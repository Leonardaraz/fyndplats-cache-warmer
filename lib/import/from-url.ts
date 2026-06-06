// Bygger en AliExpressProduct (pipeline-shape) ur AliExpress Open Platform
// DS-API:t och kör hela import-pipelinen. Används av:
//   - bulk CSV-import (lib/bulk-import/worker.ts)
//   - framtida server-side eller webhook-triggers
//
// Browser-tillägget POST:ar redan en färdig AliExpressProduct till /api/import
// (det skrapar siden för att få korrekta SEK-priser och bilder); detta är ALT-
// vägen via det officiella API:t.

import { getProduct as getAliExpressDsProduct } from "../aliexpress/client";
import type { AliExpressDsProduct, AliExpressDsVariant } from "../aliexpress/types";
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

  // Per-variant swatch-bilder ur DS-API:t (en imageUrl per SKU). undefined om
  // ingen tydlig bild-axel hittas → pipelinen hoppar bara över linkedMedia.
  const swatchFromDs = buildSwatchImagesFromDs(ds.variants);

  const product: AliExpressProduct = {
    supplierProductId: ds.productId,
    sourceUrl,
    rawTitle: ds.title,
    rawDescription: ds.description,
    imageUrls: ds.images,
    variants,
    ...(swatchFromDs ? { swatchImages: swatchFromDs } : {}),
  };

  return { product, excludedCount, supplierProductId: ds.productId };
}

/**
 * Bygger swatch-bilder ur DS-varianternas per-SKU `imageUrl`. Hittar den axel vars
 * värde bestämmer bilden (typiskt färg): för varje axel, om varje värde mappar till
 * exakt EN bild-URL och minst två värden har bilder, är det bild-axeln. Returnerar
 * { [axel]: { [värde]: url } } så pipelinen kan koppla val→bild (linkedMedia), annars
 * undefined. Samma shape som extension-skraparens swatchImages.
 */
export function buildSwatchImagesFromDs(
  variants: AliExpressDsVariant[],
): Record<string, Record<string, string>> | undefined {
  const axisNames = new Set<string>();
  for (const v of variants) for (const k of Object.keys(v.skuProps)) axisNames.add(k);
  for (const axis of axisNames) {
    const byValue: Record<string, Set<string>> = {};
    for (const v of variants) {
      const val = v.skuProps[axis];
      const img = cleanAliCdnUrl(v.imageUrl);
      if (!val || !img) continue;
      (byValue[val] ??= new Set()).add(img);
    }
    const values = Object.keys(byValue);
    // Bild-axel = minst 2 värden där varje värde mappar till exakt EN bild.
    const eachSingle = values.length >= 2 && values.every((val) => byValue[val].size === 1);
    if (!eachSingle) continue;
    const map: Record<string, string> = {};
    for (const val of values) map[val] = [...byValue[val]][0];
    // ...OCH minst två DISTINKTA bilder. Annars är det ingen riktig swatch-axel:
    // en storleksaxel där alla SKU:er delar samma hjältebild ger en degenererad
    // karta som skulle koppla samma bild till varje val (linkedMedia-brus).
    if (new Set(Object.values(map)).size < 2) continue;
    return { [axis]: map };
  }
  return undefined;
}

/**
 * Strippar alicdn-storleks-/thumbnail-suffix så Wix linkedMedia får ORIGINALET i
 * full upplösning (server-side motsvarighet till extension-skraparens cleanImageUrl;
 * bug 2026-06-02: linkedMedia satte 220×220-thumbs i stället för originalet). No-op
 * på redan rena URL:er.
 */
export function cleanAliCdnUrl(u: string | undefined): string {
  if (!u) return "";
  let s = String(u).trim();
  if (s.startsWith("//")) s = "https:" + s;
  // Suffix EFTER filändelsen: ".jpg_220x220q75.jpg_.avif" → ".jpg".
  s = s.replace(/(\.(?:jpg|jpeg|png|webp|gif|avif|bmp))_[^/]*$/i, "$1");
  // Suffix FÖRE filändelsen: "abc_220x220.jpg" / "abc_50x50q75.webp" → "abc.jpg".
  s = s.replace(/_\d{2,4}x\d{2,4}(?:q\d{1,3})?(?=\.(?:jpg|jpeg|png|webp|gif|avif|bmp)$)/i, "");
  // Dubbel-extension efter dedup ("….jpg.webp") → behåll första.
  s = s.replace(/(\.(?:jpg|jpeg|png|webp|gif|avif|bmp))\.(?:jpg|jpeg|png|webp|gif|avif|bmp)$/i, "$1");
  return s;
}
