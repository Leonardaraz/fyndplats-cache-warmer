import type { FulfillmentTask, TaskStatus } from "../orders/types";
import type { VariantMapping } from "../import/pipeline";

// Lagringsabstraktion för mappningar, fulfillment-tasks och idempotens.
//
// OBS: Standardimplementationen (memory.ts) är in-memory och överlever INTE en
// serverless-omstart. För produktion ska detta backas av en Wix Data-collection
// eller en databas. Interfacet hålls litet så bytet blir enkelt.

export type DraftStatus = "pending_review" | "published" | "rejected";

/** Per-bild verdict från Claude vision (sparas på mapping för granskning). */
export interface ImageAnalysisEntry {
  url: string;
  verdict: "ok" | "warn" | "reject";
  /** Svensk anledning, visas i /admin/queue. Tom om verdict=ok. */
  reason: string;
}

/** Claude-förslag på Wix-kategori. */
export interface CategorySuggestionRecord {
  collectionSlug: string | null;
  collectionId?: string;
  collectionName?: string;
  confidence: number;
  /** Svensk motivering, visas i kö-UI:t. */
  reason: string;
  /**
   * "auto" = redan tilldelad i Wix vid import (confidence > 0.7).
   * "suggested" = väntar på Leonards ett-klick (0.4–0.7).
   * "uncategorized" = för låg confidence eller fel — manuell hantering.
   */
  status: "auto" | "suggested" | "uncategorized";
}

export interface ProductMappingRecord {
  supplierProductId: string;
  wixProductId: string;
  variants: VariantMapping[];
  /**
   * Review-status. Nyimporterade produkter får "pending_review" och
   * visible:false i Wix tills Leonard publicerar via /admin/queue.
   * Saknar default = behandlas som "published" (back-compat med äldre rader).
   */
  draftStatus?: DraftStatus;
  /** ISO-tid när posten skapades. */
  createdAt?: string;
  /** ISO-tid när status-ändringen skedde (publish/reject). */
  reviewedAt?: string;
  /** SEO-title som genererats vid import (visas i kön). */
  seoTitle?: string;
  /** Källadress till AliExpress-produkten — visas i kön. */
  sourceUrl?: string;
  /** Claude vision-analys per bild. Saknas = analyserades inte. */
  imageAnalysis?: ImageAnalysisEntry[];
  /** Claude-förslag på Wix-kategori. Saknas = ej kategoriserad. */
  categorySuggestion?: CategorySuggestionRecord;
  /**
   * Aggregerade warehouse-koder (t.ex. ["ES","CN"]). Tom/saknas = okänt.
   * Används av /admin/queue-filter och av sajten för EU-badge.
   */
  shipsFromCountries?: string[];
  /** True om någon variant skickas från EU-lager (snabbsorterings-flagga). */
  hasEuWarehouse?: boolean;
  /**
   * Klassificering: "EU" = alla varianter från EU; "CN" = inga; "MIXED" =
   * några varianter EU och några inte; "UNKNOWN" = saknar data.
   */
  warehouseClass?: "EU" | "CN" | "MIXED" | "UNKNOWN";
  /**
   * Sätts om Wix gav DUPLICATE_SLUG_ERROR och importen lade på ett suffix.
   * /admin/queue visar "Slug auto-justerad"-badge när detta är satt.
   */
  slugSuffix?: string;
  /**
   * Sync-prioritet (Feature 4 — prioriterad sync). Styr ordningen i
   * /api/cron/aliexpress-sync: "high" synkas före "normal"/"low" oavsett
   * lastCheckedAt. Saknas = behandlas som "normal" (back-compat).
   *   - "high": bestsellers (top-50 senaste 30 dgr) + nyss köpta produkter.
   *   - "normal": default rullande kö (äldsta lastCheckedAt först).
   *   - "low": avprioriterad (t.ex. långsam-säljare) — synkas sist.
   * Sätts av applyBestsellerPriority (daglig) + order-webhooken (vid köp).
   */
  priority?: "low" | "normal" | "high";
  /** Svensk motivering till varför priority sattes — visas i admin. */
  priorityReason?: string;
  /** ISO-tid då priority senast ändrades automatiskt. */
  priorityUpdatedAt?: string;
  /**
   * AliExpress seller/store-id (Feature 6 — säljar-score). Foreign key till
   * FyndplatsSuppliers. Sätts vid import om extensionen kunde skrapa säljaren.
   * Saknas = importerad innan säljarspårningen fanns (eller säljaren okänd).
   */
  supplierId?: string;
  /** AE-butikens namn (denormaliserat för admin-vyer, slipper extra uppslag). */
  supplierName?: string;
  /**
   * True när produkten importerades RÅ (AI_ENRICHMENT_ENABLED=false): ingen
   * Claude-text/kategori/bild-ranking kördes. /admin/queue visar då en
   * "✨ Behöver AI-polering"-badge + knapp för att polera via chatten. Saknas =
   * normalt AI-berikad import (back-compat med äldre rader).
   */
  needsAiPolish?: boolean;
  /**
   * Variantvärden/axelnamn som förblev (halv-)engelska vid importen (tabell+
   * cache+AI löste dem inte). Kö-badgen listar dem — de är key-låsta i Wix V3,
   * så fixen är omimport efter tabell-/AI-rättning, inte polering i efterhand.
   */
  unresolvedVariantValues?: string[];
}

export interface AuditEntry {
  at: string;
  /** Typ av händelse, t.ex. "import", "price-alert", "stock", "order", "ship", "cancel". */
  kind: string;
  /** Referens (produkt-/order-/task-id). */
  ref?: string;
  detail?: string;
}

/**
 * Persisterad AliExpress OAuth-state. expiresAt är när access_token slutar
 * gälla (absolut timestamp, inte sekunder kvar) så Task B kan schemalägga
 * refresh utan att behöva känna till när den persisterades.
 */
export interface AliExpressTokenRecord {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface Store {
  // --- Idempotens för webhooks ---
  hasSeenEvent(eventId: string): Promise<boolean>;
  markEventSeen(eventId: string): Promise<void>;

  // --- Produktmappningar ---
  saveMapping(record: ProductMappingRecord): Promise<void>;
  getMappingByWixProductId(wixProductId: string): Promise<ProductMappingRecord | null>;
  listMappings(): Promise<ProductMappingRecord[]>;

  // --- Fulfillment-tasks ---
  upsertTask(task: FulfillmentTask): Promise<void>;
  /** Skapar bara om taskId inte redan finns (idempotent per orderrad). */
  createTaskIfAbsent(task: FulfillmentTask): Promise<boolean>;
  listTasks(status?: TaskStatus): Promise<FulfillmentTask[]>;
  setTaskStatus(taskId: string, status: TaskStatus): Promise<void>;
  /** Uppdaterar delmängd av en task (merge). */
  updateTask(taskId: string, patch: Partial<FulfillmentTask>): Promise<void>;

  // --- Audit-logg (spårbarhet) ---
  appendAudit(entry: AuditEntry): Promise<void>;
  listAudit(limit?: number): Promise<AuditEntry[]>;

  // --- AliExpress OAuth-tokens ---
  /** Returnerar persisterade tokens, eller null om inga finns än (cold bootstrap). */
  getAliExpressTokens(): Promise<AliExpressTokenRecord | null>;
  /** Skriver tokens (overwrite). Last-write-wins; concurrency-lock är Task B:s ansvar. */
  saveAliExpressTokens(record: AliExpressTokenRecord): Promise<void>;
}
