// Bulk-import worker. Konsumerar pending-items från jobbet, kör importen, och
// skriver tillbaka status. En körning processar upp till `maxItems` rader och
// återvänder direkt — Vercel-cron triggar nästa körning en minut senare.
//
// Designval:
//   - 1 item / 3 sekunder för att respektera AliExpress rate-limit. Vi
//     processerar items sekventiellt inom en körning men ger upp om
//     vägg-klockan närmar sig Vercels lambda-timeout (45 s default).
//   - Retry: 1 omförsök vid AliExpress 5xx eller throttling. Vi taggar items
//     som "failed" först när attempts >= 2.
//   - Importresultatet (wixProductId) skrivs både på item OCH som mapping i
//     den ordinarie storen — samma kodväg som /api/import.
//
// Den här filen är fri från Wix Data-specifik kod — den anropar
// BulkImportStore och getStore() abstraktionerna.

import { getBulkImportStore, type BulkImportItem, type BulkImportJob } from "./store";
import { fetchAliExpressProductFromUrl } from "../import/from-url";
import { importProduct } from "../import/pipeline";
import type { ProductContent } from "../import/generate";
import type { AliExpressProduct } from "../import/types";
import { describeRouting, resolveImportPath, type TriggerSource } from "../import/trigger-routing";
import { getPricingRules } from "../store/pricing-config";
import { getStore } from "../store/factory";
import { getImportCostStore } from "../store/import-costs";
import { audit } from "../audit";
import { addProductToCollection, getCollections } from "../wix/client";

const ITEM_DELAY_MS = 3000;
const MAX_ATTEMPTS = 2;
const DEFAULT_RUN_BUDGET_MS = 45_000;

export interface WorkerRunOptions {
  /** Max antal items att försöka i denna körning. */
  maxItems?: number;
  /** Hård budget i ms. Om vi närmar oss avbryter vi utan att starta nytt item. */
  budgetMs?: number;
  /** Tar bort sleep mellan items — bara för tester. */
  disableDelay?: boolean;
  /** Override import-funktionen — för integrationstester. */
  importerOverride?: (item: BulkImportItem) => Promise<ImportOutcome>;
  /**
   * Var körningen startade. Avgör (via lib/import/trigger-routing.ts) om vi får
   * gå via Batch API (latens-tolerant) eller måste köra realtid. Saknas = "cron"
   * (worker triggas normalt av Vercel Cron).
   */
  triggerSource?: TriggerSource;
}

export interface WorkerRunResult {
  jobsTouched: number;
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  itemsRetried: number;
  itemsSkipped: number;
  stoppedDueToBudget: boolean;
  errors: { itemId: string; error: string }[];
}

export interface ImportOutcome {
  wixProductId?: string;
  wixProductSlug?: string;
  skipped?: boolean;
  /** Anledning till skipped (visas i resultatet, t.ex. "Redan importerad"). */
  skipReason?: string;
}

/** En körning av workern. Pullar upp till maxItems items från aktiva jobb. */
export async function runBulkImportWorker(opts: WorkerRunOptions = {}): Promise<WorkerRunResult> {
  // Smart routing (#smart-routing): batch vs realtid avgörs av trigger-källan +
  // master-flaggan USE_BATCH_API. Bakgrundskällor (cron/bulk/admin-batch) får gå
  // via Batch API (50 % rabatt); en importerOverride (tester) tvingar realtid.
  // Dynamisk import undviker en statisk cykel (batch-worker importerar härifrån).
  const triggerSource: TriggerSource = opts.triggerSource ?? "cron";
  const path = opts.importerOverride ? "realtime" : resolveImportPath(triggerSource);
  console.log(`[bulk-import] ${describeRouting(triggerSource)}`);
  if (path === "batch") {
    const { runBulkImportBatchWorker } = await import("./batch-worker");
    return runBulkImportBatchWorker(opts);
  }

  const store = getBulkImportStore();
  const startMs = Date.now();
  const maxItems = opts.maxItems ?? 10;
  const budget = opts.budgetMs ?? DEFAULT_RUN_BUDGET_MS;
  const result: WorkerRunResult = {
    jobsTouched: 0,
    itemsProcessed: 0,
    itemsSucceeded: 0,
    itemsFailed: 0,
    itemsRetried: 0,
    itemsSkipped: 0,
    stoppedDueToBudget: false,
    errors: [],
  };

  const jobs = await store.listJobs(50);
  const active = jobs.filter((j) => j.status === "pending" || j.status === "running");
  if (active.length === 0) return result;

  let itemsRemaining = maxItems;
  for (const job of active) {
    if (itemsRemaining <= 0) break;
    if (Date.now() - startMs > budget * 0.9) {
      result.stoppedDueToBudget = true;
      break;
    }

    // Om jobbet just nu är "pending" → flytta till "running" innan första item.
    if (job.status === "pending") {
      job.status = "running";
      job.startedAt = job.startedAt ?? new Date().toISOString();
      await store.updateJob(job);
    }

    const items = await store.pickPendingItems(job.id, itemsRemaining);
    if (items.length === 0) {
      // Inget kvar att göra; maybe-completion check.
      await maybeCompleteJob(job, store);
      continue;
    }

    result.jobsTouched++;

    for (const item of items) {
      if (Date.now() - startMs > budget * 0.9) {
        result.stoppedDueToBudget = true;
        break;
      }
      itemsRemaining--;
      result.itemsProcessed++;

      // Kolla att jobbet inte stoppats mitt i denna körning.
      const fresh = await store.getJob(job.id);
      if (!fresh || fresh.status === "stopped") {
        // Markera resten av items som skipped och bryt.
        item.status = "skipped";
        item.error = "Jobbet stoppades innan importen kunde köras";
        item.completedAt = new Date().toISOString();
        await store.updateItem(item);
        result.itemsSkipped++;
        continue;
      }

      const outcome = await processItem(item, job, store, opts, result);
      if (outcome === "succeeded") result.itemsSucceeded++;
      else if (outcome === "failed") result.itemsFailed++;
      else if (outcome === "retried") result.itemsRetried++;
      else if (outcome === "skipped") result.itemsSkipped++;

      if (!opts.disableDelay && itemsRemaining > 0) {
        await sleep(ITEM_DELAY_MS);
      }
    }

    await maybeCompleteJob(job, store);
  }

  return result;
}

