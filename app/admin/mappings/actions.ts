"use server";

import { revalidatePath } from "next/cache";
import { extractAliExpressProductId, getProduct, searchAliExpressByText, type AliExpressSearchResult } from "@/lib/aliexpress/client";
import { getV3ProductVariants } from "@/lib/wix/v3-products";
import { getStore } from "@/lib/store/factory";
import { pricingConfigFromEnv } from "@/lib/config";
import { pairVariantMappings } from "@/lib/import/pair-variant-mappings";
import { translateValue } from "@/lib/import/variant-translations";
import { isSyntheticMappingId, repairSyntheticVariantIds } from "@/lib/sync/mapping-repair";

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
    const { variants: variantMappings, matched, positional } = pairVariantMappings(
      wixVariants,
      aeVariants,
      pricing,
      supplierProductId,
    );

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

export interface RepairBatchResult {
  /** Mappningar som bearbetades i DENNA batch. */
  processed: number;
  /** Mappningar där minst ett id reparerades. */
  repaired: { wixProductId: string; rows: number }[];
  /** Mappningar med kvarvarande tvetydiga id:n (behöver manuell ommappning). */
  ambiguous: { wixProductId: string; ids: string[] }[];
  /** Mappningar vars AE-listning inte gick att hämta (död/felande källa). */
  failed: { wixProductId: string; reason: string }[];
  /** Trasiga mappningar kvar EFTER denna batch (exkl. skipIds). 0 = klart. */
  remaining: number;
}

/**
 * Kör synkens självläkning (samma konservativa #384-regler) PÅ BEGÄRAN över
 * mappningar med syntetiska variant-id — i stället för att vänta på
 * 4-timmarsrotationen. Batchad (max `batchSize` DS-uppslag per anrop) så
 * klienten loopar med progress i stället för att riskera funktions-timeout.
 *
 * `skipIds`: wixProductId som redan försökts i denna körning (tvetydiga/döda)
 * — annars skulle samma olösbara mappningar återkomma i varje batch och
 * loopen aldrig terminera.
 */
export async function repairSyntheticMappingsAction(
  skipIds: string[],
  batchSize = 8,
): Promise<RepairBatchResult> {
  const skip = new Set(skipIds);
  const store = getStore();
  const all = await store.listMappings();
  const broken = all.filter(
    (m) =>
      !skip.has(m.wixProductId) &&
      (m.variants ?? []).some((v) => isSyntheticMappingId(v.supplierVariantId)),
  );
  const batch = broken.slice(0, Math.max(1, Math.min(batchSize, 20)));

  const result: RepairBatchResult = {
    processed: batch.length,
    repaired: [],
    ambiguous: [],
    failed: [],
    remaining: 0,
  };
  for (const mapping of batch) {
    try {
      const ds = await getProduct(mapping.supplierProductId);
      const rep = repairSyntheticVariantIds(mapping.variants, ds.variants ?? [], translateValue);
      if (rep.repaired > 0) {
        mapping.variants = rep.variants;
        await store.saveMapping(mapping);
        result.repaired.push({ wixProductId: mapping.wixProductId, rows: rep.repaired });
        console.log(
          `[admin:repair] ${mapping.wixProductId}: ${rep.repaired} syntetiska variant-id ` +
            `ersatta på begäran${rep.ambiguous.length ? `; kvar olösta: ${rep.ambiguous.join(", ")}` : ""}.`,
        );
      }
      if (rep.ambiguous.length > 0) {
        result.ambiguous.push({ wixProductId: mapping.wixProductId, ids: rep.ambiguous });
      }
    } catch (err) {
      result.failed.push({
        wixProductId: mapping.wixProductId,
        reason: (err instanceof Error ? err.message : String(err)).slice(0, 140),
      });
    }
  }
  // Kvar = trasiga som varken låg i skip eller hann med i batchen. De som i
  // batchen blev HELT reparerade är inte längre trasiga; del-reparerade och
  // misslyckade läggs i klientens skip-lista via svaret ovan.
  result.remaining = broken.length - batch.length;
  revalidatePath("/admin/mappings");
  return result;
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
