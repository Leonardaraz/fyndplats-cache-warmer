// FyndplatsProductHashes — en rad per Wix-produkt med dess huvudbilds pHash +
// (om känt) AliExpress-produkt-id. Backfillas en gång för alla befintliga
// produkter (scripts/backfill-product-hashes.ts) och uppdateras vid varje import.
//
// Dubblett-detektorn (Feature 1) läser hela kollektionen och jämför en kandidat
// mot varje rad: pHash-avstånd för bild-match, sparat aeProductId för exakt match,
// productName för titel-match. Inga AI-anrop — ren lokal beräkning.

import { storeBackend } from "./backend";
import { sql } from "../db/client";
import { allaRader, spara } from "../db/wix-data-klient";

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
  await spara(COLLECTION_ID, record.wixProductId, { ...record } as Record<string, unknown>);
}

/**
 * Läser HELA kollektionen, med markör. En saknad kollektion är ett fel sedan
 * flytten tillbaka till Wix (2026-10-29): kollektionen finns, och en tom
 * lista hade stängt av dubblettspärren utan ett ord.
 */
export async function listProductHashes(): Promise<ProductHashRecord[]> {
  if (storeBackend() === "postgres") {
    // ☠️ Inget tak här, och inte heller i Wix-vägen nedan sedan 2026-10-29.
    const rader = await sql()`select data from product_hashes`;
    return rader.map((r) => (r as { data: ProductHashRecord }).data);
  }
  // ☠️ Med markör till slutet. Den gamla vägen bröt TYST vid 5 000 rader.
  return allaRader<ProductHashRecord>(COLLECTION_ID);
}
