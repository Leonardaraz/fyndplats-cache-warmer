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

const WIX_BASE = "https://www.wixapis.com";

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: token,
  };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

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
    const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        dataCollectionId: COLLECTION_ID,
        query: { filter: {}, paging: { limit: 1000 } },
      }),
    });
    if (!res.ok) {
      // Saknad kollektion → behandla som tom (samma mönster som WixDataStore).
      if (res.status === 404) return [];
      const text = await res.text();
      if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) {
        return [];
      }
      throw new Error(`ImportCostStore.listAll (${res.status}): ${text.slice(0, 300)}`);
    }
    const body = (await res.json()) as { dataItems?: { data?: ImportCostRecord }[] };
    return (body.dataItems ?? [])
      .map((d) => d.data)
      .filter((d): d is ImportCostRecord => Boolean(d?.productId && typeof d.costSek === "number"));
  }

  async upsert(record: ImportCostRecord): Promise<void> {
    const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        dataCollectionId: COLLECTION_ID,
        dataItem: {
          id: record.productId,
          dataCollectionId: COLLECTION_ID,
          data: { _id: record.productId, ...record },
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ImportCostStore.upsert (${res.status}): ${text.slice(0, 300)}`);
    }
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
