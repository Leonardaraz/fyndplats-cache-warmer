// GET|POST /api/admin/send-delivery
//
// Skickar en RIKTIG (ej [TEST]) leverans-/utlämnings-notis via Resend från
// orders@fyndplats.se, med den vanliga branded mallen (emails/delivery-
// notification). Till för MANUELL utskick när automationen (/api/sms-inbound)
// inte kunde matcha ett SMS till en kund — t.ex. PostNord-SMS med bara en
// upphämtningslänk (pickupUrl) och ingen sifferkod.
//
// Gated av proxy.ts (ADMIN_SECRET via ?key=<secret> eller fp_admin-cookie),
// precis som resten av /api/admin/*. Mejlet maskar ursprunget (aldrig
// "AliExpress") eftersom mallen bara visar ombud + transportör + länk/kod.
//
// Användning (i webbläsare, inloggad i /admin eller med ?key=<ADMIN_SECRET>):
//   /api/admin/send-delivery?key=<SECRET>&to=kund@exempel.se&firstName=Christer
//     &pickupLocation=Hållplatsens%20Lakritshandel
//     &pickupUrl=https://l.postnord.com/OgA9f6PIy50u&carrier=PostNord
//
// POST-body (JSON) stöds också: { to, firstName, pickupLocation, pickupUrl,
//   pickupCode?, trackingNumber?, carrier?, status? }

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { fetchWixOrder, buildOrderConfirmationProps } from "@/app/api/wix-webhook/route";
import type { OrderLineItem } from "@/emails/order-confirmation";
import { reviewFormUrl } from "@/lib/review-token";
import DeliveryNotificationEmail, {
  deliverySubject,
  type DeliveryStatus,
} from "@/emails/delivery-notification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM = "Fyndplats <orders@fyndplats.se>";
const REPLY_TO = "info@fyndplats.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_STATUS: DeliveryStatus[] = [
  "out_for_delivery",
  "available_for_pickup",
  "delivered",
  "in_transit",
  "exception",
];

interface Params {
  to?: string;
  firstName?: string;
  status?: string;
  pickupLocation?: string;
  pickupCode?: string;
  pickupUrl?: string;
  trackingNumber?: string;
  carrier?: string;
  /** Wix-order-GUID. Anges det hämtas ordernummer + rader till mejlet. */
  orderId?: string;
}

async function handle(p: Params) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: "RESEND_API_KEY saknas" }, { status: 500 });
  }
  const to = (p.to || "").trim();
  if (!EMAIL_RE.test(to)) {
    return NextResponse.json({ ok: false, error: "Ange en giltig 'to'-adress." }, { status: 400 });
  }
  // Säkerhet mot tomt utskick: kräv minst ett upphämtnings-/spår-fält.
  if (!p.pickupLocation && !p.pickupUrl && !p.pickupCode && !p.trackingNumber) {
    return NextResponse.json(
      { ok: false, error: "Ange minst pickupLocation, pickupUrl, pickupCode eller trackingNumber." },
      { status: 400 },
    );
  }

  const status: DeliveryStatus = VALID_STATUS.includes(p.status as DeliveryStatus)
    ? (p.status as DeliveryStatus)
    : "available_for_pickup";

  // Samma ordersammanfattning som den SMS-utlösta vägen. Best-effort: utan
  // orderId eller vid fel skickas mejlet precis som förut.
  let orderSummary: { orderNumber?: string; items?: OrderLineItem[] } = {};
  if (p.orderId?.trim()) {
    try {
      const order = await fetchWixOrder(p.orderId.trim());
      const built = order ? buildOrderConfirmationProps(order) : null;
      if (built) orderSummary = { orderNumber: built.orderNumber, items: built.items };
    } catch (err) {
      console.warn("[send-delivery] kunde inte hämta order:", err instanceof Error ? err.message : err);
    }
  }

  const reviewUrl = p.orderId?.trim()
    ? reviewFormUrl(p.orderId.trim(), "https://www.fyndplats.se", process.env.REVIEW_TOKEN_SECRET) ?? undefined
    : undefined;

  const props = {
    ...orderSummary,
    reviewUrl,
    firstName: (p.firstName || "kund").trim(),
    status,
    pickupLocation: p.pickupLocation?.trim() || undefined,
    pickupCode: p.pickupCode?.trim() || undefined,
    pickupUrl: p.pickupUrl?.trim() || undefined,
    trackingNumber: p.trackingNumber?.trim() || undefined,
    carrier: p.carrier?.trim() || undefined,
  };

  try {
    const html = await render(DeliveryNotificationEmail(props));
    const subject = deliverySubject({
      status,
      pickupLocation: props.pickupLocation,
      pickupCode: props.pickupCode,
    });
    const sent = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: FROM,
      to,
      replyTo: REPLY_TO,
      subject,
      html,
    });
    if (sent.error) {
      return NextResponse.json(
        { ok: false, error: String(sent.error.message || sent.error) },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, to, subject, resendId: sent.data?.id });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  return handle({
    to: q.get("to") ?? undefined,
    firstName: q.get("firstName") ?? undefined,
    orderId: q.get("orderId") ?? undefined,
    status: q.get("status") ?? undefined,
    pickupLocation: q.get("pickupLocation") ?? undefined,
    pickupCode: q.get("pickupCode") ?? undefined,
    pickupUrl: q.get("pickupUrl") ?? undefined,
    trackingNumber: q.get("trackingNumber") ?? undefined,
    carrier: q.get("carrier") ?? undefined,
  });
}

export async function POST(request: Request) {
  let body: Params = {};
  try {
    body = (await request.json()) as Params;
  } catch {
    /* tillåt tomt → valideringen nedan fångar det */
  }
  return handle(body);
}
