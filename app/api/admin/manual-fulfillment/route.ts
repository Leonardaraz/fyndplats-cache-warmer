// POST /api/admin/manual-fulfillment — orderläggning och skeppning för hand.
//
//   { "action": "ordered", "orderNumber": "10026", "supplierOrderRef": "921-471LG" }
//   { "action": "shipped", "orderNumber": "10026", "trackingNumber": "JJD00039…" }
//   { "action": "shipped", "taskId": "<orderId>:<lineItemId>", … }  // flera rader
//
// VARFÖR RUTTEN FINNS. AliExpress-ordrar sköter sig själva: place-order lägger
// dem, poll-tracking hämtar spårningen var 15:e minut och skapar Wix-
// fulfillment, kunden får sitt mejl. Aosom har inget API — `place-order.ts`
// vägrar en Aosom-mappning med flit och ordern läggs på aosom.de. Det fanns
// därför ingen väg alls att tala om för motorn att ordern var lagd, och ingen
// väg att få ut ett spårningsnummer till kunden.
//
// Order 10026 (2026-09-02) gick i den väggen: betald 14:57, lagd för hand hos
// Aosom samma kväll, och tasken hade blivit liggande som `pending` medan
// vakten påminde om en order som redan var gjord.
//
// Samma nyckel-lösa upplägg som link-ae-order: CRON_SECRET räcker, så
// GitHub-workflowen "Order — beställd eller skickad för hand" går att köra
// från en telefon utan admin-inloggning.

import { type NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { markOrderedManually, shipManually } from "@/lib/orders/manual-fulfillment";

export const runtime = "nodejs";
export const maxDuration = 30;

function auktoriserad(req: NextRequest): boolean {
  if (isAuthorized(req)) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${secret}`;
}

const str = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;

export async function POST(req: NextRequest) {
  if (!auktoriserad(req)) {
    return NextResponse.json({ ok: false, error: "Otillåten" }, { status: 401 });
  }

  let kropp: Record<string, unknown>;
  try {
    kropp = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Ogiltig JSON" }, { status: 400 });
  }

  const action = str(kropp.action);
  const orderNumber = str(kropp.orderNumber);
  const taskId = str(kropp.taskId);
  const peka = orderNumber ?? taskId ?? "?";

  if (action !== "ordered" && action !== "shipped") {
    return NextResponse.json({ ok: false, error: 'action måste vara "ordered" eller "shipped"' }, { status: 400 });
  }
  if (!orderNumber && !taskId) {
    return NextResponse.json({ ok: false, error: "orderNumber eller taskId krävs" }, { status: 400 });
  }

  const trackingNumber = str(kropp.trackingNumber);
  if (action === "shipped" && !trackingNumber) {
    return NextResponse.json({ ok: false, error: "trackingNumber krävs för action=shipped" }, { status: 400 });
  }

  try {
    const store = getStore();
    const r =
      action === "ordered"
        ? await markOrderedManually(store, {
            orderNumber, taskId,
            supplierOrderRef: str(kropp.supplierOrderRef),
            source: "api/admin/manual-fulfillment",
          })
        : await shipManually(store, {
            orderNumber, taskId,
            trackingNumber: trackingNumber as string,
            carrier: str(kropp.carrier),
            source: "api/admin/manual-fulfillment",
          });

    if (!r.ok) {
      console.warn(`[manual-fulfillment] ${action} ${peka}: ${r.error}`);
      // 409 när flera rader matchar (anroparen ska peka med taskId),
      // 422 när raden finns men inte får röras.
      return NextResponse.json(r, { status: r.candidates ? 409 : 422 });
    }
    console.log(`[manual-fulfillment] ${action} ${r.taskId} (order ${r.orderNumber})`);
    return NextResponse.json(r);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[manual-fulfillment] ${action} ${peka} misslyckades: ${msg.slice(0, 300)}`);
    return NextResponse.json({ ok: false, error: msg.slice(0, 300) }, { status: 500 });
  }
}
