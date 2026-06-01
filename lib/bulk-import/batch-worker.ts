// Batch API-worker (#8) — tvåfas-tillståndsmaskin för BAKGRUNDS-importer.
//
// Anthropic Message Batches svarar inte synkront (upp till 24 h, oftast 5–15 min),
// så en vanlig cron-tick kan inte både skicka och vänta. Vi delar därför upp det:
//
//   FAS 1 (FINISH): hitta rader i status "awaiting_batch", polla deras batch. När
//     batchen är klar → hämta resultaten och kör klart importen (Wix-create m.m.)
//     med det förgenererade innehållet injicerat (inget nytt Claude-textanrop).
//   FAS 2 (SUBMIT): skrapa pending-rader, skicka in dem som EN batch (50 % rabatt)
//     och markera dem "awaiting_batch". Nästa tick plockar upp dem i FAS 1.
//
// Gatas av USE_BATCH_API (default av) — när av körs den vanliga synkrona workern
// och denna fil laddas aldrig. Den synkrona vägen är oförändrad.

import { getBulkImportStore, type BulkImportItem } from "./store";
import { scrapeAndDedupe, finishImport, type WorkerRunOptions, type WorkerRunResult } from "./worker";
import {
  submitProductContentBatch,
  getBatchStatus,
  fetchBatchResults,
  type BatchInputItem,
} from "../claude/batch";
import { getCollections } from "../wix/client";
import { audit } from "../audit";
import type { AliExpressProduct } from "../import/types";
import type { CollectionOption } from "../claude/types";
import type { ProductContent } from "../import/generate";

function emptyResult(): WorkerRunResult {
  return {
    jobsTouched: 0,
    itemsProcessed: 0,
    itemsSucceeded: 0,
    itemsFailed: 0,
    itemsRetried: 0,
    itemsSkipped: 0,
    stoppedDueToBudget: false,
    errors: [],
  };
}

