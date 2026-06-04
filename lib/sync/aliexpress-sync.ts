// Daglig AliExpress-sync — kärnlogik.
//
// Designprinciper:
//   - Ren beslutsfunktion (decideSyncOutcome) som tar tidigare snapshot +
//     AliExpress-data + pricing-config → planerad åtgärd. Inga sidoeffekter,
//     fullt testbar utan att mocka Wix eller AliExpress.
//   - Orchestrator (runDailySync) gör batchningen: chunkar API-anrop,
//     respekterar rate-limit (default 100/körning), gör sidoeffekterna
//     (Wix update, alert-skrivning, log-rad) och bygger ihop sammanfattningen
//     som email-helpern sedan kan rendera.
//   - SYNC_DRY_RUN=true: kör allt utom Wix-skrivningar. Loggas som
//     action_taken="dry_run" så att Leonard kan diffa nästa-dags-resultat.
//
// Skiljer sig från befintliga /api/aliexpress/sync-all (som gör lager + pris-
// adjust direkt på alla produkter): denna lägger fokus på listing-status,
// content-drift och alert-handoff till Leonard. Båda kan samexistera.

import { computePrice } from "../import/pricing";
import type { PricingConfig } from "../import/types";
import { getProduct as getAliExpressProduct } from "../aliexpress/client";
import {
  getProduct as getWixProduct,
  queryInventoryItemsByProductId,
  setProductVisibility,
  bulkUpdateInventoryQuantities,
  type WixInventoryItem,
} from "../wix/client";
import { getStore } from "../store/factory";
import type { ProductMappingRecord } from "../store/index";
import {
  getSyncStore,
  hashImageList,
  hashString,
  type AlertSeverity,
  type AlertType,
  type ListingStatus,
  type SyncAction,
  type SyncAlert,
  type SyncLogEntry,
  type SyncStateEntry,
} from "./sync-log";
import { fetchOrders, aggregateOrders, isoDaysAgo } from "../wix/orders";
import { findAlternativeSuppliers, isAlternativesEnabled } from "../aliexpress/alternatives";
import { getRestockStore } from "../restock/store";
import { getRestockLogStore } from "../restock/log";
import {
  buildOosAlertEmail,
  buildRestockNotificationEmail,
  sendEmail,
} from "../email/resend";
import { applyBestsellerPriority, priorityRank, RECENT_PURCHASE_REASON } from "./bestsellers";

export const DEFAULT_MARGIN_FLOOR_PERCENT = 20;
export const DEFAULT_MAX_API_CALLS_PER_RUN = 100;

export interface SyncInputs {
  /** Vad vi sparade förra gången vi körde syncen (null = första körningen). */
  prevState: SyncStateEntry | null;
  /** Nuvarande svar från AliExpress eller null om listningen inte längre finns. */
  aliExpress: {
    title: string;
    images: string[];
    /** Lägsta tillgängliga inköpspris i USD bland aktiva varianter (eller 0 om alla slut). */
    minCostUsd: number;
    /** Summan av tillgängligt lager över alla varianter. */
    totalStock: number;
    /** True om hela produkten är borta/banned (404 eller error_code för "not found"). */
    listingRemoved: boolean;
  } | null;
  /** Wix-produktens nuvarande synlighet. */
  wixVisible: boolean;
  /** Wix-produktens nuvarande primärpris i SEK (sätts via mapping.variants[0].grossSek). */
  currentPriceSek: number;
  /** Hash av nuvarande titel och bild-set. */
  newTitleHash: string;
  newImageHash: string;
  /** Prissättningskonfig (för marginal-/rekommendationsräkning). */
  pricing: PricingConfig;
  /** Tröskel under vilken en prishöjning ska flaggas (marginal i %). */
  marginFloorPercent: number;
}

export interface SyncDecision {
  listingStatus: ListingStatus;
  actionTaken: SyncAction;
  /** Sätts till true om Wix-produkten ska göras osynlig. */
  shouldHide: boolean;
  /** Sätts till true om Wix-produkten ska göras synlig igen (efter återställning). */
  shouldRestore: boolean;
  /** Lagersaldo att skriva till Wix (null = ändra inte). */
  inventoryTarget: number | null;
  /** Eventuell alert som ska upserts. */
  alert: Omit<SyncAlert, "id" | "wixProductId" | "aliexpressId" | "createdAt"> | null;
  /** Mänskligt läsbar notering till sync-loggen. */
  notes: string;
  /** Nuvarande landade kostnad i SEK (för logg + state). */
  newCostSek: number | null;
  /**
   * True om produkten just flippade TILL slut-i-lager (prev var inte oos).
   * Triggar real-tids-larm + alternativ-sökning (Feature 2 + 3). Sätts INTE
   * på första observationen (prevState=null) — vi larmar bara på en faktisk
   * övergång, inte på produkter som redan var slut när vi först såg dem.
   */
  justWentOos: boolean;
  /**
   * True om produkten just kom tillbaka i lager (prev var oos, nu aktiv).
   * Triggar restock-mejl till bevakare (Feature 1).
   */
  justRestocked: boolean;
}

