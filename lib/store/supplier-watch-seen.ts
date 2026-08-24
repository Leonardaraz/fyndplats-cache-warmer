// FyndplatsSupplierWatchSeen — negativ-cache för supplier-watch-cronen.
//
// En rad per AliExpress-produkt som supplier-watch redan detalj-kontrollerat
// och FÖRKASTAT (fel säljare / inget EU-lager / slut / för dyr). Utan cachen
// skulle samma topplistade sökträffar bränna detalj-API-anrop varje körning.
//
// Semantik:
//   - _id = aeProductId (upsert).
//   - Posten "gäller" i `ttlDays` (default 45) — därefter ignoreras den vid
//     läsning och produkten kontrolleras på nytt (en CN-listning kan ha fått
//     EU-lager, en butik kan ha bytt ägare, osv).
//   - Matchade produkter cachas ALDRIG här — de importeras och dedupas därefter
//     via FyndplatsMappings (supplierProductId).
//   - Saknad kollektion tolereras (fail-open → tom cache, kostar bara API-anrop).
//     Skapa kollektionen med scripts/ensure-supplier-watch-collection.mjs.
//
// Mönstret speglar lib/store/product-hashes.ts: egna fetch-helpers mot Wix Data.

const WIX_BASE = "https://www.wixapis.com";

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

const COLLECTION_ID =
  process.env.WIX_DATA_COL_SUPPLIER_WATCH_SEEN ?? "FyndplatsSupplierWatchSeen";

export type SupplierWatchSkipReason =
  | "wrong_seller"
  | "no_eu"
  | "no_stock"
  | "too_expensive"
  /** Listningen är nedtagen hos AE (hyllstatus offline) — går inte att sälja. */
  | "listing_offline";

export interface SupplierWatchSeenRecord {
  /** AliExpress-produkt-id (= radens _id). */
  aeProductId: string;
  reason: SupplierWatchSkipReason;
  /** Butiks-id/-namn när det var känt — gör raderna felsökningsbara. */
  storeId?: string;
  storeName?: string;
  /** Rå titel (trunkerad) för mänsklig läsbarhet i CMS:et. */
  title?: string;
  /** ISO-tid för senaste detalj-kontrollen. TTL räknas härifrån. */
  checkedAt: string;
}

/** Upsert av en batch förkastade produkter. Fel sväljs INTE — anroparen avgör. */
export async function saveSeenBatch(records: SupplierWatchSeenRecord[]): Promise<void> {
  for (const record of records) {
    const data: Record<string, unknown> = { _id: record.aeProductId, ...record };
    const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        dataCollectionId: COLLECTION_ID,
        dataItem: { id: record.aeProductId, dataCollectionId: COLLECTION_ID, data },
      }),
    });
    if (!res.ok) {
      throw new Error(
        `SupplierWatchSeen save ${record.aeProductId} (${res.status}): ${(await res.text()).slice(0, 200)}`,
      );
    }
  }
}

/**
 * Läser hela cachen (paginerat). Poster äldre än `ttlDays` filtreras bort så
 * att anroparen bara ser färska avslag. Saknad kollektion → tom map.
 */
export async function listFreshSeen(
  ttlDays: number,
  now: () => number = () => Date.now(),
): Promise<Map<string, SupplierWatchSeenRecord>> {
  const fresh = new Map<string, SupplierWatchSeenRecord>();
  const cutoff = now() - ttlDays * 24 * 60 * 60 * 1000;
  const limit = 100;
  for (let offset = 0; offset < 10000; offset += limit) {
    const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        dataCollectionId: COLLECTION_ID,
        query: { paging: { limit, offset } },
      }),
    });
    if (!res.ok) {
      if (res.status === 404) break;
      const text = await res.text();
      if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) break;
      throw new Error(`SupplierWatchSeen query (${res.status}): ${text.slice(0, 200)}`);
    }
    const body = (await res.json()) as { dataItems?: { data?: SupplierWatchSeenRecord }[] };
    const rows = (body.dataItems ?? [])
      .map((d) => d.data)
      .filter((d): d is SupplierWatchSeenRecord => Boolean(d?.aeProductId));
    for (const row of rows) {
      const ts = Date.parse(row.checkedAt ?? "");
      if (Number.isFinite(ts) && ts >= cutoff) fresh.set(row.aeProductId, row);
    }
    if (rows.length < limit) break;
  }
  return fresh;
}
