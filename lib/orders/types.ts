export interface ShippingAddress {
  fullName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  /** Delstat/region (län) — AliExpress-vänligt namn, t.ex. "Stockholm".
   *  AliExpress kräver detta vid orderläggning ("state/province/region"). */
  province?: string;
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
  /**
   * Atomiskt dubbel-order-lås. Sätts via CAS (claimTask) under pågående orderläggning
   * och hindrar att två samtidiga placeringar (dubbelklick/cron+klick) ger två betalda
   * ordrar. Rensas av releaseTask vid valideringsfel. Stale claim rensas ENDAST manuellt.
   */
  claimToken?: string;
  /**
   * Order-utfall OKÄNT (nätverks-/timeout-fel efter createOrder) — AE-ordern KAN ha lagts.
   * Tasken rörs inte automatiskt; kräver manuell verifiering på AliExpress innan nytt försök.
   */
  orderUncertain?: boolean;
  uncertainAt?: string;
  /**
   * F19: en ÅTERBETALNING (Wix order_transactions.refund_completed) registrerades för
   * ordern. Tasken avbryts INTE automatiskt (en återbetalning kan vara delvis och eventet
   * bär inga radnummer) — i stället flaggas den + blockeras för orderläggning tills Leonard
   * granskat. Hel-annulleringar (order.canceled) avbryts däremot direkt (status=cancelled).
   */
  refundFlagged?: boolean;
  refundFlaggedAt?: string;
  /**
   * F19/race: en annullering/återbetalning landade MEDAN en orderläggning pågick (claimToken
   * satt, ingen aliexpressOrderId än). Tasken avbröts då INTE (place-order äger den tills
   * claimen släpps/blir ordered) — i stället flaggas den för manuell granskning så Leonard
   * kan avbeställa på AliExpress om ordern faktiskt gick igenom.
   */
  cancelMidOrder?: boolean;
  cancelMidOrderAt?: string;
}

/** Normaliserad orderhändelse oavsett om den kom som JWT eller rå JSON. */
export interface OrderEvent {
  eventId: string;
  slug: string;
  orderId: string;
  order: WixOrder;
}

// OBS: Wix eCom kan leverera kontakten på BÅDE `contactDetails` (nuvarande V1-
// shape, verifierat på riktiga ordrar) OCH det äldre `contact`. Vi accepterar
// båda i extraktorn. Samma sak för adress: gatan ligger i `addressLine`/
// `streetAddress`, INTE `addressLine1` (se WixAddress).
type WixDestination = { address?: WixAddress; contactDetails?: WixContact; contact?: WixContact };

export interface WixOrder {
  id: string;
  number?: string;
  lineItems?: WixLineItem[];
  recipientInfo?: WixDestination;
  shippingInfo?: { logistics?: { shippingDestination?: WixDestination } };
  billingInfo?: WixDestination;
  buyerInfo?: { email?: string };
}

export interface WixLineItem {
  id: string;
  productName?: { original?: string; translated?: string };
  quantity?: number;
  physicalProperties?: { sku?: string };
  catalogReference?: { catalogItemId?: string; options?: { options?: Record<string, string> } };
  // Variantval (färg/storlek) ligger i praktiken HÄR på riktiga ordrar, inte i
  // catalogReference.options.options. COLOR-rader bär värdet i `color`/`colorInfo`,
  // text-rader i `plainText`. Nyckeln är `name` (t.ex. "Färg").
  descriptionLines?: {
    name?: { original?: string; translated?: string };
    plainText?: { original?: string; translated?: string };
    color?: string;
    colorInfo?: { original?: string; translated?: string };
    lineType?: string;
  }[];
}

export interface WixAddress {
  // Gatan kan komma i tre former beroende på checkout/version. På riktiga
  // Fyndplats-ordrar (Headless-checkout) ligger den i `addressLine` (singular),
  // INTE `addressLine1`. `streetAddress` är den strukturerade varianten.
  addressLine1?: string;
  addressLine?: string;
  streetAddress?: { name?: string; number?: string; apt?: string };
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  /** ISO 3166-2, t.ex. "SE-AB" (Stockholms län). */
  subdivision?: string;
  /** Läsbart län-namn, t.ex. "Stockholms län". */
  subdivisionFullname?: string;
}

export interface WixContact {
  firstName?: string;
  lastName?: string;
  phone?: string;
}