type ItemOutcomeTag = "succeeded" | "failed" | "retried" | "skipped";

async function processItem(
  item: BulkImportItem,
  job: BulkImportJob,
  store: ReturnType<typeof getBulkImportStore>,
  opts: WorkerRunOptions,
  result: WorkerRunResult,
): Promise<ItemOutcomeTag> {
  item.status = "importing";
  item.attempts = (item.attempts ?? 0) + 1;
  item.attemptedAt = new Date().toISOString();
  await store.updateItem(item);

  try {
    const outcome = opts.importerOverride
      ? await opts.importerOverride(item)
      : await defaultImporter(item);

    if (outcome.skipped) {
      item.status = "skipped";
      item.error = outcome.skipReason ?? "Hoppades över";
      item.completedAt = new Date().toISOString();
      await store.updateItem(item);
      return "skipped";
    }

    item.status = "done";
    item.wixProductId = outcome.wixProductId;
    item.wixProductSlug = outcome.wixProductSlug;
    item.error = undefined;
    item.completedAt = new Date().toISOString();
    await store.updateItem(item);

    // Re-läs jobbet inifrån storen så vi inte skriver tillbaka en stale status
    // (t.ex. om Leonard hann stoppa jobbet medan vi importerade).
    await incrementJobCounter(job.id, store, "succeeded");
    return "succeeded";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const retryable = isRetryable(err);
    if (retryable && (item.attempts ?? 0) < MAX_ATTEMPTS) {
      // Lämna i pending för nästa cron-körning men spara felmeddelandet
      // som diagnostik. Exponential backoff: andra försöket dröjer minst
      // ITEM_DELAY_MS * attempt, vilket vi får gratis genom att nästa
      // cron-runda är 60 s senare.
      item.status = "pending";
      item.error = `Retry ${item.attempts}/${MAX_ATTEMPTS}: ${msg.slice(0, 240)}`;
      await store.updateItem(item);
      result.errors.push({ itemId: item.id, error: msg });
      return "retried";
    }

    item.status = "failed";
    item.error = msg.slice(0, 500);
    item.completedAt = new Date().toISOString();
    await store.updateItem(item);
    await incrementJobCounter(job.id, store, "failed");
    result.errors.push({ itemId: item.id, error: msg });
    return "failed";
  }
}

/** Re-läser, ökar counter, skriver tillbaka — undviker att överskriva en
 * status-ändring som hänt parallellt (t.ex. manuell stop). */
async function incrementJobCounter(
  jobId: string,
  store: ReturnType<typeof getBulkImportStore>,
  field: "succeeded" | "failed",
): Promise<void> {
  const fresh = await store.getJob(jobId);
  if (!fresh) return;
  fresh[field] = (fresh[field] ?? 0) + 1;
  await store.updateJob(fresh);
}

async function maybeCompleteJob(
  job: BulkImportJob,
  store: ReturnType<typeof getBulkImportStore>,
): Promise<void> {
  const fresh = await store.getJob(job.id);
  if (!fresh || fresh.status === "completed" || fresh.status === "failed" || fresh.status === "stopped") return;
  const pending = await store.pickPendingItems(job.id, 1);
  if (pending.length > 0) return;

  fresh.status = (fresh.failed ?? 0) > 0 && (fresh.succeeded ?? 0) === 0 ? "failed" : "completed";
  fresh.completedAt = new Date().toISOString();
  await store.updateJob(fresh);
  try {
    await audit(
      "bulk-import-job-completed",
      job.id,
      `succ=${fresh.succeeded ?? 0} fail=${fresh.failed ?? 0} total=${fresh.totalRows ?? 0}`,
    );
  } catch {
    // Audit får inte stoppa jobb-slutförande.
  }
}

