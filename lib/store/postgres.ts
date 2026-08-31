// Store mot Postgres (Neon). Tredje implementationen av samma interface som
// memory och wix-data, vald med STORE_BACKEND=postgres.
//
// VARFÖR DEN FINNS: Wix Datas radtak är 4 000 poster GLOBALT över alla
// kollektioner, och drift-datan ensam är ~15 400. Se POSTGRES-MIGRATION.md.
//
// FORMEN: riktiga kolumner för det vi frågar på, JSONB för hela posten. Läsning
// returnerar `data` rakt av, så TypeScript-typen i lib/store/index.ts förblir
// den enda sanningen om vad en post innehåller — kolumnerna är projektioner för
// index och filter, inte en andra definition som kan glida isär.

import { sql } from "../db/client";
import type {
  AliExpressTokenRecord,
  AuditEntry,
  ProductMappingRecord,
  Store,
} from "./index";
import type { FulfillmentTask, TaskStatus } from "../orders/types";

/** Wix la sina interna fält inuti `data`. De följer med i kopieringen och ska
 *  inte läcka vidare till anroparna — ingen kod läser dem (verifierat i
 *  auditen), men en post som bär dem ser ut att komma från Wix. */
function rensa<T>(rad: { data: unknown }): T {
  const d = { ...(rad.data as Record<string, unknown>) };
  delete d._id;
  delete d._owner;
  delete d._createdDate;
  delete d._updatedDate;
  return d as T;
}

function tidEller(v: unknown, fallback: string | null = null): string | null {
  return typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : fallback;
}

export class PostgresStore implements Store {
  // --- Idempotens för webhooks -------------------------------------------
  async hasSeenEvent(eventId: string): Promise<boolean> {
    const q = sql();
    const rows = await q`select 1 from webhook_events where event_id = ${eventId} limit 1`;
    return rows.length > 0;
  }

  async markEventSeen(eventId: string): Promise<void> {
    const q = sql();
    await q`insert into webhook_events (event_id) values (${eventId})
            on conflict (event_id) do nothing`;
  }

  // --- Produktmappningar --------------------------------------------------
  async saveMapping(record: ProductMappingRecord): Promise<void> {
    const q = sql();
    await q`
      insert into mappings (
        wix_product_id, supplier_product_id, supplier, draft_status,
        needs_ai_polish, priority, reviews_checked_at, data, updated_at
      ) values (
        ${record.wixProductId}, ${record.supplierProductId}, ${record.supplier ?? null},
        ${record.draftStatus ?? null}, ${record.needsAiPolish ?? null},
        ${record.priority ?? null}, ${tidEller(record.reviewsCheckedAt)},
        ${JSON.stringify(record)}, now()
      )
      on conflict (wix_product_id) do update set
        supplier_product_id = excluded.supplier_product_id,
        supplier            = excluded.supplier,
        draft_status        = excluded.draft_status,
        needs_ai_polish     = excluded.needs_ai_polish,
        priority            = excluded.priority,
        reviews_checked_at  = excluded.reviews_checked_at,
        data                = excluded.data,
        updated_at          = now()`;
  }

  async getMappingByWixProductId(wixProductId: string): Promise<ProductMappingRecord | null> {
    const q = sql();
    const rows = await q`select data from mappings where wix_product_id = ${wixProductId} limit 1`;
    return rows[0] ? rensa<ProductMappingRecord>(rows[0] as { data: unknown }) : null;
  }

  /**
   * ☠️ INGET TAK HÄR, till skillnad från Wix-varianten.
   *
   * `queryAll` i wix-data.ts hämtade högst 10 000 rader och AVKORTADE TYST över
   * det — vid 5 470 mappningar var vi på 55 % av taket med 5 566 Aosom-artiklar
   * kvar att importera. En indexerad SQL-fråga har inget motsvarande golv att
   * falla igenom.
   */
  async listMappings(): Promise<ProductMappingRecord[]> {
    const q = sql();
    const rows = await q`select data from mappings`;
    return rows.map((r) => rensa<ProductMappingRecord>(r as { data: unknown }));
  }

