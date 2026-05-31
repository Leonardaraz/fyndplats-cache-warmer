// Service-lager för bulk-import: skapar jobb + items från en parsed CSV,
// kollar anti-abuse-caps, och returnerar jobbet redo för worker att plocka upp.
//
// Anti-abuse:
//   - 500 rader max per jobb (hard cap från CSV-parsern).
//   - Endast ett aktivt jobb i taget per createdBy (eller globalt om createdBy
//     saknas). Anropare måste kolla findActiveJob() innan.
//   - Daily cap: BULK_IMPORT_DAILY_CAP env (default 1000). Summan av totalRows
//     över alla jobb skapade senaste 24h får inte överstiga taket.

import { randomUUID } from "node:crypto";
import {
  getBulkImportStore,
  type BulkImportJob,
  type BulkImportItem,
  type BulkImportStore,
} from "./store";
import type { ParsedCsv } from "./csv";

export const DEFAULT_DAILY_CAP = 1000;
export const HARD_ROW_CAP = 500;

export class BulkImportLimitError extends Error {
  constructor(
    public readonly code:
      | "no_valid_rows"
      | "concurrent_job"
      | "daily_cap"
      | "row_cap",
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "BulkImportLimitError";
  }
}

export interface CreateJobInput {
  csv: ParsedCsv;
  createdBy?: string;
  notes?: string;
}

export interface CreateJobResult {
  job: BulkImportJob;
  items: BulkImportItem[];
  skippedValidationCount: number;
}

export async function createBulkImportJob(input: CreateJobInput): Promise<CreateJobResult> {
  const store = getBulkImportStore();

  // 1. Filter ut radspecifika valideringsfel — de skapas inte som items, de
  // bör hanteras innan användaren bekräftar (UI:t visar dem i previewen).
  const validRows = input.csv.rows.filter((r) => r.errors.length === 0);
  const skippedValidationCount = input.csv.rows.length - validRows.length;
  if (validRows.length === 0) {
    throw new BulkImportLimitError(
      "no_valid_rows",
      "Inga giltiga rader att importera",
      { totalRows: input.csv.rows.length, skippedValidationCount },
    );
  }
  if (validRows.length > HARD_ROW_CAP) {
    throw new BulkImportLimitError(
      "row_cap",
      `Max ${HARD_ROW_CAP} rader per jobb`,
      { actual: validRows.length },
    );
  }

  // 2. Endast ett aktivt jobb per createdBy.
  const conflict = await store.findActiveJob(input.createdBy);
  if (conflict) {
    throw new BulkImportLimitError(
      "concurrent_job",
      "Ett aktivt bulk-import-jobb pågår redan — vänta tills det är klart eller stoppa det först",
      { activeJobId: conflict.id, status: conflict.status },
    );
  }

  // 3. Daily cap.
  const dailyCap = Number(process.env.BULK_IMPORT_DAILY_CAP) || DEFAULT_DAILY_CAP;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recent = await store.countRecentItems(since);
  if (recent + validRows.length > dailyCap) {
    throw new BulkImportLimitError(
      "daily_cap",
      `Dagligt tak nått — ${recent} av ${dailyCap} rader använda senaste 24h. Försök igen senare eller höj BULK_IMPORT_DAILY_CAP.`,
      { recent, dailyCap, requested: validRows.length },
    );
  }

  // 4. Skapa jobb + items.
  const jobId = `bulk-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  const job: BulkImportJob = {
    id: jobId,
    createdAt: now,
    createdBy: input.createdBy,
    status: "pending",
    totalRows: validRows.length,
    succeeded: 0,
    failed: 0,
    notes: input.notes,
  };

  const items: BulkImportItem[] = validRows.map((r) => ({
    id: `${jobId}-${String(r.rowIndex).padStart(4, "0")}`,
    jobId,
    rowIndex: r.rowIndex,
    aliexpressUrl: r.aliexpressUrl,
    collectionSlug: r.collectionSlug,
    targetPriceSek: r.targetPriceSek,
    notes: r.notes,
    status: "pending",
    attempts: 0,
  }));

  await store.createJob(job);
  await store.createItemsBulk(items);

  return { job, items, skippedValidationCount };
}

export async function stopBulkImportJob(jobId: string, reason?: string): Promise<BulkImportJob> {
  const store = getBulkImportStore();
  const job = await store.getJob(jobId);
  if (!job) throw new Error(`Jobbet ${jobId} hittades inte`);
  if (job.status === "completed" || job.status === "failed" || job.status === "stopped") {
    return job;
  }
  job.status = "stopped";
  job.completedAt = new Date().toISOString();
  job.error = reason;
  await store.updateJob(job);
  return job;
}

export interface JobWithItems {
  job: BulkImportJob;
  items: BulkImportItem[];
  /** Genomsnittlig sekunder/item baserat på faktiskt avslutade items. */
  avgSecondsPerItem: number | null;
  /** Estimerad återstående tid i sekunder; null om vi inte kan beräkna. */
  etaSeconds: number | null;
}

export async function getJobWithItems(jobId: string, store?: BulkImportStore): Promise<JobWithItems | null> {
  const s = store ?? getBulkImportStore();
  const job = await s.getJob(jobId);
  if (!job) return null;
  const items = await s.listItems(jobId);

  const completed = items.filter(
    (i) => (i.status === "done" || i.status === "failed" || i.status === "skipped") && i.completedAt,
  );
  let avgSecondsPerItem: number | null = null;
  if (completed.length >= 1 && job.startedAt) {
    const start = Date.parse(job.startedAt);
    const last = Math.max(...completed.map((i) => Date.parse(i.completedAt!)));
    const elapsedSec = (last - start) / 1000;
    if (elapsedSec > 0) avgSecondsPerItem = elapsedSec / completed.length;
  }

  const remaining = items.filter((i) => i.status === "pending" || i.status === "importing").length;
  const etaSeconds = avgSecondsPerItem !== null && remaining > 0
    ? Math.ceil(avgSecondsPerItem * remaining)
    : remaining > 0
      ? remaining * 3 // worker-konstanten är 3 s/item innan vi har data
      : 0;

  return { job, items, avgSecondsPerItem, etaSeconds };
}
