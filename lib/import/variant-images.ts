// Variantbild-backfill (linkedMedia) för EXTENSION-import-vägen.
//
// Bakgrund (bug 2026-06-06, "kepsen"): tilläggets skrapa (content.js) läser per-
// färg-bilderna ur AliExpress-sidans HTML. På vissa produkter ligger de inte där
// skrapan tittar (lazy-load/annan DOM-struktur) → product.swatchImages blir tom →
// produkten importeras med text-val UTAN bild (medan en produkt vars swatchar låg
// rätt, t.ex. en sten, får bild per val). Det är inte ett Wix-problem.
//
// Fix: när skrapan inte gav NÅGON swatch-bild hämtar vi bilderna från DS-produkt-
// API:t (getProduct → sku_image) i stället, matchat på SKU-id (skrapans
// supplierVariantId === DS skuId — samma id som stock-syncen redan litar på).
// Själva axel-/swatch-härledningen ÅTERANVÄNDER URL-vägens buildSwatchImagesFromDs
// (en sanningskälla, med dess guards: ≥2 värden, konsistent bild per värde, ≥2
// distinkta bilder). Vi matar den med SKRAPANS råa namn så att kartan efter
// översättningen matchar de härledda Wix-optionsvalen exakt.
//
// Best-effort/deterministiskt (inga AI-anrop): fel/avsaknad av bilder → {} och
// importen fortsätter precis som förut.

import type { AliExpressProduct } from "./types";
import { buildSwatchImagesFromDs } from "./from-url";

export type SwatchMap = Record<string, Record<string, string>>;

/** True om produkten har varianter men skrapan inte gav NÅGON swatch-bild. */
export function needsSwatchBackfill(product: AliExpressProduct): boolean {
  const hasVariants = (product.variants?.length ?? 0) > 0;
  const hasSwatch = Object.values(product.swatchImages ?? {}).some(
    (m) => m && Object.keys(m).length > 0,
  );
  return hasVariants && !hasSwatch;
}

export interface SwatchBackfillDeps {
  getProduct: (productId: string) => Promise<{ variants: { skuId: string; imageUrl?: string }[] }>;
}

/**
 * Hämtar DS-produkten och bygger en swatch-karta (skrapans råa namn) ur sku_image,
 * matchat på SKU-id. Återanvänder buildSwatchImagesFromDs för axel-detekteringen.
 * Best-effort: returnerar {} vid fel eller om inga per-SKU-bilder finns.
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

  // Syntetiska DS-varianter: SKRAPANS namn/värden (matchar Wix-optionsvalen efter
  // översättning) + DS-bilden joinad på SKU-id. price krävs av typen men används ej.
  const synth = product.variants.map((v) => ({
    skuId: v.supplierVariantId,
    skuProps: v.options ?? {},
    imageUrl: imageBySkuId.get(v.supplierVariantId),
    price: 0,
  }));
  return buildSwatchImagesFromDs(synth) ?? {};
}
