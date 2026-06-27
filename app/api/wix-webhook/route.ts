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
import { revalidatePath } from "next/cache";
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
import OrderCancellationEmail, {
  type OrderCancellationProps,
} from "@/emails/order-cancellation";
import { fanoutToCacheWarmer, shouldFanoutToCacheWarmer } from "@/lib/webhook-fanout";
import { handleAbandonedCheckoutCreated } from "@/lib/handlers/abandoned-checkout-handler";
import { onWixOrderCreatedForAbandonedCart } from "@/lib/handlers/order-conversion-hook";
import { recordOrder } from "@/lib/order-record";
import { claimOrderConfirmation, releaseOrderConfirmation } from "@/lib/order-confirmation-dedup";
import { registerWith17Track } from "@/lib/track17";
import { maskCarrierOrUndefined } from "@/lib/carrier-mask";
import { sql } from "@/lib/db";
import { metaCapiConfigured, sendMetaCapiEvent } from "@/lib/meta-capi";
import { firePush } from "@/lib/push-send";
import { getProducts } from "@/lib/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FROM = "Fyndplats <orders@fyndplats.se>";
const REPLY_TO = "info@fyndplats.com";

// JWT-verifiering: Wix skickar antingen en ren JWT-sträng som body, eller
// ett JSON-objekt som omsluter en payload. Vi hanterar båda.
//
// Multi-key (2026-06-17): env-värdet kan vara EN PEM eller FLERA PEMer
// separerade med `-----END PUBLIC KEY-----` följt av `-----BEGIN PUBLIC KEY-----`
// (alltså bara klistra in dem efter varandra). Vi provar varje nyckel i
// ordning — accepterar JWT:n om någon matchar. Detta hanterar nyckel-rotation
// och flera signing sources (My New App-4, Headless OAuth, etc) utan att
// vi behöver veta exakt vilken som signerade.
function splitPublicKeys(pem: string): string[] {
  if (!pem) return [];
  // Splitta på "-----END PUBLIC KEY-----" → behåll suffixet på varje del
  const parts = pem.split(/(-----END PUBLIC KEY-----)/).reduce<string[]>((acc, part, i, arr) => {
    if (i % 2 === 0 && i + 1 < arr.length) {
      acc.push((part + arr[i + 1]).trim());
    } else if (i % 2 === 0 && part.trim()) {
      // Hängande del utan END-marker — ignorera
    }
    return acc;
  }, []);
  return parts.filter((p) => /-----BEGIN PUBLIC KEY-----/.test(p));
}

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

  // Prova varje publik nyckel. Accepterar om någon matchar.
  const keys = splitPublicKeys(publicKeyPem);
  let matched = false;
  for (const key of keys) {
    try {
      const verifier = crypto.createVerify("RSA-SHA256");
      verifier.update(data);
      verifier.end();
      if (verifier.verify(key, signature)) {
        matched = true;
        break;
      }
    } catch {
      // ogiltig PEM — hoppa över
    }
  }
  if (!matched) return null;

  try {
    return JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

// Wix:s eCom-event-format (v2 webhooks): payload har shape
// {
//   id, entityFqdn: "wix.ecom.v1.order", slug: "created", entityId,
//   createdEvent?: { entity },          // för creates
//   updatedEvent?: { currentEntity },   // för updates
//   actionEvent?: { body: { order } },  // för action-events (canceled, fulfilled)
//   eventTime,
// }
// Legacy/v1 payloads har `eventType` och `data: "<JSON-stringified>"` istället.
// Vi normaliserar till en composite eventType (entityFqdn.slug) + plockar ut
// den faktiska entiteten från rätt wrapper.
interface WixEventEnvelope {
  id?: string;
  instanceId?: string;
  eventType?: string;
  slug?: string;
  entityFqdn?: string;
  entityId?: string;
  data?: unknown;
  actionEvent?: { body?: string | Record<string, unknown> | object; bodyAsJson?: unknown };
  createdEvent?: { entity?: unknown };
  updatedEvent?: { entity?: unknown; currentEntity?: unknown };
  deletedEvent?: { entity?: unknown };
  // Fallback för ren payload utan envelope
  [key: string]: unknown;
}

interface UnwrapResult {
  eventType: string;
  entity: Record<string, unknown>;
  entityFqdn?: string;
  slug?: string;
  entityId?: string;
}

// Wix v2 wraps the real webhook envelope inside `data` (sometimes DOUBLY
// stringified inside another `data`). The actual envelope — with claims like
// entityFqdn / slug / entityId / *Event — lives one or two parse-hops deeper.
// We unwrap until we find that layer. Backward-compat: if payload already has
// these claims at the top level (legacy v1, test-payloads), we return it as-is.
function unwrapDataLayers(payload: unknown): Record<string, unknown> {
  let layer: unknown = payload;
  // Batched events sometimes arrive as an array at the JWT root — peek at [0].
  if (Array.isArray(layer) && layer.length > 0) layer = layer[0];

  // Max 5 hops (in practice Wix doubles at most). Guards against pathological loops.
  for (let i = 0; i < 5; i++) {
    if (!layer || typeof layer !== "object" || Array.isArray(layer)) break;
    const obj = layer as Record<string, unknown>;
    // Real envelope reached as soon as we see the canonical claims directly.
    // OBS: `eventType` ensam räknas INTE — Wix sätter ofta en sammanfattande
    // eventType på en yttre wrapper (t.ex. "wix.ecom.v1.order_approved") medan
    // entityFqdn/slug/entityId/actionEvent ligger ett lager djupare. Stannar vi
    // på den nivån får vi `entity = {data: "..."}` istället för ordern, vilket
    // gör att kund-extraktionen failar och mejlet skippas.
    if (
      typeof obj.entityFqdn === "string" ||
      typeof obj.slug === "string" ||
      typeof obj.entityId === "string" ||
      obj.createdEvent !== undefined ||
      obj.updatedEvent !== undefined ||
      obj.deletedEvent !== undefined ||
      obj.actionEvent !== undefined
    ) {
      return obj;
    }
    // Pure {data:"<json>"} wrapper → parse and dig.
    if (typeof obj.data === "string") {
      try {
        layer = JSON.parse(obj.data);
        if (Array.isArray(layer) && layer.length > 0) layer = layer[0];
        continue;
      } catch {
        break;
      }
    }
    break;
  }
  return (layer && typeof layer === "object" && !Array.isArray(layer)
    ? (layer as Record<string, unknown>)
    : (payload as Record<string, unknown>));
}

function unwrap(payload: Record<string, unknown>): UnwrapResult {
  const env = unwrapDataLayers(payload) as WixEventEnvelope;
  const entityFqdn = typeof env.entityFqdn === "string" ? env.entityFqdn : undefined;
  const slug = typeof env.slug === "string" ? env.slug : undefined;
  const entityId = typeof env.entityId === "string" ? env.entityId : undefined;

  // Composite eventType: entityFqdn.slug är Wix:s kanoniska v2-identifierare
  // (t.ex. "wix.ecom.v1.order.created"). Legacy-payloads har bara `eventType`
  // eller `slug` ensamt — vi faller tillbaka på dem för bakåtkompatibilitet.
  let eventType = "";
  if (typeof env.eventType === "string" && env.eventType) {
    eventType = env.eventType;
  } else if (entityFqdn && slug) {
    eventType = `${entityFqdn}.${slug}`;
  } else {
    eventType = slug ?? entityFqdn ?? "";
  }
  eventType = eventType.toLowerCase();

  // Plocka ut entity från rätt wrapper. Ordning:
  //   createdEvent.entity            — Order Created, Abandoned Checkout Created
  //   updatedEvent.currentEntity     — Order With Fulfillments Updated, Refund Completed
  //   updatedEvent.entity            — sällsynt variant
  //   deletedEvent.entity            — deletes
  //   actionEvent.body (.order)      — Order Canceled, Order Fulfilled
  //   actionEvent.bodyAsJson         — Events V3 (guest_order_canceled m.fl.)
  //   data                           — legacy v1, ev. JSON-strängad
  //   payload                        — sista utvägen (testpayloads utan envelope)
  let entity: unknown = undefined;
  if (env.createdEvent && (env.createdEvent as { entity?: unknown }).entity !== undefined) {
    entity = (env.createdEvent as { entity: unknown }).entity;
  } else if (env.updatedEvent && (env.updatedEvent as { currentEntity?: unknown }).currentEntity !== undefined) {
    entity = (env.updatedEvent as { currentEntity: unknown }).currentEntity;
  } else if (env.updatedEvent && (env.updatedEvent as { entity?: unknown }).entity !== undefined) {
    entity = (env.updatedEvent as { entity: unknown }).entity;
  } else if (env.deletedEvent && (env.deletedEvent as { entity?: unknown }).entity !== undefined) {
    entity = (env.deletedEvent as { entity: unknown }).entity;
  } else if (env.actionEvent?.body !== undefined) {
    const body = env.actionEvent.body;
    if (typeof body === "string") {
      try {
        entity = JSON.parse(body);
      } catch {
        entity = {};
      }
    } else {
      entity = body;
    }
    // actionEvent.body wrappar ofta entiteten i `.order` (Order Canceled, Order
    // Fulfilled). Packa upp ett steg så extractors:erna ser order-fälten direkt.
    if (entity && typeof entity === "object" && "order" in (entity as Record<string, unknown>)) {
      const inner = (entity as { order?: unknown }).order;
      if (inner && typeof inner === "object") entity = inner;
    }
  } else if (env.actionEvent && (env.actionEvent as { bodyAsJson?: unknown }).bodyAsJson !== undefined) {
    entity = (env.actionEvent as { bodyAsJson: unknown }).bodyAsJson;
  } else if (env.data !== undefined) {
    const data = env.data;
    if (typeof data === "string") {
      try {
        entity = JSON.parse(data);
      } catch {
        entity = {};
      }
    } else {
      entity = data;
    }
  } else {
    entity = payload;
  }

  return {
    eventType,
    entity: (entity as Record<string, unknown>) || {},
    entityFqdn,
    slug,
    entityId,
  };
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
export function extractCustomer(order: Record<string, unknown>): { firstName: string; email: string } | null {
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

export function buildOrderConfirmationProps(order: Record<string, unknown>): OrderConfirmationProps | null {
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
  // KRITISKT: maska carrier. AliExpress-fulfillment fyller detta fält med
  // "Cainiao" / "AliExpress Standard Shipping" — rått hade kunden sett
  // "Transportör: Cainiao" i fraktmejlet och dropship-ursprunget läckt. Samma
  // fail-safe-maskering som notis-/push-flödena (lib/carrier-mask): okänd/
  // ursprungs-carrier → undefined (transportör-raden döljs helt).
  const carrier = maskCarrierOrUndefined(
    firstStr(
      trackingInfo?.shippingProvider as string,
      trackingInfo?.carrier as string,
      firstFulfill?.shippingProvider as string,
    ),
  );

  // Filtrera till BARA den här sändningens rader. Vid delad leverans har varje
  // fulfillment egna `lineItems` ({ id, quantity }) som refererar orderns rader
  // på `id`. extractItems(order) är 1:1-justerad med order.lineItems → zippa på
  // index och behåll bara raderna i sändningen (med sändningens quantity).
  // Defensivt: saknas fulfillment.lineItems eller matchar inga id → alla rader.
  const allItems = extractItems(order);
  const orderLineItems = (order.lineItems ?? order.items) as Array<Record<string, unknown>> | undefined;
  const fulLineItems = firstFulfill?.lineItems as
    | Array<{ id?: string; _id?: string; lineItemId?: string; quantity?: number }>
    | undefined;
  let items: { name: string; qty: number; imageUrl?: string; variant?: string }[];
  if (Array.isArray(fulLineItems) && fulLineItems.length > 0 && Array.isArray(orderLineItems)) {
    const qtyById = new Map<string, number>();
    for (const fli of fulLineItems) {
      const id = String(fli.id ?? fli._id ?? fli.lineItemId ?? "");
      if (id) qtyById.set(id, (qtyById.get(id) ?? 0) + (Number(fli.quantity) || 1));
    }
    items = [];
    orderLineItems.forEach((oli, idx) => {
      const id = String((oli.id ?? oli._id) ?? "");
      const q = id ? qtyById.get(id) : undefined;
      const base = allItems[idx];
      if (q != null && base) {
        items.push({ name: base.name, qty: q, imageUrl: base.imageUrl, variant: base.variant });
      }
    });
    if (items.length === 0) items = allItems.map((it) => ({ name: it.name, qty: it.qty, imageUrl: it.imageUrl, variant: it.variant }));
  } else {
    items = allItems.map((it) => ({ name: it.name, qty: it.qty, imageUrl: it.imageUrl, variant: it.variant }));
  }

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

function buildCancellationProps(payload: Record<string, unknown>): { props: OrderCancellationProps; email: string } | null {
  // Cancel-events: kan vara på `order` med status="CANCELED" eller eget event.
  const order = (payload.order ?? payload) as Record<string, unknown>;
  const customer = extractCustomer(order);
  if (!customer) return null;

  const totals = (order.priceSummary ?? order.totals) as Record<string, unknown> | undefined;
  const totalAmount = moneyNum(totals?.total ?? totals?.totalPrice);
  const currency = moneyCurrency(totals ?? order.currency, "SEK");

  const paymentMethod = firstStr(
    (order.paymentSummary as { paymentMethods?: Array<{ method?: string }> } | undefined)?.paymentMethods?.[0]?.method,
    (order.billingInfo as { paymentMethod?: string } | undefined)?.paymentMethod,
  );

  // Cancellation reason kan ligga på flera platser
  const cancellationReason = firstStr(
    (order.cancellation as { reason?: string } | undefined)?.reason,
    payload.reason as string,
    (order as { cancellationReason?: string }).cancellationReason,
  );

  // refundInitiated: om payload har refund-info, då sker det parallellt
  const refundInitiated = Boolean(
    payload.refund ||
    (order.refunds as Array<unknown> | undefined)?.length,
  );

  const cancellationDate = formatSvDate(firstStr(
    (order.cancellation as { date?: string } | undefined)?.date,
    order.updatedDate as string,
    order._updatedDate as string,
  ));

  return {
    props: {
      firstName: customer.firstName,
      orderNumber: extractOrderNumber(order),
      cancellationDate,
      totalAmount,
      currency,
      paymentMethod,
      cancellationReason,
      refundInitiated,
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

  // Faktiskt återbetalat belopp ligger på refund.summary.refunded (Price) i
  // Wix RefundCompleted-eventet — INTE på refund.amount. Läs det. Fall ALDRIG
  // tillbaka på orderns totalsumma: vid DELVIS återbetalning rapporterade det
  // hela ordersumman till kunden (för högt belopp → tvist).
  const summary = (refund?.summary ?? {}) as { refunded?: unknown; requestedRefund?: unknown };
  const amount =
    moneyNum(summary.refunded) ||
    moneyNum(summary.requestedRefund) ||
    moneyNum(refund?.amount ?? refund?.totalRefundedAmount ?? payload.amount);
  const currency = moneyCurrency(summary.refunded ?? refund?.amount ?? order.priceSummary, "SEK");
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
}): Promise<"new" | "duplicate" | "error" | "collision"> {
  try {
    // RETURNING ger en rad ENBART när en NY rad faktiskt skrevs (inte vid
    // ON CONFLICT). Det är vår dedup-signal: "new" = första gången vi ser den
    // här sändningen (= mejla), "duplicate" = Wix-omfyrning (= hoppa mejl).
    const { rows } = await sql/*sql*/`
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
      RETURNING tracking_number
    `;
    if (rows.length > 0) {
      // NY sändning: registrera spårnumret hos 17TRACK (sv + dest SE) så
      // push-webhooken (app/api/track17-webhook) fyrar PROAKTIVT vid Delivered/
      // OutForDelivery — inte först när kunden råkar öppna /sparning. Velo-style.
      // Idempotent på 17TRACK-sidan; aldrig kastande (fångar internt + 3s timeout).
      await registerWith17Track(opts.trackingNumber, opts.orderId);
      return "new";
    }
    // Konflikt på tracking_number. Antingen en benign Wix-omfyrning av SAMMA
    // sändning (→ "duplicate"), ELLER — farligt — två OLIKA kunder på samma
    // spårnummer (AliExpress återanvänder ibland nummer). I det senare fallet kan
    // vi inte avgöra vem en framtida push/SMS gäller → KARANTÄN: markera raden
    // 'ambiguous' så varken push eller SMS auto-notifierar (inkl. hämtkod) fel
    // kund. findMapping i båda flödena exkluderar 'ambiguous'. Hanteras manuellt.
    const ex = await sql<{ customer_email: string; status: string }>/*sql*/`
      SELECT customer_email, status FROM tracking_mapping
       WHERE tracking_number = ${opts.trackingNumber} LIMIT 1
    `;
    const row = ex.rows[0];
    if (
      row &&
      row.status !== "ambiguous" &&
      row.customer_email &&
      opts.customerEmail &&
      row.customer_email.trim().toLowerCase() !== opts.customerEmail.trim().toLowerCase()
    ) {
      await sql/*sql*/`
        UPDATE tracking_mapping SET status = 'ambiguous', updated_at = NOW()
         WHERE tracking_number = ${opts.trackingNumber}
      `;
      console.error(
        `[wix-webhook] tracking_number-KOLLISION ${opts.trackingNumber}: ${row.customer_email} vs ${opts.customerEmail} → karantän (auto-notiser stoppade, hantera manuellt)`,
      );
      return "collision";
    }
    return "duplicate";
  } catch (err) {
    console.error("[wix-webhook] tracking_mapping insert failed", err);
    return "error";
  }
}

// Klassificera event-typ. Wix v2 ger oss `entityFqdn + slug` som unik nyckel
// (t.ex. "wix.ecom.v1.order.created"). Vi matchar FÖRST på den exakta strängen,
// och faller tillbaka på substring-matchning för legacy/test-payloads.
//
// Mappning (verifierad mot https://dev.wix.com/docs/api-reference/...):
//   wix.ecom.v1.order.created                          → order_created
//   wix.ecom.v1.order.canceled                         → order_cancelled
//   wix.ecom.v1.order.fulfilled                        → order_shipped (legacy)
//   wix.ecom.v1.fulfillments.updated                   → order_fulfillments_updated
//   wix.ecom.v1.order_transactions.refund_completed    → refund
//   wix.ecom.v1.abandoned_checkout.created             → abandoned_checkout_created
type EventKind =
  | "order_created"
  | "order_shipped"                  // Order Fulfilled (slug=fulfilled) — full order i payload
  | "order_fulfillments_updated"     // Fulfillments Updated — bara orderId+fulfillments, måste fetcha order
  | "refund"
  | "order_cancelled"
  | "abandoned_checkout_created"
  | "unknown";

function classify(
  eventType: string,
  entityFqdn: string | undefined,
  slug: string | undefined,
  payload: Record<string, unknown>,
): EventKind {
  const t = eventType.toLowerCase();
  const fqdn = (entityFqdn ?? "").toLowerCase();
  const s = (slug ?? "").toLowerCase();

  // 1. Exakt composite-matchning (Wix v2 kanoniska events)
  // Order Created skickas i praktiken med slug="approved" (NY checkout godkänd
  // av Klarna → ordern blir live i Wix). "created" och "placed" är legacy/
  // alternativa namn. Alla tre behandlas som order_created.
  if (fqdn === "wix.ecom.v1.order" && (s === "approved" || s === "created" || s === "placed")) return "order_created";
  if (fqdn === "wix.ecom.v1.order" && s === "canceled") return "order_cancelled";
  if (fqdn === "wix.ecom.v1.order" && s === "fulfilled") return "order_shipped";
  if (fqdn === "wix.ecom.v1.fulfillments" && s === "updated") return "order_fulfillments_updated";
  if (fqdn === "wix.ecom.v1.order_transactions" && s === "refund_completed") return "refund";
  if (fqdn === "wix.ecom.v1.abandoned_checkout" && s === "created") return "abandoned_checkout_created";

  // 2. Substring-fallback (legacy event-typer, testpayloads, framtida varianter)
  if (t.includes("abandoned_checkout") && (t.includes("created") || s === "created")) return "abandoned_checkout_created";
  if (t.includes("refund")) return "refund";
  // Cancellation FÖRE "shipped"/"fulfillment" — "order_canceled" får inte
  // misstolkas som leverans.
  if (t.includes("cancel")) return "order_cancelled";
  if (t.includes("fulfillment")) return "order_fulfillments_updated";
  if (t.includes("shipped") || t.includes("shipment") || t.includes("fulfilled")) return "order_shipped";
  if (t.includes("order_created") || t.includes("ordercreated") || t.includes("order_approved")) return "order_created";

  // Fallback: kolla payload-shape
  if (payload.refund || (payload as { fulfillment?: unknown }).fulfillment || (payload as { fulfillments?: unknown }).fulfillments) {
    if (payload.refund) return "refund";
    return "order_fulfillments_updated";
  }
  return "unknown";
}

// Fetch full order from Wix eCom API. Used by Fulfillments Updated where the
// webhook payload only contains { orderId, fulfillments[] } — no customer
// email or line items. Same auth as lib/order-sync.ts. Returns null on any
// failure (callers ack 200 + handled:false; we never block the webhook).
export async function fetchWixOrder(orderId: string): Promise<Record<string, unknown> | null> {
  const key = process.env.WIX_API_KEY;
  const site = process.env.WIX_SITE_ID;
  if (!key || !site || !orderId) {
    console.warn(
      `[wix-webhook] fetchWixOrder: saknad config (key=${Boolean(key)}, site=${Boolean(site)}, orderId=${Boolean(orderId)})`,
    );
    return null;
  }
  try {
    const res = await fetch(`https://www.wixapis.com/ecom/v1/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
      headers: {
        Authorization: key,
        "wix-site-id": site,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      // Tidsgräns: detta körs i webhookens request-väg (fulfillments/refund).
      // Ett hängande Wix-API får ALDRIG blockera svaret → Wix-timeout/retry-storm.
      // Samma 3s-konvention som lib/meta-capi/expo-push/track17. TimeoutError
      // fångas av catch → null → anroparen ack:ar 200 handled:false.
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.warn(`[wix-webhook] fetchWixOrder(${orderId}) → HTTP ${res.status}: ${txt.slice(0, 200)}`);
      return null;
    }
    const json = (await res.json()) as { order?: Record<string, unknown> };
    return json.order ?? null;
  } catch (err) {
    console.error(`[wix-webhook] fetchWixOrder(${orderId}) fel`, err);
    return null;
  }
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

// Per-line-item content_id, 1:1-justerad mot extractItems (ingen filtrering, samma
// ordning/längd). catalogItemId/productId = Wix katalog-GUID som matchar PDP/cart-
// eventen och Meta-produktkatalogen. Sista fallback är line-itemets eget _id (ett
// GUID som ALLTID finns på en Wix order-rad) — ALDRIG produktnamnet, som inte
// matchar något i Meta-katalogen och varierar med locale/versaler.
function extractContentIdsAligned(order: Record<string, unknown>): (string | undefined)[] {
  const lineItems = (order.lineItems ?? order.items) as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(lineItems)) return [];
  return lineItems.map((li) => {
    const ref = li.catalogReference as { catalogItemId?: string; productId?: string } | undefined;
    return firstStr(
      ref?.catalogItemId,
      ref?.productId,
      li.productId as string,
      li.catalogItemId as string,
      li._id as string,
    );
  });
}

// Server-autoritativt Meta Purchase via CAPI. Fyras vid order_created — når
// alltså fram även när kundens /tack-sida aldrig laddas (adblock/iOS stoppar
// klient-Pixeln). Dedupliceras mot klientens Purchase (lib/analytics) via SAMMA
// deterministiska event_id `purchase_<GUID>`. orderId tas från orderns _id/id
// (GUID) — det är det värde Wix headless redirectar med till /tack och som
// klienten i sin tur kräver är ett GUID innan den fyrar (annars hoppar den över
// och låter detta event vara enda källan). number/orderNumber är bara nödfall.
//
// Best-effort: ett fel får ALDRIG blockera bekräftelsemejlet. Loggen ovan gör
// att en eventuell id-källemiss (t.ex. saknat _id) syns i prod-loggen.
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
    // Justerad per-rad-lista (samma längd/ordning som items) med GUID-fallback,
    // så contents[i].id alltid pekar på rätt rad och aldrig på ett produktnamn.
    const alignedIds = extractContentIdsAligned(order);
    const numItems = items.reduce((n, it) => n + it.qty, 0) || contentIds.length || 1;
    // GUID (_id) FÖRST: det är detta Wix headless lägger i /tack-redirecten och
    // det klienten (lib/analytics) bygger sitt event_id på. number/orderNumber
    // är bara nödfallback — ett ordernummer här skulle INTE matcha klientens
    // GUID och ge dubbelräkning, så vi loggar om vi tvingas dit.
    const guid = firstStr(order._id as string, order.id as string);
    const orderId = guid ?? firstStr(order.number as string, order.orderNumber as string);
    if (!guid) {
      console.warn(
        `[wix-webhook] Meta Purchase: order saknar _id/id (GUID) — föll tillbaka på ordernummer=${orderId ?? "null"}. ` +
          "Detta matchar INTE klientens GUID-baserade event_id → risk för dubbelräkning i Meta.",
      );
    }
    console.log(`[wix-webhook] Meta Purchase event_id=purchase_${orderId ?? "(saknas)"} (guid=${Boolean(guid)})`);

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
          id: alignedIds[i] ?? `wix_line_${i}`,
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
  // Krismiljö (2026-06-17): när webhook-JWT:erna signeras med en annan nyckel
  // än den vi installerat (under nyckel-felsökning) ger strikt verifiering 401,
  // Wix retry:ar och kunderna får aldrig sina bekräftelsemejl. Med
  // `WIX_WEBHOOK_ALLOW_UNVERIFIED=true` accepterar vi payloaden ändå
  // (med varningslogg + verified=false) så fanout/order-record/push fortsätter
  // fungera och Wix slutar retry:a. Default är fortfarande strikt (säkert).
  const allowUnverified = (process.env.WIX_WEBHOOK_ALLOW_UNVERIFIED || "").toLowerCase() === "true";
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
    } else if (allowUnverified) {
      // Krisläge: acceptera ändå men dekoda payloaden själv utan verifiering.
      console.warn(
        "[wix-webhook] JWT-signatur ogiltig MEN WIX_WEBHOOK_ALLOW_UNVERIFIED=true — accepterar overifierat (säkerhetsläckage, stäng av när rätt nyckel är installerad)",
      );
      try {
        const [, __p] = jwtToken.split(".");
        payload = JSON.parse(Buffer.from(__p, "base64url").toString("utf8")) as Record<string, unknown>;
      } catch {
        console.error("[wix-webhook] JWT-signatur ogiltig + payload-decode failed — avvisar");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      // Strikt: avvisa
      console.error("[wix-webhook] JWT-signatur ogiltig — avvisar (sätt WIX_WEBHOOK_ALLOW_UNVERIFIED=true för krisläge)");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    // Hit når vi när body INTE är en JWT (eller ingen public key finns).
    if (publicKey && !allowUnverified) {
      // En äkta Wix-webhook är ALLTID JWT-signerad. Saknas JWT trots att vi har
      // en public key → avvisa. Annars kunde vem som helst POSTa rå JSON och
      // förfalska order/refund/cancel-event (skicka spoofade mejl, fyra Meta
      // Purchase, förgifta tracking_mapping, smutsa orders). Krisläge
      // (WIX_WEBHOOK_ALLOW_UNVERIFIED=true) kan tillfälligt släppa förbi.
      console.error("[wix-webhook] Body är inte en signerad JWT men public key finns — avvisar (krisläge: sätt WIX_WEBHOOK_ALLOW_UNVERIFIED=true)");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    if (!publicKey) {
      console.warn("[wix-webhook] WIX_WEBHOOK_PUBLIC_KEY saknas — accepterar OVERIFIERAD payload (bör sättas i Vercel)");
    } else {
      console.warn("[wix-webhook] Body är inte en JWT MEN WIX_WEBHOOK_ALLOW_UNVERIFIED=true — accepterar overifierat (krisläge)");
    }
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      console.error("[wix-webhook] Kunde inte parsa body som JSON");
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
  }

  // Resend-key kan saknas under setup — då skickar vi inga mejl men resten
  // av flödet (fanout, order-record, push, ISR) körs ändå så vi inte tappar
  // data + Wix slutar retry:a.
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("[wix-webhook] RESEND_API_KEY saknas — webhook bearbetas men INGA MEJL skickas");
  }

  if (!payload) {
    return NextResponse.json({ error: "Empty payload" }, { status: 400 });
  }

  const { eventType, entity, entityFqdn, slug, entityId } = unwrap(payload);
  const kind = classify(eventType, entityFqdn, slug, entity);

  // Strukturerad logg per event — gör det möjligt att i Vercel-loggen filtrera
  // på `kind=` och se exakt vad vi gjorde med varje webhook. Skriv ut FÖRE
  // dispatch så att en handler-krasch ändå syns kopplad till rätt event.
  console.log(
    `[wix-webhook] dispatch fqdn=${entityFqdn ?? "—"} slug=${slug ?? "—"} entityId=${entityId ?? "—"} eventType=${eventType || "—"} → kind=${kind} verified=${verified}`,
  );

  // ---------------------------------------------------------------------------
  // Fan-out till cache-warmer (best-effort, non-blocking).
  //
  // Wix tillåter bara EN webhook-subscription per event-type i hela företaget,
  // så vi kan inte registrera både detta projekt och fyndplats-cache-warmer för
  // samma order-events. Lösning: vi tar emot här, verifierar signaturen, och
  // forwardar samma raw body till cache-warmer för dess fulfillment-tasks.
  //
  // Fire-and-forget: ett fel hos cache-warmer får ALDRIG fördröja eller fälla
  // webhook-svaret till Wix (det skulle ge retry → dubbla bekräftelsemejl).
  // Implementation i lib/webhook-fanout för testbarhet.
  // ---------------------------------------------------------------------------
  if (shouldFanoutToCacheWarmer(eventType)) {
    void fanoutToCacheWarmer({
      rawBody,
      eventType,
      digest: req.headers.get("digest"),
    });
  }

  // Abandoned checkout (wix.ecom.v1.abandoned_checkout, slug=created) — enqueue
  // the cart for the 3-email recovery flow. Vi dispatcher på classified kind
  // (inte raw eventType) så att FQDN+slug-matchningen kicks in även när slug
  // är den generiska "created"-strängen.
  if (kind === "abandoned_checkout_created") {
    try {
      const result = await handleAbandonedCheckoutCreated({
        slug: slug ?? "created",
        abandonedCheckout:
          (entity.abandonedCheckout as Record<string, unknown> | undefined) ?? entity,
      } as Parameters<typeof handleAbandonedCheckoutCreated>[0]);
      return NextResponse.json({ received: true, abandonedCart: result }, { status: 200 });
    } catch (err) {
      console.error("[wix-webhook] abandoned_checkout fel", err);
      return NextResponse.json({ error: "abandoned-cart handler failed" }, { status: 500 });
    }
  }

  if (kind === "unknown") {
    // Bekräfta ändå (200) — okänd event-typ ska inte få Wix att retry:a evigt.
    // Vi loggar entityFqdn+slug separat så det blir trivialt att identifiera
    // vilken NY event-typ vi inte stödjer (om Leonard prenumererar på fler).
    console.warn(
      `[wix-webhook] Okänd event-typ fqdn=${entityFqdn ?? "—"} slug=${slug ?? "—"} eventType="${eventType}" (verified=${verified}) — ack:ar`,
    );
    return NextResponse.json({ received: true, handled: false }, { status: 200 });
  }

  // resend null när RESEND_API_KEY saknas — varje emails.send-anrop nedan är
  // nullsafe så vi loggar "SKIPPED" och fortsätter med fanout/push/recordOrder
  // istället för att 500:a hela webhooken.
  const resend = resendKey ? new Resend(resendKey) : null;

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
      // Spegla ordern till vår lokala `orders`-tabell för morgon-dashboarden.
      try {
        await recordOrder(entity as Record<string, unknown>);
      } catch (err) {
        console.error("[wix-webhook] recordOrder fel (ignorerar)", err);
      }
      // ISR on-demand revalidation: PDPs är cachade i 5 min (revalidate=300 i
      // app/produkt/[slug]/page.tsx). När ett köp sker måste vi PUSHA en ny
      // version omgående så lager-display ("X kvar i lager" / "Slutsåld") inte
      // ligger 0-5 min efter. catalogItemId från orden → slug via cachad
      // getProducts() → revalidatePath('/produkt/<slug>'). Best-effort: får
      // aldrig blockera bekräftelsemejlet.
      try {
        const ids = extractContentIds(entity);
        if (ids.length > 0) {
          const all = await getProducts();
          const idToSlug = new Map(all.map((p) => [p.id, p.slug]));
          const revalidated: string[] = [];
          for (const id of ids) {
            const slug = idToSlug.get(id);
            if (slug) {
              revalidatePath(`/produkt/${slug}`);
              revalidated.push(slug);
            }
          }
          if (revalidated.length > 0) {
            console.log(
              `[wix-webhook] order_created ISR-revalidated PDPs: ${revalidated.join(", ")}`,
            );
          }
        }
      } catch (err) {
        console.error("[wix-webhook] revalidatePath fel (ignorerar)", err);
      }
      const props = buildOrderConfirmationProps(entity);
      if (!props) {
        console.warn("[wix-webhook] order_created: kunde inte extrahera kund — skippar mejl (ordern är speglad)");
        return NextResponse.json({ received: true, handled: false, mirrored: true }, { status: 200 });
      }
      const customer = extractCustomer(entity)!;

      // DEDUP-VAKT mot dubbla orderbekräftelser. Wix fyrar order-eventet flera
      // gånger för samma order — slug "created" OCH "approved" klassas BÅDA som
      // order_created, plus Wix at-least-once-retries. Atomiskt anspråk på orderns
      // GUID: vinner vi → skicka; förlorar vi (redan skickat) → hoppa mejl + push.
      // Misslyckas mejlet släpper vi anspråket så en retry kan skicka igen (ingen
      // tappad bekräftelse). Meta Purchase körs ändå (dedupliceras på event_id).
      const dedupId = firstStr(entity._id, entity.id, props.orderNumber);
      const firstSend = dedupId ? await claimOrderConfirmation(dedupId, props.orderNumber) : true;

      let resendId: string | undefined;
      if (!firstSend) {
        console.log(
          `[wix-webhook] order_created ${props.orderNumber}: dubblett-webhook — bekräftelse redan skickad, hoppar mejl + push (dedup)`,
        );
      } else if (resend) {
        try {
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
            throw new Error("Resend send failed");
          }
          resendId = sent.data?.id;
          console.log(
            `[wix-webhook] order_created ${props.orderNumber}: bekräftelsemejl skickat (resendId=${resendId})`,
          );
        } catch (err) {
          console.error("[wix-webhook] Resend order_created fel", err);
          // Släpp anspråket så Wix-retryn kan skicka bekräftelsen på nytt.
          if (dedupId) await releaseOrderConfirmation(dedupId);
          return NextResponse.json({ error: "Email send failed" }, { status: 500 });
        }
      } else {
        // Inget Resend-key (sällsynt setup-läge) → släpp anspråket så en framtida
        // körning med key kan skicka bekräftelsen.
        if (dedupId) await releaseOrderConfirmation(dedupId);
        console.warn(
          `[wix-webhook] order_created ${props.orderNumber}: SKIPPED email (RESEND_API_KEY saknas) — kund ${customer.email} får INGET mejl`,
        );
      }
      await fireMetaPurchase(entity);
      if (firstSend) {
        firePush({
          userEmail: customer.email,
          channel: "order",
          title: "Order bekräftad! 🎉",
          body: `Tack för din beställning ${props.orderNumber}. Vi börjar packa direkt.`,
          data: { type: "order_created", orderNumber: props.orderNumber },
        });
      }
      return NextResponse.json({ received: true, sent: resendId, deduped: !firstSend, verified }, { status: 200 });
    }

    if (kind === "order_fulfillments_updated") {
      // Wix Fulfillments Updated-payloaden innehåller bara { orderId, fulfillments[] }
      // — INGEN kund, inga lineItems, inga prissummor. Vi måste fetcha hela
      // ordern från Wix Orders API innan vi kan bygga ett shipping-mejl.
      const orderId = firstStr(entity.orderId as string, entityId);
      if (!orderId) {
        console.warn("[wix-webhook] order_fulfillments_updated: ingen orderId — skippar");
        return NextResponse.json({ received: true, handled: false, reason: "no orderId" }, { status: 200 });
      }
      const fulfillmentsArr = (entity.fulfillments as Array<Record<string, unknown>> | undefined) ?? [];
      // EN sändning per trackingNumber. Vi mejlar bara sändningar SOM HAR spårnr
      // (mallen centrerar på spårnumret — ett trackingslöst "på väg"-mejl vore brutet).
      const trackedFulfillments = fulfillmentsArr.filter((f) =>
        firstStr((f.trackingInfo as { trackingNumber?: string } | undefined)?.trackingNumber, f.trackingNumber as string),
      );
      if (trackedFulfillments.length === 0) {
        console.warn(`[wix-webhook] order_fulfillments_updated ${orderId}: ingen sändning med trackingNumber — skippar`);
        return NextResponse.json({ received: true, handled: false, reason: "no tracking" }, { status: 200 });
      }
      const order = await fetchWixOrder(orderId);
      if (!order) {
        console.warn(`[wix-webhook] order_fulfillments_updated ${orderId}: kunde inte hämta order från Wix API — ack:ar`);
        return NextResponse.json({ received: true, handled: false, reason: "fetch failed" }, { status: 200 });
      }
      const customerPhone = extractCustomerPhone(order) ?? null;
      const sentIds: string[] = [];
      let skippedDup = 0;
      // ETT mejl PER sändning: rätt spårnr + BARA den sändningens rader.
      for (const f of trackedFulfillments) {
        const tracking = firstStr(
          (f.trackingInfo as { trackingNumber?: string } | undefined)?.trackingNumber,
          f.trackingNumber as string,
        )!;
        const built = buildShippingProps({ order, fulfillment: f });
        if (!built) continue;
        // Dedup per sändning (tracking_mapping unik på tracking_number): "new" =
        // första gången → mejla; "duplicate" = Wix-omfyrning → hoppa; "error" =
        // fail-open (hellre ett mejl än tyst tappat).
        const map = await upsertTrackingMapping({
          trackingNumber: tracking,
          orderId: built.props.orderNumber === "—" ? null : built.props.orderNumber,
          customerEmail: built.email,
          customerName: built.props.firstName === "kund" ? null : built.props.firstName,
          customerPhone,
        });
        if (map === "duplicate") {
          skippedDup++;
          continue;
        }
        if (resend) {
          // Override trackingNumber defensivt så mejlet ALLTID visar denna sändnings spårnr.
          const html = await render(ShippingConfirmationEmail({ ...built.props, trackingNumber: tracking }));
          const sent = await resend.emails.send({
            from: FROM,
            to: built.email,
            replyTo: REPLY_TO,
            subject: `Ditt paket är på väg – order ${built.props.orderNumber}`,
            html,
          });
          if (sent.error) {
            // Logga men returnera INTE 500: en 500 → Wix retry:ar HELA eventet, och
            // redan skickade sändningar dedupas bort → den misslyckade skulle ändå
            // hoppas över. Hellre logga för manuell omsändning.
            console.error(`[wix-webhook] Resend order_fulfillments_updated fel (tracking=${tracking})`, sent.error);
            // Släpp dedup-anspråket för DENNA sändning så Wix "Order Fulfilled"-
            // eventet (delar samma tracking_number-nyckel) eller en manuell
            // omsändning kan skicka fraktmejlet — annars dedupas det bort permanent.
            if (map === "new") {
              try {
                await sql/*sql*/`DELETE FROM tracking_mapping WHERE tracking_number = ${tracking}`;
              } catch (e) {
                console.error("[wix-webhook] kunde inte släppa tracking_mapping vid send-fel", e);
              }
            }
            continue;
          }
          if (sent.data?.id) sentIds.push(sent.data.id);
          console.log(
            `[wix-webhook] order_fulfillments_updated ${orderId}: shipping-mejl skickat (tracking=${tracking}, items=${built.props.items.length}, resendId=${sent.data?.id}, map=${map})`,
          );
        } else {
          console.warn(`[wix-webhook] order_fulfillments_updated ${orderId}: SKIPPED email (RESEND_API_KEY saknas) — kund ${built.email} (tracking=${tracking})`);
        }
        firePush({
          userEmail: built.email,
          channel: "order",
          title: "Ditt paket är på väg ✈️",
          body: `Order ${built.props.orderNumber} är skickad. Spårningsnr: ${tracking}`,
          data: { type: "order_shipped", orderNumber: built.props.orderNumber, trackingNumber: tracking },
        });
      }
      return NextResponse.json({ received: true, sent: sentIds, skippedDuplicates: skippedDup, verified }, { status: 200 });
    }

    if (kind === "order_shipped") {
      const built = buildShippingProps(entity);
      if (!built) {
        console.warn("[wix-webhook] order_shipped: kunde inte extrahera kund — skippar");
        return NextResponse.json({ received: true, handled: false }, { status: 200 });
      }
      let trackingMapped: "new" | "duplicate" | "error" | "collision" | "skipped" = "skipped";
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
      let resendId: string | undefined;
      // Dedup: dela SAMMA nyckel (tracking_number) som order_fulfillments_updated.
      // Wix kan fyra både "Fulfillments Updated" OCH "Order Fulfilled" för samma
      // sändning → utan detta skickades frakt-mejlet två gånger. "duplicate" =
      // redan skickat för det spårningsnumret → hoppa mejl + push. ("new"/"error"
      // = skicka; "skipped" = ingen tracking, kan inte dedupas men är ovanligt.)
      if (trackingMapped === "duplicate") {
        console.log(`[wix-webhook] order_shipped ${built.props.orderNumber}: redan skickat för detta spårningsnummer (dedup) — hoppar mejl + push`);
      } else if (resend) {
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
          // Släpp dedup-anspråket så Wix-retry (pga 500) kan skicka fraktmejlet
          // igen i stället för att dedupa bort det permanent. SMS-mappningen
          // återskapas på retry (upsert → "new" igen, 17TRACK-register idempotent).
          if (trackingMapped === "new" && built.props.trackingNumber) {
            try {
              await sql/*sql*/`DELETE FROM tracking_mapping WHERE tracking_number = ${built.props.trackingNumber}`;
            } catch (e) {
              console.error("[wix-webhook] kunde inte släppa tracking_mapping vid send-fel", e);
            }
          }
          return NextResponse.json({ error: "Email send failed" }, { status: 500 });
        }
        resendId = sent.data?.id;
      } else {
        console.warn(`[wix-webhook] order_shipped: SKIPPED email (RESEND_API_KEY saknas) — kund ${built.email}`);
      }
      if (trackingMapped !== "duplicate") {
        firePush({
          userEmail: built.email,
          channel: "order",
          title: "Ditt paket är på väg ✈️",
          body: built.props.trackingNumber
            ? `Order ${built.props.orderNumber} är skickad. Spårningsnr: ${built.props.trackingNumber}`
            : `Order ${built.props.orderNumber} är skickad och på väg till dig.`,
          data: { type: "order_shipped", orderNumber: built.props.orderNumber, trackingNumber: built.props.trackingNumber },
        });
      }
      return NextResponse.json({ received: true, sent: resendId, trackingMapped, deduped: trackingMapped === "duplicate", verified }, { status: 200 });
    }

    if (kind === "order_cancelled") {
      const built = buildCancellationProps(entity);
      if (!built) {
        console.warn("[wix-webhook] order_cancelled: kunde inte extrahera kund — skippar");
        return NextResponse.json({ received: true, handled: false }, { status: 200 });
      }
      let resendId: string | undefined;
      if (resend) {
        const html = await render(OrderCancellationEmail(built.props));
        const sent = await resend.emails.send({
          from: FROM,
          to: built.email,
          replyTo: REPLY_TO,
          subject: `Din beställning ${built.props.orderNumber} är avbruten`,
          html,
        });
        if (sent.error) {
          console.error("[wix-webhook] Resend order_cancelled fel", sent.error);
          return NextResponse.json({ error: "Email send failed" }, { status: 500 });
        }
        resendId = sent.data?.id;
      } else {
        console.warn(`[wix-webhook] order_cancelled ${built.props.orderNumber}: SKIPPED email (RESEND_API_KEY saknas)`);
      }
      return NextResponse.json({ received: true, sent: resendId, verified }, { status: 200 });
    }

    if (kind === "refund") {
      // Wix v2 refund_completed-payloaden innehåller bara {orderId, refund:{…}}
      // — INGEN kund, inga lineItems. Vi måste fetcha hela ordern från Wix
      // Orders API innan vi kan bygga refund-mejlet (samma som fulfillments).
      const refundOrderId = firstStr(entity.orderId as string, entityId);
      let refundPayload: Record<string, unknown> = entity;
      if (refundOrderId) {
        const fetchedOrder = await fetchWixOrder(refundOrderId);
        if (fetchedOrder) {
          // Slå ihop: order-fälten (customer, number, priceSummary) + refund-objektet
          // från webhook-bodyn. buildRefundProps tar `payload.order` ?? payload, så
          // vi lägger fulla ordern på topp och bifogar refund.
          refundPayload = { ...fetchedOrder, refund: entity.refund ?? entity };
        } else {
          console.warn(`[wix-webhook] refund ${refundOrderId}: kunde inte hämta order från Wix API — försöker bygga från payload`);
        }
      }
      const built = buildRefundProps(refundPayload);
      if (!built) {
        console.warn("[wix-webhook] refund: kunde inte extrahera kund — skippar");
        return NextResponse.json({ received: true, handled: false }, { status: 200 });
      }
      let resendId: string | undefined;
      if (resend) {
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
        resendId = sent.data?.id;
      } else {
        console.warn(`[wix-webhook] refund ${built.props.orderNumber}: SKIPPED email (RESEND_API_KEY saknas)`);
      }
      return NextResponse.json({ received: true, sent: resendId, verified }, { status: 200 });
    }
  } catch (err) {
    console.error("[wix-webhook] Oväntat fel under email-send", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true, handled: false }, { status: 200 });
}

// GET för enkel health-check (Vercel + manuell verifikation).
// ENGÅNGS-recovery: /api/wix-webhook?recover=10001 (eller 10002) — skickar om
// orderbekräftelse för specifika order som missades innan webhook-fixet.
// Allowlist är hårdkodad och tas bort efter användning.
const RECOVERY_ALLOWLIST = new Set(["10001", "10002"]);

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
      body: JSON.stringify({ search: { filter: { number: { $eq: orderNumber } } } }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { orders?: Array<{ id?: string; _id?: string }> };
    const o = json.orders?.[0];
    return o?.id ?? o?._id ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  // ENGÅNGS-test: ?test_bounce=1 skickar ett mejl till Resends bounce-simulator
  // (bounced@resend.dev) → Resend triggar email.bounced → vår resend-webhook
  // notifierar info@. Använd EN gång för att verifiera webhook-pipeline, ta
  // sen bort denna handler.
  if (req.nextUrl.searchParams.get("test_bounce") === "1") {
    const k = process.env.RESEND_API_KEY;
    if (!k) return NextResponse.json({ error: "RESEND_API_KEY saknas" }, { status: 500 });
    try {
      const r = new Resend(k);
      const sent = await r.emails.send({
        from: FROM,
        to: "bounced@resend.dev",
        subject: "Fyndplats bounce-test",
        html: "<p>Bara ett test för att trigga email.bounced-webhook. Mejlet kommer bouncea och vår resend-webhook ska notifiera info@fyndplats.com.</p>",
      });
      if (sent.error) return NextResponse.json({ ok: false, error: String(sent.error) }, { status: 500 });
      return NextResponse.json({ ok: true, resendId: sent.data?.id, expectBounceWithin: "~30s" });
    } catch (err) {
      return NextResponse.json({ error: "send failed", details: String(err) }, { status: 500 });
    }
  }

  // One-time recovery path: ?recover=<orderNumber>
  const recover = req.nextUrl.searchParams.get("recover");
  if (recover && RECOVERY_ALLOWLIST.has(recover)) {
    const orderId = await findOrderIdByNumber(recover);
    if (!orderId) {
      return NextResponse.json({ error: `Order #${recover} hittades inte` }, { status: 404 });
    }
    const order = await fetchWixOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: `Kunde inte hämta order ${orderId}` }, { status: 502 });
    }
    const props = buildOrderConfirmationProps(order);
    const customer = extractCustomer(order);
    if (!props || !customer) {
      return NextResponse.json({ error: "Kunde inte extrahera kund/order-data" }, { status: 422 });
    }
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: "RESEND_API_KEY saknas" }, { status: 500 });
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
      console.error("[wix-webhook] recovery resend fel", sent.error);
      return NextResponse.json({ error: "Resend send failed", details: String(sent.error) }, { status: 500 });
    }
    console.log(`[wix-webhook] recovery skickade orderbekräftelse #${props.orderNumber} → ${customer.email} (resendId=${sent.data?.id})`);
    return NextResponse.json({
      ok: true,
      orderId,
      orderNumber: props.orderNumber,
      email: customer.email,
      resendId: sent.data?.id,
    });
  }

  return NextResponse.json({
    status: "ok",
    endpoint: "wix-webhook",
    accepts: [
      "wix.ecom.v1.order.created",
      "wix.ecom.v1.order.canceled",
      "wix.ecom.v1.order.fulfilled",
      "wix.ecom.v1.fulfillments.updated",
      "wix.ecom.v1.order_transactions.refund_completed",
      "wix.ecom.v1.abandoned_checkout.created",
    ],
    signatureVerification: process.env.WIX_WEBHOOK_PUBLIC_KEY ? "enabled" : "disabled (key missing)",
    allowUnverified: (process.env.WIX_WEBHOOK_ALLOW_UNVERIFIED || "").toLowerCase() === "true",
    emailSending: process.env.RESEND_API_KEY ? "enabled" : "DISABLED (RESEND_API_KEY missing)",
    orderFetch: process.env.WIX_API_KEY && process.env.WIX_SITE_ID ? "enabled" : "disabled (WIX_API_KEY/WIX_SITE_ID missing)",
  });
}
