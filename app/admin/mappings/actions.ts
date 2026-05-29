"use server";

import { revalidatePath } from "next/cache";
import { extractAliExpressProductId, getProduct, searchAliExpressByText, type AliExpressSearchResult } from "@/lib/aliexpress/client";
import { getV3ProductVariants } from "@/lib/wix/v3-products";
import { getStore } from "@/lib/store/factory";
import { pricingConfigFromEnv } from "@/lib/config";
import { computePrice } from "@/lib/import/pricing";
import { autoMapUnmapped, confirmSuggestion, dismissSuggestion, type AutoMapSummary } from "@/lib/aliexpress/auto-map-run";

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

/**
 * Kör AI-auto-mappning för omappade produkter. Begränsa med `limit` för att
 * hålla körningen under tidsgränsen (kör flera gånger för resten).
 */
export async function runAutoMapAction(
  limit?: number,
): Promise<{ ok: true; summary: AutoMapSummary } | { ok: false; error: string }> {
  try {
    const summary = await autoMapUnmapped({ limit });
    revalidatePath("/admin/mappings");
    return { ok: true, summary };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Okänt fel" };
  }
}

/** Bekräftar ett förslag: skapar mappningen mot vald AliExpress-produkt. */
export async function confirmSuggestionAction(
  wixProductId: string,
  supplierProductId: string,
): Promise<MappingActionResult> {
  if (!wixProductId || !supplierProductId) {
    return { ok: false, error: "wixProductId och supplierProductId krävs" };
  }
  try {
    const res = await confirmSuggestion(wixProductId, supplierProductId);
    revalidatePath("/admin/mappings");
    return {
      ok: true,
      message: `Mappad ✓ (${res.pairedVariants} varianter${
        res.wixVariantCount !== res.aeVariantCount
          ? `, varning: Wix har ${res.wixVariantCount}, AE har ${res.aeVariantCount}`
          : ""
      })`,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Okänt fel" };
  }
}

/** Avfärdar ett förslag utan att mappa. */
export async function dismissSuggestionAction(wixProductId: string): Promise<MappingActionResult> {
  try {
    await dismissSuggestion(wixProductId);
    revalidatePath("/admin/mappings");
    return { ok: true, message: "Förslag borttaget" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Okänt fel" };
  }
}

/** Söker AliExpress-produkter. Returnerar resultat eller felmeddelande. */
export async function searchAliExpressAction(
  query: string,
): Promise<{ ok: true; results: AliExpressSearchResult[] } | { ok: false; error: string }> {
  if (!query.trim()) return { ok: false, error: "Tom query" };
  try {
    const results = await searchAliExpressByText(query);
    return { ok: true, results };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error
        ? `${err.message} — använd paste-URL-fältet istället`
        : "Sökfel",
    };
  }
}
