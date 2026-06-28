import { NextResponse } from "next/server";
import { z } from "zod";
import { isAuthorized } from "@/lib/auth";
import { cancelOneTask } from "@/lib/orders/cancel-task";
import { getStore } from "@/lib/store/factory";

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

  // Delad cancel-logik (samma sanning som Wix-cancel-eventet). cancelOneTask kastar
  // aldrig för terminal/mid-order — den returnerar ett utfall vi mappar till HTTP.
  const result = await cancelOneTask(store, task);

  if (result.outcome === "terminal-noop") {
    // shipped/cancelled går inte att avbryta (bevarar gamla 409-på-terminal-kontraktet).
    return NextResponse.json(
      { error: `Kan inte avbryta en task med status "${task.status}".` },
      { status: 409 },
    );
  }
  if (result.outcome === "mid-order-flagged") {
    // En orderläggning pågår just nu — avbryt inte mitt i. Flaggad för granskning.
    return NextResponse.json(
      { error: "Orderläggning pågår för denna rad — kan inte avbryta just nu. Försök igen om en stund eller granska den flaggade tasken." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    ok: true,
    taskId: task.taskId,
    status: "cancelled",
    // Om varan redan beställts hos leverantören krävs återbetalning till kunden.
    refundRequired: result.refundRequired,
    // Ordern var redan lagd hos AliExpress → avbeställ MANUELLT där (sker ej här).
    manualAliexpressCancelRequired: result.manualAliexpressCancelRequired,
    aliexpressOrderId: result.aliexpressOrderId,
  });
}
