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

export interface AuditEntry {
  at: string;
  /** Typ av händelse, t.ex. "import", "price-alert", "stock", "order", "ship", "cancel". */
  kind: string;
  /** Referens (produkt-/order-/task-id). */
  ref?: string;
  detail?: string;
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
}