export async function runBulkImportBatchWorker(opts: WorkerRunOptions = {}): Promise<WorkerRunResult> {
  const store = getBulkImportStore();
  const maxItems = opts.maxItems ?? 10;
  const result = emptyResult();

  const jobs = await store.listJobs(50);
  const active = jobs.filter((j) => j.status === "pending" || j.status === "running");
  if (active.length === 0) return result;

  // Kollektioner delas av alla rader i körningen (kategori-kontext + finish-länk).
  let collections: CollectionOption[] = [];
  try {
    collections = (await getCollections()).map((c) => ({ slug: c.slug, name: c.name, description: c.description }));
  } catch (err) {
    console.warn("[bulk-batch] getCollections failade:", err instanceof Error ? err.message : err);
  }

  // ---- FAS 1: FINISH klara batchar ----------------------------------------
  for (const job of active) {
    const items = await store.listItems(job.id);
    const awaiting = items.filter((i) => i.status === "awaiting_batch" && i.batchId);
    if (awaiting.length === 0) continue;
    result.jobsTouched++;

    const byBatch = new Map<string, BulkImportItem[]>();
    for (const it of awaiting) {
      const arr = byBatch.get(it.batchId!) ?? [];
      arr.push(it);
      byBatch.set(it.batchId!, arr);
    }

    for (const [batchId, group] of byBatch) {
      let ended = false;
      try {
        ended = (await getBatchStatus(batchId)).ended;
      } catch (err) {
        console.warn(`[bulk-batch] getBatchStatus(${batchId}) failade:`, err instanceof Error ? err.message : err);
        continue; // försök igen nästa tick
      }
      if (!ended) continue; // fortfarande in_progress

      // Hämta + normalisera resultaten. Saknas en rad i svaret → finishImport utan
      // preGenerated (direkt generering som fallback) så raden ändå blir klar.
      const context = new Map<string, { product: AliExpressProduct; collections: CollectionOption[] }>();
      for (const it of group) {
        const p = parseProduct(it);
        if (p) context.set(it.id, { product: p, collections });
      }
      let contentByCustomId: Map<string, ProductContent> = new Map();
      try {
        contentByCustomId = await fetchBatchResults(batchId, context);
      } catch (err) {
        console.warn(`[bulk-batch] fetchBatchResults(${batchId}) failade:`, err instanceof Error ? err.message : err);
        continue;
      }

      for (const it of group) {
        result.itemsProcessed++;
        const product = parseProduct(it);
        if (!product) {
          await markFailed(store, it, "Saknar sparad produktdata (productJson) för batch-finish.");
          await bumpJob(store, job.id, "failed");
          result.itemsFailed++;
          continue;
        }
        try {
          const outcome = await finishImport(it, product, contentByCustomId.get(it.id));
          if (outcome.skipped) {
            it.status = "skipped";
            it.error = outcome.skipReason ?? "Hoppades över";
          } else {
            it.status = "done";
            it.wixProductId = outcome.wixProductId;
            it.wixProductSlug = outcome.wixProductSlug;
            it.error = undefined;
            await bumpJob(store, job.id, "succeeded");
          }
          it.completedAt = new Date().toISOString();
          await store.updateItem(it);
          if (outcome.skipped) result.itemsSkipped++;
          else result.itemsSucceeded++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          await markFailed(store, it, msg);
          await bumpJob(store, job.id, "failed");
          result.itemsFailed++;
          result.errors.push({ itemId: it.id, error: msg });
        }
      }
    }
    await maybeComplete(store, job.id);
  }

  // ---- FAS 2: SUBMIT pending-rader som en batch ----------------------------
  let remaining = maxItems;
  for (const job of active) {
    if (remaining <= 0) break;
    const fresh = await store.getJob(job.id);
    if (!fresh || fresh.status === "stopped") continue;
    if (fresh.status === "pending") {
      fresh.status = "running";
      fresh.startedAt = fresh.startedAt ?? new Date().toISOString();
      await store.updateJob(fresh);
    }

    const pend = await store.pickPendingItems(job.id, remaining);
    if (pend.length === 0) {
      await maybeComplete(store, job.id);
      continue;
    }
    result.jobsTouched++;

    const inputs: BatchInputItem[] = [];
    for (const it of pend) {
      remaining--;
      it.attempts = (it.attempts ?? 0) + 1;
      it.attemptedAt = new Date().toISOString();
      try {
        const r = await scrapeAndDedupe(it);
        if ("skip" in r) {
          it.status = "skipped";
          it.error = r.skip.skipReason;
          it.wixProductId = r.skip.wixProductId;
          it.completedAt = new Date().toISOString();
          await store.updateItem(it);
          result.itemsSkipped++;
          continue;
        }
        it.productJson = JSON.stringify(r.product);
        await store.updateItem(it); // persistera skrapdatan innan submit
        inputs.push({ customId: it.id, product: r.product, collections });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await markFailed(store, it, msg);
        await bumpJob(store, job.id, "failed");
        result.itemsFailed++;
        result.errors.push({ itemId: it.id, error: msg });
      }
    }

    if (inputs.length === 0) continue;

    let batchId: string;
    try {
      batchId = await submitProductContentBatch(inputs);
    } catch (err) {
      // Submit failade — lämna raderna pending (productJson finns kvar) för retry
      // nästa tick. Logga men fäll inte jobbet.
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[bulk-batch] submitProductContentBatch failade:", msg);
      await audit("bulk-import-batch-submit-failed", job.id, msg.slice(0, 200));
      continue;
    }

    const now = new Date().toISOString();
    for (const inp of inputs) {
      const it = pend.find((p) => p.id === inp.customId);
      if (!it) continue;
      it.status = "awaiting_batch";
      it.batchId = batchId;
      it.batchCustomId = inp.customId;
      it.batchSubmittedAt = now;
      await store.updateItem(it);
      result.itemsProcessed++;
    }
    await audit("bulk-import-batch-submitted", batchId, `${inputs.length} rader (job ${job.id})`);
  }

  return result;
}

function parseProduct(it: BulkImportItem): AliExpressProduct | null {
  if (!it.productJson) return null;
  try {
    return JSON.parse(it.productJson) as AliExpressProduct;
  } catch {
    return null;
  }
}

async function markFailed(store: ReturnType<typeof getBulkImportStore>, it: BulkImportItem, msg: string): Promise<void> {
  it.status = "failed";
  it.error = msg.slice(0, 500);
  it.completedAt = new Date().toISOString();
  await store.updateItem(it);
}

async function bumpJob(
  store: ReturnType<typeof getBulkImportStore>,
  jobId: string,
  field: "succeeded" | "failed",
): Promise<void> {
  const fresh = await store.getJob(jobId);
  if (!fresh) return;
  fresh[field] = (fresh[field] ?? 0) + 1;
  await store.updateJob(fresh);
}

/** Markera jobbet klart när inga pending OCH inga awaiting_batch-rader återstår. */
async function maybeComplete(store: ReturnType<typeof getBulkImportStore>, jobId: string): Promise<void> {
  const fresh = await store.getJob(jobId);
  if (!fresh || ["completed", "failed", "stopped"].includes(fresh.status)) return;
  const items = await store.listItems(jobId);
  const open = items.filter((i) => i.status === "pending" || i.status === "awaiting_batch" || i.status === "importing");
  if (open.length > 0) return;
  fresh.status = (fresh.failed ?? 0) > 0 && (fresh.succeeded ?? 0) === 0 ? "failed" : "completed";
  fresh.completedAt = new Date().toISOString();
  await store.updateJob(fresh);
  try {
    await audit("bulk-import-job-completed", jobId, `succ=${fresh.succeeded ?? 0} fail=${fresh.failed ?? 0} (batch)`);
  } catch {
    /* audit får inte fälla slutförande */
  }
}
