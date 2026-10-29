import type { FulfillmentTask, TaskStatus } from "../orders/types";
import type { AliExpressTokenRecord, AuditEntry, ProductMappingRecord, Store } from "./index";
import {
  allaRader,
  fraga,
  hamta,
  infoga,
  patcha,
  satt,
  spara,
  sparaManga,
  taBortFalt,
  taBortMedFilter,
} from "../db/wix-data-klient";

// WixDataStore: persisterar mappningar, tasks, webhook-event och audit-rader
// i Wix Data-collections (CMS). Använd via STORE_BACKEND=wix-data i env, eller
// `DRIFTEN_I_WIX` i lib/store/backend.ts.
// API: https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items
//
// ☠️ ALLT GÅR VIA lib/db/wix-data-klient.ts sedan 2026-10-29. Den här filen
// hade egna fetch-hjälpare med offset-sidning och ett tak på 10 000 rader, och
// ingen av dem försökte om ett kvotstopp (WDE0014). Med drift-datan tillbaka i
// Wix är kvoten sajtens (1 500 skrivningar i minuten), och ett tappat
// kvotstopp hade varit en tappad task.

const COL = {
  mappings: process.env.WIX_DATA_COL_MAPPINGS ?? "FyndplatsMappings",
  events: process.env.WIX_DATA_COL_EVENTS ?? "FyndplatsWebhookEvents",
  tasks: process.env.WIX_DATA_COL_TASKS ?? "FyndplatsTasks",
  audit: process.env.WIX_DATA_COL_AUDIT ?? "FyndplatsAudit",
  tokens: process.env.WIX_DATA_COL_TOKENS ?? "FyndplatsAliExpressTokens",
};

// Singleton-id för AliExpress-token-raden. En enda rad per Wix-site eftersom
// vi bara har en AliExpress-app per Fyndplats-konto.
export const ALIEXPRESS_TOKEN_ID = "aliexpress-main";

/** Audit-radens id. Samma form i Postgres, så kopierade rader och nya kolliderar i stället för att dubbleras. */
export function auditId(entry: AuditEntry): string {
  return `${entry.at}-${entry.kind}-${entry.ref ?? "_"}`;
}

/** Villkoret för dubbel-order-låset: varken beställd eller claimad. */
const FRI_TASK = {
  $and: [
    { $or: [{ aliexpressOrderId: "" }, { aliexpressOrderId: { $exists: false } }] },
    { $or: [{ claimToken: "" }, { claimToken: { $exists: false } }] },
  ],
};

export class WixDataStore implements Store {
  async hasSeenEvent(eventId: string): Promise<boolean> {
    return (await hamta(COL.events, eventId)) !== null;
  }

  async markEventSeen(eventId: string): Promise<void> {
    await spara(COL.events, eventId, { seenAt: new Date().toISOString() });
  }

  async saveMapping(record: ProductMappingRecord): Promise<void> {
    await spara(COL.mappings, record.wixProductId, { ...record } as Record<string, unknown>);
  }

  async getMappingByWixProductId(wixProductId: string): Promise<ProductMappingRecord | null> {
    return hamta<ProductMappingRecord>(COL.mappings, wixProductId);
  }

  /**
   * En fråga per hundra id (`$in` på `_id`, som är Wix-produkt-id:t). Uppmätt
   * 2026-10-29: femtio rader på 140–270 ms, mot 110–220 ms för EN rad med get.
   * Bara rader vars `_id` efterfrågades kommer med.
   */
  async getMappingsByWixProductIds(wixProductIds: string[]): Promise<Map<string, ProductMappingRecord>> {
    const ut = new Map<string, ProductMappingRecord>();
    const unika = [...new Set(wixProductIds)];
    for (let i = 0; i < unika.length; i += 100) {
      const del = new Set(unika.slice(i, i + 100));
      const rader = await fraga<ProductMappingRecord & { _id?: unknown }>(COL.mappings, {
        filter: { _id: { $in: [...del] } },
        limit: 1000,
      });
      for (const r of rader) {
        if (typeof r._id === "string" && del.has(r._id)) ut.set(r._id, r);
      }
    }
    return ut;
  }

