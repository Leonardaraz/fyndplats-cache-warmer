// Hämtar det kundvända ordernumret (t.ex. "10003") för en Wix-order via dess
// interna _id (GUID). Wix headless redirectar till /tack med ?orderId=<GUID>,
// inte det läsbara numret — det ligger på orderns `number`-fält och kräver ett
// API-anrop. Samma auth/endpoint som webhookens fetchWixOrder + lib/order-sync.
// Returnerar null vid valfritt fel (anroparen faller då tillbaka på GUID:t).

/** Det /tack behöver ur ordern: numret till kunden, resten till Googles enkät. */
export interface WixOrderInfo {
  /** Läsbart ordernummer, t.ex. "10003". Null när Wix inte gav något. */
  number: string | null;
  /** Köparens e-post — Google kan inte skicka enkäten utan den. */
  email: string | null;
  /** Leveranslandets ISO 3166-1 alpha-2-kod, orörd från Wix. */
  deliveryCountry: string | null;
}

const TOMT: WixOrderInfo = { number: null, email: null, deliveryCountry: null };

interface RawOrder {
  number?: unknown;
  buyerInfo?: { email?: unknown };
  shippingInfo?: { shippingDestination?: { address?: { country?: unknown } } };
}

function text(v: unknown): string | null {
  const s = v == null ? "" : String(v).trim();
  return s === "" ? null : s;
}

/**
 * Ett Wix-anrop → allt /tack behöver.
 *
 * Fältvägarna är desamma som resten av kodbasen redan använder mot ecom-ordern
 * (se lib/handlers/order-conversion-hook.ts): `buyerInfo.email` och
 * `shippingInfo.shippingDestination.address.country`.
 *
 * Till skillnad från hooken faller landet INTE tillbaka på "SE". Googles
 * recensionströskel räknas per land och slås aldrig ihop, så en gissning här
 * skulle bokföra en svensk enkät på en utländsk order. Hellre ingen modul.
 *
 * Fail-open: allt fel ger tomma fält, aldrig ett kast. /tack är sidan kunden
 * landar på EFTER att ha betalat — den får aldrig fela.
 */
export async function fetchWixOrderInfo(orderId: string): Promise<WixOrderInfo> {
  const key = process.env.WIX_API_KEY;
  const site = process.env.WIX_SITE_ID;
  if (!key || !site || !orderId) return TOMT;
  try {
    const res = await fetch(
      `https://www.wixapis.com/ecom/v1/orders/${encodeURIComponent(orderId)}`,
      {
        method: "GET",
        headers: {
          Authorization: key,
          "wix-site-id": site,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );
    if (!res.ok) return TOMT;
    const json = (await res.json()) as { order?: RawOrder };
    const order = json.order;
    if (!order) return TOMT;
    return {
      number: text(order.number),
      email: text(order.buyerInfo?.email),
      deliveryCountry: text(order.shippingInfo?.shippingDestination?.address?.country),
    };
  } catch {
    return TOMT;
  }
}
