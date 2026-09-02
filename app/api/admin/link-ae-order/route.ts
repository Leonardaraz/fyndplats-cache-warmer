// POST /api/admin/link-ae-order — koppla en manuellt lagd AliExpress-order.
//
//   { orderNumber: "10025", aeOrderId: "3075762642483058" }
//   { taskId: "<orderId>:<lineItemId>", aeOrderId: "…" }   // när ordern har flera rader
//
// Samma logik som knappen "Beställt manuellt på AliExpress? Koppla
// ordernumret →" i /admin (lib/orders/link-ae-order.ts), men nåbar med
// CRON_SECRET så kopplingen går att göra från GitHub-workflowen
// "Order — koppla manuell AliExpress-order" utan admin-inloggning.
//
// Order 10025 (2026-09-01): lagd för hand, skickad från Polen kl 15:53, och
// tasken stod kvar på `pending` i sexton timmar medan kunden väntade på sitt
// mejl. Motorn kan inte hämta spårning för en order den inte vet finns.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { linkAliExpressOrder } from "@/lib/orders/link-ae-order";

export const runtime = "nodejs";
export const maxDuration = 30;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }

  let kropp: { orderNumber?: unknown; taskId?: unknown; aeOrderId?: unknown };
  try {
    kropp = (await req.json()) as typeof kropp;
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig JSON" }, { status: 400 });
  }

  const orderNumber = typeof kropp.orderNumber === "string" ? kropp.orderNumber.trim() : undefined;
  const taskId = typeof kropp.taskId === "string" ? kropp.taskId.trim() : undefined;
  const aeOrderId = typeof kropp.aeOrderId === "string" ? kropp.aeOrderId : "";

  if (!orderNumber && !taskId) {
    return NextResponse.json({ ok: false, error: "orderNumber eller taskId krävs" }, { status: 400 });
  }
  if (!aeOrderId) {
    return NextResponse.json({ ok: false, error: "aeOrderId krävs" }, { status: 400 });
  }

  try {
    const r = await linkAliExpressOrder(getStore(), {
      orderNumber,
      taskId,
      aeOrderId,
      source: "api/admin/link-ae-order",
    });
    if (!r.ok) {
      console.warn(`[link-ae-order] ${orderNumber ?? taskId}: ${r.error}`);
      return NextResponse.json(r, { status: r.candidates ? 409 : 422 });
    }
    console.log(`[link-ae-order] ${r.taskId} (order ${r.orderNumber}) → AE ${r.aeOrderId}`);
    return NextResponse.json(r);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[link-ae-order] ${orderNumber ?? taskId} misslyckades: ${msg.slice(0, 300)}`);
    return NextResponse.json({ ok: false, error: msg.slice(0, 300) }, { status: 500 });
  }
}
