import type { FulfillmentTask, TaskStatus } from "../orders/types";
import type { AuditEntry, ProductMappingRecord, Store } from "./index";

// WixDataStore: persisterar mappningar, tasks, webhook-event och audit-rader
// i Wix Data-collections (CMS). Använd via STORE_BACKEND=wix-data i env.
// API: https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items

const WIX_BASE = "https://www.wixapis.com";

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

const COL = {
  mappings: process.env.WIX_DATA_COL_MAPPINGS ?? "FyndplatsMappings",
  events: process.env.WIX_DATA_COL_EVENTS ?? "FyndplatsWebhookEvents",
  tasks: process.env.WIX_DATA_COL_TASKS ?? "FyndplatsTasks",
  audit: process.env.WIX_DATA_COL_AUDIT ?? "FyndplatsAudit",
};

async function save(dataCollectionId: string, id: string, data: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ dataCollectionId, dataItem: { id, dataCollectionId, data } }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix Data save ${dataCollectionId} (${res.status}): ${text.slice(0, 300)}`);
  }
}

async function get<T>(dataCollectionId: string, id: string): Promise<T | null> {
  const url = `${WIX_BASE}/data/v2/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(dataCollectionId)}`;
  const res = await fetch(url, { method: "GET", headers: headers() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix Data get ${dataCollectionId}/${id} (${res.status}): ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { dataItem?: { data?: T } };
  return body.dataItem?.data ?? null;
}

async function query<T>(
  dataCollectionId: string,
  filter?: Record<string, unknown>,
  sort?: { fieldName: string; order: "ASC" | "DESC" }[],
  limit = 100,
): Promise<T[]> {
  const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId,
      query: { filter: filter ?? {}, sort: sort ?? [], paging: { limit } },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix Data query ${dataCollectionId} (${res.status}): ${text.slice(0, 300)}`);
  }
  const body = (await res.json()) as { dataItems?: { data?: T }[] };
  return (body.dataItems ?? []).map((d) => d.data).filter((d): d is T => Boolean(d));
}

export class WixDataStore implements Store {
  async hasSeenEvent(eventId: string): Promise<boolean> {
    const item = await get<{ id: string }>(COL.events, eventId);
    return item !== null;
  }

  async markEventSeen(eventId: string): Promise<void> {
    await save(COL.events, eventId, { _id: eventId, seenAt: new Date().toISOString() });
  }

  async saveMapping(record: ProductMappingRecord): Promise<void> {
    await save(COL.mappings, record.wixProductId, { _id: record.wixProductId, ...record });
  }

  async getMappingByWixProductId(wixProductId: string): Promise<ProductMappingRecord | null> {
    return get<ProductMappingRecord>(COL.mappings, wixProductId);
  }

  async listMappings(): Promise<ProductMappingRecord[]> {
    return query<ProductMappingRecord>(COL.mappings);
  }

  async upsertTask(task: FulfillmentTask): Promise<void> {
    await save(COL.tasks, task.taskId, { _id: task.taskId, ...task });
  }

  async createTaskIfAbsent(task: FulfillmentTask): Promise<boolean> {
    const existing = await get<FulfillmentTask>(COL.tasks, task.taskId);
    if (existing) return false;
    await this.upsertTask(task);
    return true;
  }

  async listTasks(status?: TaskStatus): Promise<FulfillmentTask[]> {
    const filter = status ? { status } : undefined;
    return query<FulfillmentTask>(COL.tasks, filter);
  }

  async setTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    const existing = await get<FulfillmentTask>(COL.tasks, taskId);
    if (!existing) return;
    await this.upsertTask({ ...existing, status });
  }

  async appendAudit(entry: AuditEntry): Promise<void> {
    const id = `${entry.at}-${entry.kind}-${entry.ref ?? "_"}`;
    await save(COL.audit, id, { _id: id, ...entry });
  }

  async listAudit(limit = 100): Promise<AuditEntry[]> {
    return query<AuditEntry>(COL.audit, undefined, [{ fieldName: "at", order: "DESC" }], limit);
  }
}
