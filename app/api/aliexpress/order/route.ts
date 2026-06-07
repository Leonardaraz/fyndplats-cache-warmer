// POST /api/aliexpress/order
// Lägger en beställning på AliExpress via DS API för en väntande fulfillment-task.
// Kallas från tilläggets order-kö (eller manuellt från admin).
//
// Body: {
//   taskId: string;          — FyndplatsTasks-id
//   productId: string;
//   skuId: string;
//   quantity: number;
//   shippingAddress: { name, addressLine1, city, postalCode, countryCode, phone? }
//   logisticsServiceName?: string;
// }
//
// Svar: { tradeOrderId, paymentRequired, paymentUrl? }
// Om paymentRequired=true öppnar tillägget paymentUrl i en ny flik.

import { type NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/aliexpress/client";
import { checkToken } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";
import type { DsOrderCreateParams } from "@/lib/aliexpress/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authErr = checkToken(req);
  if (authErr) return authErr;

  let body: DsOrderCreateParams & { taskId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  if (!body.productId || !body.skuId || !body.quantity || !body.shippingAddress) {
    return NextResponse.json({ error: "productId, skuId, quantity och shippingAddress krävs" }, { status: 400 });
  }

  try {
    const result = await createOrder(body);

    // Uppdatera task med AliExpress-ordernumret om taskId skickades med.
    if (body.taskId) {
      const store = getStore();
      await store.updateTask(body.taskId, {
        aliexpressOrderId: result.tradeOrderId,
        status: result.paymentRequired ? "pending_payment" : "ordered",
        ...(result.paymentRequired && result.paymentUrl ? { paymentUrl: result.paymentUrl } : {}),
      });
      await store.appendAudit({
        at: new Date().toISOString(),
        kind: "order_created",
        ref: body.taskId,
        detail: JSON.stringify({ tradeOrderId: result.tradeOrderId, paymentRequired: result.paymentRequired }),
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
