// Variantbild-backfill (linkedMedia) för importen.
//
// Bakgrund (bug 2026-06-06, "kepsen"): tilläggets skrapa (content.js) läser per-
// färg-bilderna ur AliExpress-sidans HTML. På vissa produkter ligger de inte där
// skrapan tittar (lazy-load/annan DOM-struktur) → product.swatchImages blir tom →
// produkten importeras med text-val UTAN bild (medan en produkt vars swatchar låg
// rätt, t.ex. en sten, får bild per val). Det är inte ett Wix-problem.
//
// Fix: när skrapan inte gav NÅGON swatch-bild hämtar vi bilderna från DS-produkt-
// API:t (getProduct → sku_image) i stället. Vi matchar bild→variant på SKU-id
// (scrapans supplierVariantId === DS skuId — samma id som stock-syncen redan
// litar på) och bygger { axel: { värde: bild } } med SKRAPANS råa namn, så att
// kartan efter översättningen matchar de härledda Wix-optionsvalen exakt.
//
// Allt är best-effort och deterministiskt (inga AI-anrop): fel/avsaknad av bilder
// → {} och importen fortsätter precis som förut.

import type { AliExpressProduct } from "./types";

export type SwatchMap = Record<string, Record<string, string>>;

/** True om produkten har varianter men skrapan inte gav NÅGON swatch-bild. */
export function needsSwatchBackfill(product: AliExpressProduct): boolean {
  const hasVariants = (product.variants?.length ?? 0) > 0;
  const hasSwatch = Object.values(product.swatchImages ?? {}).some(
    (m) => m && Object.keys(m).length > 0,
  );
  return hasVariants && !hasSwatch;
}

/**
 * Härleder { axel: { värde: bild } } för den BILDBÄRANDE axeln ur varianterna +
 * en SKU-id→bild-karta. Bildaxeln är den axel där bilden är KONSISTENT per värde
 * (AE:s sku_image bestäms av färgvärdet) och flest distinkta bilder förekommer.
 * En storleksaxel faller bort eftersom samma storlek dyker upp med olika
 * färgbilder → inkonsistent. Returnerar {} om ingen axel kvalar (t.ex. inga
 * matchande bilder).
 */
export function deriveSwatchFromVariantImages(
  variants: { supplierVariantId: string; options: Record<string, string> }[],
  imageBySkuId: Map<string, string>,
): SwatchMap {
  const axisValueImages = new Map<string, Map<string, Set<string>>>();
  for (const v of variants) {
    const img = imageBySkuId.get(v.supplierVariantId);
    if (!img) continue;
    for (const [axis, value] of Object.entries(v.options ?? {})) {
      if (!value) continue;
      let vm = axisValueImages.get(axis);
      if (!vm) axisValueImages.set(axis, (vm = new Map()));
      let s = vm.get(value);
      if (!s) vm.set(value, (s = new Set()));
      s.add(img);
    }
  }

  let bestAxis = "";
  let bestDistinct = 0;
  for (const [axis, vm] of axisValueImages) {
    // Konsistent = varje värde mappar till exakt EN bild (bildbärande axel).
    const consistent = [...vm.values()].every((s) => s.size === 1);
    if (!consistent) continue;
    const distinct = new Set([...vm.values()].map((s) => [...s][0])).size;
    if (distinct > bestDistinct) {
      bestDistinct = distinct;
      bestAxis = axis;
    }
  }
  if (!bestAxis) return {};

  const out: Record<string, string> = {};
  for (const [value, s] of axisValueImages.get(bestAxis)!) out[value] = [...s][0];
  return { [bestAxis]: out };
}

/** Slår ihop swatch-kartor; base (skrapan) vinner, extra fyller bara luckor. */
export function mergeSwatchImages(base: SwatchMap | undefined, extra: SwatchMap): SwatchMap {
  const out: SwatchMap = {};
  for (const [axis, vals] of Object.entries(base ?? {})) out[axis] = { ...vals };
  for (const [axis, vals] of Object.entries(extra)) {
    const cur = (out[axis] = { ...(out[axis] ?? {}) });
    for (const [val, img] of Object.entries(vals)) if (!cur[val]) cur[val] = img;
  }
  return out;
}

export interface SwatchBackfillDeps {
  getProduct: (productId: string) => Promise<{ variants: { skuId: string; imageUrl?: string }[] }>;
}

/**
 * Hämtar DS-produkten och bygger en swatch-karta (råa namn) ur sku_image, matchat
 * på SKU-id. Best-effort: returnerar {} vid fel eller om DS-API:t inte gav några
 * per-SKU-bilder (importen fortsätter oförändrad).
 */
export async function enrichSwatchImagesFromApi(
  product: AliExpressProduct,
  deps: SwatchBackfillDeps,
): Promise<SwatchMap> {
  if (!product.supplierProductId || !(product.variants?.length)) return {};
  let ds: { variants: { skuId: string; imageUrl?: string }[] };
  try {
    ds = await deps.getProduct(product.supplierProductId);
  } catch {
    return {};
  }
  const imageBySkuId = new Map<string, string>();
  for (const v of ds.variants ?? []) {
    if (v.skuId && v.imageUrl) imageBySkuId.set(String(v.skuId), v.imageUrl);
  }
  if (imageBySkuId.size === 0) return {};
  return deriveSwatchFromVariantImages(product.variants, imageBySkuId);
}
