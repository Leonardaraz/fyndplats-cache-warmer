// Bulk-import-jobb-store. Speglar migrations/004_bulk_import.sql men kör
// faktiskt mot Wix Data-kollektionerna FyndplatsBulkImportJobs och
// FyndplatsBulkImportItems. Följer exakt samma mönster som
// lib/sync/sync-log.ts.
//
// Två kollektioner:
//   FyndplatsBulkImportJobs   — en rad per uppladdad CSV-batch
//   FyndplatsBulkImportItems  — en rad per CSV-rad (max 500 per job)
//
// Memory-fallback för dev/test så att UI:t inte kraschar utan WIX_API_TOKEN.
// Ligger KVAR i Wix Data efter Postgres-migreringen — se lib/store/backend.ts.

import { isPersistentBackend } from "../store/backend";

const WIX_BASE = "https://www.wixapis.com";

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

const COL = {
  jobs: process.env.WIX_DATA_COL_BULK_JOBS ?? "FyndplatsBulkImportJobs",
  items: process.env.WIX_DATA_COL_BULK_ITEMS ?? "FyndplatsBulkImportItems",
};

export type BulkJobStatus = "pending" | "running" | "completed" | "failed" | "stopped";
export type BulkItemStatus =
  | "pending"
  | "importing"
  | "awaiting_batch" // Batch API (#8): skrapad + inskickad, väntar på Anthropic-svar
  | "done"
  | "failed"
  | "skipped";

export interface BulkImportJob {
  id: string;
  createdAt: string;        // ISO
  createdBy?: string;
  status: BulkJobStatus;
  totalRows: number;
  succeeded: number;
  failed: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  notes?: string;
}

export interface BulkImportItem {
  id: string;               // `${jobId}-${rowIndex}`
  jobId: string;
  rowIndex: number;
  aliexpressUrl: string;
  collectionSlug?: string;
  targetPriceSek?: number;
  notes?: string;
  status: BulkItemStatus;
  attempts: number;
  wixProductId?: string;
  /** Wix-slug så att vi kan bygga queue-länk i export-CSV:n. */
  wixProductSlug?: string;
  error?: string;
  attemptedAt?: string;
  completedAt?: string;
  // --- Batch API (#8) — sätts bara när USE_BATCH_API=true ---
  /** Anthropic message_batch_id som denna rad väntar på. */
  batchId?: string;
  /** custom_id i batchen som matchar svaret tillbaka (= item.id). */
  batchCustomId?: string;
  /** ISO-tid då raden skickades in i batchen (för timeout-skydd). */
  batchSubmittedAt?: string;
  /** Skrapad AliExpressProduct (JSON) — sparas så finish-fasen slipper re-skrapa. */
  productJson?: string;
}

// ---------------------------------------------------------------------------
// Wix Data REST-helpers (samma mönster som sync-log.ts).
// ---------------------------------------------------------------------------

async function save(collection: string, id: string, data: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId: collection,
      dataItem: { id, dataCollectionId: collection, data: { _id: id, ...data } },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix Data save ${collection} (${res.status}): ${text.slice(0, 300)}`);
  }
}

async function get<T>(collection: string, id: string): Promise<T | null> {
  const url = `${WIX_BASE}/data/v2/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(collection)}`;
  const res = await fetch(url, { method: "GET", headers: headers() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix Data get ${collection} (${res.status}): ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { dataItem?: { data?: T } };
  return body.dataItem?.data ?? null;
}

async function query<T>(
  collection: string,
  filter?: Record<string, unknown>,
  sort?: { fieldName: string; order: "ASC" | "DESC" }[],
  limit = 500,
): Promise<T[]> {
  const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId: collection,
      query: { filter: filter ?? {}, sort: sort ?? [], paging: { limit } },
    }),
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    const text = await res.text();
    if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) {
      return [];
    }
    throw new Error(`Wix Data query ${collection} (${res.status}): ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { dataItems?: { data?: T }[] };
  return (body.dataItems ?? []).map((d) => d.data).filter((d): d is T => Boolean(d));
}

