import type { FulfillmentTask, TaskStatus } from "../orders/types";
import type { ProductMappingRecord, Store } from "./index";

// In-memory-implementation. Bra för tester och lokal utveckling; byt mot en
// Wix Data-/DB-backad implementation innan produktion (se store/index.ts).

export class MemoryStore implements Store {
  private seenEvents = new Set<string>();
  private mappings = new Map<string, ProductMappingRecord>();
  private tasks = new Map<string, FulfillmentTask>();

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

  async setTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task) this.tasks.set(taskId, { ...task, status });
  }
}

// Singleton för utveckling (delas mellan route-anrop i samma process).
let singleton: MemoryStore | null = null;
export function getMemoryStore(): MemoryStore {
  if (!singleton) singleton = new MemoryStore();
  return singleton;
}
