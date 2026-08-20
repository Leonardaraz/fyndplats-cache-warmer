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

import { computePrice, roundPrice } from "../import/pricing";
import { TARGET_MARGIN_PCT, priceForTargetMargin } from "../pricing/margin-bands";
import { translateValue } from "../import/variant-translations";
import { isSyntheticMappingId, repairSyntheticVariantIds } from "./mapping-repair";
import type { PricingConfig } from "../import/types";
import { getProduct as getAliExpressProduct, queryFreightToCountry } from "../aliexpress/client";
import { checkMappingShippability, isShippabilityStale, NEGATIVE_CONFIRMATIONS, type ShippabilityBudget } from "./shippability";
import { planWarehouseFailover } from "./warehouse-failover";
import type { VariantMapping } from "../import/pipeline";
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
// Vägg-klocka-budget (ms) för en sync-körning. Sätts under Vercel-funktionens
// maxDuration (300 s) så loopen alltid hinner avsluta snyggt i stället för att
// dödas mitt i en Wix-skrivning (= partiella skrivningar / state-divergens).
export const DEFAULT_SYNC_TIME_BUDGET_MS = 240_000;
// Antal körningar i RAD som måste klassa en produkt som "borttagen" innan vi
// nollar lagret. Skyddar mot att ett transient "product not found"-svar (AE
// svarar ofta så tillfälligt) felaktigt tar en levande produkt ur försäljning.
// Sedan 2026-08-09 AVPUBLICERAS produkten inte längre vid bekräftad borttagning
// — sidan behålls indexerad och markeras slut i lager (se decideSyncOutcome).
export const REMOVED_STRIKES_REQUIRED = 2;

// Antal körningar i RAD med dropship-lager 0 innan vi faktiskt nollar Wix-
// lagret. En ENSTAKA 0-läsning är opålitlig: SucceBuy-väggskåpen (2026-07-14)
// visade lager 10 i två dygn, tappades till 0 i EN körning medan konsument-
// sidan hade kvar 10 st (skickas från EU-lager), och nollades direkt → syntes
// som "Slut i lager" fast de gick att köpa. Samma KOD RÖD-princip som frakt-
// nej:en: agera inte på en enda opålitlig negativ signal. En riktig
// utförsäljning bekräftas nästa körning (~4 h) och nollas då.
export const STOCK_ZERO_STRIKES_REQUIRED = 2;

/**
 * Antal OKLASSADE hämtningsfel i RAD innan felet behandlas som borttagen
 * listning (och dölj-mekaniken via removedStreak tar över). Döda listningar
 * svarar ibland med felkoder/tomma svar vi inte känner igen — utan detta tak
 * kunde de säljas vidare i veckor (sedelräknaren, 13 juli: listning död sedan
 * ~9 juli, 91 produkter fast i felslingan, äldsta sedan 5 juni).
 */
export const ERROR_STRIKES_AS_REMOVED = 5;

/** Ren hjälpare: nästa errorStreak + om felet nu ska tolkas som borttagen listning. */
export function classifyFetchError(prevErrorStreak: number | undefined): {
  errorStreak: number;
  treatAsRemoved: boolean;
} {
  const errorStreak = (prevErrorStreak ?? 0) + 1;
  return { errorStreak, treatAsRemoved: errorStreak >= ERROR_STRIKES_AS_REMOVED };
}

/**
 * AliExpress-fel 604 "All SKU Unsaleable": produkten säljs (troligen) inte via
 * dropship-kanalen längre, men KAN vara köpbar för konsumenter. Efter kod
 * röd-lärdomen 2026-07-14 (opålitliga kanalsignaler) får detta ALDRIG driva
 * auto-döljning via felsviten — det kräver Leonards manuella beslut. Felet
 * loggas synligt och produkten roterar vidare utan strike.
 */
export function isUnsaleableError(msg: string): boolean {
  return /all\s+sku\s+unsaleable/i.test(msg) || /api-fel\s*604\b/i.test(msg);
}

/**
 * Per-variant-lager nycklat på BÅDE numeriskt sku_id och attribut-strängen
 * (sku_attr). Audit-fynd 3 (2026-07-14): mappningarnas supplierVariantId är
 * attribut-strängar (extension-importen) men kartan nycklades bara på sku_id →
 * ingen match → tyst even-split-fallback → en slutsåld variant kunde få lager
 * (samma översäljklass som bugg 2026-06-07).
 */