  async saveMappings(records: ProductMappingRecord[]): Promise<{ fel: { wixProductId: string; fel: string }[] }> {
    const utfall = await sparaManga(
      COL.mappings,
      records.map((r) => ({ id: r.wixProductId, data: { ...r } as Record<string, unknown> })),
    );
    return { fel: utfall.fel.map((f) => ({ wixProductId: f.id, fel: f.fel })) };
  }

  /** ALLA mappningar, med markör. Ingen offset och inget tyst tak (se klienten). */
  async listMappings(): Promise<ProductMappingRecord[]> {
    return allaRader<ProductMappingRecord>(COL.mappings, { sidstorlek: 500 });
  }

  /** Hundra id per fråga. Kollektionen har inget index på fälten, men 22 000 rader är en snabb genomsökning. */
  async mappningarForLeverantorsId(ids: string[]): Promise<ProductMappingRecord[]> {
    const unika = [...new Set(ids.filter(Boolean))];
    const ut = new Map<string, ProductMappingRecord>();
    for (let i = 0; i < unika.length; i += 100) {
      const del = unika.slice(i, i + 100);
      const rader = await allaRader<ProductMappingRecord>(COL.mappings, {
        filter: { $or: [{ supplierProductId: { $in: del } }, { importSparr: { $in: del } }] },
        sidstorlek: 500,
      });
      for (const r of rader) ut.set(r.wixProductId, r);
    }
    return [...ut.values()];
  }

  async upsertTask(task: FulfillmentTask): Promise<void> {
    await spara(COL.tasks, task.taskId, { ...task } as Record<string, unknown>);
  }

  /**
   * Skapar bara om taskId saknas — ETT anspråk (insert), inte läs-sedan-skriv.
   * Den gamla vägen hade ett fönster där två webhook-leveranser kunde passera
   * kontrollen samtidigt. Wix vägrar ett id som finns (WDE0074).
   */
  async createTaskIfAbsent(task: FulfillmentTask): Promise<boolean> {
    return (await infoga(COL.tasks, task.taskId, { ...task } as Record<string, unknown>)) === "skapad";
  }

  async listTasks(status?: TaskStatus): Promise<FulfillmentTask[]> {
    return allaRader<FulfillmentTask>(COL.tasks, { filter: status ? { status } : {} });
  }

  async listTasksByOrderId(orderId: string): Promise<FulfillmentTask[]> {
    // Server-side-filter på rot-fältet `orderId` (fälten ligger på rotnivå i data).
    return allaRader<FulfillmentTask>(COL.tasks, { filter: { orderId } });
  }

  /**
   * ☠️ VERSALOKÄNSLIGT, som Postgres-vägen. Rutten versaliserar kundens
   * inmatning, och en task som bär numret gemener hade annars gett exakt den
   * tysta 404 som migreringen redan gav en gång (2026-09-01). Wix filter på
   * likhet är versalkänsligt, så en exakt träff prövas först och sedan hela
   * listan jämförd i versaler. Tasks är några hundra rader: en eller två sidor.
   */
  async getTaskByTrackingNumber(trackingNumber: string): Promise<FulfillmentTask | null> {
    if (!trackingNumber) return null;
    const exakt = await fraga<FulfillmentTask>(COL.tasks, { filter: { trackingNumber }, limit: 1 });
    if (exakt[0]) return exakt[0];
    const sokt = trackingNumber.toUpperCase();
    const alla = await allaRader<FulfillmentTask>(COL.tasks, { filter: { trackingNumber: { $exists: true } } });
    return alla.find((t) => typeof t.trackingNumber === "string" && t.trackingNumber.toUpperCase() === sokt) ?? null;
  }

