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

/**
 * Asynkron massradering. Wix kör jobbet i bakgrunden och svarar direkt med ett
 * jobId — raderingen är alltså INTE klar när anropet returnerar. Samma endpoint
 * som synk-loggens retention (lib/sync/sync-log.ts).
 */
async function removeByFilter(dataCollectionId: string, filter: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${WIX_BASE}/data/v2/bulk/items/async-remove-by-filter`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ dataCollectionId, filter }),
  });
  if (!res.ok) {
    throw new Error(wixErrorMessage("remove-by-filter", dataCollectionId, res.status, await res.text()));
  }
  const body = (await res.json()) as { jobId?: string };
  return body.jobId ?? "";
}

type PatchResult = "applied" | "condition-failed" | "not-found";

/**
 * Patch Data Item med valfritt `condition.filter` — atomisk compare-and-set.
 * Empiriskt verifierat mot riktig Wix Data: två samtidiga conditional-patchar →
 * exakt EN lyckas, förloraren får HTTP 428 kod WDE0193. Endpoint `/data/v2/items/{id}`
 * (samma bas som save/get/query, bekräftat fungerande för PATCH). `fieldPath` UTAN
 * `data.`-prefix (get() unwrappar dataItem.data → fälten ligger på rotnivå i filtret).
 *  • 2xx → "applied"
 *  • 428 + WDE0193 (mot OTRUNKERAD body) → "condition-failed" (villkoret matchade inte)
 *  • 404 → "not-found" (tasken finns inte)
 *  • annat → THROW (okänt → anroparen avgör fail-closed/open)
 */
async function patchItem(
  dataCollectionId: string,
  dataItemId: string,
  fieldModifications: unknown[],
  condition?: { filter: Record<string, unknown> },
): Promise<PatchResult> {
  const res = await fetch(`${WIX_BASE}/data/v2/items/${encodeURIComponent(dataItemId)}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId,
      patch: { dataItemId, fieldModifications },
      ...(condition ? { condition } : {}),
    }),
  });
  if (res.ok) return "applied";
  if (res.status === 404) return "not-found";
  const text = await res.text(); // OTRUNKERAD för WDE0193-detektion (wixErrorMessage trunkerar till 300)
  if (res.status === 428 && /WDE0193/.test(text)) return "condition-failed";
  throw new Error(wixErrorMessage("patch", dataCollectionId, res.status, text));
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

/** En sida ur en Wix Data-collection. Saknad kollektion (404 / vissa 400) → []. */
async function queryPage<T>(
  dataCollectionId: string,
  filter: Record<string, unknown> | undefined,
  sort: { fieldName: string; order: "ASC" | "DESC" }[] | undefined,
  limit: number,
  offset: number,
): Promise<T[]> {
  // offset utelämnas vid 0 så page-0-anropet ger exakt samma body som förr.
  const paging: Record<string, number> = { limit };
  if (offset > 0) paging.offset = offset;
  const res = await fetch(`${WIX_BASE}/data/v2/items/query`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId,
      query: { filter: filter ?? {}, sort: sort ?? [], paging },
    }),
  });
  if (!res.ok) {
    // Saknad kollektion (404) eller "inte ännu skapad" på siten (vissa 400)
    // ska tolereras tyst — semantiskt detsamma som tom kollektion. Annars
    // crashar t.ex. poll-tracking-cronen i evighet innan FyndplatsTasks
    // ens har skapats av första fulfillment-flödet.
    if (res.status === 404) return [];
    const text = await res.text();
    if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) {
      return [];
    }
    throw new Error(wixErrorMessage("query", dataCollectionId, res.status, text));
  }
  const body = (await res.json()) as { dataItems?: { data?: T }[] };
  return (body.dataItems ?? []).map((d) => d.data).filter((d): d is T => Boolean(d));
}

/** Första sidan (≤ limit rader). För topp-N/log-läsningar (t.ex. listAudit). */
async function query<T>(
  dataCollectionId: string,
  filter?: Record<string, unknown>,
  sort?: { fieldName: string; order: "ASC" | "DESC" }[],
  limit = 100,
): Promise<T[]> {
  return queryPage<T>(dataCollectionId, filter, sort, limit, 0);
}

/**
 * ALLA rader i en collection, sid-paginerat (Wix Data-tak = 100/sida). Wix Data
 * `query` utan paging gav bara de FÖRSTA 100 → listMappings/listTasks tappade tyst
 * allt därutöver: admin visade "100 mappade" trots 229 rader, stock-syncen +
 * import-dedupen såg bara 100, och orderläggningen kunde inte hitta en task bortom
 * de 100 första. Dedupar på _id ifall offset-paging överlappar vid samtidig skrivning.
 */
