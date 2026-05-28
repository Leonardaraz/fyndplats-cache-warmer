import { computePrice } from "./pricing";
import { generateSeo, type SeoResult } from "./seo";
import type { AliExpressProduct, PricingConfig } from "./types";
import { createProduct, type WixProductInput, type WixVariantInput } from "../wix/client";

export interface VariantMapping {
  supplierVariantId: string;
  sku: string;
  /** Wix-tilldelat variant-id (sätts efter att produkten skapats). */
  wixVariantId?: string;
  choices: Record<string, string>;
}

export interface ImportResult {
  wixProductId: string;
  slug: string;
  supplierProductId: string;
  seo: SeoResult;
  variantMappings: VariantMapping[];
}

/** Stabil SKU per leverantörsvariant — används senare för lager-/orderkoppling. */
export function makeSku(supplierProductId: string, supplierVariantId: string): string {
  return `AE-${supplierProductId}-${supplierVariantId}`;
}

/** Färgkoder per option och val: { [optionName]: { [choiceName]: "#hex" } }. */
export type OptionColorCodes = Record<string, Record<string, string>>;

export interface DerivedOption {
  name: string;
  choices: { name: string; colorCode?: string }[];
}

/**
 * Härleder Wix-optionsdefinitioner från variantvärdena. Om en colorCode finns
 * för ett val (samplad från produktbilden) följer den med → färg-swatch i Wix.
 */
export function deriveOptions(
  variants: AliExpressProduct["variants"],
  colorCodes?: OptionColorCodes,
): DerivedOption[] {
  const map = new Map<string, Set<string>>();
  for (const v of variants) {
    for (const [name, value] of Object.entries(v.options)) {
      if (!map.has(name)) map.set(name, new Set());
      map.get(name)!.add(value);
    }
  }
  return [...map.entries()].map(([name, set]) => ({
    name,
    choices: [...set].map((choiceName) => ({
      name: choiceName,
      colorCode: colorCodes?.[name]?.[choiceName],
    })),
  }));
}

/**
 * Kör hela import-flödet för en produkt:
 * SEO-optimering → prissättning (inkl. moms) per inkluderad variant → skapa i Wix.
 * Endast varianter med `included: true` importeras (variant-filter från popupen).
 */
export async function importProduct(
  product: AliExpressProduct,
  config: PricingConfig,
  colorCodes?: OptionColorCodes,
): Promise<ImportResult> {
  const included = product.variants.filter((v) => v.included);
  if (included.length === 0) {
    throw new Error("Inga varianter valda för import.");
  }

  const seo = await generateSeo(product);

  // Options härleds från ALLA varianter; avbockade varianter skapas men döljs
  // (visible: false) så att Wix får en komplett variantuppsättning.
  const options = deriveOptions(product.variants, colorCodes);
  const variantMappings: VariantMapping[] = [];
  const wixVariants: WixVariantInput[] = product.variants.map((v) => {
    const sku = makeSku(product.supplierProductId, v.supplierVariantId);
    const price = computePrice(v.costUsd, config);
    if (v.included) {
      variantMappings.push({ supplierVariantId: v.supplierVariantId, sku, choices: v.options });
    }
    return {
      sku,
      actualPrice: price.grossSek.toFixed(2),
      choices: v.options,
      visible: v.included,
    };
  });

  const wixInput: WixProductInput = {
    name: seo.title,
    slug: seo.slug,
    plainDescription: seo.descriptionHtml,
    seo: { title: seo.title, description: seo.metaDescription },
    options: options.length ? options : undefined,
    variants: wixVariants,
  };

  const created = await createProduct(wixInput);

  // Koppla Wix-tilldelade variant-id:n till våra mappningar via SKU.
  const skuToWixId = new Map(created.variants.map((v) => [v.sku, v.id]));
  for (const m of variantMappings) {
    m.wixVariantId = skuToWixId.get(m.sku);
  }

  return {
    wixProductId: created.id,
    slug: created.slug,
    supplierProductId: product.supplierProductId,
    seo,
    variantMappings,
  };
}
