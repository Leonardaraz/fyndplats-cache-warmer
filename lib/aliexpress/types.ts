// AliExpress Drop Shipping API — delade typer

export interface AliExpressDsVariant {
  skuId: string;
  /** AliExpress attribut-sträng ("14:350853#39 Drawers;…") — samma format som
   *  extension-importens supplierVariantId → exakt variant-matchning. */
  skuAttr?: string;
  /** Egenskaper, t.ex. { "color": "Red", "size": "M" } */
  skuProps: Record<string, string>;
  /** Bild-URL för swatch (om satt av leverantören) */
  imageUrl?: string;
  price: number;
  originalPrice?: number;
  stock?: number;
  /** ISO-3166 alpha-2-kod för warehouse, t.ex. "ES" eller "CN". Tom = okänd. */
  shipFrom?: string;
}

export interface AliExpressDsProduct {
  productId: string;
  title: string;
  description: string;
  /** Huvud-bild-URL:er */
  images: string[];
  variants: AliExpressDsVariant[];
  categoryId?: string;
  /** Default shipFrom för produkten (kan skilja per variant). */
  shipFrom?: string;
  /**
   * Unika shipFrom-koder över alla SKU:er, sorterade.
   * Tom array = okänt warehouse.
   */
  shipsFromCountries?: string[];
  /** True om någon SKU skickas från EU-warehouse (för snabbfilterring). */
  hasEuWarehouse?: boolean;
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
    /** Delstat/region (län). AliExpress kräver detta för leverans (annars
     *  "Please select a state/province/region"). AliExpress-vänligt namn, t.ex.
     *  "Stockholm" för Åkersberga (Stockholms län). */
    province?: string;
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
  /** AliExpress fel-detalj (error_msg/error_code) när inget order-id gavs. */
  aeError?: string;
  /** true när AliExpress uttryckligen svarade misslyckat (is_success=false eller
   *  felkod utan order-id) → INGEN order lades → säkert att släppa claimen. */
  orderDefinitelyNotPlaced?: boolean;
}

export interface DsTrackingResult {
  tradeOrderId: string;
  trackingNumber?: string;
  shippingProvider?: string;
  status: string;
  /** Beräknad leverans (epoch ms) — bara i nya API-svarsformen. */
  etaTimestamp?: number;
  events: { time: string; description: string; location?: string }[];
}
