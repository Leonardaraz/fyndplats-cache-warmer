// POST /api/wix-webhook
//
// Tar emot Wix Stores/eCom-händelser och skickar branded transaktionsmejl
// via Resend (orderbekräftelse, leveransbekräftelse, återbetalning).
//
// Wix skickar webhooks som RS256-signerade JWT:er — vi verifierar mot den
// publika nyckeln från Wix Dev Center (env `WIX_WEBHOOK_PUBLIC_KEY`).
//
// Env-krav (Vercel):
//   RESEND_API_KEY              — Resend API-key (orders@fyndplats.se)
//   WIX_WEBHOOK_PUBLIC_KEY      — PEM-kodad public key från Wix Dev Center
//                                 (om saknas: vi loggar och fortsätter ändå —
//                                  produkten kräver att den sätts INNAN
//                                  webhooks aktiveras i Wix).
//
// Felhantering: Resend-fel returnerar 500 så Wix retry:ar. Okänd event-typ
// returnerar 200 (ack — vi vill inte att Wix ska spamma retries).

import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { render } from "@react-email/render";
import { Resend } from "resend";
import OrderConfirmationEmail, {
  type OrderConfirmationProps,
  type OrderLineItem,
} from "@/emails/order-confirmation";
import ShippingConfirmationEmail, {
  type ShippingConfirmationProps,
} from "@/emails/shipping-confirmation";
import RefundConfirmationEmail, {
  type RefundConfirmationProps,
} from "@/emails/refund-confirmation";
import { handleAbandonedCheckoutCreated } from "@/lib/handlers/abandoned-checkout-handler";
import { onWixOrderCreatedForAbandonedCart } from "@/lib/handlers/order-conversion-hook";
import { recordOrder } from "@/lib/order-record";
import { sql } from "@/lib/db";
import { metaCapiConfigured, sendMetaCapiEvent } from "@/lib/meta-capi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM = "Fyndplats <orders@fyndplats.se>";
const REPLY_TO = "info@fyndplats.com";

