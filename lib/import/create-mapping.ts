// Delad logik för att skapa en AliExpress↔Wix-mappning från två produkt-ID:n.
// Används av admin-action, /api/mappings/create och auto-mappningen så att
// variant-parning och prisberäkning sker på exakt ett ställe.

import { getProduct } from "../aliexpress/client";
import { getV3ProductVariants } from "../wix/v3-products";
import { getStore } from "../store/factory";
import { pricingConfigFromEnv } from "../config";
import { computePrice } from "./pricing";
import type { ProductMappingRecord } from "../store";

export interface BuildMappingResult {
  mapping: ProductMappingRecord;
  /** Antal parade varianter. */
  pairedVariants: number;
  /** Antal Wix-varianter respektive AliExpress-varianter (för varning vid skev). */
  wixVariantCount: number;
  aeVariantCount: number;
}

/**
 * Hämtar Wix-varianter + AliExpress-produkt, parar varianter positionellt,
 * beräknar pris och sparar mappningen i store. Skriver även en audit-rad.
 */
export async function buildAndSaveMapping(
  wixProductId: string,
  supplierProductId: string,
): Promise<BuildMappingResult> {
  const [wixVariants, aeProduct] = await Promise.all([
    getV3ProductVariants(wixProductId),
    getProduct(supplierProductId),
  ]);

  const pricing = pricingConfigFromEnv();
  const pairs = Math.min(wixVariants.length, aeProduct.variants.length);
  const variants = Array.from({ length: pairs }, (_, i) => {
    const ae = aeProduct.variants[i];
    const breakdown = computePrice(ae.price, pricing);
    return {
      supplierVariantId: ae.skuId,
      sku: wixVariants[i].sku || `${supplierProductId}-${i}`,
      wixVariantId: wixVariants[i].id,
      choices: wixVariants[i].choices,
      costUsd: ae.price,
      landedCostSek: breakdown.costSek,
      grossSek: breakdown.grossSek,
    };
  });

  const mapping: ProductMappingRecord = { supplierProductId, wixProductId, variants };

  const store = getStore();
  await store.saveMapping(mapping);
  await store.appendAudit({
    at: new Date().toISOString(),
    kind: "mapping-created",
    ref: wixProductId,
    detail: `supplierProductId=${supplierProductId} variants=${variants.length}`,
  });

  return {
    mapping,
    pairedVariants: variants.length,
    wixVariantCount: wixVariants.length,
    aeVariantCount: aeProduct.variants.length,
  };
}