/**
 * Ren beslutsfunktion. Givet snapshot + AliExpress-data, returnera planerade
 * sidoeffekter. Sidoeffekterna utförs i runDailySync.
 */
export function decideSyncOutcome(inputs: SyncInputs): SyncDecision {
  const { prevState, aliExpress, currentPriceSek, pricing, marginFloorPercent } = inputs;

  // 1) Listningen är borta — dölj produkten i Wix.
  if (!aliExpress || aliExpress.listingRemoved) {
    return {
      listingStatus: "removed",
      actionTaken: inputs.wixVisible ? "hidden" : "none",
      shouldHide: inputs.wixVisible,
      shouldRestore: false,
      inventoryTarget: null,
      alert: null,
      newCostSek: null,
      notes: "AliExpress-listning borttagen — produkten döljs i butiken.",
      justWentOos: false,
      justRestocked: false,
    };
  }

  const newCostSek = round2(aliExpress.minCostUsd * pricing.usdToSek);

  // 2) Slut i lager — markera oos men dölj inte (hybrid: produktsidan lever
  // kvar, listningarna filtreras bort på headless-sajten via inventory=0).
  if (aliExpress.totalStock <= 0) {
    const wasOos = prevState?.listingStatus === "out_of_stock";
    return {
      listingStatus: "out_of_stock",
      actionTaken: "marked_oos",
      shouldHide: false,
      shouldRestore: false,
      inventoryTarget: 0,
      alert: null,
      newCostSek,
      notes: "Slut i lager hos AliExpress — Wix-lager sätts till 0.",
      // Larma bara på en faktisk övergång (prev fanns och var inte redan oos).
      justWentOos: Boolean(prevState) && !wasOos,
      justRestocked: false,
    };
  }

  // 3) Listningen är aktiv. Behandla detta som "active" oavsett prev.
  const decision: SyncDecision = {
    listingStatus: "active",
    actionTaken: "none",
    shouldHide: false,
    // Om föregående status var removed och vi nu ser aktiv listning → restore
    // (men ENDAST om Wix-produkten själv är synlig så vi inte överröstar en
    // manuell unpublish från Leonard).
    shouldRestore: prevState?.listingStatus === "removed" && inputs.wixVisible,
    inventoryTarget: aliExpress.totalStock,
    alert: null,
    newCostSek,
    notes: "",
    justWentOos: false,
    // Tillbaka i lager efter att ha varit slut → trigga restock-mejl.
    justRestocked: prevState?.listingStatus === "out_of_stock",
  };

  // 4) Prishöjning som hotar marginalen? → flagga.
  if (prevState?.currentCostUsd && prevState.currentCostUsd > 0) {
    const costUp = aliExpress.minCostUsd > prevState.currentCostUsd;
    if (costUp) {
      const projectedMargin = projectedMarginAtPrice(
        currentPriceSek,
        newCostSek,
        pricing.vatRatePercent,
      );
      if (projectedMargin < marginFloorPercent) {
        const recommended = computePrice(aliExpress.minCostUsd, pricing).grossSek;
        const severity: AlertSeverity =
          projectedMargin < 0 ? "high" : projectedMargin < marginFloorPercent / 2 ? "medium" : "low";
        decision.actionTaken = "flagged_price";
        decision.notes = `Prishöjning: marginal ${projectedMargin.toFixed(1)}% < golvet ${marginFloorPercent}%`;
        decision.alert = {
          alertType: "price_increase",
          severity,
          status: "open",
          currentPriceSek,
          prevCostUsd: prevState.currentCostUsd,
          newCostUsd: aliExpress.minCostUsd,
          recommendedPriceSek: recommended,
          projectedMarginPct: round2(projectedMargin),
        };
      }
    }
  }

  // 5) Innehållsändring (titel eller bilder)? → flagga (om vi inte redan
  // flaggat pris — pris-alert vinner eftersom den är mer akut).
  if (decision.alert === null && prevState) {
    const titleChanged = Boolean(prevState.titleHash) && prevState.titleHash !== inputs.newTitleHash;
    const imageChanged = Boolean(prevState.imageHash) && prevState.imageHash !== inputs.newImageHash;
    if (titleChanged || imageChanged) {
      decision.actionTaken = "flagged_content";
      decision.notes = "Innehåll ändrat hos leverantör.";
      decision.alert = {
        alertType: "content_change",
        severity: "low",
        status: "open",
        titleChanged,
        imageChanged,
        newTitle: titleChanged ? aliExpress.title : undefined,
      };
    }
  }

  // 6) Tillbaka i lager efter att ha varit oos? → ingen alert behövs, bara
  // notera i loggen. shouldRestore är false (vi rörde inte visibility) men
  // inventoryTarget är satt så lagret återställs.
  if (prevState?.listingStatus === "out_of_stock" && aliExpress.totalStock > 0) {
    decision.actionTaken = decision.actionTaken === "none" ? "restored" : decision.actionTaken;
    if (!decision.notes) decision.notes = "Tillbaka i lager hos AliExpress.";
  }

  return decision;
}

