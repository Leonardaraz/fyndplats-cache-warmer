// Bygger en AliExpressProduct (pipeline-shape) ur AliExpress Open Platform
// DS-API:t och kör hela import-pipelinen. Används av:
//   - bulk CSV-import (lib/bulk-import/worker.ts)
//   - framtida server-side eller webhook-triggers
//
// Browser-tillägget POST:ar redan en färdig AliExpressProduct till /api/import
// (det skrapar siden för att få korrekta SEK-priser och bilder); detta är ALT-
// vägen via det officiella API:t.

import { getProduct as getAliExpressDsProduct } from "../aliexpress/client";
import type { AliExpressDsProduct } from "../aliexpress/types";
import type { AliExpressProduct, AliExpressVariant } from "./types";
import { parseAliExpressUrl } from "../bulk-import/url";

export interface FromUrlOptions {
  /** Filter på variantnivå — om angiven importeras endast varianter vars
   * sammansatta options-sträng matchar något av filtren (lower-case substring).
   * Lämnas tom = importera alla in-stock-varianter. */
  variantFilters?: string[];
}

export interface UrlFetchResult {
  product: AliExpressProduct;
  /** Antal varianter exkluderade på grund av filter eller noll-lager. */
  excludedCount: number;
  /** Source-id för dedupe-checken mot existerande mappningar. */
  supplierProductId: string;
}

/**
 * Hämta + konvertera till pipeline-shape (utan att köra själva importen).
 * Renheten gör det enkelt att testa mot existerande mappningar innan vi
 * spenderar bilder/Claude-anrop.
 */
export async function fetchAliExpressProductFromUrl(
  sourceUrl: string,
  opts: FromUrlOptions = {},
): Promise<UrlFetchResult> {
  const parsed = parseAliExpressUrl(sourceUrl);
  if (!parsed.productId) {
    throw new Error(parsed.error ?? "Kunde inte tolka URL");
  }

  const ds = await getAliExpressDsProduct(parsed.productId);
  return convertDsToAliExpressProduct(ds, parsed.normalizedUrl ?? sourceUrl, opts);
}

export function convertDsToAliExpressProduct(
  ds: AliExpressDsProduct,
  sourceUrl: string,
  opts: FromUrlOptions = {},
): UrlFetchResult {
  const filters = (opts.variantFilters ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean);

  let excludedCount = 0;
  const variants: AliExpressVariant[] = ds.variants.map((v) => {
    const optionsLower = Object.values(v.skuProps).join(" ").toLowerCase();
    const hasStock = (v.stock ?? 0) > 0;
    // Default = inkludera alla med lager. Filter kan whitelisteа specifika varianter.
    const matchesFilter = filters.length === 0 || filters.some((f) => optionsLower.includes(f));
    const included = hasStock && matchesFilter;
    if (!included) excludedCount++;
    return {
      supplierVariantId: v.skuId,
      options: v.skuProps,
      costUsd: v.price,
      stock: v.stock,
      included,
    };
  });

  // Om inga varianter skulle bli inkluderade pga filter — fallback: inkludera
  // alla in-stock-varianter (bulk-importen ska inte tysta tappa hela produkten).
  if (variants.every((v) => !v.included)) {
    excludedCount = 0;
    for (const v of variants) {
      v.included = (v.stock ?? 0) > 0;
      if (!v.included) excludedCount++;
    }
  }

  const product: AliExpressProduct = {
    supplierProductId: ds.productId,
    sourceUrl,
    rawTitle: ds.title,
    rawDescription: ds.description,
    imageUrls: ds.images,
    variants,
  };

  return { product, excludedCount, supplierProductId: ds.productId };
}
