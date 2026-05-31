import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runBulkImportWorker } from "./worker";
import {
  __setBulkImportStoreForTests,
  newMemoryBulkImportStore,
  type BulkImportItem,
  type BulkImportStore,
} from "./store";
import { createBulkImportJob, stopBulkImportJob } from "./service";
import { parseBulkImportCsv } from "./csv";

function csvWith(count: number, prefix = "100500"): string {
  const lines = ["aliexpress_url"];
  for (let i = 0; i < count; i++) {
    const id = `${prefix}${String(i).padStart(10, "0")}`;
    lines.push(`https://www.aliexpress.com/item/${id}.html`);
  }
  return lines.join("\n");
}

describe("runBulkImportWorker — integration", () => {
  let store: BulkImportStore;
  beforeEach(() => {
    store = newMemoryBulkImportStore();
    __setBulkImportStoreForTests(store);
    delete process.env.BULK_IMPORT_DAILY_CAP;
  });
  afterEach(() => {
    __setBulkImportStoreForTests(null);
  });

  it("processes all 3 items in a job using a mocked importer", async () => {
    const csv = parseBulkImportCsv(csvWith(3));
    const created = await createBulkImportJob({ csv, createdBy: "leonard" });

    const importer = async (item: BulkImportItem) => ({
      wixProductId: `wix-${item.rowIndex}`,
      wixProductSlug: `slug-${item.rowIndex}`,
    });

    const result = await runBulkImportWorker({
      maxItems: 10,
      disableDelay: true,
      importerOverride: importer,
    });
    expect(result.itemsProcessed).toBe(3);
    expect(result.itemsSucceeded).toBe(3);
    expect(result.itemsFailed).toBe(0);

    const finalJob = await store.getJob(created.job.id);
    expect(finalJob?.status).toBe("completed");
    expect(finalJob?.succeeded).toBe(3);

    const items = await store.listItems(created.job.id);
    expect(items.every((i) => i.status === "done")).toBe(true);
    expect(items[0].wixProductId).toBe("wix-1");
  });

  it("marks an item as failed after MAX_ATTEMPTS non-retryable errors", async () => {
    const csv = parseBulkImportCsv(csvWith(1));
    await createBulkImportJob({ csv, createdBy: "leonard" });

    const importer = async () => {
      throw new Error("Permanent fel: produkten är offline (not found)");
    };
    // Permanent error → marked failed on first attempt (isRetryable returns false).
    await runBulkImportWorker({ maxItems: 10, disableDelay: true, importerOverride: importer });

    const items = await store.listItems((await store.listJobs())[0].id);
    expect(items[0].status).toBe("failed");
    expect(items[0].error).toMatch(/offline/);
  });

  it("retries a transient (5xx / rate-limit) failure", async () => {
    const csv = parseBulkImportCsv(csvWith(1));
    await createBulkImportJob({ csv, createdBy: "leonard" });

    let calls = 0;
    const importer = async () => {
      calls++;
      if (calls === 1) throw new Error("503 service unavailable");
      return { wixProductId: "ok-1", wixProductSlug: "ok-1" };
    };

    // First run → retry (item stays pending).
    const first = await runBulkImportWorker({
      maxItems: 10,
      disableDelay: true,
      importerOverride: importer,
    });
    expect(first.itemsRetried).toBe(1);

    // Second run → succeeds.
    const second = await runBulkImportWorker({
      maxItems: 10,
      disableDelay: true,
      importerOverride: importer,
    });
    expect(second.itemsSucceeded).toBe(1);

    const items = await store.listItems((await store.listJobs())[0].id);
    expect(items[0].status).toBe("done");
    expect(items[0].attempts).toBe(2);
  });

  it("skips remaining items when job is stopped mid-run", async () => {
    const csv = parseBulkImportCsv(csvWith(3));
    const created = await createBulkImportJob({ csv, createdBy: "leonard" });

    let processedCount = 0;
    const importer = async (item: BulkImportItem) => {
      processedCount++;
      if (processedCount === 1) {
        // Stoppa jobbet efter att första item rapporterats lyckat.
        await stopBulkImportJob(created.job.id, "test stop");
      }
      return { wixProductId: `w-${item.rowIndex}`, wixProductSlug: `s-${item.rowIndex}` };
    };

    const r = await runBulkImportWorker({
      maxItems: 10,
      disableDelay: true,
      importerOverride: importer,
    });
    expect(r.itemsSucceeded).toBeGreaterThanOrEqual(1);
    expect(r.itemsSkipped).toBeGreaterThanOrEqual(1);

    const items = await store.listItems(created.job.id);
    expect(items.some((i) => i.status === "skipped")).toBe(true);
  });

  it("no-ops when there are no active jobs", async () => {
    const r = await runBulkImportWorker({ disableDelay: true });
    expect(r.itemsProcessed).toBe(0);
    expect(r.jobsTouched).toBe(0);
  });
});