  async setTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    // PATCH SET_FIELD i stället för read-then-save full-replace (annars nollar en
    // parallell skrivning claimToken). Saknad task → "not-found" → tyst no-op.
    await patcha(COL.tasks, taskId, [satt("status", status)]);
  }

  async updateTask(taskId: string, patch: Partial<FulfillmentTask>): Promise<void> {
    // Per-fält-PATCH (rör BARA angivna fält) → bevarar claimToken som annars nollas av
    // en parallell full-replace som läste före claimen. undefined → REMOVE_FIELD
    // (override-clear). Iterera patch-objektet direkt (inte JSON-roundtrip — undefined
    // försvinner då). Saknad task → "not-found" → tyst no-op (bevarar gammalt kontrakt).
    // ☠️ null tas också bort, sätts aldrig: `$exists: false` i FRI_TASK matchar inte
    // ett fält som är null (uppmätt 2026-10-29), och då hade tasken aldrig gått att claima.
    const mods = Object.entries(patch).map(([k, v]) => (v === undefined || v === null ? taBortFalt(k) : satt(k, v)));
    if (mods.length === 0) return;
    await patcha(COL.tasks, taskId, mods);
  }

  async claimTask(taskId: string, token: string): Promise<boolean> {
    // Atomisk CAS: sätt claimToken ENBART om tasken varken är beställd eller claimad.
    // Empiriskt verifierat (3/3 + fält-löst + TOCTOU). "applied" = vi vann. 428/404 = false.
    return (await patcha(COL.tasks, taskId, [satt("claimToken", token)], FRI_TASK)) === "applied";
  }

  async cancelTaskIfFree(taskId: string): Promise<"applied" | "blocked" | "not-found"> {
    // Samma CAS-villkor som claimTask → cancel och orderläggning utesluter varandra.
    const r = await patcha(COL.tasks, taskId, [satt("status", "cancelled")], FRI_TASK);
    return r === "applied" ? "applied" : r === "not-found" ? "not-found" : "blocked";
  }

  async releaseTask(taskId: string, token: string): Promise<void> {
    // Rör bara om VI håller låset (condition {claimToken: token}). Fail-open: ett
    // release-fel får ALDRIG fälla orderflödet → svälj och logga.
    try {
      await patcha(COL.tasks, taskId, [taBortFalt("claimToken")], { claimToken: token });
    } catch (e) {
      console.warn(`[wix-data] releaseTask(${taskId}) misslyckades:`, e instanceof Error ? e.message : e);
    }
  }

  async appendAudit(entry: AuditEntry): Promise<void> {
    await spara(COL.audit, auditId(entry), { ...entry } as Record<string, unknown>);
  }

  /** De senaste, sorterade på `at` (index i Wix, se lib/db/wix-kollektioner.ts). */
  async listAudit(limit = 100): Promise<AuditEntry[]> {
    return fraga<AuditEntry>(COL.audit, { sort: [{ fieldName: "at", order: "DESC" }], limit: Math.min(limit, 1000) });
  }

  async pruneAuditOlderThan(days: number, nowMs = Date.now()): Promise<string> {
    // Filtrerar på `at` (vårt eget ISO-fält, samma som listAudit sorterar på),
    // inte Wix `_createdDate` — `at` är det appen faktiskt äger och sätter.
    const cutoff = new Date(nowMs - days * 24 * 60 * 60 * 1000).toISOString();
    return taBortMedFilter(COL.audit, { at: { $lt: cutoff } });
  }

  async getAliExpressTokens(): Promise<AliExpressTokenRecord | null> {
    const raw = await hamta<{
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
    await spara(COL.tokens, ALIEXPRESS_TOKEN_ID, {
      accessToken: record.accessToken,
      refreshToken: record.refreshToken,
      expiresAt: record.expiresAt.toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
