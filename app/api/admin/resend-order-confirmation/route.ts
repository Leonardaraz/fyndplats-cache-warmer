// POST /api/admin/resend-order-confirmation
//
// Skickar om en orderbekräftelse i efterhand. Används för att rädda mejl
// som missades innan vi fixade Wix-webhooken (Leonard 2026-06-17). Kör BARA
// email-skickandet — INTE recordOrder/Meta/Push (de gjordes redan när Wix
// skickade webhooken första gången).
//
// Auth: header `x-admin-secret: <WEBHOOK_FORWARD_SECRET>` (redan i Vercel).
// Body: { "orderNumber": "10001" }  ELLER  { "orderId": "<wix-guid>" }
//
// Svar: { ok, orderId, orderNumber, email, resendId } eller { error }
import { NextResponse, type NextRequest } from "next/server";
import { render } from "@react-email/render";
import { Resend } from "resend";
import OrderConfirmationEmail from "@/emails/order-confirmation";
import {
  fetchWixOrder,
  buildOrderConfirmationProps,
  extractCustomer,
} from "@/app/api/wix-webhook/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM = "Fyndplats <orders@fyndplats.se>";
const REPLY_TO = "info@fyndplats.com";

// Sökning på orderns läsbara nummer → returnerar interna GUID:t.
// Wix v3 ecom: POST /ecom/v1/orders/search med filter på `number`.
async function findOrderIdByNumber(orderNumber: string): Promise<string | null> {
  const key = process.env.WIX_API_KEY;
  const site = process.env.WIX_SITE_ID;
  if (!key || !site) return null;
  try {
    const res = await fetch("https://www.wixapis.com/ecom/v1/orders/search", {
      method: "POST",
      headers: {
        Authorization: key,
        "wix-site-id": site,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        search: { filter: { number: { $eq: orderNumber } } },
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.warn(`[resend-order] search(${orderNumber}) HTTP ${res.status}: ${t.slice(0, 200)}`);
      return null;
    }
    const json = (await res.json()) as { orders?: Array<{ id?: string; _id?: string }> };
    const o = json.orders?.[0];
    return o?.id ?? o?._id ?? null;
  } catch (err) {
    console.error(`[resend-order] search(${orderNumber}) fel`, err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    orderNumber?: string;
    orderId?: string;
  };

  // Auth: delad hemlighet (utöver proxy.ts ADMIN_SECRET-grinden som redan
  // skyddar /api/admin/*). Den tidigare orderNumber-allowlisten (no-secret-väg
  // för engångs-recovery) är borttagen — recovery är klar och den var en latent
  // foot-gun om proxy-grinden någonsin smalnades.
  const expected = process.env.WEBHOOK_FORWARD_SECRET;
  const provided = req.headers.get("x-admin-secret");
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Resolve to internal Wix GUID
  let orderId = body.orderId;
  if (!orderId && body.orderNumber) {
    orderId = (await findOrderIdByNumber(body.orderNumber)) ?? undefined;
    if (!orderId) {
      return NextResponse.json(
        { error: `Order #${body.orderNumber} hittades inte i Wix` },
        { status: 404 },
      );
    }
  }
  if (!orderId) {
    return NextResponse.json(
      { error: "orderNumber eller orderId krävs i bodyn" },
      { status: 400 },
    );
  }

  const order = await fetchWixOrder(orderId);
  if (!order) {
    return NextResponse.json(
      { error: `Kunde inte hämta order ${orderId} från Wix API` },
      { status: 502 },
    );
  }

  const props = buildOrderConfirmationProps(order);
  const customer = extractCustomer(order);
  if (!props || !customer) {
    return NextResponse.json(
      { error: "Kunde inte extrahera kund/order-info" },
      { status: 422 },
    );
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY saknas i env" },
      { status: 500 },
    );
  }
  const resend = new Resend(resendKey);
  const html = await render(OrderConfirmationEmail(props));
  const sent = await resend.emails.send({
    from: FROM,
    to: customer.email,
    replyTo: REPLY_TO,
    subject: `Tack för din beställning ${props.orderNumber}`,
    html,
  });
  if (sent.error) {
    console.error("[resend-order] Resend fel", sent.error);
    return NextResponse.json(
      { error: "Resend send failed", details: String(sent.error) },
      { status: 500 },
    );
  }
  console.log(
    `[resend-order] efter-skickat orderbekräftelse #${props.orderNumber} → ${customer.email} (resendId=${sent.data?.id})`,
  );
  return NextResponse.json({
    ok: true,
    orderId,
    orderNumber: props.orderNumber,
    email: customer.email,
    resendId: sent.data?.id,
  });
}
