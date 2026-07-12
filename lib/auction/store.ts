// lib/auction/store.ts
//
// Fyndauktionens persistens (Wix Data-collectionen FyndplatsAuctions) och
// pris-PATCH mot Stores V3. Ren logik ligger i ./engine — här bor I/O.
//
// Wix Data-mönstren speglar beprövade vägar i repot:
//   query  = POST /wix-data/v2/items/query   (samma som lib/headless m.fl.)
//   save   = POST /data/v2/items/save        (full-ersättning, samma som score-images)
//
// Pris-PATCH följer SEO-runbookens hårda regler: färsk revision precis före
// PATCH, `options` + `variantsInfo` skickas ihop (428-fällan), och priser är
// hela kronor med 9-slut. `compareAtPrice` sätts till listpriset under
// auktionen (ger överstruket ord.pris i storefronten) och rensas vid slut.

import { WIX_BASE, wixHeaders } from "@/lib/wix/client";
import type { AuctionDoc } from "./engine";

export const AUCTION_COLLECTION = "FyndplatsAuctions";

function headers(): Record<string, string> {
  return wixHeaders();
}

/** Alla auktioner med status i `statuses` (kö-ordning stigande). */
export async function queryAuctions(statuses: string[]): Promise<AuctionDoc[]> {
  const res = await fetch(`${WIX_BASE}/wix-data/v2/items/query`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId: AUCTION_COLLECTION,
      query: {
        filter: { status: { $in: statuses } },
        sort: [{ fieldName: "queueOrder", order: "ASC" }],
        // Hela katalogen kan ligga i kön (400+ dokument) — 100 skulle tyst
        // tappa slutet av kön och göra recycling blind för äldre poster.
        paging: { limit: 1000 },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`queryAuctions ${res.status}: ${text.slice(0, 200)}`);
  }
  const body = (await res.json()) as { dataItems?: Array<{ id?: string; data?: AuctionDoc & { _id?: string } }> };
  return (body.dataItems ?? [])
    .map((it) => ({ ...(it.data as AuctionDoc), _id: it.data?._id ?? it.id }))
    .filter((d) => d && d.productId);
}

/** Full-ersättande save (Wix Data har ingen partial-patch värd namnet här). */
export async function saveAuction(doc: AuctionDoc): Promise<void> {
  if (!doc._id) throw new Error("saveAuction: dokumentet saknar _id");
  const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId: AUCTION_COLLECTION,
      dataItem: { id: doc._id, dataCollectionId: AUCTION_COLLECTION, data: doc },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`saveAuction(${doc.slug}) ${res.status}: ${text.slice(0, 200)}`);
  }
}

/**
 * Bulk-save i chunkar om 100. Seedens ~400 enskilda saves sprängde Wix Datas
 * per-minut-kvot (WDE0014: 279/399 sparade, resten 429 — kön halvskriven).
 * Bulk-endpointen tar 100 dokument per anrop → hela kön på 4 anrop.
 * Returnerar felbeskrivningar (tom lista = allt sparat).
 */
export async function saveAuctionsBulk(docs: AuctionDoc[]): Promise<string[]> {
  const errors: string[] = [];
  for (let i = 0; i < docs.length; i += 100) {
    const chunk = docs.slice(i, i + 100);
    const res = await fetch(`${WIX_BASE}/wix-data/v2/bulk/items/save`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        dataCollectionId: AUCTION_COLLECTION,
        dataItems: chunk.map((d) => ({ id: d._id, dataCollectionId: AUCTION_COLLECTION, data: d })),
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      errors.push(`bulkSave[${i}–${i + chunk.length - 1}] ${res.status}: ${text.slice(0, 200)}`);
      continue;
    }
    const body = (await res.json()) as { bulkActionMetadata?: { totalFailures?: number } };
    const failures = body.bulkActionMetadata?.totalFailures ?? 0;
    if (failures > 0) errors.push(`bulkSave[${i}–${i + chunk.length - 1}]: ${failures} items misslyckades`);
  }
  return errors;
}

/**
 * Bulk-borttagning i chunkar om 100 (samma kvot-skäl som saveAuctionsBulk).
 * Returnerar felbeskrivningar (tom lista = allt borttaget).
 */
export async function removeAuctionsBulk(ids: string[]): Promise<string[]> {
  const errors: string[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const res = await fetch(`${WIX_BASE}/wix-data/v2/bulk/items/remove`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ dataCollectionId: AUCTION_COLLECTION, dataItemIds: chunk }),
    });
    if (!res.ok) {
      const text = await res.text();
      errors.push(`bulkRemove[${i}–${i + chunk.length - 1}] ${res.status}: ${text.slice(0, 200)}`);
    }
  }
  return errors;
}