  // --- Fulfillment-tasks --------------------------------------------------
  async upsertTask(task: FulfillmentTask): Promise<void> {
    const q = sql();
    await q`
      insert into tasks (
        task_id, order_id, order_number, status, claim_token,
        aliexpress_order_id, data, created_at, updated_at
      ) values (
        ${task.taskId}, ${task.orderId}, ${task.orderNumber ?? null}, ${task.status},
        ${task.claimToken ?? null}, ${task.aliexpressOrderId ?? null},
        ${JSON.stringify(task)}, ${task.createdAt}, now()
      )
      on conflict (task_id) do update set
        order_id            = excluded.order_id,
        order_number        = excluded.order_number,
        status              = excluded.status,
        claim_token         = excluded.claim_token,
        aliexpress_order_id = excluded.aliexpress_order_id,
        data                = excluded.data,
        updated_at          = now()`;
  }

  /**
   * Skapar bara om taskId saknas. `ON CONFLICT DO NOTHING ... RETURNING` gör
   * det i EN sats: i Wix var det läs-sedan-skriv, alltså ett fönster där två
   * webhook-leveranser kunde passera kontrollen samtidigt.
   */
  async createTaskIfAbsent(task: FulfillmentTask): Promise<boolean> {
    const q = sql();
    const rows = await q`
      insert into tasks (
        task_id, order_id, order_number, status, claim_token,
        aliexpress_order_id, data, created_at
      ) values (
        ${task.taskId}, ${task.orderId}, ${task.orderNumber ?? null}, ${task.status},
        ${task.claimToken ?? null}, ${task.aliexpressOrderId ?? null},
        ${JSON.stringify(task)}, ${task.createdAt}
      )
      on conflict (task_id) do nothing
      returning task_id`;
    return rows.length > 0;
  }

  async listTasks(status?: TaskStatus): Promise<FulfillmentTask[]> {
    const q = sql();
    const rows = status
      ? await q`select data from tasks where status = ${status} order by created_at desc`
      : await q`select data from tasks order by created_at desc`;
    return rows.map((r) => rensa<FulfillmentTask>(r as { data: unknown }));
  }

  async listTasksByOrderId(orderId: string): Promise<FulfillmentTask[]> {
    const q = sql();
    const rows = await q`select data from tasks where order_id = ${orderId}`;
    return rows.map((r) => rensa<FulfillmentTask>(r as { data: unknown }));
  }

