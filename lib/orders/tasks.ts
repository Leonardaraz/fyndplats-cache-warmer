import type {
  FulfillmentTask,
  OrderEvent,
  ShippingAddress,
  WixLineItem,
  WixOrder,
} from "./types";

/**
 * Plockar ut WixOrder ur rätt event-wrapper. Wix lägger entiteten på olika
 * ställen beroende på event-typ:
 *   createdEvent.entity         — Order Created
 *   updatedEvent.currentEntity  — Order/Fulfillments Updated (currentEntity är
 *                                 den NYA staten; `entity` är en sällsynt variant)
 *   actionEvent.body[.order]    — Order Approved / Paid / Fulfilled. `body` kan
 *                                 vara ett objekt ELLER en JSON-strängad payload,
 *                                 och ordern är ofta wrappad i `.order`.
 * Returnerar undefined om ingen order hittas.
 */
function extractOrder(raw: Record<string, unknown>): WixOrder | undefined {
  const created = raw.createdEvent as { entity?: WixOrder } | undefined;
  if (created?.entity) return created.entity;

  const updated = raw.updatedEvent as { currentEntity?: WixOrder; entity?: WixOrder } | undefined;
  if (updated?.currentEntity) return updated.currentEntity;
  if (updated?.entity) return updated.entity;

  const action = raw.actionEvent as { body?: unknown } | undefined;
  if (action?.body !== undefined) {
    let body: unknown = action.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = undefined;
      }
    }
    if (body && typeof body === "object") {
      const wrapped = (body as { order?: WixOrder }).order;
      return wrapped ?? (body as WixOrder);
    }
  }
  return undefined;
}

/** Första icke-tomma strängen ur en lista (defensiv mot olika event-shapes). */
function firstStr(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

/**
 * Den råa entiteten ur valfri event-wrapper, OAVSETT om den är en full order eller
 * (för refunds) ett `{orderId, refund}`-objekt utan order-fält. Skiljer sig från
 * extractOrder genom att INTE kräva en WixOrder — refund_completed-payloaden bär
 * `currentEntity = {orderId, refund:{…}}` (ingen `.order`, inget `id`).
 */
function rawEntity(raw: Record<string, unknown>): Record<string, unknown> | undefined {
  const created = raw.createdEvent as { entity?: unknown } | undefined;
  if (created?.entity && typeof created.entity === "object") return created.entity as Record<string, unknown>;

  const updated = raw.updatedEvent as { currentEntity?: unknown; entity?: unknown } | undefined;
  if (updated?.currentEntity && typeof updated.currentEntity === "object") return updated.currentEntity as Record<string, unknown>;
  if (updated?.entity && typeof updated.entity === "object") return updated.entity as Record<string, unknown>;

  const action = raw.actionEvent as { body?: unknown } | undefined;
  if (action?.body !== undefined) {
    let body: unknown = action.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = undefined;
      }
    }
    if (body && typeof body === "object") {
      const order = (body as { order?: unknown }).order;
      if (order && typeof order === "object") return order as Record<string, unknown>;
      return body as Record<string, unknown>;
    }
  }
  return undefined;
}

export type WixEventKind = "create" | "cancel" | "refund" | "other";

/**
 * Klassificerar ett (redan uppvecklat) Wix-event på (entityFqdn, slug)-PARET — speglar
 * headless `classify()`. KRITISKT: refund ligger under FQDN `order_transactions`
 * (slug `refund_completed`), INTE under `order`, och Wix fyrar ALDRIG `order.refunded`.
 * En cancel är `order` + slug `canceled` (ETT l). Allt annat (created/approved/paid/
 * fulfilled/okänt) → "other" och går den befintliga create-vägen (deriveTasks).
 */