async function queryAll<T>(
  dataCollectionId: string,
  filter?: Record<string, unknown>,
  sort?: { fieldName: string; order: "ASC" | "DESC" }[],
): Promise<T[]> {
  const pageSize = 100;
  const out: T[] = [];
  const seen = new Set<string>();
  // Safety-tak: 100 sidor (10 000 rader), långt över nuvarande skala. Skulle det
  // någonsin överskridas → byt till cursor-paging.
  for (let offset = 0; offset <= 10_000; offset += pageSize) {
    const items = await queryPage<T>(dataCollectionId, filter, sort, pageSize, offset);
    for (const it of items) {
      const id = (it as { _id?: unknown })._id;
      if (typeof id === "string") {
        if (seen.has(id)) continue;
        seen.add(id);
      }
      out.push(it);
    }
    if (items.length < pageSize) break;
  }
  return out;
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
    return queryAll<ProductMappingRecord>(COL.mappings);
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
    return queryAll<FulfillmentTask>(COL.tasks, filter);
  }

  async listTasksByOrderId(orderId: string): Promise<FulfillmentTask[]> {
    // Server-side-filter på rot-fältet `orderId` (get() unwrappar dataItem.data →
    // fälten ligger på rotnivå i filtret, samma konvention som claim-CAS:en).
    return queryAll<FulfillmentTask>(COL.tasks, { orderId });
  }

  async setTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    // PATCH SET_FIELD i stället för read-then-save full-replace (annars nollar en
    // parallell skrivning claimToken). Saknad task → "not-found" → tyst no-op.
    await patchItem(COL.tasks, taskId, [
      { action: "SET_FIELD", fieldPath: "status", setFieldOptions: { value: status } },
    ]);
  }

  async updateTask(taskId: string, patch: Partial<FulfillmentTask>): Promise<void> {
    // Per-fält-PATCH (rör BARA angivna fält) → bevarar claimToken som annars nollas av
    // en parallell full-replace som läste före claimen. undefined → REMOVE_FIELD
    // (override-clear). Iterera patch-objektet direkt (inte JSON-roundtrip — undefined
    // försvinner då). Saknad task → "not-found" → tyst no-op (bevarar gammalt kontrakt).
    const mods = Object.entries(patch).map(([k, v]) =>
      v === undefined
        ? { action: "REMOVE_FIELD", fieldPath: k }
        : { action: "SET_FIELD", fieldPath: k, setFieldOptions: { value: v } },
    );
    if (mods.length === 0) return;
    await patchItem(COL.tasks, taskId, mods);
  }

  async claimTask(taskId: string, token: string): Promise<boolean> {
    // Atomisk CAS: sätt claimToken ENBART om tasken varken är beställd eller claimad.
    // Empiriskt verifierat (3/3 + fält-löst + TOCTOU). "applied" = vi vann. 428/404 = false.
    const r = await patchItem(
      COL.tasks,
      taskId,
      [{ action: "SET_FIELD", fieldPath: "claimToken", setFieldOptions: { value: token } }],
      {
        filter: {
          $and: [
            { $or: [{ aliexpressOrderId: "" }, { aliexpressOrderId: { $exists: false } }] },
            { $or: [{ claimToken: "" }, { claimToken: { $exists: false } }] },
          ],
        },
      },
    );
    return r === "applied";
  }

  async cancelTaskIfFree(taskId: string): Promise<"applied" | "blocked" | "not-found"> {
    // Samma CAS-villkor som claimTask (empiriskt verifierat) → cancel och orderläggning
    // utesluter varandra. "applied" = vi avbröt rent; 428/condition-failed = "blocked"
    // (claimad/beställd → anroparen läser om); 404 = "not-found".
    const r = await patchItem(
      COL.tasks,
      taskId,
      [{ action: "SET_FIELD", fieldPath: "status", setFieldOptions: { value: "cancelled" } }],
      {
        filter: {
          $and: [
            { $or: [{ aliexpressOrderId: "" }, { aliexpressOrderId: { $exists: false } }] },
            { $or: [{ claimToken: "" }, { claimToken: { $exists: false } }] },
          ],
        },
      },
    );
    return r === "applied" ? "applied" : r === "not-found" ? "not-found" : "blocked";
  }

  async releaseTask(taskId: string, token: string): Promise<void> {
    // Rör bara om VI håller låset (condition {claimToken: token}). Fail-open: ett
    // release-fel får ALDRIG fälla orderflödet → svälj och logga.
    try {
      await patchItem(
        COL.tasks,
        taskId,
        [{ action: "REMOVE_FIELD", fieldPath: "claimToken" }],
        { filter: { claimToken: token } },
      );
    } catch (e) {
      console.warn(`[wix-data] releaseTask(${taskId}) misslyckades:`, e instanceof Error ? e.message : e);
    }
  }

  async appendAudit(entry: AuditEntry): Promise<void> {
    const id = `${entry.at}-${entry.kind}-${entry.ref ?? "_"}`;
    await save(COL.audit, id, { _id: id, ...entry });
  }

  async listAudit(limit = 100): Promise<AuditEntry[]> {
    return query<AuditEntry>(COL.audit, undefined, [{ fieldName: "at", order: "DESC" }], limit);
  }

  async pruneAuditOlderThan(days: number, nowMs = Date.now()): Promise<string> {
    // Filtrerar på `at` (vårt eget ISO-fält, samma som listAudit sorterar på),
    // inte Wix `_createdDate` — `at` är det appen faktiskt äger och sätter.
    const cutoff = new Date(nowMs - days * 24 * 60 * 60 * 1000).toISOString();
    return removeByFilter(COL.audit, { at: { $lt: cutoff } });
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
