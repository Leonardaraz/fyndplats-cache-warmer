// Supplier-watch — hittar NYA produkter hos bevakade AliExpress-säljare
// (Aosom, SucceBuy, …) och köar dem för auto-import.
//
// Bakgrund: DS-API:et kan inte lista en säljares sortiment. Närmsta möjliga är
// text-sök på våra kategoritermer + säljarfilter i efterhand via detalj-API:t
// (aliexpress.ds.product.get → ae_store_info.store_id). Det ger "nya produkter
// inom våra nischer", inte garanterat säljarens HELA nyhetsflöde — och
// latensen är polling (daglig cron), inte realtid.
//
// Flöde per körning:
//   1. Välj dagens skiva söktermer (deterministisk rotation — stateless).
//   2. text.search per term (sorterat på orders — nyare storsäljare bubblar upp
//      med tiden; träffdjupet styrs av pageSize).
//   3. Dedupe: hoppa över allt som redan finns i FyndplatsMappings
//      (supplierProductId) eller i den persistenta negativ-cachen
//      (FyndplatsSupplierWatchSeen, TTL:ad).
//   4. Detalj-kolla kandidater (cap:at): rätt säljare? bekräftat EU-lager?
//      i lager? rimlig kostnad? Avslag skrivs till negativ-cachen.
//   5. Matchningar köas i den BEFINTLIGA bulk-import-kön (raw-läge → draft i
//      /admin/queue med needsAiPolish) — inget publiceras automatiskt.
//
// Säkerhet: dry-run är default (rapporterar bara), separat createdBy så
// watch-jobb aldrig krockar med manuella CSV-jobb, och alla API-anrop är
// hårt cap:ade per körning.

import type { AliExpressDsProduct, } from "../aliexpress/types";
import type { AliExpressSearchResult } from "../aliexpress/client";
import type {
  SupplierWatchSeenRecord,
  SupplierWatchSkipReason,
} from "../store/supplier-watch-seen";

// --- Bevakade säljare (AliExpress store_id) ---------------------------------
// Aosom ES är paraplyet bakom house-brands (PawHut/HOMCOM/Outsunny/Aiyaplay…).
// SucceBuy kör en butik per kategori — alla id:n kommer från FyndplatsMappings
// (supplierId-fältet) och kan överstyras via SUPPLIER_WATCH_SELLER_IDS.
export const DEFAULT_WATCHED_SELLER_IDS: readonly string[] = [
  "1104096404", // Aosom ES (EU) Store
  "912166334",  // SucceBuy Tools Global
  "1103578649", // SucceBuy Tools Overseas Global
  "912155350",  // SucceBuy Home Garden
  "1103578650", // SucceBuy Home Garden (Overseas)
  "1103580698", // SucceBuy Power Tools
  "1103570675", // SucceBuy Office Electronics Overseas
  "912162345",  // SucceBuy Office Electronics
  "912168161",  // SucceBuy Appliance
  "912161326",  // SucceBuy Auto
  "1103582643", // SucceBuy Auto Overseas
];

// Söktermer = de nischer Aosom/SucceBuy faktiskt säljer i (härledda ur
// katalogen). Engelska — AE-listningarna är engelska. Roteras N per dag.
export const DEFAULT_WATCH_TERMS: readonly string[] = [
  "cat tree", "cat scratching post", "pet stroller", "dog playpen", "dog cage",
  "kids ride on car", "ride on motorcycle kids", "balance bike kids",
  "gymnastics bar kids", "kids kitchen wooden", "montessori activity table",
  "kids armchair", "rocking horse baby", "kids luggage ride on", "baby playpen",
  "hand winch boat", "threshold ramp aluminum", "hydraulic lift motorcycle",
  "wall cabinet steel", "garage storage shelves", "truck tool box",
  "tool belt pouch", "workbench vise", "storage rack trolley",
  "greenhouse shelves", "parasol base", "tomato cage garden", "chicken coop door",
  "wheelchair folding", "massage table folding", "shoe bench storage",
  "console table industrial", "printer stand", "laundry basket bamboo",
  "camping toilet portable", "moving blankets",
];

export interface SupplierWatchConfig {
  sellerIds: Set<string>;
  terms: readonly string[];
  /** Antal termer per körning (rotationens skivstorlek). */
  termsPerRun: number;
  /** Max detalj-API-anrop per körning (dyraste resursen). */
  maxDetailCalls: number;
  /** Max produkter att köa per körning. */
  maxEnqueues: number;
  /** Skippa produkter vars billigaste in-stock-variant kostar mer (USD). */
  maxCostUsd: number;
  /** TTL för negativ-cachen (dagar). */
  seenTtlDays: number;
  /** true = rapportera bara, köa inget. */
  dryRun: boolean;
}