export function classifyWixEvent(raw: Record<string, unknown>): WixEventKind {
  const fqdn = firstStr(raw.entityFqdn).toLowerCase();
  const slug = firstStr(raw.slug).toLowerCase();
  if (fqdn.includes("order_transactions") && slug === "refund_completed") return "refund";
  if (slug.includes("refund")) return "refund"; // defensivt: refund-slug oavsett fqdn
  if (fqdn === "wix.ecom.v1.order" && (slug === "canceled" || slug === "cancelled")) return "cancel";
  if (slug === "canceled" || slug === "cancelled") return "cancel"; // defensivt
  return "other";
}

/**
 * Order-id ur ett cancel/refund-event, defensivt mot alla shapes. För refund är
 * `raw.entityId` transaktions-entitetens id (INTE order-id) — därför läses
 * `entity.orderId` FÖRST. Cancel bär ordern i `actionEvent.body.order` → `entity.id`.
 * Returnerar "" om inget order-id kan härledas (anroparen ack:ar då eventet utan att
 * röra några tasks, i stället för att skapa/avbryta fel).
 */
export function extractCancelOrderId(raw: Record<string, unknown>): string {
  const ent = rawEntity(raw);
  return firstStr(ent?.orderId, ent?.id, raw.entityId);
}

/**
 * Normaliserar en inkommande Wix eCom-webhook (created/approved/paid/fulfilled)
 * till en OrderEvent. Hanterar createdEvent / updatedEvent / actionEvent-formerna
 * (se extractOrder).
 */
export function normalizeOrderEvent(raw: Record<string, unknown>): OrderEvent | null {
  const eventId = typeof raw.id === "string" ? raw.id : "";
  const slug = typeof raw.slug === "string" ? raw.slug : "";
  const entityId = typeof raw.entityId === "string" ? raw.entityId : "";

  const order = extractOrder(raw);

  if (!eventId || !order || !order.id) return null;
  return { eventId, slug, orderId: entityId || order.id, order };
}

/**
 * Skapar en fulfillment-task PER ORDERRAD. En order kan innehålla artiklar från
 * olika AliExpress-leverantörer, så varje rad blir en egen task.
 */
export function deriveTasks(event: OrderEvent): FulfillmentTask[] {
  const order = event.order;
  const address = extractAddress(order);
  const now = new Date().toISOString();

  return (order.lineItems ?? []).map((li) => ({
    taskId: `${order.id}:${li.id}`,
    orderId: order.id,
    orderNumber: order.number ?? "",
    lineItemId: li.id,
    productName: li.productName?.translated || li.productName?.original || "",
    sku: extractSku(li),
    wixCatalogItemId: li.catalogReference?.catalogItemId,
    variantChoices: li.catalogReference?.options?.options ?? {},
    quantity: li.quantity ?? 1,
    status: "pending",
    shippingAddress: address,
    createdAt: now,
  }));
}

function extractSku(li: WixLineItem): string | undefined {
  return li.physicalProperties?.sku || undefined;
}

/**
 * Normaliserar en landskod till ISO-3166 alpha-2 (versaler). Returnerar null om
 * värdet inte är exakt två bokstäver. Order-läggningen vägrar då hellre ordern
 * än skickar den fel — tidigare default `"SE"` kunde tyst skicka en kunds paket
 * till Sverige när Wix-adressens land saknades/var i fel format.
 */
export function normalizeCountryCode(raw: string | undefined | null): string | null {
  const s = (raw ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(s) ? s : null;
}

function extractAddress(order: WixOrder): ShippingAddress | undefined {
  const addr =
    order.shippingInfo?.logistics?.shippingDestination?.address ?? order.recipientInfo?.address;
  const contact =
    order.shippingInfo?.logistics?.shippingDestination?.contact ?? order.recipientInfo?.contact;
  if (!addr && !contact) return undefined;

  const fullName = [contact?.firstName, contact?.lastName].filter(Boolean).join(" ") || undefined;
  return {
    fullName,
    addressLine1: addr?.addressLine1,
    addressLine2: addr?.addressLine2,
    city: addr?.city,
    postalCode: addr?.postalCode,
    country: addr?.country,
    phone: contact?.phone,
  };
}
