// Seller-catalog — säljar-scopade kandidat-källor för supplier-watchens
// "seller"-läge. Varje källa returnerar KANDIDAT-produkt-id för en bevakad
// AliExpress-butik; supplier-watch detalj-verifierar sedan varje id (store_id,
// EU-lager, lager, pris) via det officiella API:t. Källorna påverkar alltså
// bara TÄCKNING/EFFEKTIVITET, aldrig korrektheten.
//
// Två källor, olika styrkor — de kombineras och deduperas:
//   1. api-search-extend  — text.search med säljarfilter i searchExtend.
//      Alltid tillgänglig (officiellt API), men fortfarande sökords-bunden:
//      bra som säljar-scopad backup, inte full katalog.
//   2. storefront         — hämtar butikens katalog-/nyhets-yta (utan sökord)
//      och extraherar produkt-id. Ger äkta per-säljar-täckning, men beror på
//      att butikssidan går att hämta (AE kan blocka datacenter-IP:n → koppla en
//      skrap-proxy via env). fetch injiceras så logiken är testbar oberoende.

import type { CandidateDiscovery, CandidateRef } from "./supplier-watch";

export interface SellerCatalogResult {
  source: string;
  storeId: string;
  productIds: string[];
  /** false = källan kunde inte betjäna butiken (fel/otillgänglig). */
  ok: boolean;
  note?: string;
}

export interface SellerCatalogSource {
  readonly name: string;
  listProductIds(storeId: string): Promise<SellerCatalogResult>;
}

const ID_RE = /(?:\/item\/|"productId"\s*:\s*"?|"product_id"\s*:\s*"?|itemId["']?\s*[:=]\s*["']?)(\d{10,16})/g;

/**
 * Extraherar AliExpress-produkt-id ur butiks-storefrontens HTML/JSON. Matchar
 * både `/item/{id}.html`-länkar och inbäddade `productId`/`itemId`-fält (SSR-
 * JSON). Deduperar, bevarar första-förekomst-ordning, cap:ar.
 */
export function extractProductIds(text: string, cap = 200): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of text.matchAll(ID_RE)) {
    const id = m[1];
    if (id && !seen.has(id)) {
      seen.add(id);
      out.push(id);
      if (out.length >= cap) break;
    }
  }
  return out;
}

/**
 * API-källa: säljar-scopad text.search över en (roterande) skiva söktermer.
 * `searchSellerScoped(storeId, term)` ska returnera produkt-id (route:n kopplar
 * den till searchAliExpressByText med sellerId-filter).
 */
export function createApiSearchExtendSource(deps: {
  searchSellerScoped(storeId: string, term: string): Promise<string[]>;
  terms: readonly string[];
  /** Max antal termer att köra per butik och körning (rate-limit-skydd). */
  perStoreTermCap: number;
}): SellerCatalogSource {
  return {
    name: "api-search-extend",
    async listProductIds(storeId: string): Promise<SellerCatalogResult> {
      const ids = new Set<string>();
      const terms = deps.terms.slice(0, Math.max(0, deps.perStoreTermCap));
      const errors: string[] = [];
      for (const term of terms) {
        try {
          for (const id of await deps.searchSellerScoped(storeId, term)) ids.add(id);
        } catch (err) {
          errors.push(err instanceof Error ? err.message.slice(0, 100) : String(err));
        }
      }
      const ok = errors.length < terms.length; // helt trasig bara om ALLT failade
      return {
        source: "api-search-extend",
        storeId,
        productIds: [...ids],
        ok,
        note: errors.length ? `${errors.length}/${terms.length} termer failade` : undefined,
      };
    },
  };
}

/**
 * Storefront-källa: hämtar butikens katalog-yta och extraherar produkt-id.
 * `fetchStorefront(storeId)` returnerar sidans råtext (HTML eller SSR-JSON).
 */
export function createStorefrontSource(deps: {
  fetchStorefront(storeId: string): Promise<string>;
  cap?: number;
}): SellerCatalogSource {
  return {
    name: "storefront",
    async listProductIds(storeId: string): Promise<SellerCatalogResult> {
      try {
        const text = await deps.fetchStorefront(storeId);
        const productIds = extractProductIds(text, deps.cap ?? 200);
        return {
          source: "storefront",
          storeId,
          productIds,
          ok: true,
          note: productIds.length === 0 ? "0 id — blockerad/tomt svar?" : `${productIds.length} id`,
        };
      } catch (err) {
        return {
          source: "storefront",
          storeId,
          productIds: [],
          ok: false,
          note: err instanceof Error ? err.message.slice(0, 120) : String(err),
        };
      }
    },
  };
}

/**
 * Kör alla källor mot alla butiker, deduperar id över källor/butiker, och
 * formar en CandidateDiscovery som supplier-watch kan konsumera direkt.
 * `foundBy` bevarar källa+butik för rapporten. Cap:ar totala kandidater.
 */
export async function gatherSellerCandidates(
  sources: SellerCatalogSource[],
  storeIds: string[],
  opts: { totalCap?: number } = {},
): Promise<CandidateDiscovery> {
  const totalCap = opts.totalCap ?? 1000;
  const candidates: CandidateRef[] = [];
  const sourceStats: Record<string, number> = {};
  const errors: string[] = [];
  const seen = new Set<string>();

  // Butiks-yttre loop så en butiks nyheter inte trängs ut av en annans om vi
  // cap:ar — varannan källa per butik ger jämn spridning.
  for (const storeId of storeIds) {
    for (const source of sources) {
      let res: SellerCatalogResult;
      try {
        res = await source.listProductIds(storeId);
      } catch (err) {
        errors.push(`${source.name}/${storeId}: ${err instanceof Error ? err.message.slice(0, 100) : String(err)}`);
        continue;
      }
      sourceStats[`${res.source}:${storeId}`] = res.productIds.length;
      if (!res.ok) {
        errors.push(`${res.source}/${storeId}: ${res.note ?? "ok=false"}`);
      }
      for (const id of res.productIds) {
        if (seen.has(id)) continue;
        seen.add(id);
        candidates.push({ aeProductId: id, foundBy: `${res.source}:${storeId}` });
        if (candidates.length >= totalCap) return { candidates, sourceStats, errors };
      }
    }
  }
  return { candidates, sourceStats, errors };
}
