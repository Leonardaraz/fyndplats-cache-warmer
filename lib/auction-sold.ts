// lib/auction-sold.ts
//
// Fyndauktionens DIREKT-FÖRSVINNANDE: så fort någon köper ett live-fynd ska
// det bort från auktionen — inte vid nästa timcron. Anropas från
// app/api/wix-webhook (order_created): matchar orderns produkt-id:n mot
// live-dokument i FyndplatsAuctions och avslutar träffarna på stället:
//
//   1. Priset PATCH:as tillbaka till ordinarie (per variant om trackar finns)
//      — nästa besökare ska aldrig kunna köpa ett redan-sålt fynd till
//      auktionspris.
//   2. Dokumentet sparas som status=sold (endedAt, soldPrice = senast
//      PATCH:ade visningspriset) → fyndet försvinner ur live-gridden och
//      dyker upp under "Senast sålda fynd".
//
// Motorn (cache-warmer-appen, lib/auction/store.ts på main) äger fortfarande
// skrivlogiken i stort — det här är en minimal, medvetet dum port av exakt
// de två skrivvägar som behövs för sold-fallet. Timcronens sold-detektering
// ligger kvar som backup: failar något här tar den över inom timmen (dess
// steg 1 kör FÖRE prissteget, så ett halvfärdigt slut kan inte re-sänka).
//
// Idempotent: bara status="live" träffas — Wix fyrar order_created flera
// gånger (created + approved + retries) men andra rundan finns inget kvar.

const WIX_BASE = "https://www.wixapis.com";
const COL = "FyndplatsAuctions";

// Webhookens request-väg → samma 8s-hängningsvakt som fetchWixOrder där:
// normal Wix-latens tillåts, en äkta TCP-hängning får inte äta funktionstiden.
const TIMEOUT_MS = 8000;

function wixHeaders(): Record<string, string> | null {
  const token = process.env.WIX_API_KEY;
  const siteId = process.env.WIX_SITE_ID;
  if (!token || !siteId) return null;
  return { "Content-Type": "application/json", Authorization: token, "wix-site-id": siteId };
}

interface VariantTrack {
  wixVariantId?: string;
  listPrice?: number;
}

/** Minimal vy av auktionsdokumentet — resten följer med orört via [k]. */
export interface LiveAuctionDoc {
  _id?: string;
  productId?: string;
  slug?: string;
  status?: string;
  listPrice?: number;
  lastPatchedPrice?: number;
  variantPrices?: VariantTrack[];
  [k: string]: unknown;
}

/**
 * Vilka ordinariepriser ska återställas? Per-variant-trackar om dokumentet
 * har dem (varje variant tillbaka till SITT listpris; varianter utanför
 * trackarna lämnas orörda) — annars enkel-pris-läge: `uniform` på alla
 * varianter. Ren funktion, exporterad för test.
 */
export function restoreTargets(doc: LiveAuctionDoc): {
  byVariant: Map<string, number>;
  uniform: number | null;
} {
  const byVariant = new Map<string, number>();
  for (const t of doc.variantPrices ?? []) {
    if (t.wixVariantId && typeof t.listPrice === "number") byVariant.set(t.wixVariantId, t.listPrice);
  }
  const uniform = byVariant.size === 0 && typeof doc.listPrice === "number" ? doc.listPrice : null;
  return { byVariant, uniform };
}

interface RawVariant {
  id: string;
  price?: { actualPrice?: { amount?: string }; compareAtPrice?: { amount?: string } };
  [k: string]: unknown;
}

