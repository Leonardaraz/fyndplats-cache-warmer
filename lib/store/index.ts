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

export interface Store {
  // --- Idempotens för webhooks ---
  hasSeenEvent(eventId: string): Promise<boolean>;
  markEventSeen(eventId: string): Promise<void>;

  // --- Produktmappningar ---
  saveMapping(record: ProductMappingRecord): Promise<void>;
  getMappingByWixProductId(wixProductId: string): Promise<ProductMappingRecord | null>;

  // --- Fulfillment-tasks ---
  upsertTask(task: FulfillmentTask): Promise<void>;
  /** Skapar bara om taskId inte redan finns (idempotent per orderrad). */
  createTaskIfAbsent(task: FulfillmentTask): Promise<boolean>;
  listTasks(status?: TaskStatus): Promise<FulfillmentTask[]>;
  setTaskStatus(taskId: string, status: TaskStatus): Promise<void>;
}
