// lib/wix-order-lookup.ts
//
// Nätverksdelen av "vilket order-id ska jag slå upp?".
//
// Regeln bor i lib/wix-order-id.ts, som är avsiktligt utan sido-import och
// utan `fetch` så att `node --test` kan ladda den utan Wix-nycklar. Den här
// modulen lägger nätverket bredvid, och är därför medvetet OTESTAD — den gör
// inget annat än att koppla ihop de två.
//
// VARFÖR DEN FINNS. Wix `GET /ecom/v1/orders/{id}` slår bara upp på orderns
// interna GUID, men `tracking_mapping.order_id` bär orderns LÄSBARA nummer
// ("10019") — och därifrån kommer både omdömeslänkens token och
// leveransmejlets ordersammanfattning. Det gav 404 för kunden (PR #497).
//
// Uppslaget fanns efter den fixen på två ställen, och `/tack` stod på väg att
// bli ett tredje: sidan tar emot `?orderNumber` som reserv och skickade det
// rakt in i samma GUID-krävande anrop. Hade Wix någonsin skickat den
// parametern hade Googles recensionsenkät tyst uteblivit, för den kräver
// e-post och leveransland ur ordern.
//
// KVARVARANDE DUBBLERING: app/api/admin/resend-order-confirmation har en egen
// kopia. Den lämnas orörd med flit — den saknar timeout, så att dra in den här
// skulle ÄNDRA beteendet på ett återställningsverktyg som fungerar, för
// städningens skull. Den dagen rutten ändå ska röras hör den hemma här.

import { resolveWixOrderId } from "./wix-order-id";

const WIX_BASE = "https://www.wixapis.com";

/** Slår upp orderns interna GUID ur det läsbara numret. */
async function sokOrderIdViaNummer(orderNumber: string): Promise<string | null> {
  const key = process.env.WIX_API_KEY;
  const site = process.env.WIX_SITE_ID;
  if (!key || !site) return null;
  const res = await fetch(`${WIX_BASE}/ecom/v1/orders/search`, {
    method: "POST",
    headers: { Authorization: key, "wix-site-id": site, "Content-Type": "application/json" },
    body: JSON.stringify({ search: { filter: { number: { $eq: orderNumber } } } }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.warn(`[wix-order] sök(${orderNumber}) → HTTP ${res.status}: ${txt.slice(0, 200)}`);
    return null;
  }
  const json = (await res.json()) as { orders?: Array<{ id?: string; _id?: string }> };
  const o = json.orders?.[0];
  return o?.id ?? o?._id ?? null;
}

/**
 * Ger ett order-id som Wix faktiskt accepterar, oavsett om anroparen har ett
 * GUID eller ett läsbart nummer.
 *
 * Ett GUID kostar ingen extra rundtur — det lämnas orört. Bara ett nummer
 * utlöser sökningen. Null = varken GUID eller känt nummer; anroparen ska då
 * bete sig som om ordern inte fanns.
 */
export async function resolveOrderId(raa: string | null | undefined): Promise<string | null> {
  return resolveWixOrderId(raa, sokOrderIdViaNummer);
}