// ---------------------------------------------------------------------------
// Store-interface — Wix-backad och memory-backad implementation.
// ---------------------------------------------------------------------------

export interface BulkImportStore {
  createJob(job: BulkImportJob): Promise<void>;
  getJob(id: string): Promise<BulkImportJob | null>;
  updateJob(job: BulkImportJob): Promise<void>;
  listJobs(limit?: number): Promise<BulkImportJob[]>;
  /** Senaste aktiva jobbet (pending/running). Används för anti-abuse-check. */
  findActiveJob(createdBy?: string): Promise<BulkImportJob | null>;
  /** Antal rader som börjat importeras inom angiven tidsperiod — för daily-cap. */
  countRecentItems(sinceIso: string): Promise<number>;

  createItem(item: BulkImportItem): Promise<void>;
  createItemsBulk(items: BulkImportItem[]): Promise<void>;
  getItem(id: string): Promise<BulkImportItem | null>;
  updateItem(item: BulkImportItem): Promise<void>;
  listItems(jobId: string): Promise<BulkImportItem[]>;
  /** Hämta upp till `limit` pending-items från jobbet (sorterade på rowIndex). */
  pickPendingItems(jobId: string, limit: number): Promise<BulkImportItem[]>;
}

class WixDataBulkImportStore implements BulkImportStore {
  async createJob(job: BulkImportJob): Promise<void> {
    await save(COL.jobs, job.id, { ...job });
  }
  async getJob(id: string): Promise<BulkImportJob | null> {
    return get<BulkImportJob>(COL.jobs, id);
  }
  async updateJob(job: BulkImportJob): Promise<void> {
    await save(COL.jobs, job.id, { ...job });
  }
  async listJobs(limit = 50): Promise<BulkImportJob[]> {
    return query<BulkImportJob>(
      COL.jobs,
      undefined,
      [{ fieldName: "createdAt", order: "DESC" }],
      limit,
    );
  }
  async findActiveJob(createdBy?: string): Promise<BulkImportJob | null> {
    const open = await query<BulkImportJob>(
      COL.jobs,
      { status: { $in: ["pending", "running"] } },
      [{ fieldName: "createdAt", order: "DESC" }],
      20,
    );
    if (!createdBy) return open[0] ?? null;
    return open.find((j) => j.createdBy === createdBy) ?? null;
  }
  async countRecentItems(sinceIso: string): Promise<number> {
    // Wix Data har ingen count-endpoint; vi hämtar bara jobb skapade sen då
    // och summerar deras totalRows. Mer korrekt än att räkna items direkt
    // (en bulk på 500 räknas som 500 mot taket vid uppladdning).
    const jobs = await query<BulkImportJob>(
      COL.jobs,
      { createdAt: { $gte: sinceIso } },
      [{ fieldName: "createdAt", order: "DESC" }],
      500,
    );
    return jobs.reduce((s, j) => s + (j.totalRows ?? 0), 0);
  }

  async createItem(item: BulkImportItem): Promise<void> {
    await save(COL.items, item.id, { ...item });
  }
  async createItemsBulk(items: BulkImportItem[]): Promise<void> {
    // Wix bulk-save är begränsat — vi kör sekventiellt men i grupper om 25
    // för att inte överskrida någon rate-limit. Detta körs en gång per job-skapande.
    const BATCH = 25;
    for (let i = 0; i < items.length; i += BATCH) {
      const slice = items.slice(i, i + BATCH);
      await Promise.all(slice.map((it) => save(COL.items, it.id, { ...it })));
    }
  }
  async getItem(id: string): Promise<BulkImportItem | null> {
    return get<BulkImportItem>(COL.items, id);
  }
  async updateItem(item: BulkImportItem): Promise<void> {
    await save(COL.items, item.id, { ...item });
  }
  async listItems(jobId: string): Promise<BulkImportItem[]> {
    return query<BulkImportItem>(
      COL.items,
      { jobId },
      [{ fieldName: "rowIndex", order: "ASC" }],
      500,
    );
  }
  async pickPendingItems(jobId: string, limit: number): Promise<BulkImportItem[]> {
    return query<BulkImportItem>(
      COL.items,
      { jobId, status: "pending" },
      [{ fieldName: "rowIndex", order: "ASC" }],
      limit,
    );
  }
}

