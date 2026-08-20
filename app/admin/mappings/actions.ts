"use server";

import { revalidatePath } from "next/cache";
import { classifyWarehouses, hasAnyEuWarehouse, uniqueShipFromCodes } from "@/lib/aliexpress/eu-countries";
import { extractAliExpressProductId, getProduct, searchAliExpressByText, type AliExpressSearchResult } from "@/lib/aliexpress/client";
import { getV3ProductVariants } from "@/lib/wix/v3-products";
import { getStore } from "@/lib/store/factory";
import { pricingConfigFromEnv } from "@/lib/config";
import { pairVariantMappings } from "@/lib/import/pair-variant-mappings";
import { translateValue } from "@/lib/import/variant-translations";
import { isSyntheticMappingId, repairSyntheticVariantIds } from "@/lib/sync/mapping-repair";
import { runDailySync, DEFAULT_MARGIN_FLOOR_PERCENT } from "@/lib/sync/aliexpress-sync";
import { getSyncStore } from "@/lib/sync/sync-log";

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
    // SLÅ IHOP med befintlig rad, ersätt den inte. Wix items/save är en
    // HELERSÄTTNING och JSON.stringify tappar undefined, så ett objekt byggt
    // från grunden raderar allt som inte står i literalen: draftStatus,
    // needsAiPolish, priceUnverified, seoTitle, createdAt, reviewsCheckedAt,
    // priority... En rad utan draftStatus matchar dessutom VARKEN kön eller
    // "senast importerade" i /admin/queue — produkten försvinner ur admin helt.
    //
    // Det är särskilt farligt sedan prisspärren (2026-08-20): dess badge säger
    // "saknar riktiga SKU-id:n", vilket är precis vad som får en att gå hit och
    // mappa om produkten — och därmed radera flaggan som höll den osynlig.
    // Lagerländerna kommer från den NYA listningen, inte den gamla mappningen.
    const skeppasFrån = uniqueShipFromCodes(
      (aeVariants ?? []).map((v: { shipFrom?: string }) => v.shipFrom).filter(Boolean),
    );
    const befintlig = await store.getMappingByWixProductId(wixProductId);
    await store.saveMapping({
      ...(befintlig ?? {}),
      supplierProductId,
      wixProductId,
      variants: variantMappings,
      // PER-AE-LISTNING: hör till den GAMLA källan och skulle ljuga efter en
      // ommappning. Sammanslagningen ovan räddar det som beskriver WIX-produkten
      // (draftStatus, seoTitle, createdAt, imageAnalysis, priority) — men allt
      // som beskriver LISTNINGEN måste räknas om eller nollas, annars länkar
      // "Källa" till den gamla varan, EU-flaggan visar fel lager och sålda
      // enheter skrivs på fel säljare i säljar-scoren.
      sourceUrl: `https://www.aliexpress.com/item/${supplierProductId}.html`,
      shipsFromCountries: skeppasFrån,
      hasEuWarehouse: hasAnyEuWarehouse(skeppasFrån),
      warehouseClass: classifyWarehouses(skeppasFrån),
      supplierId: undefined,
      supplierName: undefined,
      reviewsCheckedAt: undefined,
      unresolvedVariantValues: undefined,
      // En lyckad ommappning parar mot riktiga DS-SKU:er med riktiga per-SKU-
      // priser — alltså precis det prisspärren saknade. Utan den här raden
      // fanns ingen väg alls att rensa flaggan: den sätts bara vid import, och
      // ommappningen var enda manuella vägen innan sammanslagningen infördes.
      priceUnverified: undefined,
    });
    await store.appendAudit({
      at: new Date().toISOString(),
      kind: "mapping-created",
      ref: wixProductId,
      detail: `supplierProductId=${supplierProductId} variants=${variantMappings.length} `
        + `värdematchade=${matched} positionella=${positional}`,
    });

    // Synka OM produkten direkt (Leonards rapport 2026-08-13: övervakningskameran
    // låg kvar som "Slut hos leverantören sedan 27 juli" efter en lyckad
    // ommappning). Orsak: listingStatus/outOfStockSince/lagret är sparat per
    // WIX-PRODUKT, inte per AE-listning — ommappningen bytte källa men lämnade
    // tillståndet från den gamla. Raden ljög alltså, OCH lagret låg kvar nollat
    // (produkten gick inte att köpa) tills 4-timmarsrotationen råkade nå
    // produkten — den sorteras äldst-först, så en nyss kontrollerad produkt
    // hamnar sist i kön.
    //
    // Körs ALLTID, även när källan är oförändrad. Första versionen gjorde det
    // bara vid källbyte ("samma källa ⇒ tillståndet är redan korrekt"), men det
    // antagandet är fel precis när man behöver knappen som mest: tillståndet kan
    // vara inaktuellt för samma källa också (leverantören har fyllt på, eller
    // state skrevs före en tidigare ommappning). Utan detta finns ingen väg alls
    // att tvinga fram en färsk kontroll från admin — man får vänta på rotationen.
    // Kostnaden är ETT AE-anrop per manuellt klick.
    //
    // Vi kör synkens EGEN logik scopad till produkten (onlyIds) i stället för en
    // halv kopia här: då uppdateras lager, pris, tillstånd, restock-utskick och
    // OOS-klassning enligt exakt samma regler som cronen. opsAlertEmail utelämnas
    // medvetet — ett admin-klick ska inte trigga ops-larm.
    let syncNote = "";
    try {
      await runDailySync({
        pricing,
        dryRun: (process.env.SYNC_DRY_RUN ?? "true").toLowerCase() !== "false",
        maxApiCalls: 5,
        timeBudgetMs: 30_000,
        marginFloorPercent: DEFAULT_MARGIN_FLOOR_PERCENT,
        baseUrl: (
          process.env.NEXT_PUBLIC_APP_URL
          ?? process.env.VERCEL_URL
          ?? "https://fyndplats-cache-warmer.vercel.app"
        ).replace(/^https?:\/\//, "https://").replace(/\/$/, ""),
        onlyIds: new Set([wixProductId]),
      });
      // Läs det FÄRSKA tillståndet och rapportera saldot i klartext. Utan siffran
      // går det inte att skilja "synken har inte hunnit" från "leverantören har
      // faktiskt 0" — och det är exakt den tvetydigheten som gjorde kameran
      // omöjlig att felsöka. OBS: produktSIDAN på AliExpress kan se tillgänglig
      // ut medan dropshipping-API:t rapporterar 0 för de SKU:er vi kan beställa.
      const fresh = await getSyncStore().getState(wixProductId);
      if (!fresh) {
        syncNote = " — men inget synk-tillstånd skrevs, kontrollera synkloggen";
      } else if (fresh.listingStatus === "out_of_stock" || (fresh.currentStock ?? 0) <= 0) {
        syncNote = " — OBS: leverantörens API rapporterar 0 i lager för den här"
          + " listningen just nu, även om produktsidan ser tillgänglig ut";
      } else if (fresh.listingStatus === "removed") {
        syncNote = " — OBS: leverantören svarar att listningen är borttagen";
      } else {
        syncNote = ` — lager hämtat: ${fresh.currentStock} st hos leverantören`;
      }
    } catch {
      // Fail-open: mappningen är sparad och det är huvudjobbet. Rotationen
      // hämtar lagret inom 4 h ändå.
      syncNote = " — mappningen sparad, men lagret kunde inte hämtas nu (synken tar det inom 4 h)";
    }

    revalidatePath("/admin/mappings");
    return {
      ok: true,
      message: `Mappad ✓ (${variantMappings.length} varianter: ${matched} värdematchade`
        + `${positional > 0 ? `, ${positional} positionsgissade — KONTROLLERA att rätt AE-variant valdes` : ""}`
        + `${wixVariants.length !== aeVariants.length
          ? `; Wix har ${wixVariants.length}, AE har ${aeVariants.length}`
          : ""})${syncNote}`,
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
 *
 * `onlyIds`: LIVE-produkternas id från sidladdningen — utan filtret bearbetades
 * även orphan-mappningar (raderade produkter) som klienten varken räknar i
 * totalen eller kan namnge ("Lagar… 8/5", audit 2026-08-09). Att reparera en
 * mappning vars produkt är raderad är dessutom meningslöst.
 */
export async function repairSyntheticMappingsAction(
  skipIds: string[],
  onlyIds?: string[],
  batchSize = 8,
): Promise<RepairBatchResult> {
  const skip = new Set(skipIds);
  const only = onlyIds ? new Set(onlyIds) : null;
  const store = getStore();
  const all = await store.listMappings();
  const broken = all.filter(
    (m) =>
      !skip.has(m.wixProductId) &&
      (only ? only.has(m.wixProductId) : true) &&
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
      if (!ds.variants?.length) {
        // Degraderat DS-svar (0 varianter) → repair blir en tyst no-op som
        // varken hamnar i repaired/ambiguous → utan denna vakt återkom samma
        // mappning i varje batch tills guard-taket (audit 2026-08-09).
        result.failed.push({
          wixProductId: mapping.wixProductId,
          reason: "AliExpress gav 0 varianter (degraderat svar) — försök igen senare eller byt källa.",
        });
        continue;
      }
      const rep = repairSyntheticVariantIds(mapping.variants, ds.variants, translateValue);
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
