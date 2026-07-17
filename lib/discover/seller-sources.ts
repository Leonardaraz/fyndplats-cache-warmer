// Produktions-wiring för seller-catalog-källorna (fetch + sökskoppling). Hålls
// separat från lib/discover/seller-catalog.ts (ren, testbar logik) så att både
// supplier-watch-cronen och seller-probe-endpointen delar exakt samma källor.

import { searchAliExpressByText } from "../aliexpress/client";
import {
  createApiSearchExtendSource,
  createStorefrontSource,
  type SellerCatalogSource,
} from "./seller-catalog";
import { DEFAULT_WATCH_TERMS } from "./supplier-watch";

/** Butiks-storefront-URL. Default = AE-butik sorterad på nyast. {storeId} byts ut. */
export function storefrontUrl(storeId: string, env: NodeJS.ProcessEnv = process.env): string {
  const tmpl =
    env.SUPPLIER_WATCH_STOREFRONT_URL_TEMPLATE ??
    "https://www.aliexpress.com/store/{storeId}?sortType=create_desc";
  return tmpl.replace("{storeId}", encodeURIComponent(storeId));
}

/**
 * Hämtar en butiks storefront-råtext. Går via en skrap-proxy om
 * SUPPLIER_WATCH_SCRAPE_PROXY_URL är satt (AE blockerar ofta datacenter-IP:n) —
 * proxyn förväntas ta mål-URL:en URL-kodad efter sitt eget "?url="-liknande fäste.
 */
export async function fetchStorefront(
  storeId: string,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const target = storefrontUrl(storeId, env);
  const proxy = env.SUPPLIER_WATCH_SCRAPE_PROXY_URL;
  const url = proxy ? `${proxy}${encodeURIComponent(target)}` : target;
  const res = await fetchImpl(url, {
    headers: {
      "User-Agent":
        env.SUPPLIER_WATCH_UA ??
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
      Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`storefront ${res.status}`);
  return await res.text();
}

/** Söktermer för api-källan (env-override eller inbyggd nisch-lista). */
export function apiSourceTerms(env: NodeJS.ProcessEnv = process.env): string[] {
  const raw = (env.SUPPLIER_WATCH_TERMS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return raw.length > 0 ? raw : [...DEFAULT_WATCH_TERMS];
}

/**
 * Bygger de aktiva säljar-källorna ur env. SUPPLIER_WATCH_SOURCES väljer vilka
 * (default "storefront,api"). fetchImpl injiceras för test.
 */
export function buildSellerSources(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch,
): SellerCatalogSource[] {
  const enabled = (env.SUPPLIER_WATCH_SOURCES ?? "storefront,api")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const pageSize = Number(env.SUPPLIER_WATCH_SEARCH_PAGE_SIZE) || 30;
  const sources: SellerCatalogSource[] = [];

  if (enabled.includes("storefront")) {
    sources.push(
      createStorefrontSource({
        fetchStorefront: (storeId) => fetchStorefront(storeId, env, fetchImpl),
        cap: Number(env.SUPPLIER_WATCH_STOREFRONT_CAP) || 200,
      }),
    );
  }
  if (enabled.includes("api")) {
    sources.push(
      createApiSearchExtendSource({
        terms: apiSourceTerms(env),
        perStoreTermCap: Number(env.SUPPLIER_WATCH_API_TERMS_PER_STORE) || 4,
        searchSellerScoped: async (storeId, term) => {
          const hits = await searchAliExpressByText(term, {
            pageSize,
            sortBy: "orders,desc",
            sellerId: storeId,
          });
          return hits.map((h) => h.productId).filter(Boolean);
        },
      }),
    );
  }
  return sources;
}
