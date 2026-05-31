-- ===========================================================================
-- 003_aliexpress_sync.sql
--
-- Schema för den dagliga AliExpress-syncen. Spårar pris-/lager-/listnings-
-- ändringar per importerad produkt så att vi (a) kan auto-agera när en
-- AliExpress-listning försvinner eller är slut, (b) kan flagga prishöjningar
-- som hotar marginalen för Leonards granskning, och (c) kan revertera/audita
-- vad cron-jobbet faktiskt gjort.
--
-- OBS: Cache-warmer-appen kör idag på Wix Data (FyndplatsMappings,
-- FyndplatsImportCosts, …) — INTE Postgres. Denna migration är förberedd för
-- ett framtida Postgres-flytt och speglar samma fält som
-- lib/sync/sync-log.ts skriver till Wix Data-kollektionerna:
--   - FyndplatsAliExpressSyncLog   (motsvarar aliexpress_sync_log nedan)
--   - FyndplatsAliExpressSyncState (motsvarar product_source_mapping nedan)
--   - FyndplatsAliExpressSyncAlerts (motsvarar sync_alerts nedan)
-- När vi byter STORE_BACKEND till "postgres" räcker det att lägga till en
-- PostgresSyncStore-implementation av samma interface som SyncStore.
-- ===========================================================================

-- Tabell 1: aliexpress_sync_log
-- Append-only logg över varje sync-check. En rad per (produkt, körning).
CREATE TABLE IF NOT EXISTS aliexpress_sync_log (
  id              BIGSERIAL PRIMARY KEY,
  product_id      TEXT        NOT NULL,        -- Wix-produkt-id
  aliexpress_id   TEXT        NOT NULL,        -- AliExpress source product_id
  checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  prev_cost_sek   NUMERIC(12, 2),              -- föregående landade kostnad i SEK
  new_cost_sek    NUMERIC(12, 2),              -- aktuell landad kostnad i SEK
  prev_stock      INTEGER,                     -- föregående lager (sum av varianter)
  new_stock       INTEGER,                     -- aktuellt lager
  listing_status  TEXT        NOT NULL,        -- "active" | "out_of_stock" | "removed" | "unknown"
  action_taken    TEXT        NOT NULL,        -- "none" | "hidden" | "marked_oos" | "restored" | "flagged_price" | "flagged_content" | "dry_run"
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_aliexpress_sync_log_product
  ON aliexpress_sync_log (product_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_aliexpress_sync_log_checked_at
  ON aliexpress_sync_log (checked_at DESC);

-- Tabell 2: product_source_mapping
-- Snapshot per produkt — "sist sedda värden" så vi kan diffa nästa körning.
-- Skiljer sig från FyndplatsMappings: den håller ursprungs-importdata
-- (costUsd vid import) medan denna tabell håller den senast observerade
-- AliExpress-statusen så vi inte måste söka i loggen för varje diff.
CREATE TABLE IF NOT EXISTS product_source_mapping (
  wix_product_id     TEXT PRIMARY KEY,
  aliexpress_id      TEXT        NOT NULL,
  current_cost_sek   NUMERIC(12, 2),
  current_cost_usd   NUMERIC(12, 4),
  current_stock      INTEGER,
  listing_status     TEXT,            -- "active" | "out_of_stock" | "removed" | "unknown"
  title_hash         TEXT,            -- sha256-hex av titel — kort jämförelse istället för full text
  image_hash         TEXT,            -- sha256-hex av sorterad image-URL-lista
  last_checked_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_product_source_mapping_aliexpress
  ON product_source_mapping (aliexpress_id);
CREATE INDEX IF NOT EXISTS idx_product_source_mapping_checked
  ON product_source_mapping (last_checked_at);

-- Tabell 3: sync_alerts
-- Öppna alerts som visas i /admin/sync-alerts. Auto-actions (hide/oos)
-- skapar ingen alert — bara loggrad. Bara saker som kräver mänsklig beslut.
CREATE TABLE IF NOT EXISTS sync_alerts (
  id               BIGSERIAL PRIMARY KEY,
  wix_product_id   TEXT        NOT NULL,
  aliexpress_id    TEXT        NOT NULL,
  alert_type       TEXT        NOT NULL,   -- "price_increase" | "content_change"
  severity         TEXT        NOT NULL,   -- "low" | "medium" | "high"
  status           TEXT        NOT NULL DEFAULT 'open',  -- "open" | "approved" | "dismissed" | "removed"
  -- Pris-specifika fält
  current_price_sek    NUMERIC(12, 2),
  prev_cost_usd        NUMERIC(12, 4),
  new_cost_usd         NUMERIC(12, 4),
  recommended_price_sek NUMERIC(12, 2),
  projected_margin_pct  NUMERIC(5, 2),
  -- Innehållsändringar
  title_changed    BOOLEAN,
  image_changed    BOOLEAN,
  new_title        TEXT,
  -- Gemensamma fält
  product_name     TEXT,
  image_url        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ,
  resolved_by      TEXT,
  UNIQUE (wix_product_id, alert_type, status) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_sync_alerts_open
  ON sync_alerts (status, severity, created_at DESC)
  WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_sync_alerts_product
  ON sync_alerts (wix_product_id, status);
