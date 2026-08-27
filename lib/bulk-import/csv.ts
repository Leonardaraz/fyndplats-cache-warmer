// Minimal CSV-parser för bulk-import.
//
// Stödjer:
//   - Header-rad (case-insensitive matchning på kolumnnamn)
//   - Citerade fält ("...") med inbäddade "" som escape för "
//   - LF / CRLF radslut
//   - BOM (﻿) i början av filen
//   - Tomma rader (hoppas över)
//   - Kommatecken ELLER semikolon som separator (auto-detect, semikolon vinner
//     bara om header-raden uppenbart är semikolon-separerad — vanligt i Excel-export
//     på svensk locale).
//
// Avsiktligt INGEN tredjeparts-dependency: pipelinen ska kunna deployas till
// Vercel utan att blåsa upp lambda-storleken.

import { parseAliExpressUrl } from "./url";

export const EXPECTED_COLUMNS = ["aliexpress_url", "wix_collection_slug", "target_price_sek", "notes"] as const;
export type CsvColumn = (typeof EXPECTED_COLUMNS)[number];

export interface ParsedCsvRow {
  rowIndex: number;        // 1-baserat (header = 0)
  aliexpressUrl: string;
  collectionSlug?: string;
  targetPriceSek?: number;
  notes?: string;
  errors: string[];
}

export interface ParsedCsv {
  rows: ParsedCsvRow[];
  /** Generella fel som inte hör till en specifik rad (saknad header etc.). */
  errors: string[];
  /** Antal rader i originalfilen (efter att tomma rader filtrerats bort). */
  totalRows: number;
}

const MAX_ROWS = 500;
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export class CsvLimitsError extends Error {
  constructor(public readonly limit: "rows" | "bytes", public readonly actual: number) {
    super(
      limit === "rows"
        ? `Max ${MAX_ROWS} rader per fil — fick ${actual}`
        : `Max ${MAX_BYTES / 1024 / 1024} MB per fil — fick ${(actual / 1024 / 1024).toFixed(1)} MB`,
    );
    this.name = "CsvLimitsError";
  }
}

export function parseBulkImportCsv(input: string): ParsedCsv {
  // Strip BOM om den finns kvar (T.ex. Excel-export på Windows).
  const text = input.replace(/^﻿/, "");

  if (Buffer.byteLength(text, "utf8") > MAX_BYTES) {
    throw new CsvLimitsError("bytes", Buffer.byteLength(text, "utf8"));
  }

  // Auto-detect separator: räkna första radens icke-citerade kommatecken vs semikolon.
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const separator = countUnquoted(firstLine, ";") > countUnquoted(firstLine, ",") ? ";" : ",";

  const records = parseCsvRecords(text, separator);
  if (records.length === 0) {
    return { rows: [], errors: ["CSV-filen är tom"], totalRows: 0 };
  }

  const headerRow = records[0].map((h) => h.trim().toLowerCase());
  const colIndex: Partial<Record<CsvColumn, number>> = {};
  for (const col of EXPECTED_COLUMNS) {
    const idx = headerRow.indexOf(col);
    if (idx >= 0) colIndex[col] = idx;
  }

  const generalErrors: string[] = [];
  if (colIndex.aliexpress_url === undefined) {
    generalErrors.push(`Saknad kolumn: "aliexpress_url". Hittade: ${headerRow.join(", ") || "(tomt)"}`);
    return { rows: [], errors: generalErrors, totalRows: records.length - 1 };
  }

  const dataRows = records.slice(1);
  if (dataRows.length > MAX_ROWS) {
    throw new CsvLimitsError("rows", dataRows.length);
  }

  const seenUrls = new Set<string>();
  const rows: ParsedCsvRow[] = dataRows.map((cols, i) => {
    const get = (key: CsvColumn): string => {
      const idx = colIndex[key];
      return idx !== undefined ? (cols[idx] ?? "").trim() : "";
    };

    const row: ParsedCsvRow = {
      rowIndex: i + 1,
      aliexpressUrl: get("aliexpress_url"),
      collectionSlug: get("wix_collection_slug") || undefined,
      notes: get("notes") || undefined,
      errors: [],
    };

    const priceStr = get("target_price_sek");
    if (priceStr) {
      const normalized = priceStr.replace(/\s/g, "").replace(",", ".");
      const n = Number(normalized);
      if (!Number.isFinite(n) || n < 0) {
        row.errors.push(`Ogiltigt målpris: "${priceStr}"`);
      } else {
        row.targetPriceSek = Math.round(n * 100) / 100;
      }
    }

    if (!row.aliexpressUrl) {
      row.errors.push("Tom aliexpress_url");
      return row;
    }

    const urlCheck = parseAliExpressUrl(row.aliexpressUrl);
    if (urlCheck.error) {
      row.errors.push(urlCheck.error);
      return row;
    }
    const normalized = urlCheck.normalizedUrl!;
    if (seenUrls.has(normalized)) {
      row.errors.push("Dubblett i CSV (samma produkt-id finns på en tidigare rad)");
    } else {
      seenUrls.add(normalized);
    }
    return row;
  });

  return { rows, errors: generalErrors, totalRows: dataRows.length };
}