export function buildStockBySupplierId(
  variants: ReadonlyArray<{ skuId?: string; skuAttr?: string; stock?: number }>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of variants) {
    const stock = Math.max(0, Math.trunc(v.stock ?? 0));
    if (v.skuId) out[String(v.skuId)] = stock;
    if (v.skuAttr && v.skuAttr.trim()) out[v.skuAttr.trim()] = stock;
  }
  return out;
}

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
  /**
   * Hur många körningar i rad (inkl. denna) som klassat produkten som borttagen.
   * Vi döljer först vid REMOVED_STRIKES_REQUIRED. Saknas (äldre anropare/tester) →
   * behandlas som bekräftad (bakåtkompatibelt — döljer direkt som förut).
   */
  removedStreak?: number;
  /** True när synken själv dolt produkten (state.hiddenBySync) — tillåter
   *  auto-restore trots att wixVisible är false. */
  hiddenBySync?: boolean;
  /**
   * Hur många körningar i rad (inkl. denna) som dropship-lagret läst 0 för en
   * levande listning. Vi nollar Wix-lagret först vid STOCK_ZERO_STRIKES_REQUIRED
   * (skydd mot en enstaka opålitlig 0-läsning). Saknas (äldre anropare/tester) →
   * behandlas som bekräftad (bakåtkompatibelt — nollar direkt som förut).
   */
  zeroStreak?: number;
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

  // 1) Listningen verkar borta. Dölj BARA efter REMOVED_STRIKES_REQUIRED
  // körningar i rad (skydd mot transient "not found" som annars gömmer en
  // levande produkt permanent). Saknas removedStreak (äldre anropare/tester) →
  // behandlas som bekräftad direkt (bakåtkompatibelt).
  if (!aliExpress || aliExpress.listingRemoved) {
    const streak = inputs.removedStreak ?? REMOVED_STRIKES_REQUIRED;
    const confirmed = streak >= REMOVED_STRIKES_REQUIRED;
    if (confirmed) {
      // SEO-BESLUT (2026-08-09): en borttagen listning nollar lagret men
      // AVPUBLICERAR INTE produkten. Att dölja sidan gör URL:en till en 404 och
      // kastar bort all upparbetad ranking och alla inlänkar — för en produkt
      // som mycket väl kan komma tillbaka hos en annan leverantör. Branschpraxis
      // för utgången vara är att låta sidan ligga kvar med status "slut i lager"
      // och hänvisa vidare, inte att radera den ur indexet.
      //
      // Produkten blir ändå omöjlig att köpa (lager 0), syns som removed i
      // /admin/sync-alerts och kan hanteras manuellt: behåll som
      // informationssida, byt leverantör, eller 301:a till en ersättare där en
      // sådan faktiskt finns.
      return {
        listingStatus: "removed",
        actionTaken: "marked_oos",
        shouldHide: false,
        shouldRestore: false,
        inventoryTarget: 0,
        alert: null,
        newCostSek: null,
        notes: "AliExpress-listning borttagen — lagret nollas, sidan behålls publicerad (SEO).",
        justWentOos: prevState?.listingStatus !== "out_of_stock" && prevState?.listingStatus !== "removed",
        justRestocked: false,
      };
    }
    // Obekräftad (strike < tröskel): rör ingenting, behåll tidigare status.
    return {
      listingStatus: prevState?.listingStatus ?? "active",
      actionTaken: "none",
      shouldHide: false,
      shouldRestore: false,
      inventoryTarget: null,
      alert: null,
      newCostSek: null,
      notes: `Möjlig borttagning (${streak}/${REMOVED_STRIKES_REQUIRED}) — väntar på bekräftelse innan produkten döljs.`,
      justWentOos: false,
      justRestocked: false,
    };
  }

  const newCostSek = round2(aliExpress.minCostUsd * pricing.usdToSek);

  // 2) Slut i lager — markera oos men dölj inte (hybrid: produktsidan lever
  // kvar, listningarna filtreras bort på headless-sajten via inventory=0).
  if (aliExpress.totalStock <= 0) {
    const wasOos = prevState?.listingStatus === "out_of_stock";
    // Bekräfta 0-lager innan vi nollar (KOD RÖD-principen: en enstaka dropship-
    // 0-läsning är opålitlig). Analogt med removedStreak: en produkt som läste
    // lager förra körningen men 0 nu kräver STOCK_ZERO_STRIKES_REQUIRED
    // körningar i rad med 0. En redan-oos produkt (wasOos) är i steady state →
    // ingen om-bekräftelse behövs. Saknas zeroStreak (äldre anropare/tester) →
    // behandlas som bekräftad direkt (bakåtkompatibelt).
    const streak = inputs.zeroStreak ?? STOCK_ZERO_STRIKES_REQUIRED;
    const confirmed = wasOos || streak >= STOCK_ZERO_STRIKES_REQUIRED;
    if (!confirmed) {
      // Obekräftad (strike < tröskel): rör INTE Wix-lagret (produkten förblir
      // köpbar) och behåll tidigare status. En riktig utförsäljning bekräftas
      // och nollas nästa körning.
      return {
        listingStatus: prevState?.listingStatus ?? "active",
        actionTaken: "none",
        shouldHide: false,
        shouldRestore: false,
        inventoryTarget: null,
        alert: null,
        newCostSek,
        notes: `Möjlig slut i lager (${streak}/${STOCK_ZERO_STRIKES_REQUIRED}) — dropship läste 0 men bekräftas inte än (lagret behålls, produkten är köpbar på AliExpress).`,
        justWentOos: false,
        justRestocked: false,
      };
    }
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
    // Om föregående status var removed och vi nu ser aktiv listning → restore,
    // men BARA när det var SYNKEN som dolde produkten (hiddenBySync, legacy
    // före #369:s aldrig-dölj-policy). Under nya policyn förblir produkten
    // synlig vid removed → utan hiddenBySync-kravet gav varje removed→active-
    // övergång en spök-restore: en onödig Wix-skrivning + en "ÅTERSTÄLLER"-
    // logg för en produkt som aldrig doldes (audit 2026-08-09). En MANUELL
    // unpublish (visible=false utan hiddenBySync) respekteras som förut.
    shouldRestore:
      prevState?.listingStatus === "removed" && inputs.hiddenBySync === true,
    inventoryTarget: aliExpress.totalStock,
    alert: null,
    newCostSek,
    notes: "",
    justWentOos: false,
    // Tillbaka i lager efter att ha varit slut → trigga restock-mejl.
    justRestocked: prevState?.listingStatus === "out_of_stock",
  };
  // Notera comebacken i loggen (pris-/innehållsflaggor nedan får skriva över).
  if (prevState?.listingStatus === "removed") {
    decision.notes = "Listningen är tillbaka hos AliExpress.";
  }

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
        // MÅLMARGINALEN, inte import-multiplikatorn. computePrice ger
        // kostnad × 2,5 (~62 % marginal) — ett förslag ingen trycker på:
        // växthuset på 449 kr föreslogs få 1219 kr. Vid målmarginalen landar
        // det på ~639 kr, vilket är en höjning man faktiskt gör. Faller
        // tillbaka på import-regeln om målpriset inte går att räkna ut.
        // Målet är det HÖGSTA av standardmålet och larmgolvet. Är golvet satt
        // över 22,5 % (SYNC_MARGIN_FLOOR_PERCENT) vore ett förslag på 22,5 %
        // en PRISSÄNKNING som dessutom aldrig rensar larmet — det ligger ju
        // fortfarande under golvet (granskning 2026-08-19).
        const målmarginal = Math.max(TARGET_MARGIN_PCT, marginFloorPercent);
        const målpris = priceForTargetMargin(
          newCostSek,
          målmarginal,
          pricing.vatRatePercent,
        );
        const recommended =
          målpris === null
            ? computePrice(aliExpress.minCostUsd, pricing).grossSek
            : roundPrice(målpris, pricing.rounding);
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
 * Marginal vid givet salespris (inkl. moms) och landad kostnad (inkl. moms).
 *
 * NETTO MOT NETTO. Båda talen bär moms: butikspriset gör det, och det lagrade
 * inköpspriset gör det också ("Price includes VAT" hos AliExpress EU-lager —
 * se noten i lib/import/pricing.ts). Momsen på inköpet är dessutom aldrig en
 * verklig kostnad för ett momsregistrerat företag: EU-säljare fakturerar utan
 * moms (omvänd skattskyldighet) och importmoms på Kina-köp är avdragsgill.
 * Kodbasens egen netSupplierCost() i lib/auction/seed.ts bygger på just det.
 *
 * Fram till 2026-08-19 drogs den MOMSADE kostnaden från nettointäkten, vilket
 * underskattade varje marginal med ungefär momssatsen gånger kostnaden. Följden
 * var inte kosmetisk: sidan visade 208 "prishöjningar" där tre av fyra
 * stickprov i själva verket låg på plus (−9,5 % var +12,4 %, −12,5 % var
 * +10,0 %, −23,3 % var +1,3 %). Både alert-tröskeln och allvarlighetsgraden
 * hänger på talet, så felet skapade en vägg av röda larm som inte fanns.
 *
 * Försimplad i övrigt: ignorerar Klarna-avgiften (lägger tröskeln konservativt).
 */
