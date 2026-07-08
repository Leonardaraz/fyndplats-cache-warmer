import type { FulfillmentTask, TaskStatus } from "../orders/types";
import type { AliExpressTokenRecord, AuditEntry, ProductMappingRecord, Store } from "./index";

// In-memory-implementation. Bra för tester och lokal utveckling; byt mot en
// Wix Data-/DB-backad implementation innan produktion (se store/index.ts).

export class MemoryStore implements Store {
  private seenEvents = new Set<string>();
  private mappings = new Map<string, ProductMappingRecord>();
  private tasks = new Map<string, FulfillmentTask>();
  private audit: AuditEntry[] = [];
  private aliExpressTokens: AliExpressTokenRecord | null = null;

  async hasSeenEvent(eventId: string): Promise<boolean> {
    return this.seenEvents.has(eventId);
  }

  async markEventSeen(eventId: string): Promise<void> {
    this.seenEvents.add(eventId);
  }

  async saveMapping(record: ProductMappingRecord): Promise<void> {
    this.mappings.set(record.wixProductId, record);
  }

  async getMappingByWixProductId(wixProductId: string): Promise<ProductMappingRecord | null> {
    return this.mappings.get(wixProductId) ?? null;
  }

  async listMappings(): Promise<ProductMappingRecord[]> {
    return [...this.mappings.values()];
  }

  async upsertTask(task: FulfillmentTask): Promise<void> {
    this.tasks.set(task.taskId, task);
  }

  async createTaskIfAbsent(task: FulfillmentTask): Promise<boolean> {
    if (this.tasks.has(task.taskId)) return false;
    this.tasks.set(task.taskId, task);
    return true;
  }

  async listTasks(status?: TaskStatus): Promise<FulfillmentTask[]> {
    const all = [...this.tasks.values()];
    return status ? all.filter((t) => t.status === status) : all;
  }

  async listTasksByOrderId(orderId: string): Promise<FulfillmentTask[]> {
    return [...this.tasks.values()].filter((t) => t.orderId === orderId);
  }

  async setTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) this.tasks.set(taskId, { ...task, status });
  }

  async updateTask(taskId: string, patch: Partial<FulfillmentTask>): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) this.tasks.set(taskId, { ...task, ...patch });
  }

  // CAS-lås: synkron get+set är atomiskt inom EN process (ingen await emellan), så
  // detta speglar wix-data-semantiken (ej beställd OCH ej claimad → vinn). I prod är
  // det wix-data:s conditional PATCH som ger atomiciteten mellan processer/instanser.
  async claimTask(taskId: string, token: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task || task.aliexpressOrderId || task.claimToken) return false;
    this.tasks.set(taskId, { ...task, claimToken: token });
    return true;
  }

  async releaseTask(taskId: string, token: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task && task.claimToken === token) {
      const { claimToken: _drop, ...rest } = task;
      this.tasks.set(taskId, rest);
    }
  }

  // CAS: avbryt bara om varken claimad eller beställd (samma villkor som claimTask).
  // Synkron get+set → atomiskt i en process; speglar wix-data:s conditional PATCH.
  async cancelTaskIfFree(taskId: string): Promise<"applied" | "blocked" | "not-found"> {
    const task = this.tasks.get(taskId);
    if (!task) return "not-found";
    if (task.aliexpressOrderId || task.claimToken) return "blocked";
    this.tasks.set(taskId, { ...task, status: "cancelled" });
    return "applied";
  }

  async appendAudit(entry: AuditEntry): Promise<void> {
    this.audit.push(entry);
  }

  async listAudit(limit = 100): Promise<AuditEntry[]> {
    return this.audit.slice(-limit).reverse();
  }

  async getAliExpressTokens(): Promise<AliExpressTokenRecord | null> {
    return this.aliExpressTokens;
  }

  async saveAliExpressTokens(record: AliExpressTokenRecord): Promise<void> {
    this.aliExpressTokens = record;
  }
}

// Singleton för utveckling (delas mellan route-anrop i samma process).
let singleton: MemoryStore | null = null;
export function getMemoryStore(): MemoryStore {
  if (!singleton) singleton = new MemoryStore();
  return singleton;
}
