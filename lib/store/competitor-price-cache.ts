// FyndplatsCompetitorPriceCache — cachar konkurrentpris-sökningar i 7 dagar så
// vi inte skrapar samma fråga om och om igen (och inte blir IP-bannade). Nyckeln
// är SHA-256 av den normaliserade sökfrågan. En rad per fråga, _id = nyckeln.

import type { CompetitorPrice } from "../import/competitor-prices";

const WIX_BASE = "https://www.wixapis.com";

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

const COLLECTION_ID = process.env.WIX_DATA_COL_COMPETITOR_CACHE ?? "FyndplatsCompetitorPriceCache";

export interface CompetitorPriceCacheEntry {
  key: string;
  query: string;
  prices: CompetitorPrice[];
  fetchedAt: string;
  expiresAt: string;
}

/** Läser en cache-rad. Returnerar null om saknad, utgången eller kollektion ej skapad. */
export async function getCachedCompetitorPrices(key: string): Promise<CompetitorPriceCacheEntry | null> {
  try {
    const url = `${WIX_BASE}/data/v2/items/${encodeURIComponent(key)}?dataCollectionId=${encodeURIComponent(COLLECTION_ID)}`;
    const res = await fetch(url, { headers: headers() });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const body = (await res.json()) as { dataItem?: { data?: CompetitorPriceCacheEntry } };
    const entry = body.dataItem?.data ?? null;
    if (!entry) return null;
    // Utgången → behandla som miss (caller skrapar om och skriver över).
    if (entry.expiresAt && Date.parse(entry.expiresAt) < Date.now()) return null;
    return entry;
  } catch {
    return null;
  }
}

/** Skriver (upsert) en cache-rad. Best-effort — fel ska aldrig fälla pris-checken. */
export async function putCachedCompetitorPrices(entry: CompetitorPriceCacheEntry): Promise<void> {
  try {
    const data: Record<string, unknown> = { _id: entry.key, ...entry };
    await fetch(`${WIX_BASE}/data/v2/items/save`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ dataCollectionId: COLLECTION_ID, dataItem: { id: entry.key, dataCollectionId: COLLECTION_ID, data } }),
    });
  } catch {
    /* tyst — caching är en optimering, inte en korrekthetsgaranti */
  }
}
