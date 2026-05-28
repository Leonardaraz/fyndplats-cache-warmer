// GET /api/aliexpress/tracking?orderId=<tradeOrderId>
// Hämtar spårningsinformation för en AliExpress-order och uppdaterar
// motsvarande Wix-order med spårningsnumret automatiskt.
//
// Om du vill batcha alla öppna ordrar: kalla denna endpoint för varje
// task med status=ordered och aliexpressOrderId satt.

import { type NextRequest, NextResponse } from "next/server";
import { getTracking } from "@/lib/aliexpress/client";
import { checkToken } from "@/lib/auth";
import { getStore } from "@/lib/store/factory";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authErr = checkToken(req);
  if (authErr) return authErr;

  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId krävs" }, { status: 400 });
  }

  try {
    const tracking = await getTracking(orderId);

    // Om vi hittade ett spårningsnummer — logga det i audit.
    if (tracking.trackingNumber) {
      const store = getStore();
      await store.appendAudit({
        at: new Date().toISOString(),
        kind: "tracking_fetched",
        ref: orderId,
        detail: JSON.stringify({ trackingNumber: tracking.trackingNumber, carrier: tracking.shippingProvider }),
      });
    }

    return NextResponse.json(tracking);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