// JWT-verifiering: Wix skickar antingen en ren JWT-sträng som body, eller
// ett JSON-objekt som omsluter en payload. Vi hanterar båda.
function verifyJwt(token: string, publicKeyPem: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;

  let header: { alg?: string };
  try {
    header = JSON.parse(Buffer.from(headerB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  // Wix använder RS256 för webhook-JWT:er. Hårdkodat — accept INTE `none`.
  if (header.alg !== "RS256") return null;

  const data = `${headerB64}.${payloadB64}`;
  const signature = Buffer.from(sigB64, "base64url");
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(data);
  verifier.end();
  const ok = verifier.verify(publicKeyPem, signature);
  if (!ok) return null;

  try {
    return JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

// Wix:s eCom-event-format (v2 webhooks): payload har shape
// { instanceId, eventType, identity, data: "<JSON-stringified entity>" }
// `data` är en sträng som måste parseas vidare. Vi normaliserar till objekt.
interface WixEventEnvelope {
  instanceId?: string;
  eventType?: string;
  slug?: string;
  data?: unknown;
  actionEvent?: { body?: string | object };
  entityFqdn?: string;
  // Fallback för ren payload utan envelope
  [key: string]: unknown;
}

function unwrap(payload: Record<string, unknown>): { eventType: string; entity: Record<string, unknown> } {
  const env = payload as WixEventEnvelope;
  const eventType = (env.eventType || env.slug || (env.entityFqdn as string) || "").toLowerCase();

  // Försök i tur och ordning: actionEvent.body (string|object), data (string|object), payload self
  let entity: unknown = env.actionEvent?.body ?? env.data ?? payload;
  if (typeof entity === "string") {
    try {
      entity = JSON.parse(entity);
    } catch {
      entity = {};
    }
  }
  return { eventType, entity: (entity as Record<string, unknown>) || {} };
}

// Hjälpfunktion för att plocka första icke-tom-sträng från flera kandidater.
function firstStr(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

// Konvertera Wix penningformat ({ amount: "199.00", currency: "SEK" }) till tal.
function moneyNum(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof v === "object") {
    const obj = v as { amount?: unknown; value?: unknown };
    return moneyNum(obj.amount ?? obj.value);
  }
  return 0;
}

function moneyCurrency(v: unknown, fallback = "SEK"): string {
  if (v && typeof v === "object") {
    const c = (v as { currency?: string }).currency;
    if (c) return c;
  }
  return fallback;
}

function formatSvDate(iso: string | undefined): string {
  if (!iso) return new Date().toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
  const d = new Date(iso);
  if (isNaN(d.getTime())) return new Date().toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
}

// Plocka ut kundens första namn + e-post oavsett om ordern kommer som
// "buyerInfo", "billingInfo", eller "recipientInfo".
function extractCustomer(order: Record<string, unknown>): { firstName: string; email: string } | null {
  const buyer = (order.buyerInfo ?? order.buyer) as Record<string, unknown> | undefined;
  const billing = (order.billingInfo ?? order.billing) as Record<string, unknown> | undefined;
  const recipient = (order.recipientInfo ?? order.recipient) as Record<string, unknown> | undefined;

  const billingContact = (billing as { contactDetails?: Record<string, unknown> } | undefined)?.contactDetails;
  const recipientContact = (recipient as { contactDetails?: Record<string, unknown> } | undefined)?.contactDetails;

  const email =
    firstStr(
      buyer?.email,
      (buyer as { contactDetails?: { email?: string } } | undefined)?.contactDetails?.email,
      (billingContact as { email?: string } | undefined)?.email,
      (recipientContact as { email?: string } | undefined)?.email,
      order.buyerEmail,
    ) ?? "";

  const firstName =
    firstStr(
      (buyer as { contactDetails?: { firstName?: string } } | undefined)?.contactDetails?.firstName,
      buyer?.firstName,
      (billingContact as { firstName?: string } | undefined)?.firstName,
      (recipientContact as { firstName?: string } | undefined)?.firstName,
    ) ?? "kund";

  if (!email) return null;
  return { firstName, email };
}

function extractOrderNumber(order: Record<string, unknown>): string {
  return firstStr(order.number, order.orderNumber, order._id, order.id) ?? "—";
}

function extractCustomerPhone(order: Record<string, unknown>): string | undefined {
  const buyer = (order.buyerInfo ?? order.buyer) as Record<string, unknown> | undefined;
  const billing = (order.billingInfo ?? order.billing) as Record<string, unknown> | undefined;
  const recipient = (order.recipientInfo ?? order.recipient) as Record<string, unknown> | undefined;
  const billingContact = (billing as { contactDetails?: Record<string, unknown> } | undefined)?.contactDetails;
  const recipientContact = (recipient as { contactDetails?: Record<string, unknown> } | undefined)?.contactDetails;
  return firstStr(
    (buyer as { contactDetails?: { phone?: string } } | undefined)?.contactDetails?.phone,
    buyer?.phone,
    (billingContact as { phone?: string } | undefined)?.phone,
    (recipientContact as { phone?: string } | undefined)?.phone,
  );
}

function extractItems(order: Record<string, unknown>): OrderLineItem[] {
  const lineItems = (order.lineItems ?? order.items) as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(lineItems)) return [];
  return lineItems.map((li) => {
    const name =
      firstStr(li.productName as string | undefined, (li.productName as { original?: string } | undefined)?.original, li.name) ?? "Produkt";
    const qty = Number(li.quantity ?? 1) || 1;
    const unitPrice = moneyNum(li.price ?? li.priceData ?? li.unitPrice);
    const lineTotal = moneyNum(li.totalPriceAfterTax ?? li.totalPrice ?? li.lineItemTotal ?? unitPrice * qty);
    const imageUrl = firstStr(
      (li.image as { url?: string } | undefined)?.url,
      li.image as string | undefined,
      (li.productMedia as { url?: string } | undefined)?.url,
    );
    const variant = firstStr(
      ((li.descriptionLines as Array<{ plainText?: { original?: string } }> | undefined)?.[0]?.plainText?.original),
      li.variantName as string | undefined,
    );
    return { name, qty, unitPrice, lineTotal, imageUrl, variant };
  });
}

function extractShippingAddress(order: Record<string, unknown>) {
  const recipient = (order.recipientInfo ?? order.recipient ?? order.shippingInfo) as
    | Record<string, unknown>
    | undefined;
  // Wix v3 ecom: recipientInfo.address har { addressLine, city, postalCode, country, fullName }
  const addr =
    ((recipient?.address ?? recipient?.shippingDestination) as Record<string, unknown> | undefined) ??
    ((order.shippingInfo as { logistics?: { shippingDestination?: { address?: Record<string, unknown> } } } | undefined)?.logistics?.shippingDestination?.address);
  const contact = recipient?.contactDetails as Record<string, unknown> | undefined;
  const fullName = firstStr(
    contact ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() : undefined,
    recipient?.fullName as string,
  );
  return {
    fullName,
    addressLine: firstStr(addr?.addressLine as string, addr?.addressLine1 as string, addr?.streetAddress as string),
    city: firstStr(addr?.city as string),
    postalCode: firstStr(addr?.postalCode as string, addr?.zipCode as string),
    country: firstStr(addr?.country as string, addr?.countryFullname as string),
  };
}

function buildOrderConfirmationProps(order: Record<string, unknown>): OrderConfirmationProps | null {
  const customer = extractCustomer(order);
  if (!customer) return null;
  const items = extractItems(order);
  const currency = moneyCurrency(order.priceSummary ?? order.totals ?? order.currency, "SEK");
  const totals = (order.priceSummary ?? order.totals) as Record<string, unknown> | undefined;
  const subtotal = moneyNum(totals?.subtotal);
  const shipping = moneyNum(totals?.shipping);
  const discount = moneyNum(totals?.discount);
  const total = moneyNum(totals?.total ?? totals?.totalPrice);

  const payment = firstStr(
    (order.paymentSummary as { paymentMethods?: Array<{ method?: string }> } | undefined)?.paymentMethods?.[0]?.method,
    (order.billingInfo as { paymentMethod?: string } | undefined)?.paymentMethod,
  );

  return {
    firstName: customer.firstName,
    orderNumber: extractOrderNumber(order),
    orderDate: formatSvDate(firstStr(order.createdDate as string, order._createdDate as string)),
    items,
    subtotal,
    shipping,
    discount: discount || undefined,
    total,
    currency,
    shippingAddress: extractShippingAddress(order),
    paymentMethod: payment,
    orderUrl: undefined,
  };
}

function buildShippingProps(payload: Record<string, unknown>): { props: ShippingConfirmationProps; email: string } | null {
  // Webhook kan komma som "order_updated" med status-fält eller specifik
  // shipment-event. Vi accepterar både `order` rooten och en nestad payload.
  const order = (payload.order ?? payload) as Record<string, unknown>;
  const customer = extractCustomer(order);
  if (!customer) return null;

  const fulfillment = ((payload.fulfillment ?? order.fulfillments) as
    | Record<string, unknown>
    | Array<Record<string, unknown>>
    | undefined);
  const firstFulfill = Array.isArray(fulfillment) ? fulfillment[0] : fulfillment;
  const trackingInfo =
    (firstFulfill?.trackingInfo as Record<string, unknown> | undefined) ??
    ((order.shippingInfo as Record<string, unknown> | undefined)?.tracking as Record<string, unknown> | undefined);

  const trackingNumber = firstStr(
    trackingInfo?.trackingNumber as string,
    payload.trackingNumber as string,
    firstFulfill?.trackingNumber as string,
  );
  const carrier = firstStr(
    trackingInfo?.shippingProvider as string,
    trackingInfo?.carrier as string,
    firstFulfill?.shippingProvider as string,
  );

  const items = extractItems(order).map((it) => ({
    name: it.name,
    qty: it.qty,
    imageUrl: it.imageUrl,
  }));

  return {
    props: {
      firstName: customer.firstName,
      orderNumber: extractOrderNumber(order),
      trackingNumber,
      carrier,
      items,
    },
    email: customer.email,
  };
}

function buildRefundProps(payload: Record<string, unknown>): { props: RefundConfirmationProps; email: string } | null {
  // Refund-events: kan vara på `order` (med refund-array) eller eget event.
  const order = (payload.order ?? payload) as Record<string, unknown>;
  const customer = extractCustomer(order);
  if (!customer) return null;
  const refund = (payload.refund ?? (order.refunds as Array<Record<string, unknown>> | undefined)?.[0]) as
    | Record<string, unknown>
    | undefined;

  const amount =
    moneyNum(refund?.amount ?? refund?.totalRefundedAmount ?? payload.amount) ||
    moneyNum((order.priceSummary as { total?: unknown } | undefined)?.total);
  const currency = moneyCurrency(refund?.amount ?? order.priceSummary, "SEK");
  const reason = firstStr(refund?.reason as string, payload.reason as string);

  return {
    props: {
      firstName: customer.firstName,
      orderNumber: extractOrderNumber(order),
      refundAmount: amount,
      currency,
      refundReason: reason,
      expectedDays: 10,
    },
    email: customer.email,
  };
}

// Persist (tracking_number → customer) for the SMS-forwarding flow. The
// /api/sms-inbound handler reads from this table to map an incoming carrier
// SMS back to the real customer's email. Idempotent via ON CONFLICT — Wix
// can fire fulfillments_updated multiple times for the same shipment.
async function upsertTrackingMapping(opts: {
  trackingNumber: string;
  orderId: string | null;
  customerEmail: string;
  customerName: string | null;
  customerPhone: string | null;
}): Promise<boolean> {
  try {
    await sql/*sql*/`
      INSERT INTO tracking_mapping (
        tracking_number, order_id, customer_email, customer_name, customer_phone, status
      ) VALUES (
        ${opts.trackingNumber},
        ${opts.orderId},
        ${opts.customerEmail},
        ${opts.customerName},
        ${opts.customerPhone},
        'in_transit'
      )
      ON CONFLICT (tracking_number) DO NOTHING
    `;
    return true;
  } catch (err) {
    console.error("[wix-webhook] tracking_mapping insert failed", err);
    return false;
  }
}

// Klassificera event-typ. Wix har flera möjliga slugs och har bytt namn
// mellan v1/v2/v3 — vi matchar liberalt på substring.
type EventKind = "order_created" | "order_shipped" | "refund" | "unknown";
function classify(eventType: string, payload: Record<string, unknown>): EventKind {
  const t = eventType.toLowerCase();
  if (t.includes("refund")) return "refund";
  if (t.includes("shipped") || t.includes("shipment") || t.includes("fulfillment")) return "order_shipped";
  if (t.includes("order_created") || t.includes("ordercreated") || t.includes("order_approved")) return "order_created";

  // Fallback: kolla payload-shape
  if (payload.refund || (payload as { fulfillment?: unknown }).fulfillment) {
    return payload.refund ? "refund" : "order_shipped";
  }
  return "unknown";
}

// Meta-content_ids ur orderns rader. Wix lägger produkt-ID:t på
// catalogReference.catalogItemId (samma fält PDP/cart skickar i view_item/
// add_to_cart), med fallbacks för äldre/andra shapes.
function extractContentIds(order: Record<string, unknown>): string[] {
  const lineItems = (order.lineItems ?? order.items) as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(lineItems)) return [];
  return lineItems
    .map((li) => {
      const ref = li.catalogReference as { catalogItemId?: string; productId?: string } | undefined;
      return firstStr(ref?.catalogItemId, ref?.productId, li.productId as string, li.catalogItemId as string);
    })
    .filter((x): x is string => Boolean(x));
}

// Server-autoritativt Meta Purchase via CAPI. Fyras vid order_created — når
// alltså fram även när kundens /tack-sida aldrig laddas (adblock/iOS stoppar
// klient-Pixeln). Dedupliceras mot klientens Purchase (lib/analytics) via SAMMA
// deterministiska event_id `purchase_<orderId>`. orderId tas från orderns _id/
// id (GUID), vilket är det Wix-headless redirectar med i /tack?orderId=.
//
// VIKTIGT (att verifiera i Test Events): dedup förutsätter att /tack-redirectens
// ?orderId matchar denna orderId. Om Purchase dubbelräknas → justera id-källan
// så de två stämmer. Best-effort: ett fel får ALDRIG blockera bekräftelsemejlet.
//
// Ingen IP/User-Agent skickas: webhook-requesten kommer från Wix servrar, inte
// kunden — fel signal vore värre än ingen. Matchningen vilar på hashad e-post +
// telefon (starka signaler), value/currency och content_ids.
async function fireMetaPurchase(order: Record<string, unknown>): Promise<void> {
  if (!metaCapiConfigured()) return;
  try {
    const customer = extractCustomer(order); // { firstName, email } | null
    const phone = extractCustomerPhone(order);
    const totals = (order.priceSummary ?? order.totals) as Record<string, unknown> | undefined;
    const value = moneyNum(totals?.total ?? totals?.totalPrice);
    const currency = moneyCurrency(totals ?? order.currency, "SEK");
    const contentIds = extractContentIds(order);
    const items = extractItems(order);
    const numItems = items.reduce((n, it) => n + it.qty, 0) || contentIds.length || 1;
    const orderId = firstStr(order._id as string, order.id as string, order.number as string, order.orderNumber as string);

    await sendMetaCapiEvent({
      eventName: "Purchase",
      eventId: orderId ? `purchase_${orderId}` : undefined,
      eventSourceUrl: "https://www.fyndplats.se/tack",
      actionSource: "website",
      customData: {
        currency,
        value,
        content_type: "product",
        content_ids: contentIds,
        contents: items.map((it, i) => ({
          id: contentIds[i] || it.name,
          quantity: it.qty,
          item_price: it.unitPrice,
        })),
        num_items: numItems,
      },
      userData: {
        email: customer?.email,
        phone,
      },
    });
  } catch (err) {
    console.error("[wix-webhook] Meta Purchase CAPI fel (ignorerar)", err);
  }
}

export async function POST(req: NextRequest) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("[wix-webhook] RESEND_API_KEY saknas — kan inte skicka mejl");
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    console.error("[wix-webhook] Kunde inte läsa body", err);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // Verifiera Wix JWT-signatur om public key finns. Wix skickar antingen
  // ren JWT-sträng som body, eller JSON med JWT som värde.
  const publicKey = process.env.WIX_WEBHOOK_PUBLIC_KEY;
  let payload: Record<string, unknown> | null = null;
  let verified = false;

  const looksLikeJwt = rawBody.split(".").length === 3 && !rawBody.trim().startsWith("{");
  const jwtToken = looksLikeJwt
    ? rawBody.trim()
    : (() => {
        try {
          const j = JSON.parse(rawBody) as { data?: string };
          return typeof j.data === "string" && j.data.split(".").length === 3 ? j.data : null;
        } catch {
          return null;
        }
      })();

  if (jwtToken && publicKey) {
    const verifiedPayload = verifyJwt(jwtToken, publicKey);
    if (verifiedPayload) {
      payload = verifiedPayload;
      verified = true;
    } else {
      // Signaturen fanns men matchade inte — det är ett HÅRT fel i produktion.
      console.error("[wix-webhook] JWT-signatur ogiltig — avvisar");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    // Ingen JWT eller ingen public key → försök parsa som JSON, logga varning.
    if (!publicKey) {
      console.warn("[wix-webhook] WIX_WEBHOOK_PUBLIC_KEY saknas — accepterar OVERIFIERAD payload (bör sättas i Vercel)");
    } else if (!jwtToken) {
      console.warn("[wix-webhook] Body är inte en JWT — accepterar OVERIFIERAD payload");
    }
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      console.error("[wix-webhook] Kunde inte parsa body som JSON");
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
  }

  if (!payload) {
    return NextResponse.json({ error: "Empty payload" }, { status: 400 });
  }

  const { eventType, entity } = unwrap(payload);

  // Abandoned checkout (wix.ecom.v1.abandoned_checkout, slug=created) — enqueue
  // the cart for the 3-email recovery flow. Slug guard means we only act on
  // creations; updates/deletes are ack:ed below as "unknown".
  if (eventType.includes("abandoned_checkout") || entity.abandonedCheckout) {
    const slug = typeof (payload as { slug?: unknown }).slug === "string"
      ? (payload as { slug: string }).slug
      : undefined;
    try {
      const result = await handleAbandonedCheckoutCreated({
        slug,
        abandonedCheckout: (entity.abandonedCheckout as Record<string, unknown> | undefined) ?? entity,
      } as Parameters<typeof handleAbandonedCheckoutCreated>[0]);
      return NextResponse.json({ received: true, abandonedCart: result }, { status: 200 });
    } catch (err) {
      console.error("[wix-webhook] abandoned_checkout fel", err);
      return NextResponse.json({ error: "abandoned-cart handler failed" }, { status: 500 });
    }
  }

  const kind = classify(eventType, entity);

  if (kind === "unknown") {
    // Bekräfta ändå (200) — okänd event-typ ska inte få Wix att retry:a evigt.
    console.warn(`[wix-webhook] Okänd event-typ "${eventType}" (verified=${verified}) — ack:ar`);
    return NextResponse.json({ received: true, handled: false }, { status: 200 });
  }

  const resend = new Resend(resendKey);

  try {
    if (kind === "order_created") {
      // Cancel any in-flight abandoned-cart sequence for this checkout + seed
      // used_addresses with the buyer so the 5% code doesn't go out next time.
      // Best-effort: a failure here must not block the order-confirmation email.
      try {
        await onWixOrderCreatedForAbandonedCart(entity as Parameters<typeof onWixOrderCreatedForAbandonedCart>[0]);
      } catch (err) {
        console.error("[wix-webhook] onWixOrderCreatedForAbandonedCart fel (ignorerar)", err);
      }
      const props = buildOrderConfirmationProps(entity);
      if (!props) {
        console.warn("[wix-webhook] order_created: kunde inte extrahera kund — skippar");
        return NextResponse.json({ received: true, handled: false }, { status: 200 });
      }
      // Spegla ordern till vår lokala `orders`-tabell för morgon-dashboarden.
      // Best-effort: vår WIX_API_KEY saknar Read-Orders-behörighet så detta är
      // dashboardens enda orderkälla. Ett fel får inte blockera bekräftelsemejlet.
      try {
        await recordOrder(entity as Record<string, unknown>);
      } catch (err) {
        console.error("[wix-webhook] recordOrder fel (ignorerar)", err);
      }
      // Server-autoritativt Meta Purchase (CAPI). Best-effort; dedupliceras mot
      // klientens /tack-Purchase via delad event_id `purchase_<orderId>`.
      await fireMetaPurchase(entity);
      const customer = extractCustomer(entity)!;
      const html = await render(OrderConfirmationEmail(props));
      const sent = await resend.emails.send({
        from: FROM,
        to: customer.email,
        replyTo: REPLY_TO,
        subject: `Tack för din beställning ${props.orderNumber}`,
        html,
      });
      if (sent.error) {
        console.error("[wix-webhook] Resend order_created fel", sent.error);
        return NextResponse.json({ error: "Email send failed" }, { status: 500 });
      }
      return NextResponse.json({ received: true, sent: sent.data?.id }, { status: 200 });
    }

    if (kind === "order_shipped") {
      const built = buildShippingProps(entity);
      if (!built) {
        console.warn("[wix-webhook] order_shipped: kunde inte extrahera kund — skippar");
        return NextResponse.json({ received: true, handled: false }, { status: 200 });
      }

      // Populate tracking_mapping so /api/sms-inbound can match the
      // forwarded carrier SMS back to this customer. Best-effort: a DB
      // failure here must not block the shipping email.
      let trackingMapped = false;
      if (built.props.trackingNumber) {
        const orderForCustomer = (entity.order ?? entity) as Record<string, unknown>;
        trackingMapped = await upsertTrackingMapping({
          trackingNumber: built.props.trackingNumber,
          orderId: built.props.orderNumber === "—" ? null : built.props.orderNumber,
          customerEmail: built.email,
          customerName: built.props.firstName === "kund" ? null : built.props.firstName,
          customerPhone: extractCustomerPhone(orderForCustomer) ?? null,
        });
      } else {
        console.warn("[wix-webhook] order_shipped: ingen tracking_number — hoppar tracking_mapping");
      }

      const html = await render(ShippingConfirmationEmail(built.props));
      const sent = await resend.emails.send({
        from: FROM,
        to: built.email,
        replyTo: REPLY_TO,
        subject: `Ditt paket är på väg – order ${built.props.orderNumber}`,
        html,
      });
      if (sent.error) {
        console.error("[wix-webhook] Resend order_shipped fel", sent.error);
        return NextResponse.json({ error: "Email send failed" }, { status: 500 });
      }
      return NextResponse.json({ received: true, sent: sent.data?.id, trackingMapped }, { status: 200 });
    }

    if (kind === "refund") {
      const built = buildRefundProps(entity);
      if (!built) {
        console.warn("[wix-webhook] refund: kunde inte extrahera kund — skippar");
        return NextResponse.json({ received: true, handled: false }, { status: 200 });
      }
      const html = await render(RefundConfirmationEmail(built.props));
      const sent = await resend.emails.send({
        from: FROM,
        to: built.email,
        replyTo: REPLY_TO,
        subject: `Återbetalning bekräftad – order ${built.props.orderNumber}`,
        html,
      });
      if (sent.error) {
        console.error("[wix-webhook] Resend refund fel", sent.error);
        return NextResponse.json({ error: "Email send failed" }, { status: 500 });
      }
      return NextResponse.json({ received: true, sent: sent.data?.id }, { status: 200 });
    }
  } catch (err) {
    console.error("[wix-webhook] Oväntat fel under email-send", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true, handled: false }, { status: 200 });
}

// GET för enkel health-check (Vercel + manuell verifikation).
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "wix-webhook",
    accepts: ["order_created", "order_shipped", "refund"],
    signatureVerification: process.env.WIX_WEBHOOK_PUBLIC_KEY ? "enabled" : "disabled (key missing)",
  });
}