// ---------------------------------------------------------------------------
// Intern parser. Itererar tecken för tecken — undviker dependency på papaparse.
// ---------------------------------------------------------------------------

/**
 * Tokeniserar CSV till råa fält-rader. Exporterad för att Aosom-feeden
 * (lib/aosom/feed.ts) ska dela EXAKT samma tokenizer — feedens beskrivningar
 * innehåller citerade fält med både kommatecken och radbrytningar, och en andra
 * handrullad parser i repot vore en bugg som väntar på att hända.
 */
export function parseCsvRecords(input: string, separator: string): string[][] {
  const records: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < input.length) {
    const c = input[i];

    if (inQuotes) {
      if (c === '"') {
        // Escaped quote ("") inside quoted field.
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }

    if (c === '"') {
      // Tillåt citerade fält bara i fältets början; annars behandla " som
      // bokstavsläge så att en lös " i en URL inte korrumperar resten av raden.
      if (field.length === 0) {
        inQuotes = true;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }

    if (c === separator) {
      current.push(field);
      field = "";
      i++;
      continue;
    }

    if (c === "\r") {
      // Konsumera CR; LF hanteras separat. Stöder både CR och CRLF.
      i++;
      continue;
    }

    if (c === "\n") {
      current.push(field);
      field = "";
      if (current.some((f) => f.length > 0)) records.push(current);
      current = [];
      i++;
      continue;
    }

    field += c;
    i++;
  }

  // Sista raden (utan trailing newline).
  if (field.length > 0 || current.length > 0) {
    current.push(field);
    if (current.some((f) => f.length > 0)) records.push(current);
  }

  return records;
}

function countUnquoted(line: string, ch: string): number {
  let inQuotes = false;
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && c === ch) count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Export-hjälpare för resultat-CSV.
// ---------------------------------------------------------------------------

function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export interface ResultRow {
  row_index: number;
  aliexpress_url: string;
  wix_collection_slug?: string;
  target_price_sek?: number;
  notes?: string;
  import_status: string;
  wix_product_id?: string;
  queue_url?: string;
  error?: string;
}

export function buildResultCsv(rows: ResultRow[]): string {
  const header = [
    "row_index",
    "aliexpress_url",
    "wix_collection_slug",
    "target_price_sek",
    "notes",
    "import_status",
    "wix_product_id",
    "queue_url",
    "error",
  ];
  const lines: string[] = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.row_index,
        r.aliexpress_url,
        r.wix_collection_slug ?? "",
        r.target_price_sek ?? "",
        r.notes ?? "",
        r.import_status,
        r.wix_product_id ?? "",
        r.queue_url ?? "",
        r.error ?? "",
      ]
        .map(escapeCsvField)
        .join(","),
    );
  }
  // CRLF för bästa Excel-kompatibilitet.
  return "﻿" + lines.join("\r\n") + "\r\n";
}