export function projectedMarginAtPrice(
  grossSek: number,
  landedCostSek: number,
  vatRatePercent: number,
): number {
  if (grossSek <= 0) return 0;
  const netRevenue = grossSek / (1 + vatRatePercent / 100);
  if (netRevenue <= 0) return 0;
  const netCost = landedCostSek / (1 + vatRatePercent / 100);
  return ((netRevenue - netCost) / netRevenue) * 100;
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
  /**
   * Vägg-klocka-budget (ms). Loopen stannar (resten räknas som skipped) innan
   * budgeten nås, så Vercel inte dödar lambdan mitt i en produkt-skrivning.
   * Default DEFAULT_SYNC_TIME_BUDGET_MS.
   */
  timeBudgetMs?: number;
  /** Mappnings-id:er att hoppa över (för åter-körning av en partiell körning). */
  skipIds?: Set<string>;
  /**
   * Kör ENBART dessa wixProductId (allt annat lämnas orört). Används av
   * "Ändra mappning" i admin: efter ett källbyte är det sparade tillståndet
   * (listingStatus/outOfStockSince/lager) kvar från den GAMLA listningen, så
   * raden visar en falsk "slut hos leverantören"-varning och lagret ligger
   * nollat tills 4-timmarsrotationen råkar nå produkten. Med det här filtret
   * kör admin-åtgärden synkens riktiga logik för just den produkten direkt —
   * ingen halv duplikat-implementation av lager/pris/tillstånd.
   *
   * Filtreras FÖRE tillståndsuppslagen nedan: annars skulle en enproduktskörning
   * läsa state för hela katalogen (~800 uppslag) i onödan.
   */
  onlyIds?: Set<string>;
  /** Marginal-golv för pris-alert. */
  marginFloorPercent: number;
  /**
   * Bas-URL för cache-warmer-appen (admin-import-länkar i OOS-mejlet).
   * T.ex. https://fyndplats-cache-warmer.vercel.app.
   */
  baseUrl: string;
  /** Mottagare för real-tids-OOS-larm (Feature 2). Saknas = inga larm skickas. */
  opsAlertEmail?: string;
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
  /** Fraktbarhetskontroller: antal API-anrop resp. ofraktbara varianter. */
  shippabilityChecked?: number;
  shippabilityUnshippable?: number;
  /** True om körningen var dry-run. */
  dryRun: boolean;
  /** Körningens början/slut i ISO. */
  startedAt: string;
  finishedAt: string;
}

/**
 * Begränsar en körning till `onlyIds`. Utbruten som ren funktion för att låsa
 * semantiken i test: `undefined` = hela katalogen (cronens väg — får ALDRIG
 * råka scopas bort), en ifylld mängd = exakt de mappningarna, en TOM mängd =
 * ingenting (anroparens fel, loggas högljutt av anroparen).
 */
export function scopeMappings<T extends { wixProductId: string }>(
  mappings: T[],
  onlyIds: Set<string> | undefined,
): T[] {
  if (!onlyIds) return mappings;
  return mappings.filter((m) => onlyIds.has(m.wixProductId));
}

