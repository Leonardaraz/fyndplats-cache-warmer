import type { FulfillmentTask, TaskStatus } from "../orders/types";
import type { VariantMapping } from "../import/pipeline";

// Lagringsabstraktion för mappningar, fulfillment-tasks och idempotens.
//
// OBS: Standardimplementationen (memory.ts) är in-memory och överlever INTE en
// serverless-omstart. För produktion ska detta backas av en Wix Data-collection
// eller en databas. Interfacet hålls litet så bytet blir enkelt.

export interface ProductMappingRecord {
  supplierProductId: string;
  wixProductId: string;
  variants: VariantMapping[];
}

/**
 * En auto-mappnings-kandidat som väntar på manuell bekräftelse. Sparas när
 * AI-matchningen inte är säker nog att auto-mappa (medium/low confidence) så
 * operatorn kan välja rätt AliExpress-källa med ett klick i /admin/mappings.
 */
export interface MappingSuggestion {
  wixProductId: string;
  wixProductName: string;
  /** Engelska sökord som användes mot AliExpress. */
  searchQuery: string;
  confidence: "high" | "medium" | "low";
  candidates: Array<{
    productId: string;
    title: string;
    imageUrl?: string;
    priceUsd?: number;
    productUrl?: string;
    score: number;
  }>;
  createdAt: string;
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

  // --- Auto-mappnings-förslag (väntar på bekräftelse) ---
  saveSuggestion(suggestion: MappingSuggestion): Promise<void>;
  listSuggestions(): Promise<MappingSuggestion[]>;
  deleteSuggestion(wixProductId: string): Promise<void>;

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
