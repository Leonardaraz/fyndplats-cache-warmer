// FyndplatsTranslationUsage — Wix Data-collection som spårar kumulativt antal
// DeepL-tecken använda per månad. DeepL Free-tiern ger 500 000 tecken/månad;
// review-importen läser månadens summa före varje översättning och hoppar över
// (faller tillbaka på originaltext) när vi närmar oss taket (DEEPL_MONTHLY_BUDGET).
//
// Schema (dataItem.data):
//   _id:        "YYYY-MM" (månadsnyckel — en rad per månad)
//   month:      "YYYY-MM"
//   chars:      number (kumulativt antal tecken skickade till DeepL den månaden)
//   updatedAt:  ISO-datum
//
// Mönster speglar lib/store/import-costs.ts (samma Wix Data v2-REST + tolerera
// saknad kollektion som tom).

const WIX_BASE = "https://www.wixapis.com";

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

const COLLECTION_ID =
  process.env.WIX_DATA_COL_TRANSLATION_USAGE ?? "FyndplatsTranslationUsage";

/** DeepL Free-quota (tecken/månad). Vi varnar/stoppar under detta tak. */
export const DEEPL_FREE_QUOTA = 500_000;
/** Säkerhetsmarginal — sluta skicka nya översättningar vid detta antal tecken. */
export function monthlyBudget(): number {
  const n = Number(process.env.DEEPL_MONTHLY_BUDGET);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 450_000;
}

/** Månadsnyckel "YYYY-MM" ur ett Date (UTC). Default = now. */
export function monthKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export interface TranslationUsageRecord {
  month: string;
  chars: number;
  updatedAt: string;
}

export interface TranslationUsageStore {
  getMonthlyUsage(month: string): Promise<number>;
  addUsage(month: string, chars: number): Promise<void>;
}

export class WixTranslationUsageStore implements TranslationUsageStore {
  async getMonthlyUsage(month: string): Promise<number> {
    const url = `${WIX_BASE}/data/v2/items/${encodeURIComponent(month)}?dataCollectionId=${encodeURIComponent(COLLECTION_ID)}`;
    const res = await fetch(url, { method: "GET", headers: headers() });
    if (res.status === 404) return 0;
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) {
        return 0;
      }
      throw new Error(`TranslationUsage.get (${res.status}): ${text.slice(0, 200)}`);
    }
    const body = (await res.json()) as { dataItem?: { data?: TranslationUsageRecord } };
    const chars = body.dataItem?.data?.chars;
    return typeof chars === "number" && Number.isFinite(chars) ? chars : 0;
  }

  async addUsage(month: string, chars: number): Promise<void> {
    if (chars <= 0) return;
    const current = await this.getMonthlyUsage(month);
    const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        dataCollectionId: COLLECTION_ID,
        dataItem: {
          id: month,
          dataCollectionId: COLLECTION_ID,
          data: {
            _id: month,
            month,
            chars: current + chars,
            updatedAt: new Date().toISOString(),
          },
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`TranslationUsage.addUsage (${res.status}): ${text.slice(0, 200)}`);
    }
  }
}

let singleton: TranslationUsageStore | null = null;
export function getTranslationUsageStore(): TranslationUsageStore {
  if (!singleton) singleton = new WixTranslationUsageStore();
  return singleton;
}
