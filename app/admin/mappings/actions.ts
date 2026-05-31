"use server";

import { revalidatePath } from "next/cache";
import { extractAliExpressProductId, getProduct, searchAliExpressByText, type AliExpressSearchResult } from "@/lib/aliexpress/client";
import { getV3ProductVariants } from "@/lib/wix/v3-products";
import { getStore } from "@/lib/store/factory";
import { pricingConfigFromEnv } from "@/lib/config";
import { computePrice } from "@/lib/import/pricing";

export type MappingActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/**
 * Skapar mappning från Wix-produkt till AliExpress-URL/ID. Positionell
 * variantmappning. Bumpar revalidatePath så listan uppdateras direkt.
 */
export async function createMappingAction(
  wixProductId: string,
  aliexpressInput: string,
): Promise<MappingActionResult> {
  if (!wixProductId || !aliexpressInput) {
    return { ok: false, error: "Wix-produkt och AliExpress-input krävs" };
  }
  const supplierProductId = extractAliExpressProductId(aliexpressInput);
  if (!supplierProductId) {
    return { ok: false, error: "Hittade inget AliExpress-produktID i input" };
  }

  try {
    const [wixVariants, aeProduct] = await Promise.all([
      getV3ProductVariants(wixProductId),
      getProduct(supplierProductId),
    ]);
    const pairs = Math.min(wixVariants.length, aeProduct.variants.length);
    const pricing = pricingConfigFromEnv();
    const variantMappings = Array.from({ length: pairs }, (_, i) => {
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

    const store = getStore();
    await store.saveMapping({ supplierProductId, wixProductId, variants: variantMappings });
    await store.appendAudit({
      at: new Date().toISOString(),
      kind: "mapping-created",
      ref: wixProductId,
      detail: `supplierProductId=${supplierProductId} variants=${variantMappings.length}`,
    });
    revalidatePath("/admin/mappings");
    return {
      ok: true,
      message: `Mappad ✓ (${variantMappings.length} varianter${
        wixVariants.length !== aeProduct.variants.length
          ? `, varning: Wix har ${wixVariants.length}, AE har ${aeProduct.variants.length}`
          : ""
      })`,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Okänt fel" };
  }
}

/** Söker AliExpress-produkter. Returnerar resultat eller felmeddelande. */
export async function searchAliExpressAction(
  query: string,
): Promise<{ ok: true; results: AliExpressSearchResult[]; query: string } | { ok: false; error: string }> {
  const q = query.trim();
  if (!q) return { ok: false, error: "Skriv ett sökord först." };
  try {
    const results = await searchAliExpressByText(q);
    return { ok: true, results, query: q };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Nätverksfel (fetch failed, ENOTFOUND, timeout) → vänligt meddelande
    if (/fetch failed|ENOTFOUND|ECONNRESET|timed? ?out|network/i.test(message)) {
      return { ok: false, error: "Kunde inte nå AliExpress. Prova igen om en stund." };
    }
    return { ok: false, error: message };
  }
}
