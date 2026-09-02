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
  "reviews",
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
  // ☠️ INTE UNIKT — och det är ett medvetet beslut, inte en förbiseelse.
  //
  // Första skarpa kopieringen hade ett unikt index här, och det avvisade fyra
  // AE-listningar som har TVÅ mappningar var (1005010198611959,
  // 1005010705662766, 1005007823230150, 1005002985985096). Det såg först ut som
  // ett fynd att fira: databasen fångade en intern dubblett.
  //
  // Men kodbasen TILLÅTER dubbletter med flit. `/api/import` tar
  // `allowDuplicate: true` för fallet "produkten raderades men mappningsraden
  // blev kvar", och båda importvägarnas dubblettspärr är uttryckligen
  // fail-open: ett trasigt uppslag ska aldrig blockera en i övrigt giltig
  // import. Ett hårt unikhetsvillkor här hade tagit bort den nödutgången — och
  // en databas som vägrar det applikationen medvetet stödjer är fel, hur
  // tilltalande invarianten än ser ut.
  //
  // Indexet finns alltså för uppslaget (dubblettspärren slår upp på det här
  // fältet), inte som en regel. De fyra dubbletterna är verkliga och hanteras
  // där de hör hemma: i poleringen, av en människa.
  `drop index if exists mappings_supplier_product_id_key`,
  `create index if not exists mappings_supplier_product_id_idx
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
  // Kundens /sparning slår upp AE-ordern på spårningsnumret. Numret bor i
  // JSONB-svansen (en enda läsare), så indexet är på uttrycket.
  `create index if not exists tasks_tracking_number_idx
      on tasks (upper(data->>'trackingNumber'))`,

  // --- Webhook-idempotens --------------------------------------------------
  // `data` är NULLBAR: webhooken skriver bara event_id, kopieringen bär med
  // hela källraden. Utan kolumnen föll kopieringen med "column data does not
  // exist" (uppmätt i första skarpa körningen 2026-08-31) — och verifieringen
  // jämför just `data`, så en tabell utan den kan aldrig verifieras.
  `create table if not exists webhook_events (
     event_id text primary key,
     seen_at  timestamptz not null default now(),
     data     jsonb
   )`,
  `alter table webhook_events add column if not exists data jsonb`,

  // --- Audit ---------------------------------------------------------------
  `create table if not exists audit (
     id     text primary key,
     at     timestamptz not null,
     kind   text not null,
     ref    text,
     detail text,
     data   jsonb
   )`,
  // ALTER för databaser som redan skapats utan kolumnen — schemat är
  // idempotent och måste kunna laga en tabell det självt skapat fel.
  `alter table audit add column if not exists data jsonb`,
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
  // --- Recensioner: 2 514 rader ---------------------------------------------
  //
  // ☠️ DEN HÄR ÄR ANLEDNINGEN TILL ATT TAKET KAN LÖSAS. Wix Data har ett
  // GLOBALT tak på 4 000 rader över alla kollektioner. Efter att drift-datan
  // flyttat (2026-08-31) ligger vi på ~3 355, och recensionerna är 2 514 av
  // dem — alltså 75 % av allt som är kvar. Aosoms egna produktrecensioner är
  // uppmätta till ~9 500 texter; de får aldrig plats så länge raderna bor här.
  //
  // ⚠️ ATT KOPIERA HIT FRIGÖR INGENTING. Taket rör sig först när Wix-raderna
  // RADERAS, och det får inte ske förrän butiksrepot slutat läsa dem direkt
  // (lib/reviews.ts och lib/review-aggregates.ts på grenen headless-site).
  // Därför står FyndplatsImportedReviews kvar i ALDRIG_RADERA. Samma lärdom
  // som spårningssidan gav 2026-09-01: en migrering är klar först när alla
  // läsare följt med, och en läsare som blir TOM syns varken i en kodaudit
  // eller i en felräknare.
  `create table if not exists reviews (
     id           text primary key,
     product_id   text not null,
     review_id_ae text not null,
     status       text not null,
     rating       integer,
     date         timestamptz,
     data         jsonb not null,
     updated_at   timestamptz not null default now()
   )`,
  // Produktsidan slår upp per produkt — den vanligaste frågan i hela systemet.
  `create index if not exists reviews_product_id_idx on reviews (product_id)`,
  // /admin/reviews filtrerar på status. ☠️ Filtret MÅSTE köras i databasen:
  // en väntande rad kan ha vilket AE-datum som helst (recensionerna är ofta
  // månader gamla), så "hämta de nyaste N och filtrera efteråt" hittar den
  // inte. Det stod redan som en kommentar i Wix-versionen och gäller här med.
  `create index if not exists reviews_status_date_idx on reviews (status, date desc nulls last)`,

];
