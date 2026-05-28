// AliExpress Drop Shipping API — delade typer

export interface AliExpressDsVariant {
  skuId: string;
  /** Egenskaper, t.ex. { "color": "Red", "size": "M" } */
  skuProps: Record<string, string>;
  /** Bild-URL för swatch (om satt av leverantören) */
  imageUrl?: string;
  price: number;
  originalPrice?: number;
  stock?: number;
}

export interface AliExpressDsProduct {
  productId: string;
  title: string;
  description: string;
  /** Huvud-bild-URL:er */
  images: string[];
  variants: AliExpressDsVariant[];
  categoryId?: string;
  shipFrom?: string;
}

export interface DsTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  account: string;
}

export interface DsOrderCreateParams {
  productId: string;
  skuId: string;
  quantity: number;
  shippingAddress: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
    countryCode: string;
    phone?: string;
    email?: string;
  };
  logisticsServiceName?: string;
  /** Valfri buyer-note som visas i kassan */
  buyerMessage?: string;
}

export interface DsOrderCreateResult {
  /** AliExpress trade order id */
  tradeOrderId: string;
  /** Om true måste betalning göras manuellt i kassan */
  paymentRequired: boolean;
  paymentUrl?: string;
}

export interface DsTrackingResult {
  tradeOrderId: string;
  trackingNumber?: string;
  shippingProvider?: string;
  status: string;
  events: { time: string; description: string; location?: string }[];
}