// Stores V3 GET→PATCH tillbaka till ordinariepris. Runbookens hårda regler
// (samma som motorns applyVariantPatch): färsk revision precis före PATCH,
// options MÅSTE följa med variantsInfo (428-fällan), visible:true så en
// publicerad produkt inte flippas osynlig. compareAtPrice rensas (null) —
// inget överstruket pris kvar efter auktionen.
async function restoreListPrices(doc: LiveAuctionDoc, h: Record<string, string>): Promise<void> {
  const productId = doc.productId!;
  const getRes = await fetch(`${WIX_BASE}/stores/v3/products/${productId}`, {
    method: "GET",
    headers: h,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!getRes.ok) {
    throw new Error(`restore GET ${getRes.status}: ${(await getRes.text()).slice(0, 200)}`);
  }
  const data = (await getRes.json()) as {
    product?: { revision?: string; options?: unknown[]; variantsInfo?: { variants?: RawVariant[] } };
  };
  const p = data.product;
  if (!p?.revision || !p.variantsInfo?.variants?.length) {
    throw new Error(`restore(${productId}): saknar revision/varianter`);
  }
  const { byVariant, uniform } = restoreTargets(doc);
  const variants = p.variantsInfo.variants.map((v) => {
    const target = byVariant.get(v.id) ?? uniform;
    if (target == null) return v;
    return {
      ...v,
      price: { ...(v.price ?? {}), actualPrice: { amount: String(target) }, compareAtPrice: null },
    };
  });
  const patchRes = await fetch(`${WIX_BASE}/stores/v3/products/${productId}`, {
    method: "PATCH",
    headers: h,
    body: JSON.stringify({
      product: {
        id: productId,
        revision: p.revision,
        visible: true,
        variantsInfo: { ...p.variantsInfo, variants },
        ...(Array.isArray(p.options) && p.options.length > 0 ? { options: p.options } : {}),
      },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!patchRes.ok) {
    throw new Error(`restore PATCH ${patchRes.status}: ${(await patchRes.text()).slice(0, 300)}`);
  }
}

// Full-ersättande save (samma mönster som motorns saveAuction) med sold-fälten.
async function saveSold(doc: LiveAuctionDoc, h: Record<string, string>): Promise<void> {
  const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      dataCollectionId: COL,
      dataItem: {
        id: doc._id,
        dataCollectionId: COL,
        data: {
          ...doc,
          status: "sold",
          endedAt: new Date().toISOString(),
          soldPrice: doc.lastPatchedPrice ?? doc.listPrice,
        },
      },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`saveSold(${doc.slug}) ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}

/**
 * Avsluta live-auktioner vars produkt finns bland `productIds` (orderns rader).
 * Returnerar sluggarna som avslutades — tom lista = ingen auktionsprodukt i
 * ordern (det normala; kostar EN wix-data-query). Kastar aldrig för ett enskilt
 * dokument: fel loggas och timcronens sold-detektering tar över som backup.
 */
export async function endLiveAuctionsForProducts(productIds: string[]): Promise<string[]> {
  const h = wixHeaders();
  if (!h || productIds.length === 0) return [];

  const res = await fetch(`${WIX_BASE}/wix-data/v2/items/query`, {
    method: "POST",
    headers: h,
    cache: "no-store",
    body: JSON.stringify({
      dataCollectionId: COL,
      query: { filter: { status: "live", productId: { $in: productIds } }, paging: { limit: 10 } },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`auction-sold query ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const body = (await res.json()) as { dataItems?: Array<{ id?: string; data?: LiveAuctionDoc }> };
  const docs = (body.dataItems ?? [])
    .map((it) => ({ ...(it.data ?? {}), _id: it.data?._id ?? it.id }) as LiveAuctionDoc)
    .filter((d) => d._id && d.productId);

  const ended: string[] = [];
  for (const doc of docs) {
    try {
      // Ordningen är avsiktlig: priset tillbaka FÖRST (kunden efter köparen får
      // aldrig se auktionspris på ett sålt fynd), sedan sold-flippen. Failar
      // save efter lyckad restore är dokumentet kvar som live med ordinarie
      // pris — timcronen markerar det sold innan dess prissteg hinner köra.
      await restoreListPrices(doc, h);
      await saveSold(doc, h);
      ended.push(String(doc.slug ?? doc.productId));
    } catch (err) {
      console.error(`[auction-sold] kunde inte avsluta ${doc.slug ?? doc.productId} (timcronen tar det)`, err);
    }
  }
  return ended;
}