export async function runDailySync(opts: RunDailySyncOptions): Promise<SyncSummary> {
  const startedAt = new Date().toISOString();
  const store = getStore();
  const syncStore = getSyncStore();
  const allMappings = await store.listMappings();
  // Scoped körning (onlyIds) filtreras här, före både summary.total och
  // tillståndsuppslagen — så siffrorna beskriver den faktiska körningen och en
  // enproduktskörning kostar ett state-uppslag i stället för hela katalogens.
  const mappings = scopeMappings(allMappings, opts.onlyIds);
  if (opts.onlyIds && mappings.length === 0) {
    // Loud, aldrig tyst: en scoped körning som inte matchar någon mappning är
    // alltid ett fel hos anroparen (fel id, oskapad mappning). Tyst nollkörning
    // är precis den felmod som brände oss förr — 21 produkter felade osynligt i
    // 8 dagar (audit 2026-07-14).
    console.warn(
      `[sync] scoped körning matchade INGEN mappning: ${[...opts.onlyIds].join(", ")}`,
    );
  }

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
    shippabilityChecked: 0,
    shippabilityUnshippable: 0,
    dryRun: opts.dryRun,
    startedAt,
    finishedAt: startedAt,
  };

  // --- Senaste 30 dagars försäljning (en gång per körning) ----------------
  // Används både för bestseller-prioritet (Feature 4) och för "X sålda"-raden
  // i real-tids-OOS-mejlet (Feature 2). Best-effort: failar order-API:t kör vi
  // vidare med tomt data (mejlet visar då 0 sålda, prioriteringen rör inget).
  // Fraktbarhetskontrollens delade anropsbudget. Pausad (default 0) från
  // 2026-07-14 till 2026-08-16: fraktAPI:ts nej-svar var opålitliga per anrop
  // och nollade 8 fraktbara produkter under en natt (kod röd). Villkoret för
  // återaktivering var "hårdare beviskrav" — det är nu byggt (kontroll v2):
  // ett nej måste vara UTTRYCKLIGT, upprepas minst två gånger med minst ett
  // dygns spridning, och får inte stå bredvid ett fraktbart syskon.
  //
  // Default höjd till 20 anrop/körning (Leonards begäran 2026-08-16). Med
  // körning var 4:e timme blir det ~120 kontroller/dygn — en första svep över
  // de ~822 aldrig kontrollerade varianterna tar drygt en vecka. Medvetet
  // långsamt: beviskravet kostar tid, och det är priset för att inte upprepa
  // kod röd. Sätt SYNC_SHIPPABILITY_CHECKS_PER_RUN för att ändra takten, 0
  // för att pausa igen.
  const DEFAULT_SHIPPABILITY_CHECKS_PER_RUN = 20;
  const shipBudgetEnv = Number(process.env.SYNC_SHIPPABILITY_CHECKS_PER_RUN);
  const shippabilityBudget: ShippabilityBudget = {
    remaining: Number.isFinite(shipBudgetEnv) && shipBudgetEnv >= 0
      ? shipBudgetEnv
      : DEFAULT_SHIPPABILITY_CHECKS_PER_RUN,
  };

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
  // Hoppas över i scoped körningar (onlyIds): prioritetsplanen ska bygga på HELA
  // katalogen. Faller 30-dagarshämtningen ovan blir salesByProduct tom, och en
  // enproduktskörning skulle då kunna degradera en bestseller på ofullständigt
  // underlag. Ett källbyte ska inte röra prioriteter.
  try {
    if (!opts.onlyIds) {
      await applyBestsellerPriority({ store, mappings, salesByProduct, dryRun: opts.dryRun });
    }
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
  const loopStartMs = Date.now();
  const timeBudgetMs = opts.timeBudgetMs ?? DEFAULT_SYNC_TIME_BUDGET_MS;

  for (const { mapping, state } of states) {
    // Stanna på rate-limit ELLER vägg-klocka-budget (kollas FÖRE varje produkt
    // → avbryter aldrig en pågående skrivning). Resten räknas som skipped och
    // tas nästa körning (äldsta lastCheckedAt först).
    if (apiCallsUsed >= opts.maxApiCalls || Date.now() - loopStartMs >= timeBudgetMs) {
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
        shippabilityBudget,
      });
      summary.checked++;
      summary.shippabilityChecked = (summary.shippabilityChecked ?? 0) + (result.shippabilityCalls ?? 0);
      summary.shippabilityUnshippable = (summary.shippabilityUnshippable ?? 0) + (result.shippabilityUnshippable ?? 0);
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
      const errMsg = err instanceof Error ? err.message.slice(0, 300) : String(err);
      // Synlig i Vercel-loggen (audit-fynd 6) — summeringen persisterar bara antalet.
      console.warn(`[sync] fel ${mapping.wixProductId} (${mapping.supplierProductId}): ${errMsg}`);
      summary.errors.push({
        productId: mapping.wixProductId,
        aliexpressId: mapping.supplierProductId,
        error: errMsg,
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
  /** Delad budget för fraktbarhetskontroller denna körning (muteras). */
  shippabilityBudget?: ShippabilityBudget;
}

interface SyncOneResult {
  actionTaken: SyncAction;
  /** True om ett real-tids-OOS-mejl komponerades/skickades denna körning. */
  oosAlertSent?: boolean;
  /** Sätts när produkten flippade till OOS (för daglig aggregering). */
  oosEvent?: { productName: string; aliexpressId: string; sales30d: number };
  /** Antal restock-mejl som skickades till bevakare. */
  restockSent?: number;
  /** Antal fraktbarhets-API-anrop resp. ofraktbara varianter denna produkt. */
  shippabilityCalls?: number;
  shippabilityUnshippable?: number;
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
  // SKU:er (numeriskt id + egenskaper) för fraktbarhetskontrollen (steg 3.5).
  let aeVariantsForShippability: Array<{
    skuId: string;
    skuAttr?: string;
    skuProps: Record<string, string>;
    stock?: number;
    shipFrom?: string;
    /** SKU-priset — lager-failovern (steg 3.6) räknar om marginalen med det. */
    price?: number;
  }> = [];
  // Sätts om AE-svaret klassas som "borttagen listning" (för strike-räkningen
  // som kräver REMOVED_STRIKES_REQUIRED körningar i rad innan vi döljer).
  let removedClassified = false;
  // >0 när hämtningen felade oklassat denna körning (persisteras i newState).
  let fetchErrorStreak = 0;
  try {
    const product = await getAliExpressProduct(mapping.supplierProductId);
    // Skydd mot degraderat 200-svar: ett giltigt svar med TOM variant-lista
    // (throttling/partiell DS-respons) skulle annars ge totalStock=0 →
    // decideSyncOutcome markerar OOS → Wix-lagret NOLLAS för en levande produkt
    // (försvinner ur butiken). En riktig produkt har alltid ≥1 SKU, så vi
    // behandlar 0 varianter som transient (kasta → fångas i loopen, ingen skrivning).
    if (!product.variants || product.variants.length === 0) {
      throw new Error(
        `AliExpress returnerade 0 varianter för ${mapping.supplierProductId} `
        + `— behandlas som transient (ingen lager-skrivning).`,
      );
    }
    const minCostUsd = product.variants
      .filter((v) => (v.stock ?? 0) > 0 && v.price > 0)
      .reduce((min, v) => (min === 0 ? v.price : Math.min(min, v.price)), 0);
    const totalStock = product.variants.reduce((s, v) => s + (v.stock ?? 0), 0);
    // SJÄLVLÄKNING av syntetiska variant-id:n (audit 2026-08-08: 85 mappningar
    // med dom-/default-id → orderläggning skickar påhittat sku_attr och lager-
    // synken kan aldrig matcha per variant). DS-produkten är redan hämtad —
    // reparera ENTYDIGA träffar och spara innan lagerkartan byggs, så repare-
    // rade id:n matchar per-variant-saldot i SAMMA körning. Konservativ +
    // best-effort: tvetydigt lämnas orört (loggat), fel fäller aldrig synken.
    if (mapping.variants.some((v) => isSyntheticMappingId(v.supplierVariantId))) {
      try {
        const rep = repairSyntheticVariantIds(mapping.variants, product.variants, translateValue);
        if (rep.repaired > 0) {
          mapping.variants = rep.variants;
          if (!dryRun) await getStore().saveMapping(mapping);
          console.log(
            `[sync] mappnings-reparation ${mapping.wixProductId}: ${rep.repaired} syntetiska ` +
              `variant-id ersatta med riktiga AE-skuId${rep.ambiguous.length ? `; kvar olösta: ${rep.ambiguous.join(", ")}` : ""}.`,
          );
        } else if (rep.ambiguous.length > 0) {
          console.warn(
            `[sync] mappnings-reparation ${mapping.wixProductId}: kunde inte matcha ${rep.ambiguous.join(", ")} ` +
              `entydigt mot DS-SKU:erna — auto-order kräver manuell åtgärd för dessa varianter.`,
          );
        }
      } catch (err) {
        console.warn(
          `[sync] mappnings-reparation misslyckades för ${mapping.wixProductId}: ` +
            `${err instanceof Error ? err.message.slice(0, 160) : String(err)}`,
        );
      }
    }
    aeStockBySupplierId = buildStockBySupplierId(product.variants);
    aeVariantsForShippability = product.variants
      .filter((v) => v.skuId)
      // stock + shipFrom följer med för lager-failovern: får vår sparade SKU
      // nej provas samma vara i andra lager, och då vill vi börja med det som
      // har saldo och ligger i EU.
      .map((v) => ({
        skuId: String(v.skuId),
        skuAttr: v.skuAttr,
        skuProps: v.skuProps ?? {},
        stock: v.stock,
        shipFrom: v.shipFrom,
        price: v.price,
      }));
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
      removedClassified = true;
      aliExpress = {
        title: "",
        images: [],
        minCostUsd: 0,
        totalStock: 0,
        listingRemoved: true,
      };
    } else if (isUnsaleableError(msg)) {
      // 604 "All SKU Unsaleable": egen OFARLIG klassificering (audit-fynd 1).
      // Får ALDRIG driva errorStreak→removed→hidden — produkten kan vara fullt
      // köpbar för konsumenter (21 levande produkter var på väg att auto-döljas
      // 2026-07-14). Rotationen går vidare, sviten fryses, felet loggas synligt
      // och räknas i körningens fel — beslutet är Leonards.
      if (!dryRun) {
        await getSyncStore().saveState({
          currentCostSek: state?.currentCostSek ?? null,
          currentCostUsd: state?.currentCostUsd ?? null,
          currentStock: state?.currentStock ?? null,
          listingStatus: state?.listingStatus ?? "unknown",
          titleHash: state?.titleHash ?? null,
          imageHash: state?.imageHash ?? null,
          lastOosAlertAt: state?.lastOosAlertAt ?? null,
          outOfStockSince: state?.outOfStockSince ?? null,
          removedStreak: state?.removedStreak ?? 0,
          hiddenBySync: state?.hiddenBySync ?? false,
          wixProductId: mapping.wixProductId,
          aliexpressId: mapping.supplierProductId,
          lastCheckedAt: checkedAt,
          errorStreak: state?.errorStreak ?? 0,
        });
        try {
          await getSyncStore().appendLog({
            id: `${mapping.wixProductId}-${checkedAt}`,
            productId: mapping.wixProductId,
            aliexpressId: mapping.supplierProductId,
            checkedAt,
            prevCostSek: state?.currentCostSek ?? null,
            newCostSek: null,
            prevStock: state?.currentStock ?? null,
            newStock: null,
            listingStatus: state?.listingStatus ?? "unknown",
            actionTaken: "error",
            notes: "AliExpress 604: All SKU Unsaleable — säljs möjligen inte via dropship-kanalen. Döljs INTE automatiskt; kräver manuellt beslut.",
          });
        } catch { /* loggning är best-effort */ }
      }
      throw err;
    } else {
      // OKLASSAT fel. Tidigare: re-throw → state rördes aldrig → produkten låg
      // kvar FÖRST i äldst-först-kön och brände kvot varje körning, tyst.
      // Nu: bumpa lastCheckedAt + errorStreak så rotationen går vidare, och
      // vid ERROR_STRIKES_AS_REMOVED behandlas felet som borttagen listning
      // (removedStreak-mekaniken döljer sedan som vanligt, och en senare
      // lyckad aktiv observation återställer produkten).
      const verdict = classifyFetchError(state?.errorStreak);
      fetchErrorStreak = verdict.errorStreak;
      if (verdict.treatAsRemoved) {
        removedClassified = true;
        aliExpress = { title: "", images: [], minCostUsd: 0, totalStock: 0, listingRemoved: true };
      } else {
        if (!dryRun) {
          await getSyncStore().saveState({
            currentCostSek: state?.currentCostSek ?? null,
            currentCostUsd: state?.currentCostUsd ?? null,
            currentStock: state?.currentStock ?? null,
            listingStatus: state?.listingStatus ?? "unknown",
            titleHash: state?.titleHash ?? null,
            imageHash: state?.imageHash ?? null,
            lastOosAlertAt: state?.lastOosAlertAt ?? null,
            outOfStockSince: state?.outOfStockSince ?? null,
            removedStreak: state?.removedStreak ?? 0,
            hiddenBySync: state?.hiddenBySync ?? false,
            wixProductId: mapping.wixProductId,
            aliexpressId: mapping.supplierProductId,
            lastCheckedAt: checkedAt,
            errorStreak: fetchErrorStreak,
          });
          // Synlig loggrad (audit-fynd 6): tidigare fanns felet BARA som en
          // siffra i körningens summering — odiagnostiserbart i efterhand.
          try {
            await getSyncStore().appendLog({
              id: `${mapping.wixProductId}-${checkedAt}`,
              productId: mapping.wixProductId,
              aliexpressId: mapping.supplierProductId,
              checkedAt,
              prevCostSek: state?.currentCostSek ?? null,
              newCostSek: null,
              prevStock: state?.currentStock ?? null,
              newStock: null,
              listingStatus: state?.listingStatus ?? "unknown",
              actionTaken: "error",
              notes: `Hämtningsfel (svit ${fetchErrorStreak}/${ERROR_STRIKES_AS_REMOVED}): ${err instanceof Error ? err.message.slice(0, 200) : String(err)}`,
            });
          } catch { /* loggning är best-effort */ }
        }
        // Räknas som fel i körningens summering (samma som förr), men utan
        // att blockera rotationen.
        throw err;
      }
    }
  }
  // Strike-räkning: +1 per körning i rad som klassar borttagning, nollas annars.
  // decideSyncOutcome döljer först vid REMOVED_STRIKES_REQUIRED.
  const removedStreak = removedClassified ? (state?.removedStreak ?? 0) + 1 : 0;

  // Lager-0-strike: +1 per körning i rad där en LEVANDE listning läst lager 0,
  // nollas när lager > 0. decideSyncOutcome nollar Wix-lagret först vid
  // STOCK_ZERO_STRIKES_REQUIRED (skydd mot en enstaka opålitlig 0-läsning).
  // Capas vid tröskeln så räknaren inte växer obegränsat för permanent slut.
  const stockIsZero = aliExpress != null && !aliExpress.listingRemoved && aliExpress.totalStock <= 0;
  const zeroStreak = stockIsZero
    ? Math.min((state?.zeroStreak ?? 0) + 1, STOCK_ZERO_STRIKES_REQUIRED)
    : 0;

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
    hiddenBySync: state?.hiddenBySync,
    currentPriceSek,
    newTitleHash,
    newImageHash,
    pricing,
    marginFloorPercent,
    removedStreak,
    zeroStreak,
  });

  // 3.5) Fraktbarhetskontroll (SucceBuy-fallet 2026-07-13): leverantören kan
  // ha LAGER på en SKU som ändå saknar fraktväg till Sverige — kassan vägrar.
  // Körs live, för aktiva listningar, inom körningens delade anropsbudget och
  // bara för varianter vars kontroll är äldre än 7 dygn (eller aldrig gjord).
  // Uppdaterade shippableToSe-flaggor plockas upp av applyInventoryTarget i
  // steg 4 → ofraktbara varianter tvingas till 0 i samma körning. Best-effort:
  // ett fel här får aldrig fälla synk-checken.
  let shippabilityCalls = 0;
  let shippabilityUnshippable = 0;
  const shipBudget = opts.shippabilityBudget;
  if (
    !dryRun
    && shipBudget
    && shipBudget.remaining > 0
    && aliExpress
    && decision.listingStatus === "active"
    && aeVariantsForShippability.length > 0
    && mapping.variants.some((v) => isShippabilityStale(v, Date.parse(checkedAt)))
  ) {
    try {
      const check = await checkMappingShippability({
        mapping,
        aeVariants: aeVariantsForShippability,
        nowMs: Date.parse(checkedAt),
        budget: shipBudget,
        queryFn: (productId, skuId) => queryFreightToCountry(productId, skuId, "SE", 1),
      });
      shippabilityCalls = check.apiCalls;
      shippabilityUnshippable = check.unshippable;
      if (check.changed) {
        // Lagerbyten loggas högljutt: de ändrar VILKEN SKU en kundorder läggs
        // på, och inköpspriset kan skilja mellan lager.
        for (const v of check.variants) {
          if (v.shipFromSwitchedAt === checkedAt && v.previousSupplierVariantId) {
            console.warn(
              `[sync] lagerbyte ${mapping.wixProductId} (${v.sku}): ${v.previousSupplierVariantId} → ${v.supplierVariantId} ` +
                `— gamla lagret svarade nej, det nya skickar till SE. Kontrollera inköpspriset.`,
            );
          }
        }
        mapping.variants = check.variants;
        await getStore().saveMapping(mapping);
        if (check.unshippable > 0) {
          console.warn(
            `[sync] fraktbarhet ${mapping.wixProductId}: ${check.unshippable} variant(er) utan fraktväg till SE — lagret tvingas till 0.`,
          );
        }
      }
    } catch (err) {
      console.warn(
        `[sync] fraktbarhetskontroll misslyckades för ${mapping.wixProductId}: ${err instanceof Error ? err.message.slice(0, 200) : String(err)}`,
      );
    }
  }

  // 3.6) LAGER-FAILOVER: vårt lager tomt, men varan finns i ett annat.
  //
  // AliExpress bakar in lagerlandet i SKU:n, och synken speglar just VÅR SKU:s
  // saldo till Wix (resolveInventoryQuantities). Tar det tyska lagret slut blir
  // varan slutsåld i butiken trots att säljaren har 42 kvar i Spanien och
  // skickar därifrån till Sverige — Leonards rapport 2026-08-20.
  //
  // Vi pekar om mappningen i stället för att bara visa syskonets saldo: ordern
  // läggs på den sparade SKU:n, så en uppblåst lagersiffra hade bara flyttat
  // felet till kassan. Ligger FÖRE steg 4 med flit — då hämtar
  // applyInventoryTarget det nya lagrets saldo i samma körning.
  //
  // Spärrarna sitter i lib/sync/warehouse-failover.ts: bara EU:s tullunion,
  // bara med känt pris, och bara om marginalen håller efter bytet.
  if (!dryRun && aliExpress && aeVariantsForShippability.length > 0) {
    try {
      const failover = planWarehouseFailover(mapping.variants, aeVariantsForShippability, {
        nowIso: checkedAt,
      });
      if (failover.changed) {
        for (const b of failover.switches) {
          console.warn(
            `[sync] lagerbyte (slut) ${mapping.wixProductId} (${b.sku}): ${b.from} → ${b.to}` +
              `${b.shipFrom ? ` [${b.shipFrom}]` : ""} — vårt lager 0, nya har ${b.toStock}. ` +
              `Inköp $${b.oldCostUsd} → $${b.newCostUsd}, marginal ${b.marginPct.toFixed(1)} %.`,
          );
        }
        mapping.variants = failover.variants;
        await getStore().saveMapping(mapping);
      }
      // Ett syskon fanns men bytet gjordes inte — det är ett beslut för en
      // människa, inte något att tiga om. Marginalfallet är det intressanta:
      // varan GÅR att sälja, men inte till nuvarande pris.
      for (const s of failover.skipped) {
        console.warn(
          `[sync] lagerbyte AVSTOD ${mapping.wixProductId} (${s.sku}): ${s.reason}` +
            `${s.marginPct !== undefined ? ` (${s.marginPct.toFixed(1)} % marginal)` : ""}` +
            `${s.toStock !== undefined ? `, syskon har ${s.toStock} i lager` : ""}.`,
        );
      }
    } catch (err) {
      // Best-effort, precis som fraktbarhetskontrollen: ett fel här får aldrig
      // fälla synk-checken för produkten.
      console.warn(
        `[sync] lager-failover misslyckades för ${mapping.wixProductId}: ${err instanceof Error ? err.message.slice(0, 200) : String(err)}`,
      );
    }
  }

  // 4) Sidoeffekter — Wix-skrivningar.
  // Sedan #369 (SEO-bevarande policy) DÖLJER synken aldrig: en borttagen
  // listning nollar lagret (marked_oos) men sidan behålls synlig — att
  // avpublicera gör URL:en till en 404 och kastar bort ranking/inlänkar.
  // shouldHide finns kvar i beslutsstrukturen (alltid false) för state-
  // bokföringen; shouldRestore gäller enbart LEGACY-produkter som synken
  // hann dölja före policybytet (hiddenBySync) och loggas högljutt.
  if (!dryRun) {
    if (decision.shouldRestore) {
      console.log(
        `[sync] ÅTERSTÄLLER synlighet ${mapping.wixProductId} (AE ${mapping.supplierProductId}): ` +
          `${decision.notes} Produkten doldes av synken före aldrig-dölj-policyn (#369).`,
      );
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
      productSlug: wixSnapshot.slug,
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
  //
  // AV som standard sedan 2026-07-14: en körning gav 7 separata mejl i
  // Leonards inkorg. Dygnets OOS-händelser sammanställs i stället i
  // morgonmejlet (ordervakten) med AliExpress- + sajtlänk per produkt.
  // Sätt SYNC_REALTIME_OOS_EMAIL=true för att få tillbaka per-produkt-mejlen.
  const realtimeOosEmail = process.env.SYNC_REALTIME_OOS_EMAIL === "true";
  if (decision.justWentOos && opts.opsAlertEmail && !dryRun && realtimeOosEmail) {
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
    // Frys i dry-run så en torrkörning inte "konsumerar" en strike.
    removedStreak: dryRun ? (state?.removedStreak ?? 0) : removedStreak,
    zeroStreak: dryRun ? (state?.zeroStreak ?? 0) : zeroStreak,
    // Lyckad hämtning nollställer felsviten; föll vi hit via
    // ERROR_STRIKES_AS_REMOVED persisteras den vidare-räknade sviten.
    errorStreak: dryRun ? (state?.errorStreak ?? 0) : fetchErrorStreak,
    // Kom ihåg när DET VAR VI som dolde (→ auto-restore tillåten, fynd 2).
    hiddenBySync: dryRun
      ? (state?.hiddenBySync ?? false)
      : decision.shouldHide
        ? true
        : decision.shouldRestore
          ? false
          : (state?.hiddenBySync ?? false),
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

  return { actionTaken: logEntry.actionTaken, oosAlertSent, oosEvent, restockSent, shippabilityCalls, shippabilityUnshippable };
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
 * Avgör Wix-lagersaldo per variant (ren funktion → enhetstestbar).
 *
 * - `target === 0` (slut i lager) → nollar hela linjen.
 * - Har vi per-variant-saldo från AE (`stockBySupplierId`, keyat på skuId)
 *   speglas varje variant individuellt via Wix variantId → supplierVariantId.
 *   En variant vars supplier-SKU SAKNAS i AE-svaret (slutsåld/borttagen variant
 *   som AE droppat) sätts till **0 — inte even-split**. Bug 2026-06-07: even-split-
 *   fallbacken gav en slutsåld variant `total/n` i lager → oversälj (#97-klassen igen).
 * - Saknar vi per-variant-data HELT, ELLER matchar INGEN Wix-variant något skuId
 *   i svaret (helt inaktuell mappning) → even-split av aggregatet. (Att nolla allt
 *   när ingenting matchar vore falsk mass-OOS; even-split är säkrare gissning.)
 */
/**
 * Vilka Wix-varianter som ska tvingas till 0 lager för att de saknar fraktväg
 * till Sverige. Ren funktion → testbar.
 *
 * TVÅ KÄLLOR med olika tillit:
 *  • MANUELLT verdikt (`shippabilityManual`) — en människa har läst "This
 *    product can't be shipped to your address" på leverantörens egen sida.
 *    Lyder ALDRIG under env-flaggan.
 *  • Automatiskt verdikt från frakt-API:t — gatas av
 *    `SYNC_SHIPPABILITY_ENFORCE`, avstängt sedan kod röd 2026-07-14 då
 *    kontrollen nollade 8 SÄLJBARA produkter på en natt. De ~9 kvarvarande
 *    flaggorna från den natten förblir därför inerta.
 *
 * Utan uppdelningen fanns ingen väg alls att stoppa en vara vi VET inte går att
 * skicka: sparkbilen (SucceBuy, samma säljare som fallet 2026-07-13) låg kvar
 * med ~60 i lager, såldes och fick återbetalas (Leonards rapport 2026-08-16).
 */
export function unshippableVariantIdsFor(
  variants: readonly VariantMapping[],
  enforceAutomatic: boolean,
): Set<string> {
  return new Set(
    variants
      .filter((v) => {
        if (v.shippableToSe !== false || !v.wixVariantId) return false;
        // Människa har kontrollerat leverantörens sida.
        if (v.shippabilityManual === true) return true;
        // BEVISAD v2-dom: bär en bekräftelseserie, vilket per konstruktion
        // betyder ≥2 uttryckliga nej spridda över minst ett dygn utan något
        // fraktbart syskon. Den behöver inte env-flaggan — beviskravet ÄR
        // grinden. Granskning 2026-08-16: utan detta undantag var v2 helt
        // inert, domen skrevs men nollade aldrig något.
        if ((v.shippabilityNegativeStreak ?? 0) >= NEGATIVE_CONFIRMATIONS) return true;
        // Kvar: v1-flaggor från kod röd 2026-07-14 (uppmätt: 13 varianter,
        // ingen med serie). De saknar bevis och förblir inerta tills någon
        // uttryckligen sätter env-flaggan.
        return enforceAutomatic;
      })
      .map((v) => v.wixVariantId as string),
  );
}

export function resolveInventoryQuantities(
  items: ReadonlyArray<{ variantId: string }>,
  supplierByVariantId: Map<string, string>,
  target: number,
  stockBySupplierId: Record<string, number>,
  // Varianter (Wix variantId) utan fraktväg till Sverige — tvingas ALLTID
  // till 0 oavsett leverantörens lager (fraktbarhetskontrollen, 2026-07-13:
  // SucceBuy-SKU:er hade 26 st i lager men kunde inte skickas hit).
  unshippableVariantIds: ReadonlySet<string> = new Set(),
): Map<string, number> {
  const out = new Map<string, number>();
  const evenSplit = Math.max(0, Math.trunc(target / Math.max(1, items.length)));
  // Matchar NÅGON variant ett skuId i svaret? Om ingen gör det (inaktuell
  // mappning) faller vi tillbaka på even-split i stället för att nolla allt.
  const anyMatch = items.some((it) => {
    const sid = supplierByVariantId.get(it.variantId);
    return sid != null && sid in stockBySupplierId;
  });
  const usePerVariant = target > 0 && Object.keys(stockBySupplierId).length > 0 && anyMatch;
  for (const it of items) {
    if (unshippableVariantIds.has(it.variantId)) {
      out.set(it.variantId, 0);
    } else if (target === 0) {
      out.set(it.variantId, 0);
    } else if (usePerVariant) {
      const supplierId = supplierByVariantId.get(it.variantId);
      const perVariant = supplierId != null ? stockBySupplierId[supplierId] : undefined;
      out.set(it.variantId, typeof perVariant === "number" ? perVariant : 0);
    } else {
      out.set(it.variantId, evenSplit);
    }
  }
  return out;
}

/**
 * Skriver lager-target till varianterna (per-variant via resolveInventoryQuantities).
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
  // Ofraktbara varianter tvingas till 0 vid spegling — men BARA när
  // SYNC_SHIPPABILITY_ENFORCE=true. Grindad av (kod röd 2026-07-14): flaggor
  // satta av opålitliga API-nej får inte nolla säljbara varianter. Kvarvarande
  // gamla flaggor är inerta tills kontrollen v2 är bevisad.
  const unshippableVariantIds = unshippableVariantIdsFor(
    mapping.variants ?? [],
    process.env.SYNC_SHIPPABILITY_ENFORCE === "true",
  );
  const qtyByVariant = resolveInventoryQuantities(items, supplierByVariantId, target, stockBySupplierId, unshippableVariantIds);
  const updates = items.map((it) => ({
    id: it.id,
    revision: it.revision,
    quantity: qtyByVariant.get(it.variantId) ?? 0,
  }));
  await bulkUpdateInventoryQuantities(updates);
}