/** Tar bort ett auktionsdokument (används när en köad produkt diskvalificeras). */
export async function removeAuction(id: string): Promise<void> {
  const res = await fetch(
    `${WIX_BASE}/wix-data/v2/items/${encodeURIComponent(id)}?dataCollectionId=${AUCTION_COLLECTION}`,
    { method: "DELETE", headers: headers() },
  );
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`removeAuction(${id}) ${res.status}: ${text.slice(0, 200)}`);
  }
}

interface RawVariant {
  id: string;
  price?: { actualPrice?: { amount?: string }; compareAtPrice?: { amount?: string } };
  [k: string]: unknown;
}

/** Nytt pris (och ev. jämförpris) för en variant. compareAt null = rensa. */
type VariantTarget = { price: number; compareAt: number | null };

/**
 * Delad GET→map→PATCH mot Stores V3. `resolve` returnerar nytt pris per variant
 * (eller null = lämna variantens pris orört). Följer runbookens hårda regler:
 * färsk revision, options + variantsInfo skickas ihop (428), visible:true.
 */
async function applyVariantPatch(
  productId: string,
  resolve: (v: RawVariant) => VariantTarget | null,
  precheck?: (variants: RawVariant[]) => void,
): Promise<void> {
  const getRes = await fetch(`${WIX_BASE}/stores/v3/products/${productId}`, {
    method: "GET",
    headers: headers(),
  });
  if (!getRes.ok) {
    const text = await getRes.text();
    throw new Error(`patch GET ${getRes.status}: ${text.slice(0, 200)}`);
  }
  const data = (await getRes.json()) as {
    product?: { revision?: string; options?: unknown[]; variantsInfo?: { variants?: RawVariant[] } };
  };
  const p = data.product;
  if (!p?.revision || !p.variantsInfo?.variants?.length) {
    throw new Error(`patch(${productId}): saknar revision/varianter`);
  }
  precheck?.(p.variantsInfo.variants);
  const variants = p.variantsInfo.variants.map((v) => {
    const t = resolve(v);
    if (!t) return v;
    return {
      ...v,
      price: {
        ...(v.price ?? {}),
        actualPrice: { amount: String(t.price) },
        ...(t.compareAt != null ? { compareAtPrice: { amount: String(t.compareAt) } } : { compareAtPrice: null }),
      },
    };
  });
  const body: Record<string, unknown> = {
    product: {
      id: productId,
      revision: p.revision,
      // En variantsInfo-PATCH på publicerad produkt kan flippa visible → skicka alltid true.
      visible: true,
      variantsInfo: { ...p.variantsInfo, variants },
      // options MÅSTE följa med när variantsInfo skickas (V3 428) — men bara om de finns.
      ...(Array.isArray(p.options) && p.options.length > 0 ? { options: p.options } : {}),
    },
  };
  const patchRes = await fetch(`${WIX_BASE}/stores/v3/products/${productId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!patchRes.ok) {
    const text = await patchRes.text();
    throw new Error(`patch PATCH ${patchRes.status}: ${text.slice(0, 300)}`);
  }
}

/**
 * ENKEL-PRIS-läge (legacy + enkel-variant): sätter samma pris på ALLA varianter.
 * `compareAt` = listpris under auktion, null för att rensa (återställning).
 *
 * `requireUniform` (pris-SÄNKNINGAR i ticken): vägra om varianterna inte längre
 * delar ETT pris — enkel-pris-läget får aldrig platta ett prisspann (fel pris/
 * förlust på dyraste varianten). Återställningar skickar false så priset aldrig
 * fastnar på auktionsnivå. Multi-variant-produkter använder patchProductVariants.
 */
export async function patchProductPrice(
  productId: string,
  newPrice: number,
  compareAt: number | null,
  requireUniform = false,
): Promise<void> {
  const precheck = requireUniform
    ? (variants: RawVariant[]) => {
        const distinct = new Set(variants.map((v) => v.price?.actualPrice?.amount ?? ""));
        if (distinct.size > 1) {
          throw new Error(
            `patchProductPrice(${productId}): varianterna har olika priser (${[...distinct].join(", ")}) — vägrar sänka`,
          );
        }
      }
    : undefined;
  await applyVariantPatch(productId, () => ({ price: newPrice, compareAt }), precheck);
}

/**
 * PER-VARIANT-läge: varje variant sätts till sitt eget pris (och jämförpris).
 * `byVariantId`: wixVariantId → {price, compareAt}. Varianter som saknas i
 * mappen lämnas orörda (skulle en ny variant dyka upp mellan seed och tick).
 */
export async function patchProductVariants(
  productId: string,
  byVariantId: Map<string, VariantTarget>,
): Promise<void> {
  await applyVariantPatch(productId, (v) => byVariantId.get(v.id) ?? null).catch((e) => {
    throw new Error(`patchProductVariants ${(e as Error).message}`);
  });
}
