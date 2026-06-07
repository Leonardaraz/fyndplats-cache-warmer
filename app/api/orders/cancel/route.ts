import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorized } from "@/lib/auth";
import { assertTransition } from "@/lib/orders/status";
import { getStore } from "@/lib/store/factory";
import { audit } from "@/lib/audit";

const Schema = z.object({ taskId: z.string().min(1) });

// Avbryter en orderrad innan den skickats. En redan skickad rad kan inte
// avbrytas (statusguarden nekar). Återbetalning sker via betalleverantören
// (Klarna/Stripe) — vi flaggar att återbetalning krävs, men utför den inte här.
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
  const task = (await store.listTasks()).find((t) => t.taskId === parsed.data.taskId);
  if (!task) return NextResponse.json({ error: "Task hittades inte" }, { status: 404 });

  try {
    assertTransition(task.status, "cancelled");
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 409 });
  }

  const alreadyOrdered = task.status === "ordered";
  // Om en AliExpress-order redan lagts avbeställs den INTE automatiskt här (DS-API:t
  // saknar pålitlig cancel) → annars skulle vi tyst återbetala kunden men ändå få
  // varan skickad/debiterad. Larma högt så Leonard avbeställer manuellt på AliExpress.
  const aeOrderPlaced = alreadyOrdered && Boolean(task.aliexpressOrderId);
  await store.setTaskStatus(task.taskId, "cancelled");
  if (aeOrderPlaced) {
    await audit(
      "cancel-manual-ae-required",
      task.taskId,
      `MANUELL AVBESTÄLLNING KRÄVS på AliExpress (order ${task.aliexpressOrderId}) + återbetalning till kund — annars skickas/debiteras varan ändå.`,
    );
  } else {
    await audit("cancel", task.taskId, alreadyOrdered ? "återbetalning krävs" : undefined);
  }

  return NextResponse.json({
    ok: true,
    taskId: task.taskId,
    status: "cancelled",
    // Om varan redan beställts hos leverantören krävs återbetalning till kunden.
    refundRequired: alreadyOrdered,
    // Ordern var redan lagd hos AliExpress → avbeställ MANUELLT där (sker ej här).
    manualAliexpressCancelRequired: aeOrderPlaced,
    aliexpressOrderId: aeOrderPlaced ? task.aliexpressOrderId : undefined,
  });
}