/**
 * Marginal vid givet salespris (inkl. moms) och landad kostnad.
 * Försimplad: ignorerar Klarna-fee i alert-räknaren (lägger tröskeln lite konservativt).
 */
export function projectedMarginAtPrice(
  grossSek: number,
  landedCostSek: number,
  vatRatePercent: number,
): number {
  if (grossSek <= 0) return 0;
  const netRevenue = grossSek / (1 + vatRatePercent / 100);
  if (netRevenue <= 0) return 0;
  return ((netRevenue - landedCostSek) / netRevenue) * 100;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// =====================================================================
// Orkestreringen — det här är vad cron-rutten anropar.
// =====================================================================

export interface RunDailySyncOptions {
  pricing: PricingConfig;
  /** Default true (säker). Sätt SYNC_DRY_RUN=false i Vercel för live-läge. */
  dryRun: boolean;
  /** Maxantal AliExpress-API-anrop per körning (rate-limit-skydd). */
  maxApiCalls: number;
  /** Mappnings-id:er att hoppa över (för åter-körning av en partiell körning). */
  skipIds?: Set<string>;
  /** Marginal-golv för pris-alert. */
  marginFloorPercent: number;
  /**
   * Bas-URL för cache-warmer-appen (admin-import-länkar i OOS-mejlet).
   * T.ex. https://fyndplats-cache-warmer.vercel.app.
   */
  baseUrl: string;
  /** Mottagare för real-tids-OOS-larm (Feature 2). Saknas = inga larm skickas. */
  opsAlertEmail?: string;
  /**
   * Vägg-klocka-budget i ms. Loopen stannar SNYGGT innan denna nås (resten
   * räknas som skipped och plockas av nästa körning), så att cronens hårda
   * maxDuration (300s) aldrig dödar funktionen mitt i — då skulle rapporten +
   * mejlet utebli. Gör det säkert att sätta ett högt SYNC_MAX_API_CALLS (t.ex.
   * 1000): tidsbudgeten blir den verkliga gränsen per körning. Default 270s.
   */
  timeBudgetMs?: number;
}

export interface SyncSummary {
  /** Antal mappade produkter totalt. */
  total: number;
  /** Antal som faktiskt synkades i denna körning (efter rate-limit). */
  checked: number;
  /** Hoppade pga rate-limit eller skipIds. */
  skipped: number;
  /** Antal som blev hidden pga listning borttagen. */
  hidden: number;
  /** Antal som markerades som slut-i-lager. */
  markedOos: number;
  /** Antal som återställdes från oos. */
  restored: number;
  /** Antal pris-alerts som skapades/uppdaterades. */
  flaggedPrice: number;
  /** Antal content-change-alerts. */
  flaggedContent: number;
  /** Antal real-tids-"slut hos leverantör"-mejl som skickades (Feature 2). */
  oosRealtimeAlerts: number;
  /** Antal restock-mejl som skickades till väntande prenumeranter (Feature 1). */
  restockNotificationsSent: number;
  /**
   * Produkter som flippade till slut-i-lager denna körning (för daglig
   * aggregering i sammanfattnings-mejlet). En post per ny OOS-händelse.
   */
  oosEvents: { productName: string; aliexpressId: string; sales30d: number }[];
  /** Antal som inte hade någon ändring att göra. */
  unchanged: number;
  /** Per-produkt-fel som inte avbröt körningen. */
  errors: { productId: string; aliexpressId: string; error: string }[];
  /** True om körningen var dry-run. */
  dryRun: boolean;
  /** Körningens början/slut i ISO. */
  startedAt: string;
  finishedAt: string;
}

export async function runDailySync(opts: RunDailySyncOptions): Promise<SyncSummary> {
  const startedAt = new Date().toISOString();
  const store = getStore();
  const syncStore = getSyncStore();
  const mappings = await store.listMappings();

  const summary: SyncSummary = {
    total: mappings.length,
    checked: 0,
    skipped: 0,
    hidden: 0,
    markedOos: 0,
    restored: 0,
    flaggedPrice: 0,
    flaggedContent: 0,
    oosRealtimeAlerts: 0,
    restockNotificationsSent: 0,
    oosEvents: [],
    unchanged: 0,
    errors: [],
    dryRun: opts.dryRun,
    startedAt,
    finishedAt: startedAt,
  };

  // --- Senaste 30 dagars försäljning (en gång per körning) ----------------
  // Används både för bestseller-prioritet (Feature 4) och för "X sålda"-raden
  // i real-tids-OOS-mejlet (Feature 2). Best-effort: failar order-API:t kör vi
  // vidare med tomt data (mejlet visar då 0 sålda, prioriteringen rör inget).
  let salesByProduct: Record<string, number> = {};
  try {
    const orders = await fetchOrders(isoDaysAgo(30));
    const agg = aggregateOrders(orders);
    salesByProduct = Object.fromEntries(
      Object.entries(agg.byProductId).map(([id, v]) => [id, v.units]),
    );
  } catch (err) {
    console.warn(
      `[sync] kunde inte hämta 30-dagars orderdata: ${err instanceof Error ? err.message.slice(0, 200) : String(err)}`,
    );
  }

  // --- Bestseller-prioritet (Feature 4) -----------------------------------
  // Sätter priority=high på top-50 sålda. Muterar in-memory mappings så
  // sorteringen nedan ser ny prioritet; skriver till store endast om !dryRun.
  try {
    await applyBestsellerPriority({ store, mappings, salesByProduct, dryRun: opts.dryRun });
  } catch (err) {
    console.warn(
      `[sync] bestseller-prioritet misslyckades: ${err instanceof Error ? err.message.slice(0, 200) : String(err)}`,
    );
  }

  // Sortera: priority DESC (high först), sedan äldsta lastCheckedAt först — så
  // bestsellers/köp-triggade produkter alltid hinner med innan rate-limit slår
  // till, medan resten roterar runt över flera dagar.
  const states = await Promise.all(
    mappings.map((m) => syncStore.getState(m.wixProductId).then((s) => ({ mapping: m, state: s }))),
  );
  states.sort((a, b) => {
    const pr = priorityRank(a.mapping.priority) - priorityRank(b.mapping.priority);
    if (pr !== 0) return pr;
    const aTime = a.state?.lastCheckedAt ?? "0";
    const bTime = b.state?.lastCheckedAt ?? "0";
    return aTime.localeCompare(bTime);
  });

  let apiCallsUsed = 0;
  // Vägg-klocka-budget: stanna innan cronens 300s-deadline dödar funktionen.
  // Kollas FÖRE varje produkt → avbryter aldrig en pågående lager-skrivning.
  const loopStart = Date.now();
  const timeBudgetMs = opts.timeBudgetMs ?? 270_000;

  let processedIdx = 0;
  for (const { mapping, state } of states) {
    if (Date.now() - loopStart > timeBudgetMs) {
      // Resten hinns inte denna körning — räknas som skipped, tas av nästa
      // cron (de har äldst lastCheckedAt → hamnar först i sorteringen).
      summary.skipped += states.length - processedIdx;
      break;
    }
    processedIdx++;
    if (apiCallsUsed >= opts.maxApiCalls) {
      summary.skipped++;
      continue;
    }
    if (opts.skipIds?.has(mapping.wixProductId)) {
      summary.skipped++;
      continue;
    }
    if (!mapping.supplierProductId) {
      summary.skipped++;
      continue;
    }
    // Bara aktivt publicerade produkter — pending_review-kön granskar Leonard manuellt.
    if (mapping.draftStatus === "rejected") {
      summary.skipped++;
      continue;
    }

    try {
      apiCallsUsed++;
      const result = await syncOneProduct({
        mapping,
        state,
        pricing: opts.pricing,
        dryRun: opts.dryRun,
        marginFloorPercent: opts.marginFloorPercent,
        sales30d: salesByProduct[mapping.wixProductId] ?? 0,
        baseUrl: opts.baseUrl,
        opsAlertEmail: opts.opsAlertEmail,
      });
      summary.checked++;
      switch (result.actionTaken) {
        case "hidden": summary.hidden++; break;
        case "marked_oos": summary.markedOos++; break;
        case "restored": summary.restored++; break;
        case "flagged_price": summary.flaggedPrice++; break;
        case "flagged_content": summary.flaggedContent++; break;
        case "none":
        case "dry_run":
          summary.unchanged++; break;
      }
      if (result.oosAlertSent) summary.oosRealtimeAlerts++;
      if (result.oosEvent) summary.oosEvents.push(result.oosEvent);
      if (result.restockSent) summary.restockNotificationsSent += result.restockSent;
    } catch (err) {
      summary.errors.push({
        productId: mapping.wixProductId,
        aliexpressId: mapping.supplierProductId,
        error: err instanceof Error ? err.message.slice(0, 300) : String(err),
      });
    }
  }

  summary.finishedAt = new Date().toISOString();
  return summary;
}

interface SyncOneOpts {
  mapping: ProductMappingRecord;
  state: SyncStateEntry | null;
  pricing: PricingConfig;
  dryRun: boolean;
  marginFloorPercent: number;
  /** Sålda enheter senaste 30 dagar (för OOS-mejlet). */
  sales30d: number;
  /** Bas-URL för admin-import-länkar. */
  baseUrl: string;
  /** Mottagare för real-tids-OOS-larm. Saknas = larma inte. */
  opsAlertEmail?: string;
}

interface SyncOneResult {
  actionTaken: SyncAction;
  /** True om ett real-tids-OOS-mejl komponerades/skickades denna körning. */
  oosAlertSent?: boolean;
  /** Sätts när produkten flippade till OOS (för daglig aggregering). */
  oosEvent?: { productName: string; aliexpressId: string; sales30d: number };
  /** Antal restock-mejl som skickades till bevakare. */
  restockSent?: number;
}

async function syncOneProduct(opts: SyncOneOpts): Promise<SyncOneResult> {
  const { mapping, state, pricing, dryRun, marginFloorPercent } = opts;
  const checkedAt = new Date().toISOString();

  // 1) Hämta AliExpress-data. Två anrop räcker (product.get inkluderar redan
  // varianterna), men vi separerar för tydlighet och felisolering.
  let aliExpress: SyncInputs["aliExpress"] = null;
  // Per-variant-saldo från AliExpress, keyat på skuId (= mapping.supplierVariantId).
  // Används av applyInventoryTarget för att spegla VERKLIGT lager per variant i Wix
  // istället för att jämnt fördela aggregatet (bug 2026-06-01).
  let aeStockBySupplierId: Record<string, number> = {};
  try {
    const product = await getAliExpressProduct(mapping.supplierProductId);
    // Skydd mot AE-glitch: en LYCKAD men TOM variant-respons (rate-limit/cache)
    // är oskiljbar från en riktig produkt och skulle annars ge totalStock=0 →
    // felaktig OOS-markering som tystar en levande produkt. Kasta i stället →
    // fångas nedan, matchar inte "borttagen"-mönstren, re-throwas → loopen
    // loggar ett fel och tar INGEN åtgärd (ingen OOS, ingen döljning). En
    // verkligt slutsåld produkt har sina varianter kvar (stock 0) → träffas ej.
    if (!Array.isArray(product.variants) || product.variants.length === 0) {
      throw new Error(
        `tom variant-respons från AliExpress (möjlig glitch) — hoppar över pid=${mapping.supplierProductId}`,
      );
    }
    const minCostUsd = product.variants
      .filter((v) => (v.stock ?? 0) > 0 && v.price > 0)
      .reduce((min, v) => (min === 0 ? v.price : Math.min(min, v.price)), 0);
    const totalStock = product.variants.reduce((s, v) => s + (v.stock ?? 0), 0);
    aeStockBySupplierId = Object.fromEntries(
      product.variants
        .filter((v) => v.skuId)
        .map((v) => [String(v.skuId), Math.max(0, Math.trunc(v.stock ?? 0))]),
    );
    aliExpress = {
      title: product.title,
      images: product.images,
      minCostUsd: minCostUsd > 0 ? minCostUsd : product.variants[0]?.price ?? 0,
      totalStock,
      listingRemoved: false,
    };
  } catch (err) {
    // Klassisk "produkt finns inte"-respons från AliExpress: error_response
    // med code som t.ex. 7001020 eller text som innehåller "not found" /
    // "product offline". Vi tolkar dem som listing_removed. Andra fel — re-throwa.
    const msg = err instanceof Error ? err.message.toLowerCase() : "";
    if (
      msg.includes("not found")
      || msg.includes("offline")
      || msg.includes("not exist")
      || msg.includes("invalid product")
      || /code\s*7001\d{3}/.test(msg)
    ) {
      aliExpress = {
        title: "",
        images: [],
        minCostUsd: 0,
        totalStock: 0,
        listingRemoved: true,
      };
    } else {
      throw err;
    }
  }

  // 2) Hämta Wix-snapshot (för visibility + nuvarande pris).
  const wixSnapshot = await getWixProduct(mapping.wixProductId);
  if (!wixSnapshot) {
    // Wix-produkten är redan borttagen → bara logga och rensa state.
    await getSyncStore().appendLog({
      id: `${mapping.wixProductId}-${checkedAt}`,
      productId: mapping.wixProductId,
      aliexpressId: mapping.supplierProductId,
      checkedAt,
      prevCostSek: state?.currentCostSek ?? null,
      newCostSek: null,
      prevStock: state?.currentStock ?? null,
      newStock: null,
      listingStatus: "unknown",
      actionTaken: "none",
      notes: "Wix-produkten hittades inte — hoppar över.",
    });
    return { actionTaken: "none" };
  }

  const currentPriceSek = Number.parseFloat(
    wixSnapshot.variants[0]?.actualPriceAmount ?? "0",
  );

  const newTitleHash = aliExpress ? await hashString(aliExpress.title) : "";
  const newImageHash = aliExpress ? await hashImageList(aliExpress.images) : "";

  // 3) Beslut.
  const decision = decideSyncOutcome({
    prevState: state,
    aliExpress,
    wixVisible: wixSnapshot.visible,
    currentPriceSek,
    newTitleHash,
    newImageHash,
    pricing,
    marginFloorPercent,
  });

  // 4) Sidoeffekter — Wix-skrivningar.
  if (!dryRun) {
    if (decision.shouldHide) {
      await setProductVisibility(mapping.wixProductId, wixSnapshot.revision, false);
    } else if (decision.shouldRestore) {
      // Bara om vi inte redan döljer pga annan policy.
      await setProductVisibility(mapping.wixProductId, wixSnapshot.revision, true);
    }
    if (decision.inventoryTarget !== null) {
      await applyInventoryTarget(mapping, decision.inventoryTarget, aeStockBySupplierId);
    }
  }

  // 5) Sidoeffekter — alerts.
  const syncStore = getSyncStore();
  if (decision.alert) {
    const id = `${mapping.wixProductId}-${decision.alert.alertType}`;
    await syncStore.upsertAlert({
      id,
      wixProductId: mapping.wixProductId,
      aliexpressId: mapping.supplierProductId,
      createdAt: checkedAt,
      productName: mapping.seoTitle ?? wixSnapshot.name,
      imageUrl: mapping.imageAnalysis?.find((i) => i.verdict === "ok")?.url,
      ...decision.alert,
    });
  } else {
    // Auto-stäng ev. tidigare prishöjnings-alert om priset nu är OK,
    // resp. content-alert om det inte längre detekteras.
    await syncStore.closeAlertIfOpen(`${mapping.wixProductId}-price_increase`);
    await syncStore.closeAlertIfOpen(`${mapping.wixProductId}-content_change`);
  }

  // 5.5) Real-tids-OOS-larm + restock-mejl (Features 1-3).
  //
  // VIKTIGT (dry-run-semantik): real-tids-larm, restock-mejl, alternativ-
  // sökning OCH de tillstånds-fält som övergångs-detekteringen vilar på
  // (listingStatus, lastOosAlertAt) får ENDAST muteras i live-läge. Annars
  // "konsumerar" en dry-run-körning övergången (active→oos / oos→active) genom
  // att persistera den, så att justWentOos/justRestocked blir false när
  // SYNC_DRY_RUN sedan slås av — och de riktiga mejlen aldrig skickas.
  // Vi REGISTRERAR däremot oosEvent även i dry-run (det är en detektering, inte
  // ett utskick) så att sammanfattnings-rapporten visar vad som skulle hänt.
  let oosAlertSent = false;
  let oosEvent: SyncOneResult["oosEvent"];
  let restockSent = 0;
  let lastOosAlertAt = state?.lastOosAlertAt ?? null;

  const productName =
    mapping.seoTitle || wixSnapshot.name || aliExpress?.title || mapping.supplierProductId;
  const productImage =
    mapping.imageAnalysis?.find((i) => i.verdict === "ok")?.url ?? aliExpress?.images?.[0];

  // Registrera övergången till slut-i-lager för dagsrapporten (även i dry-run).
  if (decision.justWentOos) {
    oosEvent = {
      productName,
      aliexpressId: mapping.supplierProductId,
      sales30d: opts.sales30d,
    };
  }

  // Feature 2 + 3: skicka real-tids-larm — ENDAST live (kostar AE-sök + ev.
  // Haiku + mejl). Debounce: larma inte igen inom 24h.
  if (decision.justWentOos && opts.opsAlertEmail && !dryRun) {
    const within24h = lastOosAlertAt
      ? Date.parse(checkedAt) - Date.parse(lastOosAlertAt) < 24 * 3600 * 1000
      : false;
    if (!within24h) {
      try {
        const aliexpressUrl = `https://www.aliexpress.com/item/${mapping.supplierProductId}.html`;
        const alternatives = isAlternativesEnabled()
          ? await findAlternativeSuppliers({
              aliexpressId: mapping.supplierProductId,
              productName,
              baseUrl: opts.baseUrl,
              usdToSek: pricing.usdToSek,
              // Senast kända inköpspris (produkten är slut nu → minCostUsd ofta 0).
              originalCostUsd: state?.currentCostUsd ?? aliExpress?.minCostUsd ?? undefined,
            }).catch(() => [])
          : [];
        const alertsUrl = `${opts.baseUrl.replace(/\/$/, "")}/admin/sync-alerts`;
        const email = buildOosAlertEmail({
          productName,
          imageUrl: productImage,
          aliexpressUrl,
          sales30d: opts.sales30d,
          alternatives,
          alertsUrl,
        });
        await sendEmail({
          to: opts.opsAlertEmail,
          subject: email.subject,
          bodyHtml: email.html,
          bodyText: email.text,
        });
        lastOosAlertAt = checkedAt; // debounce-stämpel — bara på verkligt utskick
        oosAlertSent = true;
      } catch (err) {
        // Mejl/sökning ska aldrig fälla själva sync-checken.
        console.warn(
          `[sync] OOS-larm misslyckades för ${mapping.wixProductId}: ${err instanceof Error ? err.message.slice(0, 200) : String(err)}`,
        );
      }
    }
  }

  // Feature 1 + 8: produkten kom tillbaka i lager → mejla bevakarna och logga
  // restock-händelsen i FyndplatsRestockLog (restock-tidslinje för admin). Endast live.
  if (decision.justRestocked && !dryRun) {
    try {
      const restockStore = getRestockStore();
      const subs = await restockStore.listPendingForProduct(mapping.wixProductId);
      if (subs.length > 0) {
        const productUrl = productPageUrl(wixSnapshot.slug);
        const email = buildRestockNotificationEmail({
          productName,
          productUrl,
          imageUrl: productImage,
        });
        const notifiedIds: string[] = [];
        for (const sub of subs) {
          await sendEmail({
            to: sub.email,
            subject: email.subject,
            bodyHtml: email.html,
            bodyText: email.text,
          });
          notifiedIds.push(sub.id);
        }
        await restockStore.markNotified(notifiedIds);
        restockSent = notifiedIds.length;
      }
      // Logga restock-händelsen oavsett om någon bevakare fanns (= full tidslinje).
      // Best-effort: en misslyckad loggning får inte fälla syncen.
      try {
        await getRestockLogStore().log({
          productId: mapping.wixProductId,
          productName,
          restockedAt: checkedAt,
          subscribersNotified: restockSent,
          newStock: aliExpress?.totalStock ?? null,
        });
      } catch (logErr) {
        console.warn(
          `[sync] restock-logg misslyckades för ${mapping.wixProductId}: ${logErr instanceof Error ? logErr.message.slice(0, 200) : String(logErr)}`,
        );
      }
    } catch (err) {
      console.warn(
        `[sync] restock-mejl misslyckades för ${mapping.wixProductId}: ${err instanceof Error ? err.message.slice(0, 200) : String(err)}`,
      );
    }
  }

  // Feature 8: spåra NÄR produkten gick slut (outOfStockSince). Sätts vid första
  // observationen som slut och behålls tills den kommer tillbaka (då nollas den).
  // "removed" rör inte fältet. Headless visar "Slutsåld sedan X" från detta.
  let outOfStockSince = state?.outOfStockSince ?? null;
  if (decision.listingStatus === "out_of_stock") {
    if (!outOfStockSince) outOfStockSince = checkedAt;
  } else if (decision.listingStatus === "active") {
    outOfStockSince = null;
  }

  // 6) Sidoeffekter — state + log.
  // I dry-run fryser vi listingStatus + lastOosAlertAt + outOfStockSince till
  // föregående (riktiga) värden så att en dry-run inte konsumerar en övergång,
  // stämplar debouncen eller sätter en falsk slut-sedan-tidpunkt. Övriga fält
  // (kostnad/lager/hashar) får uppdateras för diff-syfte.
  const newState: SyncStateEntry = {
    wixProductId: mapping.wixProductId,
    aliexpressId: mapping.supplierProductId,
    currentCostSek: decision.newCostSek,
    currentCostUsd: aliExpress?.minCostUsd ?? null,
    currentStock: aliExpress?.totalStock ?? null,
    listingStatus: dryRun ? (state?.listingStatus ?? decision.listingStatus) : decision.listingStatus,
    titleHash: newTitleHash || null,
    imageHash: newImageHash || null,
    lastCheckedAt: checkedAt,
    lastOosAlertAt: dryRun ? (state?.lastOosAlertAt ?? null) : lastOosAlertAt,
    outOfStockSince: dryRun ? (state?.outOfStockSince ?? null) : outOfStockSince,
  };
  await syncStore.saveState(newState);

  const logEntry: SyncLogEntry = {
    id: `${mapping.wixProductId}-${checkedAt}`,
    productId: mapping.wixProductId,
    aliexpressId: mapping.supplierProductId,
    checkedAt,
    prevCostSek: state?.currentCostSek ?? null,
    newCostSek: decision.newCostSek,
    prevStock: state?.currentStock ?? null,
    newStock: aliExpress?.totalStock ?? null,
    listingStatus: decision.listingStatus,
    actionTaken: dryRun && decision.actionTaken !== "none" ? "dry_run" : decision.actionTaken,
    notes: decision.notes || undefined,
  };
  await syncStore.appendLog(logEntry);

  // Feature 4: köp-triggad engångsprioritet konsumeras efter check → tillbaka
  // till normal så produkten inte fastnar överst i kön för alltid.
  if (
    !dryRun
    && mapping.priority === "high"
    && mapping.priorityReason === RECENT_PURCHASE_REASON
  ) {
    try {
      await getStore().saveMapping({
        ...mapping,
        priority: "normal",
        priorityReason: undefined,
        priorityUpdatedAt: checkedAt,
      });
    } catch {
      // best-effort
    }
  }

  return { actionTaken: logEntry.actionTaken, oosAlertSent, oosEvent, restockSent };
}

/**
 * Bygger produktsidans publika URL för restock-mejl. Slug kommer från Wix-
 * produkten; bas-URL från STORE_PRODUCT_BASE_URL (default fyndplats.se/produkt).
 */
function productPageUrl(slug?: string): string {
  const base = (process.env.STORE_PRODUCT_BASE_URL ?? "https://fyndplats.se/produkt").replace(/\/$/, "");
  if (slug) return `${base}/${slug}`;
  return process.env.NEXT_PUBLIC_STORE_URL ?? "https://fyndplats.se";
}

/**
 * Skriver lager-target till varianterna.
 *
 * Bug 2026-06-01: tidigare fördelades aggregatet JÄMNT över alla varianter
 * (target / n), så en produkt med 100 i lager på "Röd" och 0 på "Blå" fick 50/50
 * i Wix — fel verklighet. När vi har AliExpress per-variant-saldo (stockBySupplierId,
 * keyat på skuId) sätter vi nu varje Wix-variants saldo individuellt genom att
 * matcha Wix variantId → mapping.supplierVariantId → AE-saldo. Saknas per-variant-
 * data faller vi tillbaka på den gamla jämna fördelningen. target===0 (slut i lager)
 * nollar alltid hela linjen.
 */
async function applyInventoryTarget(
  mapping: ProductMappingRecord,
  target: number,
  stockBySupplierId: Record<string, number> = {},
): Promise<void> {
  const items: WixInventoryItem[] = await queryInventoryItemsByProductId(mapping.wixProductId);
  if (items.length === 0) return;

  // Wix variantId → leverantörens variant-id (skuId), via sparad mapping.
  const supplierByVariantId = new Map<string, string>();
  for (const v of mapping.variants ?? []) {
    if (v.wixVariantId) supplierByVariantId.set(v.wixVariantId, v.supplierVariantId);
  }
  const hasPerVariant = target > 0 && Object.keys(stockBySupplierId).length > 0;
  const evenSplit = Math.max(0, Math.trunc(target / Math.max(1, items.length)));

  const updates = items.map((it) => {
    let quantity: number;
    if (target === 0) {
      quantity = 0;
    } else if (hasPerVariant) {
      const supplierId = supplierByVariantId.get(it.variantId);
      const perVariant = supplierId != null ? stockBySupplierId[supplierId] : undefined;
      quantity = typeof perVariant === "number" ? perVariant : evenSplit;
    } else {
      quantity = evenSplit;
    }
    return { id: it.id, revision: it.revision, quantity };
  });
  await bulkUpdateInventoryQuantities(updates);
}