// ---------------------------------------------------------------------------
// Default importer: AliExpress URL → AliExpressProduct → importProduct + spara
// mapping. Speglar /api/import-rutten men förbi HTTP-lagret.
// ---------------------------------------------------------------------------

/**
 * Skrapar AliExpress-URL:en och kollar dedupe. Returnerar antingen den skrapade
 * produkten (för import) eller ett skip-utfall om den redan finns. Delas av det
 * synkrona flödet och Batch API-submit-fasen (lib/bulk-import/batch-worker.ts).
 */
export async function scrapeAndDedupe(
  item: BulkImportItem,
): Promise<{ product: AliExpressProduct } | { skip: ImportOutcome }> {
  const ordinaryStore = getStore();
  const fetched = await fetchAliExpressProductFromUrl(item.aliexpressUrl);
  try {
    const allMappings = await ordinaryStore.listMappings();
    const existing = allMappings.find((m) => m.supplierProductId === fetched.supplierProductId);
    if (existing) {
      return {
        skip: {
          skipped: true,
          skipReason: `Redan importerad — finns som Wix-produkt ${existing.wixProductId}`,
          wixProductId: existing.wixProductId,
        },
      };
    }
  } catch (lookupErr) {
    // Dedupe-misslyckande får inte stoppa importen — Leonard kan rensa dubbletter senare.
    console.warn(
      "[bulk-import] dedupe-uppslag failade, fortsätter med import:",
      lookupErr instanceof Error ? lookupErr.message : lookupErr,
    );
  }
  return { product: fetched.product };
}

async function defaultImporter(item: BulkImportItem): Promise<ImportOutcome> {
  const r = await scrapeAndDedupe(item);
  if ("skip" in r) return r.skip;
  return finishImport(item, r.product);
}

/**
 * Kör själva importen (importProduct) och persisterar mapping/cost/kollektion/audit.
 * `preGenerated` injiceras av Batch API-flödet (#8) så importen INTE gör ett nytt
 * Claude-textanrop. Delas av det synkrona flödet och batch-finish-fasen.
 */
export async function finishImport(
  item: BulkImportItem,
  product: AliExpressProduct,
  preGenerated?: ProductContent,
): Promise<ImportOutcome> {
  const ordinaryStore = getStore();
  const result = await importProduct(product, await getPricingRules(), undefined, undefined, preGenerated);

  // Spara mapping (samma form som /api/import gör).
  const resultAny = result as unknown as Record<string, unknown>;
  const mappingExtras: Record<string, unknown> = {};
  if (resultAny.imageAnalysis !== undefined) mappingExtras.imageAnalysis = resultAny.imageAnalysis;
  if (resultAny.categorySuggestion !== undefined) mappingExtras.categorySuggestion = resultAny.categorySuggestion;

  await ordinaryStore.saveMapping({
    supplierProductId: result.supplierProductId,
    wixProductId: result.wixProductId,
    variants: result.variantMappings,
    draftStatus: "pending_review",
    createdAt: new Date().toISOString(),
    seoTitle: result.seo.title,
    sourceUrl: item.aliexpressUrl,
    ...mappingExtras,
  });

  // Import-cost-rad (best-effort, samma mönster som /api/import).
  try {
    const variants = result.variantMappings;
    const avgCostSek = variants.length > 0
      ? variants.reduce((s, v) => s + (v.landedCostSek ?? 0), 0) / variants.length
      : 0;
    const avgCostUsd = variants.length > 0
      ? variants.reduce((s, v) => s + (v.costUsd ?? 0), 0) / variants.length
      : 0;
    if (avgCostSek > 0) {
      await getImportCostStore().upsert({
        productId: result.wixProductId,
        costSek: Math.round(avgCostSek * 100) / 100,
        costUsd: avgCostUsd || undefined,
        currency: "SEK",
        importedAt: new Date().toISOString(),
        source: "aliexpress",
      });
    }
  } catch (costErr) {
    console.warn(
      "[bulk-import] FyndplatsImportCosts.upsert failade (icke-fatalt):",
      costErr instanceof Error ? costErr.message : costErr,
    );
  }

  // Om CSV-raden angav en kollektion → koppla in produkten där också.
  if (item.collectionSlug) {
    try {
      const cols = await getCollections();
      const match = cols.find((c) => c.slug === item.collectionSlug);
      if (match) await addProductToCollection(result.wixProductId, match.id);
    } catch (err) {
      console.warn(
        `[bulk-import] Kunde inte koppla ${result.wixProductId} till kollektion "${item.collectionSlug}":`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  await audit("bulk-import-item-done", result.wixProductId, result.seo.title);

  return {
    wixProductId: result.wixProductId,
    wixProductSlug: result.slug,
  };
}

function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const m = err.message.toLowerCase();
  if (m.includes("timeout") || m.includes("etimedout")) return true;
  if (m.includes("rate limit") || m.includes("too many requests") || m.includes("429")) return true;
  if (/\b(5\d{2})\b/.test(m) && !m.includes("404")) return true;
  if (m.includes("network") || m.includes("fetch failed")) return true;
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
