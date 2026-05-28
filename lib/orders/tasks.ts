import type {
  FulfillmentTask,
  OrderEvent,
  ShippingAddress,
  WixLineItem,
  WixOrder,
} from "./types";

/**
 * Normaliserar en inkommande Wix eCom-webhook (created/approved) till en OrderEvent.
 * Hanterar både `actionEvent.body.order` och `createdEvent.entity`-formerna.
 */
export function normalizeOrderEvent(raw: Record<string, unknown>): OrderEvent | null {
  const eventId = typeof raw.id === "string" ? raw.id : "";
  const slug = typeof raw.slug === "string" ? raw.slug : "";
  const orderId = typeof raw.entityId === "string" ? raw.entityId : "";

  const action = raw.actionEvent as { body?: { order?: WixOrder } } | undefined;
  const created = raw.createdEvent as { entity?: WixOrder } | undefined;
  const order = action?.body?.order ?? created?.entity;

  if (!eventId || !order || !order.id) return null;
  return { eventId, slug, orderId: orderId || order.id, order };
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
