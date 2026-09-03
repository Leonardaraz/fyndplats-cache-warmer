// Kollektion → tabell, id och de fält som projiceras till kolumner.
//
// EN definition, läst av både sync-loggen (som frågar) och kopieringen (som
// fyller). En tvilling hade glidit isär vid första ändringen — samma skäl som
// SHIP_AXIS_RE och EU_TULL_CODES har sina tvilling-tester.
//
// Mönstret: `data` bär HELA posten som JSONB, kolumnerna är projektioner av
// den för index och filter. Kartan är avsiktligt ofullständig — bara fält som
// verkligen filtreras eller sorteras på står här, så ett nytt filter på ett
// oindexerat fält blir ett fel vid utveckling i stället för en tyst full-scan.

import type { Kolumnkarta } from "./wix-filter";

export interface TabellSpec {
  /** Wix-kollektionens id (läses ur env med samma default som ägarmodulen). */
  kollektion: string;
  tabell: string;
  /** Fältet i posten som är primärnyckel. */
  idFält: string;
  kolumner: Kolumnkarta;
}

function col(namn: string, fallback: string): string {
  return process.env[namn] ?? fallback;
}

export const MAPPNINGAR: TabellSpec = {
  kollektion: col("WIX_DATA_COL_MAPPINGS", "FyndplatsMappings"),
  tabell: "mappings",
  idFält: "wixProductId",
  kolumner: {
    wixProductId: "wix_product_id",
    supplierProductId: "supplier_product_id",
    supplier: "supplier",
    draftStatus: "draft_status",
    needsAiPolish: "needs_ai_polish",
    priority: "priority",
    reviewsCheckedAt: "reviews_checked_at",
  },
};

export const TASKS: TabellSpec = {
  kollektion: col("WIX_DATA_COL_TASKS", "FyndplatsTasks"),
  tabell: "tasks",
  idFält: "taskId",
  kolumner: {
    taskId: "task_id",
    orderId: "order_id",
    orderNumber: "order_number",
    status: "status",
    claimToken: "claim_token",
    aliexpressOrderId: "aliexpress_order_id",
    createdAt: "created_at",
  },
};

export const AUDIT: TabellSpec = {
  kollektion: col("WIX_DATA_COL_AUDIT", "FyndplatsAudit"),
  tabell: "audit",
  idFält: "_id",
  kolumner: { _id: "id", at: "at", kind: "kind", ref: "ref", detail: "detail" },
};

export const WEBHOOK_EVENTS: TabellSpec = {
  kollektion: col("WIX_DATA_COL_EVENTS", "FyndplatsWebhookEvents"),
  tabell: "webhook_events",
  idFält: "_id",
  kolumner: { _id: "event_id" },
};

export const SYNC_LOG: TabellSpec = {
  kollektion: col("WIX_DATA_COL_SYNC_LOG", "FyndplatsAliExpressSyncLog"),
  tabell: "sync_log",
  idFält: "id",
  kolumner: { id: "id", checkedAt: "checked_at", productId: "product_id", actionTaken: "action_taken" },
};

export const SYNC_STATE: TabellSpec = {
  kollektion: col("WIX_DATA_COL_SYNC_STATE", "FyndplatsAliExpressSyncState"),
  tabell: "sync_state",
  idFält: "wixProductId",
  kolumner: {
    wixProductId: "wix_product_id",
    listingStatus: "listing_status",
    errorStreak: "error_streak",
    lastCheckedAt: "last_checked_at",
  },
};

export const SYNC_ALERTS: TabellSpec = {
  kollektion: col("WIX_DATA_COL_SYNC_ALERTS", "FyndplatsAliExpressSyncAlerts"),
  tabell: "sync_alerts",
  idFält: "id",
  kolumner: { id: "id", status: "status", createdAt: "created_at" },
};

export const PRODUCT_HASHES: TabellSpec = {
  kollektion: col("WIX_DATA_COL_PRODUCT_HASHES", "FyndplatsProductHashes"),
  tabell: "product_hashes",
  idFält: "wixProductId",
  kolumner: { wixProductId: "wix_product_id" },
};

export const IMPORT_COSTS: TabellSpec = {
  kollektion: col("WIX_DATA_COL_IMPORT_COSTS", "FyndplatsImportCosts"),
  tabell: "import_costs",
  idFält: "productId",
  kolumner: { productId: "id", importedAt: "at" },
};

export const RECENSIONER: TabellSpec = {
  kollektion: col("WIX_DATA_COL_REVIEWS", "FyndplatsImportedReviews"),
  tabell: "reviews",
  // Komposit-id, samma som `reviewDocId` bygger: `${productId}__${reviewIdAE}`.
  // Wix-raden bär det i `_id`, och unikheten är per PRODUKT — samma reviewIdAE
  // kan förekomma globalt hos AE.
  idFält: "_id",
  kolumner: {
    _id: "id",
    productId: "product_id",
    reviewIdAE: "review_id_ae",
    status: "status",
    rating: "rating",
    date: "date",
  },
};

/** LLM-samlingarna delar EN tabell, nycklad på (collection, key). De hanteras
 *  separat i kopieringen eftersom `collection` är en del av nyckeln. */
export const LLM_SAMLINGAR = [
  col("WIX_DATA_COL_LLM_CACHE", "FyndplatsClaudeCache"),
  col("WIX_DATA_COL_LLM_SPEND", "FyndplatsAnthropicSpend"),
  col("WIX_DATA_COL_LLM_STATS", "FyndplatsLlmStats"),
  col("WIX_DATA_COL_LLM_VARIANT_TRANSLATIONS", "FyndplatsVariantTranslations"),
] as const;

/** Allt som flyttar, i kopieringsordning. Ordningen är godtycklig — varje
 *  tabell är oberoende — men fast, så en markör betyder samma sak varje gång. */
export const ATT_KOPIERA: TabellSpec[] = [
  MAPPNINGAR,
  TASKS,
  WEBHOOK_EVENTS,
  AUDIT,
  SYNC_LOG,
  SYNC_STATE,
  SYNC_ALERTS,
  PRODUCT_HASHES,
  IMPORT_COSTS,
  RECENSIONER,
];
