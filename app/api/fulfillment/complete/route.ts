import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorized } from "@/lib/auth";
import { assertTransition } from "@/lib/orders/status";
import { getStore } from "@/lib/store/factory";
import { createFulfillment } from "@/lib/wix/client";
import { sparningsLank } from "@/lib/tracking-link";
import { audit } from "@/lib/audit";

const Schema = z.object({
  taskId: z.string().min(1),
  trackingNumber: z.string().min(1),
  shippingProvider: z.string().optional(),
  trackingLink: z.string().url().optional(),
});

// Markerar en orderrad som skickad och pushar spårningsnummer till Wix-ordern.
export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Otillåten" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valideringsfel", details: parsed.error.flatten() }, { status: 422 });
  }

  const store = getStore();
  const tasks = await store.listTasks();
  const task = tasks.find((t) => t.taskId === parsed.data.taskId);
  if (!task) {
    return NextResponse.json({ error: "Task hittades inte" }, { status: 404 });
  }

  // F19-backstopp: en task flaggad för manuell granskning (annullering/återbetalning racade
  // in, eller osäkert orderutfall) får inte skeppas via NÅGON väg — annars skeppas varan till
  // en kund som annullerat/återbetalat. Rensa flaggan / hantera manuellt i /admin först.
  if (task.cancelMidOrder || task.refundFlagged || task.orderUncertain) {
    return NextResponse.json(
      { error: "Task flaggad för manuell granskning (annullering/återbetalning/osäkert orderutfall) — kan inte skeppas. Hantera i /admin först." },
      { status: 409 },
    );
  }

  try {
    assertTransition(task.status, "shipped");
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 409 });
  }

  try {
    await createFulfillment({
      orderId: task.orderId,
      lineItems: [{ id: task.lineItemId, quantity: task.quantity }],
      trackingNumber: parsed.data.trackingNumber,
      shippingProvider: parsed.data.shippingProvider,
      // Anroparens länk vinner; utan den vår egen spårsida i stället för
      // ingen länk alls (samma regel som cron-vägen, se lib/tracking-link).
      trackingLink: parsed.data.trackingLink ?? sparningsLank(parsed.data.trackingNumber),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json({ error: "Wix-fulfillment misslyckades", message }, { status: 502 });
  }

  await store.setTaskStatus(task.taskId, "shipped");
  await audit("ship", task.taskId, parsed.data.trackingNumber);
  return NextResponse.json({ ok: true, taskId: task.taskId, status: "shipped" });
}
