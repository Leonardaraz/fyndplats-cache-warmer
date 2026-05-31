import { describe, expect, it } from "vitest";
import { parseBulkImportCsv, buildResultCsv, CsvLimitsError } from "./csv";

const VALID = "https://www.aliexpress.com/item/1005006789012345.html";
const VALID_2 = "https://www.aliexpress.com/item/1005009999999999.html";

describe("parseBulkImportCsv", () => {
  it("parses a minimal valid CSV with header", () => {
    const csv = `aliexpress_url\n${VALID}\n${VALID_2}`;
    const r = parseBulkImportCsv(csv);
    expect(r.errors).toEqual([]);
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0].aliexpressUrl).toBe(VALID);
    expect(r.rows[0].errors).toEqual([]);
    expect(r.rows[1].aliexpressUrl).toBe(VALID_2);
  });

  it("handles all columns including optional ones", () => {
    const csv =
      "aliexpress_url,wix_collection_slug,target_price_sek,notes\n"
      + `${VALID},shoes,199.90,"premiumkollektion"\n`;
    const r = parseBulkImportCsv(csv);
    expect(r.rows[0].collectionSlug).toBe("shoes");
    expect(r.rows[0].targetPriceSek).toBe(199.9);
    expect(r.rows[0].notes).toBe("premiumkollektion");
  });

  it("treats malformed URL and missing url as errors", () => {
    const csv = `aliexpress_url\nnot-a-url\nhttps://example.com/foo\n\n,\n`;
    const r = parseBulkImportCsv(csv);
    expect(r.rows[0].errors.length).toBeGreaterThan(0);
    expect(r.rows[1].errors[0]).toMatch(/aliexpress/i);
  });

  it("flags duplicates within the CSV", () => {
    const csv = `aliexpress_url\n${VALID}\n${VALID}`;
    const r = parseBulkImportCsv(csv);
    expect(r.rows[0].errors).toEqual([]);
    expect(r.rows[1].errors[0]).toMatch(/dubblett/i);
  });

  it("handles quotes and escaped quotes inside fields", () => {
    const csv = `aliexpress_url,notes\n${VALID},"contains ""quoted"" word"`;
    const r = parseBulkImportCsv(csv);
    expect(r.rows[0].notes).toBe('contains "quoted" word');
  });

  it("strips BOM at start of file", () => {
    const csv = `﻿aliexpress_url\n${VALID}`;
    const r = parseBulkImportCsv(csv);
    expect(r.errors).toEqual([]);
    expect(r.rows[0].aliexpressUrl).toBe(VALID);
  });

  it("supports CRLF line endings", () => {
    const csv = `aliexpress_url\r\n${VALID}\r\n${VALID_2}\r\n`;
    const r = parseBulkImportCsv(csv);
    expect(r.rows).toHaveLength(2);
  });

  it("auto-detects semicolon separator (Excel sv-SE export)", () => {
    const csv = `aliexpress_url;target_price_sek;notes\n${VALID};249,50;test`;
    const r = parseBulkImportCsv(csv);
    expect(r.rows[0].aliexpressUrl).toBe(VALID);
    expect(r.rows[0].targetPriceSek).toBe(249.5);
    expect(r.rows[0].notes).toBe("test");
  });

  it("returns a general error when required header is missing", () => {
    const csv = `url\n${VALID}`;
    const r = parseBulkImportCsv(csv);
    expect(r.errors[0]).toMatch(/aliexpress_url/);
  });

  it("rejects invalid price formats", () => {
    const csv = `aliexpress_url,target_price_sek\n${VALID},abc`;
    const r = parseBulkImportCsv(csv);
    expect(r.rows[0].errors[0]).toMatch(/Ogiltigt målpris/);
  });

  it("enforces row cap", () => {
    const lines = ["aliexpress_url"];
    for (let i = 0; i < 501; i++) {
      // Unique productId per row to avoid the duplicate-check triggering first
      lines.push(`https://www.aliexpress.com/item/100500000000${String(i).padStart(4, "0")}.html`);
    }
    expect(() => parseBulkImportCsv(lines.join("\n"))).toThrow(CsvLimitsError);
  });

  it("enforces file size cap", () => {
    const filler = "x".repeat(6 * 1024 * 1024);
    expect(() => parseBulkImportCsv(`aliexpress_url,notes\n${VALID},${filler}`)).toThrow(CsvLimitsError);
  });

  it("ignores empty lines between rows", () => {
    const csv = `aliexpress_url\n\n${VALID}\n\n${VALID_2}\n\n`;
    const r = parseBulkImportCsv(csv);
    expect(r.rows).toHaveLength(2);
  });
});

describe("buildResultCsv", () => {
  it("emits headers, escapes quotes, and includes BOM", () => {
    const csv = buildResultCsv([
      {
        row_index: 1,
        aliexpress_url: VALID,
        import_status: "done",
        wix_product_id: "abc-123",
        queue_url: "https://example.com/admin/queue#abc-123",
      },
      {
        row_index: 2,
        aliexpress_url: VALID_2,
        import_status: "failed",
        error: 'AliExpress returned "not found"',
      },
    ]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("row_index,aliexpress_url,wix_collection_slug,target_price_sek,notes,import_status,wix_product_id,queue_url,error");
    expect(csv).toContain("abc-123");
    // Escaped quotes.
    expect(csv).toContain('"AliExpress returned ""not found"""');
  });
});
