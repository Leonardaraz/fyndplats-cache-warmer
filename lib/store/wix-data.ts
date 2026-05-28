import type { FulfillmentTask, TaskStatus } from "../orders/types";
import type { AliExpressTokenRecord, AuditEntry, ProductMappingRecord, Store } from "./index";

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
  tokens: process.env.WIX_DATA_COL_TOKENS ?? "FyndplatsAliExpressTokens",
};

// Singleton-id för AliExpress-token-raden. En enda rad per Wix-site eftersom
// vi bara har en AliExpress-app per Fyndplats-konto.
const ALIEXPRESS_TOKEN_ID = "aliexpress-main";

/**
 * Wix Data error-body kan i värsta fall innehålla request-body-fält i
 * valideringsfel. För token-collectionen MÅSTE vi inte logga den raden eftersom
 * den skulle läcka access/refresh-tokens till Vercel-loggarna.
 */
function isSensitiveCollection(dataCollectionId: string): boolean {
  return dataCollectionId === COL.tokens;
}

function wixErrorMessage(
  op: string,
  dataCollectionId: string,
  status: number,
  body: string,
): string {
  const safe = isSensitiveCollection(dataCollectionId) ? "[redacted]" : body.slice(0, 300);
  return `Wix Data ${op} ${dataCollectionId} (${status}): ${safe}`;
}

async function save(dataCollectionId: string, id: string, data: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ dataCollectionId, dataItem: { id, dataCollectionId, data } }),
  });
  if (!res.ok) {
    throw new Error(wixErrorMessage("save", dataCollectionId, res.status, await res.text()));
  }
}

async function get<T>(dataCollectionId: string, id: string): Promise<T | null> {
  const url = `${WIX_BASE}/data/v2/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(dataCollectionId)}`;
  const res = await fetch(url, { method: "GET", headers: headers() });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(
      wixErrorMessage(`get/${id}`, dataCollectionId, res.status, await res.text()),
    );
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
    throw new Error(wixErrorMessage("query", dataCollectionId, res.status, await res.text()));
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

  async updateTask(taskId: string, patch: Partial<FulfillmentTask>): Promise<void> {
    const existing = await get<FulfillmentTask>(COL.tasks, taskId);
    if (!existing) return;
    await this.upsertTask({ ...existing, ...patch });
  }

  async appendAudit(entry: AuditEntry): Promise<void> {
    const id = `${entry.at}-${entry.kind}-${entry.ref ?? "_"}`;
    await save(COL.audit, id, { _id: id, ...entry });
  }

  async listAudit(limit = 100): Promise<AuditEntry[]> {
    return query<AuditEntry>(COL.audit, undefined, [{ fieldName: "at", order: "DESC" }], limit);
  }

  async getAliExpressTokens(): Promise<AliExpressTokenRecord | null> {
    const raw = await get<{
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: string;
    }>(COL.tokens, ALIEXPRESS_TOKEN_ID);
    if (!raw) return null;
    if (!raw.accessToken || !raw.refreshToken || !raw.expiresAt) {
      // Korrupt/partiell rad — varna operatorn istället för att tysta failas
      // tillbaka till env-fallback utan signal.
      console.warn(
        `[wix-data] ${COL.tokens}/${ALIEXPRESS_TOKEN_ID} har partiell token-data ` +
          `(accessToken=${Boolean(raw.accessToken)}, refreshToken=${Boolean(raw.refreshToken)}, ` +
          `expiresAt=${Boolean(raw.expiresAt)}). Behandlas som null.`,
      );
      return null;
    }
    const expiresAt = new Date(raw.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      console.warn(
        `[wix-data] ${COL.tokens}/${ALIEXPRESS_TOKEN_ID} har ogiltig expiresAt="${raw.expiresAt}". Behandlas som null.`,
      );
      return null;
    }
    return {
      accessToken: raw.accessToken,
      refreshToken: raw.refreshToken,
      expiresAt,
    };
  }

  async saveAliExpressTokens(record: AliExpressTokenRecord): Promise<void> {
    if (Number.isNaN(record.expiresAt.getTime())) {
      throw new Error(
        "saveAliExpressTokens: ogiltig expiresAt. Skickar inte till Wix — caller måste validera tokens.expires_in före anrop.",
      );
    }
    await save(COL.tokens, ALIEXPRESS_TOKEN_ID, {
      _id: ALIEXPRESS_TOKEN_ID,
      accessToken: record.accessToken,
      refreshToken: record.refreshToken,
      expiresAt: record.expiresAt.toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
