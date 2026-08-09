"use server";

import { revalidatePath } from "next/cache";
import { extractAliExpressProductId, getProduct, searchAliExpressByText, type AliExpressSearchResult } from "@/lib/aliexpress/client";
import { getV3ProductVariants } from "@/lib/wix/v3-products";
import { getStore } from "@/lib/store/factory";
import { pricingConfigFromEnv } from "@/lib/config";
import { computePrice } from "@/lib/import/pricing";
import { translateValue } from "@/lib/import/variant-translations";
import { repairSyntheticVariantIds } from "@/lib/sync/mapping-repair";

export type MappingActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/**
 * Skapar mappning från Wix-produkt till AliExpress-URL/ID.
 *
 * VÄRDEBASERAD variantparning (destillatorn 2026-08-09: 4 Wix-varianter mot
 * 24 AE-SKU:er parades förr positionellt = blint på listordning → fel SKU:er
 * med riktiga id:n som självläkningen aldrig rör). Nu återanvänds synkens
 * matchningsmaskineri (repairSyntheticVariantIds): svenska Wix-choices matchas
 * mot översatta AE-skuProps per värdesignatur, samma-vara-i-flera-lager väljs
 * med EU-preferens. Positionell parning finns kvar ENBART som sista utväg för
 * omatchade rader — och räknas + varnas i svaret så det aldrig sker tyst.
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
    const aeVariants = aeProduct.variants;
    const pricing = pricingConfigFromEnv();

    // 1) Värdeparning: tomma id:n är per definition syntetiska → matcharen
    //    fyller i AE-skuId där signaturen (eller samma-vara-regeln) är entydig.
    const seed = wixVariants.map((wv) => ({ supplierVariantId: "", choices: wv.choices }));
    const rep = repairSyntheticVariantIds(seed, aeVariants, translateValue);
    const aeById = new Map(aeVariants.map((a) => [String(a.skuId), a]));
    const assigned = new Set(rep.variants.map((v) => v.supplierVariantId).filter(Boolean));
    // 2) Positionell RESERV för omatchade Wix-varianter: kvarvarande AE-SKU:er
    //    i listordning (gamla beteendet, nu bara för resten + högljutt räknad).
    const remaining = aeVariants.filter((a) => !assigned.has(String(a.skuId)));
    let positional = 0;

    const variantMappings = wixVariants.flatMap((wv, i) => {
      let ae = aeById.get(rep.variants[i].supplierVariantId);
      if (!ae) {
        ae = remaining.shift();
        if (!ae) return []; // fler Wix-varianter än AE-SKU:er → raden får ingen källa
        positional++;
      }
      const breakdown = computePrice(ae.price, pricing);
      return [{
        supplierVariantId: ae.skuId,
        sku: wv.sku || `${supplierProductId}-${i}`,
        wixVariantId: wv.id,
        choices: wv.choices,
        costUsd: ae.price,
        landedCostSek: breakdown.costSek,
        grossSek: breakdown.grossSek,
      }];
    });
    const matched = variantMappings.length - positional;

    const store = getStore();
    await store.saveMapping({ supplierProductId, wixProductId, variants: variantMappings });
    await store.appendAudit({
      at: new Date().toISOString(),
      kind: "mapping-created",
      ref: wixProductId,
      detail: `supplierProductId=${supplierProductId} variants=${variantMappings.length} `
        + `värdematchade=${matched} positionella=${positional}`,
    });
    revalidatePath("/admin/mappings");
    return {
      ok: true,
      message: `Mappad ✓ (${variantMappings.length} varianter: ${matched} värdematchade`
        + `${positional > 0 ? `, ${positional} positionsgissade — KONTROLLERA att rätt AE-variant valdes` : ""}`
        + `${wixVariants.length !== aeVariants.length
          ? `; Wix har ${wixVariants.length}, AE har ${aeVariants.length}`
          : ""})`,
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