export const DEFAULT_TERMS_PER_RUN = 6;
export const DEFAULT_MAX_DETAIL_CALLS = 60;
export const DEFAULT_MAX_ENQUEUES = 8;
export const DEFAULT_MAX_COST_USD = 250;
export const DEFAULT_SEEN_TTL_DAYS = 45;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** Läser konfig ur env med säkra defaults (dry-run PÅ tills motsatsen bevisats). */
export function supplierWatchConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): SupplierWatchConfig {
  const sellerIdsRaw = (env.SUPPLIER_WATCH_SELLER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const termsRaw = (env.SUPPLIER_WATCH_TERMS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    sellerIds: new Set(sellerIdsRaw.length > 0 ? sellerIdsRaw : DEFAULT_WATCHED_SELLER_IDS),
    terms: termsRaw.length > 0 ? termsRaw : DEFAULT_WATCH_TERMS,
    termsPerRun: parsePositiveInt(env.SUPPLIER_WATCH_TERMS_PER_RUN, DEFAULT_TERMS_PER_RUN),
    maxDetailCalls: parsePositiveInt(env.SUPPLIER_WATCH_MAX_DETAIL_CALLS, DEFAULT_MAX_DETAIL_CALLS),
    maxEnqueues: parsePositiveInt(env.SUPPLIER_WATCH_MAX_IMPORTS_PER_RUN, DEFAULT_MAX_ENQUEUES),
    maxCostUsd: parsePositiveInt(env.SUPPLIER_WATCH_MAX_COST_USD, DEFAULT_MAX_COST_USD),
    seenTtlDays: parsePositiveInt(env.SUPPLIER_WATCH_SEEN_TTL_DAYS, DEFAULT_SEEN_TTL_DAYS),
    // Dry-run är default — kräver explicit "false" för att börja köa.
    dryRun: env.SUPPLIER_WATCH_DRY_RUN !== "false",
  };
}

/**
 * Deterministisk term-rotation utan lagrat state: dag-index väljer skiva.
 * Med 36 termer och 6/körning täcks hela listan var 6:e dag.
 */
export function selectTermsForRun(
  terms: readonly string[],
  termsPerRun: number,
  dayIndex: number,
): string[] {
  if (terms.length === 0 || termsPerRun <= 0) return [];
  const sliceCount = Math.ceil(terms.length / termsPerRun);
  const slice = ((dayIndex % sliceCount) + sliceCount) % sliceCount;
  return terms.slice(slice * termsPerRun, (slice + 1) * termsPerRun);
}

export interface SupplierWatchMatch {
  aeProductId: string;
  title: string;
  storeId: string;
  storeName?: string;
  /** Billigaste in-stock-variant (USD) — grov marginal-sanity i rapporten. */
  minCostUsd: number;
  hasEuWarehouse: boolean;
  sourceUrl: string;
  /** Term som hittade produkten (för att utvärdera termlistan). */
  foundByTerm: string;
}

export interface SupplierWatchSummary {
  termsUsed: string[];
  /** Sökträffar per term (för att se döda termer). */
  hitsPerTerm: Record<string, number>;
  searchErrors: string[];
  detailCalls: number;
  detailErrors: number;
  skipped: {
    alreadyImported: number;
    seenCache: number;
    wrongSeller: number;
    noEu: number;
    noStock: number;
    tooExpensive: number;
  };
  matches: SupplierWatchMatch[];
  /** null = inget att köa; { dryRun: true } = matchningar fanns men dry-run. */
  enqueue: null | { dryRun: true } | { jobId: string; itemCount: number } | { error: string };
  dryRun: boolean;
}

export interface SupplierWatchDeps {
  search(term: string): Promise<AliExpressSearchResult[]>;
  getDetail(productId: string): Promise<AliExpressDsProduct>;
  /** supplierProductId för allt som redan importerats (FyndplatsMappings). */
  listExistingSupplierProductIds(): Promise<Set<string>>;
  /** Färsk (TTL-filtrerad) negativ-cache. */
  listSeen(ttlDays: number): Promise<Map<string, SupplierWatchSeenRecord>>;
  saveSeen(records: SupplierWatchSeenRecord[]): Promise<void>;
  /** Köar URL:er i bulk-importen. Kastar inte — mappa fel till { error }. */
  enqueue(matches: SupplierWatchMatch[]): Promise<{ jobId: string; itemCount: number } | { error: string }>;
  now?: () => number;
}

function productUrl(aeProductId: string): string {
  return `https://www.aliexpress.com/item/${aeProductId}.html`;
}

/** Billigaste pris bland in-stock-varianter. Infinity om inget finit pris finns. */
function minInStockCostUsd(detail: AliExpressDsProduct): number {
  let min = Infinity;
  for (const v of detail.variants) {
    if ((v.stock ?? 0) <= 0) continue;
    if (Number.isFinite(v.price) && v.price > 0 && v.price < min) min = v.price;
  }
  return min;
}

export async function runSupplierWatch(
  deps: SupplierWatchDeps,
  config: SupplierWatchConfig,
): Promise<SupplierWatchSummary> {
  const now = deps.now ?? (() => Date.now());
  const dayIndex = Math.floor(now() / 86_400_000);
  const terms = selectTermsForRun(config.terms, config.termsPerRun, dayIndex);

  const summary: SupplierWatchSummary = {
    termsUsed: terms,
    hitsPerTerm: {},
    searchErrors: [],
    detailCalls: 0,
    detailErrors: 0,
    skipped: {
      alreadyImported: 0,
      seenCache: 0,
      wrongSeller: 0,
      noEu: 0,
      noStock: 0,
      tooExpensive: 0,
    },
    matches: [],
    enqueue: null,
    dryRun: config.dryRun,
  };

  const [existing, seen] = await Promise.all([
    deps.listExistingSupplierProductIds(),
    deps.listSeen(config.seenTtlDays),
  ]);

  // Dubblettskydd INOM körningen — samma produkt kan träffa flera termer.
  const checkedThisRun = new Set<string>();
  const newSeen: SupplierWatchSeenRecord[] = [];

  const reject = (
    id: string,
    reason: SupplierWatchSkipReason,
    detail?: AliExpressDsProduct,
  ): void => {
    newSeen.push({
      aeProductId: id,
      reason,
      storeId: detail?.storeId,
      storeName: detail?.storeName,
      title: detail?.title?.slice(0, 120),
      checkedAt: new Date(now()).toISOString(),
    });
  };

  outer: for (const term of terms) {
    let hits: AliExpressSearchResult[];
    try {
      hits = await deps.search(term);
    } catch (err) {
      summary.searchErrors.push(
        `${term}: ${err instanceof Error ? err.message.slice(0, 160) : String(err)}`,
      );
      continue;
    }
    summary.hitsPerTerm[term] = hits.length;

    for (const hit of hits) {
      const id = hit.productId;
      if (!id || checkedThisRun.has(id)) continue;
      if (existing.has(id)) {
        summary.skipped.alreadyImported++;
        continue;
      }
      if (seen.has(id)) {
        summary.skipped.seenCache++;
        continue;
      }
      // Kapacitetstak: sluta detalj-kolla när köandet ändå är fullt.
      if (summary.matches.length >= config.maxEnqueues) break outer;
      if (summary.detailCalls >= config.maxDetailCalls) break outer;

      checkedThisRun.add(id);
      summary.detailCalls++;

      let detail: AliExpressDsProduct;
      try {
        detail = await deps.getDetail(id);
      } catch {
        // Transient? Cacha INTE — låt nästa körning försöka igen.
        summary.detailErrors++;
        continue;
      }

      if (!detail.storeId || !config.sellerIds.has(detail.storeId)) {
        summary.skipped.wrongSeller++;
        reject(id, "wrong_seller", detail);
        continue;
      }
      if (!detail.hasEuWarehouse) {
        summary.skipped.noEu++;
        reject(id, "no_eu", detail);
        continue;
      }
      const minCost = minInStockCostUsd(detail);
      if (!Number.isFinite(minCost)) {
        summary.skipped.noStock++;
        reject(id, "no_stock", detail);
        continue;
      }
      if (minCost > config.maxCostUsd) {
        summary.skipped.tooExpensive++;
        reject(id, "too_expensive", detail);
        continue;
      }

      summary.matches.push({
        aeProductId: id,
        title: detail.title,
        storeId: detail.storeId,
        storeName: detail.storeName,
        minCostUsd: minCost,
        hasEuWarehouse: true,
        sourceUrl: productUrl(id),
        foundByTerm: term,
      });
    }
  }

  // Persistera avslag — best effort: en trasig cache-write ska inte fälla
  // körningen (kostnaden är bara extra API-anrop nästa gång).
  if (newSeen.length > 0) {
    try {
      await deps.saveSeen(newSeen);
    } catch {
      // rapporteras implicit via att cachen inte växer; medvetet tyst
    }
  }

  if (summary.matches.length > 0) {
    summary.enqueue = config.dryRun ? { dryRun: true } : await deps.enqueue(summary.matches);
  }

  return summary;
}
