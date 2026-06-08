export interface ShippingAddress {
  fullName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

export type TaskStatus = "pending" | "pending_payment" | "ordered" | "shipped" | "cancelled";

export interface FulfillmentTask {
  /** Stabil nyckel per orderrad: `${orderId}:${lineItemId}`. */
  taskId: string;
  orderId: string;
  orderNumber: string;
  lineItemId: string;
  productName: string;
  sku?: string;
  /** Wix produkt-id (catalogItemId) — koppling till leverantörsmappning. */
  wixCatalogItemId?: string;
  variantChoices: Record<string, string>;
  quantity: number;
  status: TaskStatus;
  shippingAddress?: ShippingAddress;
  createdAt: string;
  /** AliExpress trade order id (sätts efter DS API-order). */
  aliexpressOrderId?: string;
  /** AliExpress betal-URL när ordern kräver betalning (status pending_payment). */
  paymentUrl?: string;
  /**
   * Per-order leverantörsbyte: lägg DENNA orderrad hos en annan AliExpress-källa
   * än produktens globala mappning, utan att röra mappningen. Sätts via /admin
   * ("Byt leverantör") och vinner över mappningen i placeAliExpressOrder.
   */
  overriddenSupplierProductId?: string;
  overriddenSupplierVariantId?: string;
  /** Läsbar etikett (skuProps, t.ex. "Red / M") för UI och audit. */
  overriddenSupplierLabel?: string;
}

/** Normaliserad orderhändelse oavsett om den kom som JWT eller rå JSON. */
export interface OrderEvent {
  eventId: string;
  slug: string;
  orderId: string;
  order: WixOrder;
}

export interface WixOrder {
  id: string;
  number?: string;
  lineItems?: WixLineItem[];
  recipientInfo?: { address?: WixAddress; contact?: WixContact };
  shippingInfo?: { logistics?: { shippingDestination?: { address?: WixAddress; contact?: WixContact } } };
  buyerInfo?: { email?: string };
}

export interface WixLineItem {
  id: string;
  productName?: { original?: string; translated?: string };
  quantity?: number;
  physicalProperties?: { sku?: string };
  catalogReference?: { catalogItemId?: string; options?: { options?: Record<string, string> } };
  descriptionLines?: { name?: { original?: string }; plainText?: { original?: string } }[];
}

export interface WixAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface WixContact {
  firstName?: string;
  lastName?: string;
  phone?: string;
}
