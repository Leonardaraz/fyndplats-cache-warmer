import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorized } from "@/lib/auth";
import { assertTransition } from "@/lib/orders/status";
import { getMemoryStore } from "@/lib/store/memory";
import { createFulfillment } from "@/lib/wix/client";

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

  const store = getMemoryStore();
  const tasks = await store.listTasks();
  const task = tasks.find((t) => t.taskId === parsed.data.taskId);
  if (!task) {
    return NextResponse.json({ error: "Task hittades inte" }, { status: 404 });
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
      trackingLink: parsed.data.trackingLink,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Okänt fel";
    return NextResponse.json({ error: "Wix-fulfillment misslyckades", message }, { status: 502 });
  }

  await store.setTaskStatus(task.taskId, "shipped");
  return NextResponse.json({ ok: true, taskId: task.taskId, status: "shipped" });
}