// In-memory store för dev/test (samma mönster som lib/store/memory.ts).
class MemoryBulkImportStore implements BulkImportStore {
  private jobs = new Map<string, BulkImportJob>();
  private items = new Map<string, BulkImportItem>();

  async createJob(job: BulkImportJob): Promise<void> {
    this.jobs.set(job.id, { ...job });
  }
  async getJob(id: string): Promise<BulkImportJob | null> {
    const j = this.jobs.get(id);
    return j ? { ...j } : null;
  }
  async updateJob(job: BulkImportJob): Promise<void> {
    this.jobs.set(job.id, { ...job });
  }
  async listJobs(limit = 50): Promise<BulkImportJob[]> {
    return [...this.jobs.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((j) => ({ ...j }));
  }
  async findActiveJob(createdBy?: string): Promise<BulkImportJob | null> {
    const open = [...this.jobs.values()]
      .filter((j) => j.status === "pending" || j.status === "running")
      .filter((j) => (createdBy ? j.createdBy === createdBy : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return open[0] ? { ...open[0] } : null;
  }
  async countRecentItems(sinceIso: string): Promise<number> {
    return [...this.jobs.values()]
      .filter((j) => j.createdAt >= sinceIso)
      .reduce((s, j) => s + (j.totalRows ?? 0), 0);
  }
  async createItem(item: BulkImportItem): Promise<void> {
    this.items.set(item.id, { ...item });
  }
  async createItemsBulk(items: BulkImportItem[]): Promise<void> {
    for (const it of items) this.items.set(it.id, { ...it });
  }
  async getItem(id: string): Promise<BulkImportItem | null> {
    const it = this.items.get(id);
    return it ? { ...it } : null;
  }
  async updateItem(item: BulkImportItem): Promise<void> {
    this.items.set(item.id, { ...item });
  }
  async listItems(jobId: string): Promise<BulkImportItem[]> {
    return [...this.items.values()]
      .filter((it) => it.jobId === jobId)
      .sort((a, b) => a.rowIndex - b.rowIndex)
      .map((it) => ({ ...it }));
  }
  async pickPendingItems(jobId: string, limit: number): Promise<BulkImportItem[]> {
    return [...this.items.values()]
      .filter((it) => it.jobId === jobId && it.status === "pending")
      .sort((a, b) => a.rowIndex - b.rowIndex)
      .slice(0, limit)
      .map((it) => ({ ...it }));
  }
}

// ---------------------------------------------------------------------------
// Singleton — väljs på STORE_BACKEND, samma som getStore().
// ---------------------------------------------------------------------------

let singleton: BulkImportStore | null = null;
let testOverride: BulkImportStore | null = null;

export function getBulkImportStore(): BulkImportStore {
  if (testOverride) return testOverride;
  if (!singleton) {
    // Ligger kvar i Wix Data. Se watchlist-storen: jämförelsen mot "wix-data"
    // hade tyst gjort bulk-jobben in-memory, och jobbet skrivs i EN lambda
    // medan worker-cronen läser i en annan — det hade försvunnit varje minut.
    singleton = isPersistentBackend() ? new WixDataBulkImportStore() : new MemoryBulkImportStore();
  }
  return singleton;
}

/** Test-hook: byt ut storen mot en in-memory-instans. */
export function __setBulkImportStoreForTests(store: BulkImportStore | null): void {
  testOverride = store;
  if (!store) singleton = null;
}

export function newMemoryBulkImportStore(): BulkImportStore {
  return new MemoryBulkImportStore();
}
