import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createBulkImportJob,
  stopBulkImportJob,
  BulkImportLimitError,
  HARD_ROW_CAP,
} from "./service";
import {
  __setBulkImportStoreForTests,
  newMemoryBulkImportStore,
  type BulkImportStore,
} from "./store";
import { parseBulkImportCsv } from "./csv";

function csvWith(count: number, prefix = "100500"): string {
  const lines = ["aliexpress_url"];
  for (let i = 0; i < count; i++) {
    const id = `${prefix}${String(i).padStart(10, "0")}`;
    lines.push(`https://www.aliexpress.com/item/${id}.html`);
  }
  return lines.join("\n");
}

describe("createBulkImportJob — anti-abuse", () => {
  let store: BulkImportStore;
  beforeEach(() => {
    store = newMemoryBulkImportStore();
    __setBulkImportStoreForTests(store);
    delete process.env.BULK_IMPORT_DAILY_CAP;
  });
  afterEach(() => {
    __setBulkImportStoreForTests(null);
  });

  it("creates job + items for a valid CSV", async () => {
    const csv = parseBulkImportCsv(csvWith(3));
    const r = await createBulkImportJob({ csv, createdBy: "leonard" });
    expect(r.job.totalRows).toBe(3);
    expect(r.job.status).toBe("pending");
    expect(r.items).toHaveLength(3);
    expect(r.items[0].id).toMatch(/^bulk-/);
  });

  it("rejects when no valid rows remain after filtering", async () => {
    const csv = parseBulkImportCsv("aliexpress_url\nnot-a-url");
    await expect(createBulkImportJob({ csv })).rejects.toMatchObject({
      code: "no_valid_rows",
    });
  });

  it("blocks a second concurrent job from same user", async () => {
    await createBulkImportJob({ csv: parseBulkImportCsv(csvWith(2)), createdBy: "leonard" });
    await expect(
      createBulkImportJob({ csv: parseBulkImportCsv(csvWith(2, "200500")), createdBy: "leonard" }),
    ).rejects.toMatchObject({ code: "concurrent_job" });
  });

  it("allows a new job after the previous one is stopped", async () => {
    const first = await createBulkImportJob({
      csv: parseBulkImportCsv(csvWith(2)),
      createdBy: "leonard",
    });
    await stopBulkImportJob(first.job.id, "test");
    const second = await createBulkImportJob({
      csv: parseBulkImportCsv(csvWith(2, "200500")),
      createdBy: "leonard",
    });
    expect(second.job.id).not.toBe(first.job.id);
  });

  it("enforces daily cap from env", async () => {
    process.env.BULK_IMPORT_DAILY_CAP = "5";
    const csv = parseBulkImportCsv(csvWith(3));
    await createBulkImportJob({ csv, createdBy: "leonard" });
    await stopBulkImportJob((await store.listJobs())[0].id, "test");
    const csv2 = parseBulkImportCsv(csvWith(3, "200500"));
    await expect(createBulkImportJob({ csv: csv2, createdBy: "leonard" })).rejects.toMatchObject({
      code: "daily_cap",
    });
  });

  it("HARD_ROW_CAP matches CSV parser limit", () => {
    expect(HARD_ROW_CAP).toBe(500);
  });

  it("BulkImportLimitError carries the code and details", () => {
    const err = new BulkImportLimitError("daily_cap", "msg", { foo: 1 });
    expect(err.code).toBe("daily_cap");
    expect(err.details).toEqual({ foo: 1 });
  });
});
