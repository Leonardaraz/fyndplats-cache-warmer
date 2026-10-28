// FyndplatsImportCosts — Wix Data-collection som speglar inköpsdata per produkt
// vid import-tillfället. Behövs när vi vill överskrida eller komplettera den
// data som ligger i FyndplatsMappings.variants[].landedCostSek (importpipeline
// skriver dit by-default).
//
// Schema (dataItem.data):
//   _id:         wixProductId
//   productId:   string (samma)
//   costSek:     number (landad inköpskostnad i SEK, frakt + valuta inräknad)
//   costUsd?:    number (rå USD-kostnad innan FX, om känd)
//   currency:    "SEK" | "USD" | "EUR" | "RMB" | "CNY"
//   importedAt:  ISO-datum
//   source:      "aliexpress" | "manual" | "csv-backfill"
//   note?:       string (operatorns valfria not)
//
// API:t här är frivilligt — vi behöver inte denna collection för att visa
// /admin/profitability eftersom mappningarna redan har kostnaden. Den används
// för:
//   1. manuell override per produkt (CSV-upload)
//   2. produkter utan mapping (manuellt skapade i Wix) — kostnad fylls i här
//   3. framtida ändringar i landad kostnad utan att skriva om import-pipelinen

import { storeBackend } from "./backend";
import { sql } from "../db/client";
import { allaRader, spara } from "../db/wix-data-klient";

const COLLECTION_ID =
  process.env.WIX_DATA_COL_IMPORT_COSTS ?? "FyndplatsImportCosts";

export type ImportCostCurrency = "SEK" | "USD" | "EUR" | "RMB" | "CNY";
export type ImportCostSource = "aliexpress" | "manual" | "csv-backfill";

export interface ImportCostRecord {
  productId: string;
  costSek: number;
  costUsd?: number;
  currency: ImportCostCurrency;
  importedAt: string;
  source: ImportCostSource;
  note?: string;
}

export class ImportCostStore {
  /** Listar alla manuella overrides (collection kan vara tom → returnerar []). */
  async listAll(): Promise<ImportCostRecord[]> {
    if (storeBackend() === "postgres") {
      const rader = await sql()`select data from import_costs order by at desc nulls last`;
      return rader.map((r) => (r as { data: ImportCostRecord }).data);
    }
    // ☠️ Med markör till slutet. Den gamla vägen läste EN sida om 1 000 rader,
    // och tabellen hade 1 283 när datan flyttade tillbaka till Wix
    // (2026-10-29): var femte override hade tyst saknats.
    const rader = await allaRader<ImportCostRecord>(COLLECTION_ID);
    return rader.filter((d) => Boolean(d?.productId && typeof d.costSek === "number"));
  }

  async upsert(record: ImportCostRecord): Promise<void> {
    if (storeBackend() === "postgres") {
      await sql()`insert into import_costs (id, at, data)
                  values (${record.productId}, ${record.importedAt ?? null}, ${JSON.stringify(record)})
                  on conflict (id) do update set at = excluded.at, data = excluded.data`;
      return;
    }
    await spara(COLLECTION_ID, record.productId, { ...record } as Record<string, unknown>);
  }

  async upsertMany(records: ImportCostRecord[]): Promise<{ saved: number; failed: number; errors: string[] }> {
    let saved = 0;
    let failed = 0;
    const errors: string[] = [];
    for (const r of records) {
      try {
        await this.upsert(r);
        saved++;
      } catch (err) {
        failed++;
        if (errors.length < 5) {
          errors.push(`${r.productId}: ${err instanceof Error ? err.message.slice(0, 120) : String(err)}`);
        }
      }
    }
    return { saved, failed, errors };
  }
}

let singleton: ImportCostStore | null = null;
export function getImportCostStore(): ImportCostStore {
  if (!singleton) singleton = new ImportCostStore();
  return singleton;
}
