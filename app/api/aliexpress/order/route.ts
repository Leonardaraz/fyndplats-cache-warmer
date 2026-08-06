// POST /api/aliexpress/order
// Lägger AliExpress-ordern för en väntande fulfillment-task. Body: { taskId }.
//
// SÄKERHET: ordern läggs ENBART via den DELADE placeOrderForTask (samma atomiska
// dubbel-order-claim + guards som admin-vägen) och härleds från TASKEN — INTE från
// klient-body. Tidigare tog routen productId/skuId/shippingAddress direkt och anropade
// createOrder utan claim/guard → en oskyddad parallell betalväg. Den är nu stängd.
//
// Svar: { tradeOrderId, paymentUrl? } vid 200. Fel mappas till 4xx (aldrig 5xx →
// ingen retry-loop på ett permanent/osäkert utfall).

import { type NextRequest, NextResponse } from "next/server";
import { checkToken } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import { placeOrderForTask } from "@/lib/orders/place-order";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authErr = checkToken(req);
  if (authErr) return authErr;

  let body: { taskId?: string; acceptPrice?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }
  if (!body.taskId) {
    return NextResponse.json({ error: "taskId krävs" }, { status: 400 });
  }

  // acceptPrice: anroparen har sett prisvaktens stopp och valt API-vägen ändå.
  const result = await placeOrderForTask(getStore(), body.taskId, { acceptPrice: body.acceptPrice === true });
  if (result.ok) {
    return NextResponse.json({ tradeOrderId: result.tradeOrderId, paymentUrl: result.paymentUrl });
  }
  // Prisvaktens stopp är ett BESLUT, inte ett fel → 409 med strukturerad payload
  // så tilläggets orderläge kan visa siffrorna + "Lägg ändå" (acceptPrice: true).
  if (result.priceStop) {
    return NextResponse.json({ error: result.error, priceStop: result.priceStop }, { status: 409 });
  }
  // Alla fel → 4xx (klientfel/osäkert utfall, ingen retry): hittades inte → 404,
  // redan lagd / hanteras redan → 409, annat (validering/osäkert) → 422.
  const status = /hittades inte/i.test(result.error)
    ? 404
    : /redan lagd|hanteras redan/i.test(result.error)
      ? 409
      : 422;
  return NextResponse.json({ error: result.error }, { status });
}
