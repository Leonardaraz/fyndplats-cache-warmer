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

/**
 * Sätter auktionspriset på ALLA produktens varianter (poolen är enkel-variant-
 * produkter, men koden tål fler). `compareAt` = listpris under auktion, null
 * för att rensa (återställning). Läser färsk revision + echo:ar options.
 */
export async function patchProductPrice(
  productId: string,
  newPrice: number,
  compareAt: number | null,
): Promise<void> {
  const getRes = await fetch(`${WIX_BASE}/stores/v3/products/${productId}`, {
    method: "GET",
    headers: headers(),
  });
  if (!getRes.ok) {
    const text = await getRes.text();
    throw new Error(`patchProductPrice GET ${getRes.status}: ${text.slice(0, 200)}`);
  }
  const data = (await getRes.json()) as {
    product?: { revision?: string; options?: unknown[]; variantsInfo?: { variants?: RawVariant[] } };
  };
  const p = data.product;
  if (!p?.revision || !p.variantsInfo?.variants?.length) {
    throw new Error(`patchProductPrice(${productId}): saknar revision/varianter`);
  }
  const variants = p.variantsInfo.variants.map((v) => ({
    ...v,
    price: {
      ...(v.price ?? {}),
      actualPrice: { amount: String(newPrice) },
      ...(compareAt != null
        ? { compareAtPrice: { amount: String(compareAt) } }
        : { compareAtPrice: null }),
    },
  }));
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
    throw new Error(`patchProductPrice PATCH ${patchRes.status}: ${text.slice(0, 300)}`);
  }
}
