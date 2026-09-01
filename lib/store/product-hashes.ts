// FyndplatsProductHashes — en rad per Wix-produkt med dess huvudbilds pHash +
// (om känt) AliExpress-produkt-id. Backfillas en gång för alla befintliga
// produkter (scripts/backfill-product-hashes.ts) och uppdateras vid varje import.
//
// Dubblett-detektorn (Feature 1) läser hela kollektionen och jämför en kandidat
// mot varje rad: pHash-avstånd för bild-match, sparat aeProductId för exakt match,
// productName för titel-match. Inga AI-anrop — ren lokal beräkning.

import { storeBackend } from "./backend";
import { sql } from "../db/client";

const WIX_BASE = "https://www.wixapis.com";

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

const COLLECTION_ID = process.env.WIX_DATA_COL_PRODUCT_HASHES ?? "FyndplatsProductHashes";

export interface ProductHashRecord {
  /** Wix-produkt-id (= radens _id). */
  wixProductId: string;
  productName: string;
  /** Hexkodad 64-bitars pHash av huvudbilden. null = bilden kunde inte hashas. */
  phash: string | null;
  /** AliExpress-produkt-id om känt (från mapping) — ger exakt dubblett-match. */
  aeProductId?: string;
  /** Huvudbildens URL (för felsökning/visning). */
  imageUrl?: string;
  slug?: string;
  updatedAt: string;
}

/** Sparar (upsert) en hash-rad. _id = wixProductId. */
export async function saveProductHash(record: ProductHashRecord): Promise<void> {
  if (storeBackend() === "postgres") {
    await sql()`insert into product_hashes (wix_product_id, data)
                values (${record.wixProductId}, ${JSON.stringify(record)})
                on conflict (wix_product_id) do update set data = excluded.data`;
    return;
  }
  const data: Record<string, unknown> = { _id: record.wixProductId, ...record };
  const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ dataCollectionId: COLLECTION_ID, dataItem: { id: record.wixProductId, dataCollectionId: COLLECTION_ID, data } }),
  });
  if (!res.ok) {
    throw new Error(`ProductHashes save ${record.wixProductId} (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }
}

/**
 * Läser HELA kollektionen (paginerat via offset). Tolererar saknad kollektion
 * (404/400) → tom lista, så dubblett-checken aldrig kraschar på en oinitierad site.
 */
export async function listProductHashes(): Promise<ProductHashRecord[]> {
  if (storeBackend() === "postgres") {
    // ☠️ Inget tak här. Wix-vägen nedan bryter TYST vid 5 000 rader (samma
    // klass av bugg som queryAll hade vid 10 000) — vid 1 463 hashar är vi på
    // 29 % av den gränsen, och dubblettspärren hade tystnat utan felmeddelande.
    const rader = await sql()`select data from product_hashes`;
    return rader.map((r) => (r as { data: ProductHashRecord }).data);
  }
  const all: ProductHashRecord[] = [];
  const limit = 100;
  for (let offset = 0; offset < 5000; offset += limit) {
    const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ dataCollectionId: COLLECTION_ID, query: { paging: { limit, offset } } }),
    });
    if (!res.ok) {
      if (res.status === 404) break;
      const text = await res.text();
      if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) break;
      throw new Error(`ProductHashes query (${res.status}): ${text.slice(0, 200)}`);
    }
    const body = (await res.json()) as { dataItems?: { data?: ProductHashRecord }[] };
    const rows = (body.dataItems ?? []).map((d) => d.data).filter((d): d is ProductHashRecord => Boolean(d));
    all.push(...rows);
    if (rows.length < limit) break;
  }
  return all;
}
