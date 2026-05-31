-- ===========================================================================
-- 004_bulk_import.sql
--
-- Schema för bulk CSV-import av AliExpress-produkter.
--
-- Två tabeller:
--   bulk_import_jobs   — en rad per uppladdad CSV-batch (status, statistik)
--   bulk_import_items  — en rad per CSV-rad (url, status, resultat)
--
-- OBS (samma princip som 003_aliexpress_sync.sql): cache-warmer-appen kör
-- idag på Wix Data, inte Postgres. Denna migration är förberedd för ett
-- framtida flytt och speglar fältnamnen i lib/bulk-import/store.ts som
-- skriver mot FyndplatsBulkImportJobs / FyndplatsBulkImportItems. När
-- STORE_BACKEND byts till "postgres" implementeras en PostgresBulkImportStore
-- med samma interface.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS bulk_import_jobs (
  id              TEXT        PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      TEXT,
  status          TEXT        NOT NULL,   -- "pending" | "running" | "completed" | "failed" | "stopped"
  total_rows      INTEGER     NOT NULL,
  succeeded       INTEGER     NOT NULL DEFAULT 0,
  failed          INTEGER     NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  error           TEXT,
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_bulk_import_jobs_status
  ON bulk_import_jobs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulk_import_jobs_created
  ON bulk_import_jobs (created_at DESC);

CREATE TABLE IF NOT EXISTS bulk_import_items (
  id                  TEXT        PRIMARY KEY,
  job_id              TEXT        NOT NULL REFERENCES bulk_import_jobs(id) ON DELETE CASCADE,
  row_index           INTEGER     NOT NULL,
  aliexpress_url      TEXT        NOT NULL,
  collection_slug     TEXT,
  target_price_sek    NUMERIC(12, 2),
  notes               TEXT,
  status              TEXT        NOT NULL,  -- "pending" | "importing" | "done" | "failed" | "skipped"
  attempts            INTEGER     NOT NULL DEFAULT 0,
  wix_product_id      TEXT,
  error               TEXT,
  attempted_at        TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  UNIQUE (job_id, row_index)
);

CREATE INDEX IF NOT EXISTS idx_bulk_import_items_job
  ON bulk_import_items (job_id, status);
CREATE INDEX IF NOT EXISTS idx_bulk_import_items_pending
  ON bulk_import_items (status, attempted_at NULLS FIRST)
  WHERE status IN ('pending', 'importing');
