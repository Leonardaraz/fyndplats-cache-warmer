// Motorns kollektioner i Wix CMS, och de index varje kollektion behöver.
//
// EN lista. Förberedelsen (kollektion, behörighet ADMIN, index) och
// kopieringen läser den, och `wix-kollektioner.test.ts` fäller om en modul
// skriver till en kollektion som inte står här — samma skäl som
// `tabeller.test.ts` har: en kollektion som saknas i listan är osynlig för
// både förberedelsen och verifieringen.
//
// ☠️ INDEXEN ÄR INTE PYNT. Wix avbryter en fråga efter 5 sekunder (WDE0028)
// och vägrar sortera en stor mängd utan index (WDE0092). Recensionerna
// (14 973 rader) och synkloggen (8 954) sorteras på datum vid varje läsning.
// Wix tar högst 3 vanliga index per kollektion, med högst 3 fält var
// (dev.wix.com … /cms/collection-management/indexes/index-types).
//
// ☠️ BEHÖRIGHETEN ÄR ADMIN, ÖVERALLT. Auktionsraderna bär golvpriset och
// recensionsraderna väntande texter; FyndplatsAuctions och
// FyndplatsImportedReviews stod som läsbara för ANYONE när datan flyttade
// tillbaka (2026-10-28). Butiken läser via motorns rutter, aldrig Wix Data
// direkt, så ingen besökare behöver läsa något här.

export interface IndexSpec {
  namn: string;
  falt: { path: string; order: "ASC" | "DESC" }[];
}

export interface KollektionSpec {
  id: string;
  index: IndexSpec[];
}

const asc = (path: string) => ({ path, order: "ASC" as const });
const desc = (path: string) => ({ path, order: "DESC" as const });

function col(namn: string, fallback: string): string {
  return process.env[namn] ?? fallback;
}

/** De nya kollektionerna (bara Postgres fram till 2026-10-29). */
export const NYA = {
  syncMarkor: "FyndplatsSyncMarkor",
  karens: "FyndplatsBildstadningKarens",
  fargbilder: "FyndplatsFargbilder",
  fakturaUtskick: "FyndplatsFakturaUtskick",
} as const;

export const KOLLEKTIONER: KollektionSpec[] = [
  { id: col("WIX_DATA_COL_MAPPINGS", "FyndplatsMappings"), index: [] },
  {
    id: col("WIX_DATA_COL_TASKS", "FyndplatsTasks"),
    index: [
      { namn: "status", falt: [asc("status")] },
      { namn: "order", falt: [asc("orderId")] },
      { namn: "sparning", falt: [asc("trackingNumber")] },
    ],
  },
  { id: col("WIX_DATA_COL_EVENTS", "FyndplatsWebhookEvents"), index: [] },
  { id: col("WIX_DATA_COL_AUDIT", "FyndplatsAudit"), index: [{ namn: "at", falt: [desc("at")] }] },
  { id: col("WIX_DATA_COL_TOKENS", "FyndplatsAliExpressTokens"), index: [] },
  {
    id: col("WIX_DATA_COL_SYNC_LOG", "FyndplatsAliExpressSyncLog"),
    index: [
      { namn: "checked", falt: [desc("checkedAt")] },
      { namn: "produkt", falt: [asc("productId"), desc("checkedAt")] },
      { namn: "handelse", falt: [asc("actionTaken"), desc("checkedAt")] },
    ],
  },
  {
    id: col("WIX_DATA_COL_SYNC_STATE", "FyndplatsAliExpressSyncState"),
    index: [{ namn: "senast", falt: [desc("lastCheckedAt")] }],
  },
  {
    id: col("WIX_DATA_COL_SYNC_ALERTS", "FyndplatsAliExpressSyncAlerts"),
    index: [
      { namn: "status", falt: [asc("status"), desc("createdAt")] },
      { namn: "skapad", falt: [desc("createdAt")] },
    ],
  },
  { id: col("WIX_DATA_COL_PRODUCT_HASHES", "FyndplatsProductHashes"), index: [] },
  { id: col("WIX_DATA_COL_IMPORT_COSTS", "FyndplatsImportCosts"), index: [] },
  {
    id: col("WIX_DATA_COL_REVIEWS", "FyndplatsImportedReviews"),
    index: [
      { namn: "produkt", falt: [asc("productId"), desc("date")] },
      { namn: "status", falt: [asc("status"), desc("date")] },
      { namn: "datum", falt: [desc("date")] },
    ],
  },
  {
    id: "FyndplatsAuctions",
    index: [
      { namn: "ko", falt: [asc("status"), asc("queueOrder")] },
      { namn: "salda", falt: [asc("status"), desc("endedAt")] },
    ],
  },
  { id: col("WIX_DATA_COL_LLM_CACHE", "FyndplatsClaudeCache"), index: [] },
  { id: col("WIX_DATA_COL_LLM_SPEND", "FyndplatsAnthropicSpend"), index: [{ namn: "at", falt: [desc("at")] }] },
  { id: col("WIX_DATA_COL_LLM_STATS", "FyndplatsLlmStats"), index: [{ namn: "at", falt: [desc("at")] }] },
  { id: col("WIX_DATA_COL_LLM_VARIANT_TRANSLATIONS", "FyndplatsVariantTranslations"), index: [] },
  { id: NYA.syncMarkor, index: [] },
  { id: NYA.karens, index: [] },
  { id: NYA.fargbilder, index: [] },
  { id: NYA.fakturaUtskick, index: [] },
];
