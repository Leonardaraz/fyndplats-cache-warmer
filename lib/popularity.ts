// lib/popularity.ts — verklig försäljning per produkt (90 dagar).
//
// Bakgrund (Leonard 2026-08-08): sorteringsvalen "Rekommenderat"/"Nyast"/
// "Populärast" visade samma ordning — "Populärast" hade ingen datakälla alls
// och "Rekommenderat" vilade på en bildpoäng som är 60 för samtliga produkter.
// Nu byggs populariteten på riktiga Wix-ordrar: antal sålda enheter per
// catalogItemId de senaste 90 dagarna.
//
// Samma API-mönster som dashboardens tryWixOrders (WIX_API_KEY + wix-site-id;
// fail-open vid 403/nätfel → tom karta, sorteringen faller då tillbaka på
// nyhet). Modul-cachad med TTL så produktlistningarna inte betalar ett
// orders-svep per request — populäritet får vara timmes-färsk.

const TTL_MS = 30 * 60 * 1000; // 30 min — försäljning ändras långsamt
const WINDOW_DAYS = 90;
const MAX_PAGES = 30; // 30 × 100 ordrar ≫ butikens volym; skydd mot evighetsloop

type WixOrderLike = {
  status?: string;
  lineItems?: { quantity?: number; catalogReference?: { catalogItemId?: string } }[];
};

/** REN aggregering (enhetstestbar): ordrar → catalogItemId → sålda enheter.
 *  Annullerade ordrar räknas inte; rader utan katalogkoppling hoppas över. */
export function aggregateSoldUnits(orders: ReadonlyArray<WixOrderLike>): Map<string, number> {
  const out = new Map<string, number>();
  for (const o of orders) {
    if ((o.status ?? "").toUpperCase() === "CANCELED") continue;
    for (const li of o.lineItems ?? []) {
      const id = li.catalogReference?.catalogItemId;
      if (!id) continue;
      const qty = Number(li.quantity ?? 1) || 1;
      out.set(id, (out.get(id) ?? 0) + qty);
    }
  }
  return out;
}

let cached: { at: number; promise: Promise<Map<string, number>> } | null = null;

async function fetchSoldUnitsRaw(): Promise<Map<string, number>> {
  const key = process.env.WIX_API_KEY;
  const site = process.env.WIX_SITE_ID;
  if (!key || !site) return new Map();
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const orders: WixOrderLike[] = [];
  let cursor: string | undefined;
  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await fetch("https://www.wixapis.com/ecom/v1/orders/search", {
        method: "POST",
        headers: { Authorization: key, "wix-site-id": site, "Content-Type": "application/json" },
        body: JSON.stringify({
          search: {
            filter: { createdDate: { $gte: since } },
            cursorPaging: cursor ? { limit: 100, cursor } : { limit: 100 },
          },
        }),
        cache: "no-store",
      });
      if (!res.ok) return new Map(); // 403 READ_ORDER_FORBIDDEN m.m. → fail-open
      const data = await res.json();
      orders.push(...((data?.orders ?? []) as WixOrderLike[]));
      cursor = data?.pagingMetadata?.cursors?.next || undefined;
      if (!cursor) break;
    }
    return aggregateSoldUnits(orders);
  } catch {
    return new Map(); // nät-/parsningsfel får aldrig fälla produktlistningen
  }
}

/** Sålda enheter per catalogItemId (90 d), TTL-cachad per instans. */
export function getSoldUnits(): Promise<Map<string, number>> {
  const now = Date.now();
  if (!cached || now - cached.at > TTL_MS) {
    cached = { at: now, promise: fetchSoldUnitsRaw() };
    // En misslyckad hämtning ska inte cementeras i 30 min: en tom karta är
    // korrekt även för en butik utan ordrar, så vi kan inte skilja fel från
    // tomt — men fetchSoldUnitsRaw sväljer bara fel efter att ha försökt, och
    // nästa TTL-fönster försöker igen. Acceptabel avvägning.
  }
  return cached.promise;
}
