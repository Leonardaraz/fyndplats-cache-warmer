// Schemat för drift-datan. Idempotent — körs vid varje kopiering och kostar
// ingenting när tabellerna redan finns.
//
// MÖNSTRET GENOMGÅENDE: riktiga kolumner för det vi frågar på, JSONB för
// svansen. `ProductMappingRecord` har trettio fält varav en handfull används i
// filter; att göra alla trettio till kolumner vore trettio migrationer att
// hålla i synk med en TypeScript-typ som redan ÄR sanningen. JSONB:n bär hela
// posten, kolumnerna är projektioner av den för index och filter.
//
// Ingen ORM. Rå SQL i fem moduler är mindre kod än ett schemaverktyg, och
// typerna finns redan i lib/store/index.ts.

import { sql } from "./client";

/** Alla tabeller, i skapandeordning. Exporterad så verifieringen kan loopa. */
export const TABELLER = [
  "mappings",
  "tasks",
  "webhook_events",
  "audit",
  "aliexpress_tokens",
  "sync_log",
  "sync_state",
  "sync_alerts",
  "product_hashes",
  "import_costs",
  "llm_kv",
] as const;

export type Tabell = (typeof TABELLER)[number];

/**
 * Skapar det som saknas. `IF NOT EXISTS` överallt, så den är säker att köra om.
 *
 * Neons HTTP-drivrutin kör en sats per anrop, så DDL:en ligger som en lista i
 * stället för ett skript — det gör den dessutom läsbar rad för rad.
 */
export async function ensureSchema(): Promise<void> {
  const q = sql();
  for (const ddl of DDL) await q.query(ddl);
}

const DDL: string[] = [
  // --- Mappningar: 5 470 rader, den största posten -------------------------
  `create table if not exists mappings (
     wix_product_id      text primary key,
     supplier_product_id text not null,
     supplier            text,
     draft_status        text,
     needs_ai_polish     boolean,
     priority            text,
     reviews_checked_at  timestamptz,
     data                jsonb not null,
     updated_at          timestamptz not null default now()
   )`,
  // ☠️ Dubblettspärren ÄR det här indexet. I Wix var den en applikationsregel
  // som kunde kringgås av en tappad mappningsrad; här kan databasen inte låta
  // två produkter dela leverantörsartikelnummer.
  `create unique index if not exists mappings_supplier_product_id_key
     on mappings (supplier_product_id)`,
  // Filtrerad listning: AE-synken hoppar över Aosom-rader och tvärtom. I Wix
  // lästes alla 5 470 och 4 467 kastades bort — det var den obegränsade
  // fan-outen som sänkte synken i 57 timmar (2026-08-28).
  `create index if not exists mappings_supplier_idx on mappings (supplier)`,

  // --- Fulfillment-tasks ---------------------------------------------------
  `create table if not exists tasks (
     task_id             text primary key,
     order_id            text not null,
     order_number        text,
     status              text not null,
     claim_token         text,
     aliexpress_order_id text,
     data                jsonb not null,
     created_at          timestamptz not null,
     updated_at          timestamptz not null default now()
   )`,
  `create index if not exists tasks_order_id_idx on tasks (order_id)`,
  `create index if not exists tasks_status_idx on tasks (status)`,

  // --- Webhook-idempotens --------------------------------------------------
  `create table if not exists webhook_events (
     event_id text primary key,
     seen_at  timestamptz not null default now()
   )`,

  // --- Audit ---------------------------------------------------------------
  `create table if not exists audit (
     id     text primary key,
     at     timestamptz not null,
     kind   text not null,
     ref    text,
     detail text
   )`,
  `create index if not exists audit_at_idx on audit (at desc)`,

  // --- AliExpress OAuth ----------------------------------------------------
  // En enda rad. `id` är låst till 1 av CHECK:en så en andra rad är omöjlig —
  // två tokenrader hade betytt att hälften av lambdorna använder en död token.
  `create table if not exists aliexpress_tokens (
     id            int primary key default 1 check (id = 1),
     access_token  text not null,
     refresh_token text not null,
     expires_at    timestamptz not null,
     updated_at    timestamptz not null default now()
   )`,

  // --- Synk-logg och synk-state -------------------------------------------
  // Kolumnnamnen speglar domänens fältnamn (checkedAt, actionTaken, …) i
  // snake_case. Det är med flit: översättaren i lib/db/wix-filter.ts mappar
  // fält → kolumn explicit och KASTAR på okända fält, så ett filter som inte
  // går att översätta blir ett fel i stället för fel rader.
  `create table if not exists sync_log (
     id           text primary key,
     checked_at   timestamptz not null,
     product_id   text,
     action_taken text,
     data         jsonb not null
   )`,
  `create index if not exists sync_log_checked_at_idx on sync_log (checked_at desc)`,
  `create index if not exists sync_log_product_idx on sync_log (product_id, checked_at desc)`,
  `create index if not exists sync_log_action_idx on sync_log (action_taken, checked_at desc)`,

  `create table if not exists sync_state (
     wix_product_id  text primary key,
     listing_status  text,
     error_streak    int,
     last_checked_at timestamptz,
     data            jsonb not null
   )`,
  `create index if not exists sync_state_problem_idx
     on sync_state (listing_status, error_streak, last_checked_at desc)`,

  `create table if not exists sync_alerts (
     id         text primary key,
     status     text not null,
     created_at timestamptz,
     data       jsonb not null
   )`,
  `create index if not exists sync_alerts_status_idx on sync_alerts (status, created_at desc)`,

  // --- Produkt-hashar och importkostnader ---------------------------------
  `create table if not exists product_hashes (
     wix_product_id text primary key,
     data           jsonb not null
   )`,
  `create table if not exists import_costs (
     id   text primary key,
     at   timestamptz,
     data jsonb not null
   )`,
  `create index if not exists import_costs_at_idx on import_costs (at desc)`,

  // --- LLM: fyra Wix-kollektioner blir EN tabell ---------------------------
  // cache, spend, stats och variantöversättningar har identisk form
  // (nyckel → JSON) och skilde sig bara i vilken kollektion de låg i.
  `create table if not exists llm_kv (
     collection text not null,
     key        text not null,
     data       jsonb not null,
     at         timestamptz,
     primary key (collection, key)
   )`,
  `create index if not exists llm_kv_at_idx on llm_kv (collection, at desc)`,
];