  async setTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    const q = sql();
    await q`update tasks
              set status = ${status},
                  data = data || ${JSON.stringify({ status })}::jsonb,
                  updated_at = now()
            where task_id = ${taskId}`;
  }

  /**
   * Slår ihop `patch` med befintlig `data`. `undefined` i patchen betyder
   * "ta bort fältet" — samma kontrakt som Wix-varianten, där det blev
   * REMOVE_FIELD. Saknad task är en tyst no-op, också som förut.
   *
   * ☠️ Fälten sätts med `||` (merge), inte genom att skriva hela raden. En full
   * ersättning läst-före-claim hade nollat `claimToken` för en parallell
   * orderläggning — exakt den kapplöpning kommentaren i wix-data.ts varnar för.
   */
  async updateTask(taskId: string, patch: Partial<FulfillmentTask>): Promise<void> {
    const nycklar = Object.keys(patch);
    if (nycklar.length === 0) return;

    const sätt: Record<string, unknown> = {};
    const taBort: string[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) taBort.push(k);
      else sätt[k] = v;
    }

    const q = sql();
    await q`
      update tasks set
        data = (data || ${JSON.stringify(sätt)}::jsonb) - ${taBort}::text[],
        status = coalesce(${(sätt.status as string) ?? null}, status),
        claim_token = case
          when ${taBort.includes("claimToken")} then null
          else coalesce(${(sätt.claimToken as string) ?? null}, claim_token) end,
        aliexpress_order_id = case
          when ${taBort.includes("aliexpressOrderId")} then null
          else coalesce(${(sätt.aliexpressOrderId as string) ?? null}, aliexpress_order_id) end,
        updated_at = now()
      where task_id = ${taskId}`;
  }

  /**
   * ☠️ DUBBEL-ORDER-LÅSET. En villkorad UPDATE ... RETURNING är atomisk av
   * databasen — starkare än Wix-varianten, som var en PATCH med filter och
   * behövde verifieras empiriskt för att man skulle våga lita på den.
   *
   * Villkoret: varken claimad eller redan beställd. Tomma strängar räknas som
   * ofritt läge precis som i Wix (rader kopierade därifrån kan bära `""`).
   */
  async claimTask(taskId: string, token: string): Promise<boolean> {
    const q = sql();
    const rows = await q`
      update tasks
         set claim_token = ${token},
             data = data || ${JSON.stringify({ claimToken: token })}::jsonb,
             updated_at = now()
       where task_id = ${taskId}
         and coalesce(claim_token, '') = ''
         and coalesce(aliexpress_order_id, '') = ''
      returning task_id`;
    return rows.length > 0;
  }

  /** Släpper låset bara om VI håller det. Kastar aldrig — ett release-fel får
   *  inte fälla orderflödet (samma fail-open som Wix-varianten). */
  async releaseTask(taskId: string, token: string): Promise<void> {
    try {
      const q = sql();
      await q`update tasks
                 set claim_token = null,
                     data = data - 'claimToken',
                     updated_at = now()
               where task_id = ${taskId} and claim_token = ${token}`;
    } catch (e) {
      console.warn(
        `[postgres] releaseTask(${taskId}) misslyckades:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  /** Samma CAS-villkor som claimTask → cancel och orderläggning utesluter
   *  varandra. Skiljer "finns inte" från "blockerad", som anroparen behöver. */
  async cancelTaskIfFree(taskId: string): Promise<"applied" | "blocked" | "not-found"> {
    const q = sql();
    const rows = await q`
      update tasks
         set status = 'cancelled',
             data = data || '{"status":"cancelled"}'::jsonb,
             updated_at = now()
       where task_id = ${taskId}
         and coalesce(claim_token, '') = ''
         and coalesce(aliexpress_order_id, '') = ''
      returning task_id`;
    if (rows.length > 0) return "applied";
    const finns = await q`select 1 from tasks where task_id = ${taskId} limit 1`;
    return finns.length > 0 ? "blocked" : "not-found";
  }

  // --- Audit --------------------------------------------------------------
  async appendAudit(entry: AuditEntry): Promise<void> {
    // Samma id-form som Wix-varianten, så kopierade rader och nya kolliderar
    // på samma nyckel i stället för att dubbleras.
    const id = `${entry.at}-${entry.kind}-${entry.ref ?? "_"}`;
    const q = sql();
    await q`insert into audit (id, at, kind, ref, detail)
            values (${id}, ${entry.at}, ${entry.kind}, ${entry.ref ?? null}, ${entry.detail ?? null})
            on conflict (id) do update set detail = excluded.detail`;
  }

  async listAudit(limit = 100): Promise<AuditEntry[]> {
    const q = sql();
    const rows = await q`select at, kind, ref, detail from audit order by at desc limit ${limit}`;
    return rows.map((r) => {
      const rad = r as { at: Date | string; kind: string; ref: string | null; detail: string | null };
      return {
        at: rad.at instanceof Date ? rad.at.toISOString() : String(rad.at),
        kind: rad.kind,
        ...(rad.ref ? { ref: rad.ref } : {}),
        ...(rad.detail ? { detail: rad.detail } : {}),
      };
    });
  }

  /** En rak DELETE. I Wix var det ett asynkront jobb vars id man fick tillbaka
   *  och aldrig kunde följa upp — här är antalet raderade rader ett svar. */
  async pruneAuditOlderThan(days: number, nowMs = Date.now()): Promise<string> {
    const cutoff = new Date(nowMs - days * 24 * 60 * 60 * 1000).toISOString();
    const q = sql();
    const rows = await q`delete from audit where at < ${cutoff} returning id`;
    return `${rows.length} rader`;
  }

  // --- AliExpress OAuth ---------------------------------------------------
  async getAliExpressTokens(): Promise<AliExpressTokenRecord | null> {
    const q = sql();
    const rows = await q`select access_token, refresh_token, expires_at
                           from aliexpress_tokens where id = 1 limit 1`;
    const r = rows[0] as
      | { access_token: string; refresh_token: string; expires_at: Date | string }
      | undefined;
    if (!r) return null;
    return {
      accessToken: r.access_token,
      refreshToken: r.refresh_token,
      expiresAt: r.expires_at instanceof Date ? r.expires_at : new Date(r.expires_at),
    };
  }

  async saveAliExpressTokens(record: AliExpressTokenRecord): Promise<void> {
    const q = sql();
    await q`
      insert into aliexpress_tokens (id, access_token, refresh_token, expires_at, updated_at)
      values (1, ${record.accessToken}, ${record.refreshToken}, ${record.expiresAt.toISOString()}, now())
      on conflict (id) do update set
        access_token  = excluded.access_token,
        refresh_token = excluded.refresh_token,
        expires_at    = excluded.expires_at,
        updated_at    = now()`;
  }
}
