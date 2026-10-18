// lib/returadress-order.ts
//
// Returadressen för en retur ur en riktig order: varje vald vara kopplas till
// sina rader i Wix-ordern, motorn säger vilken leverantör produkten har, och
// orderns sändningar i Wix säger hur raden skickades. Regeln och adresserna
// bor i lib/returadress.ts.
//
// Allt som inte går att avgöra blir null, och kvittot säger då att vi mejlar
// returadressen inom 1 arbetsdag. Uppslaget har en tidsgräns: mottagnings-
// kvittot är ett lagkrav och får aldrig vänta på Wix eller motorn.

import { fetchWixOrder } from "@/app/api/wix-webhook/route";
import { arAosomVara } from "./gpsr";
import { leverantorForRader, orderRaderUr, raderFor, valjReturadress, type Returadress } from "./returadress";

const TIDSGRANS_MS = 6000;

/**
 * Orderns sändningar i Wix (ecom/v1/fulfillments), eller null när de inte gick
 * att läsa. Då får returen ingen adress, och kvittot säger att vi mejlar den.
 */
async function hamtaSandningar(orderId: string): Promise<Record<string, unknown>[] | null> {
  const key = process.env.WIX_API_KEY;
  const site = process.env.WIX_SITE_ID;
  if (!key || !site || !orderId) return null;
  try {
    const res = await fetch(`https://www.wixapis.com/ecom/v1/fulfillments/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: key, "wix-site-id": site, "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      console.warn(`[angra] orderns sändningar gick inte att läsa (HTTP ${res.status})`);
      return null;
    }
    const json = (await res.json()) as { orderWithFulfillments?: { fulfillments?: unknown } };
    if (!json.orderWithFulfillments) return null;
    const lista = json.orderWithFulfillments.fulfillments;
    return Array.isArray(lista) ? (lista as Record<string, unknown>[]) : [];
  } catch (err) {
    console.warn("[angra] orderns sändningar gick inte att läsa", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Returadressen för de valda varorna i en order, eller null. Utan valda varor
 * gäller hela ordern. `ordernummer` ska vara verifierat mot kundens e-post
 * innan det kommer hit (app/api/angra/route.ts gör det).
 */
export async function returadressForOrder(ordernummer: string, varunamn: readonly string[]): Promise<Returadress | null> {
  if (!ordernummer) return null;
  const uppslag = (async () => {
    const order = await fetchWixOrder(ordernummer);
    if (!order) return null;
    const valda = raderFor(varunamn, orderRaderUr(order));
    if (valda.length === 0) return null;
    const produktIdn = [...new Set(valda.flatMap((t) => (t ? t.map((r) => r.produktId as string) : [])))];
    const [svar, sandningar] = await Promise.all([
      Promise.all(produktIdn.map(async (id) => [id, await arAosomVara(id)] as const)),
      hamtaSandningar(typeof order.id === "string" ? order.id : ""),
    ]);
    const aosom = new Map(svar);
    return valjReturadress(valda.map((t) => leverantorForRader(t, (id) => aosom.get(id) ?? null, sandningar)));
  })();
  const grans = new Promise<null>((resolve) => setTimeout(() => resolve(null), TIDSGRANS_MS));
  try {
    return await Promise.race([uppslag, grans]);
  } catch (err) {
    console.error("[angra] returadressen gick inte att avgöra", err instanceof Error ? err.message : err);
    return null;
  }
}
