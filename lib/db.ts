// lib/db.ts
// Thin wrapper around @vercel/postgres so we can swap the driver later without
// touching call sites. Uses the connection-pool client (recommended for serverless).

import { sql } from '@vercel/postgres';

export { sql };

// Run the migration in-process. Idempotent: every CREATE is guarded with IF NOT EXISTS.
// Inlined rather than file-read so this works in any Vercel runtime (edge or node).
export async function runMigration(): Promise<{ ok: true }> {
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS abandoned_carts (
      id                   TEXT PRIMARY KEY,
      email                TEXT NOT NULL,
      phone                TEXT,
      shipping_addr_hash   TEXT,
      items_json           JSONB NOT NULL,
      subtotal_minor       INTEGER NOT NULL,
      currency             TEXT NOT NULL DEFAULT 'SEK',
      recover_url          TEXT,
      abandoned_at         TIMESTAMPTZ NOT NULL,
      next_step            SMALLINT NOT NULL DEFAULT 1,
      next_step_at         TIMESTAMPTZ NOT NULL,
      status               TEXT NOT NULL DEFAULT 'pending',
      discount_code        TEXT,
      discount_code_wix_id TEXT,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql/*sql*/`CREATE INDEX IF NOT EXISTS abandoned_carts_due_idx ON abandoned_carts(status, next_step_at) WHERE status = 'pending';`;
  await sql/*sql*/`CREATE INDEX IF NOT EXISTS abandoned_carts_email_idx ON abandoned_carts(email);`;
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS sent_emails (
      id            BIGSERIAL PRIMARY KEY,
      cart_id       TEXT NOT NULL REFERENCES abandoned_carts(id) ON DELETE CASCADE,
      step          SMALLINT NOT NULL,
      resend_id     TEXT,
      sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      email         TEXT NOT NULL,
      discount_code TEXT,
      UNIQUE(cart_id, step)
    );
  `;
  await sql/*sql*/`CREATE INDEX IF NOT EXISTS sent_emails_email_window_idx ON sent_emails(email, sent_at);`;
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS used_addresses (
      hash        TEXT PRIMARY KEY,
      email       TEXT,
      phone       TEXT,
      first_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql/*sql*/`CREATE INDEX IF NOT EXISTS used_addresses_phone_idx ON used_addresses(phone) WHERE phone IS NOT NULL;`;
  await sql/*sql*/`CREATE INDEX IF NOT EXISTS used_addresses_email_idx ON used_addresses(email) WHERE email IS NOT NULL;`;

  // SMS-forwarding tables (migrations/002_sms_forwarding.sql). Inlined so any
  // Vercel runtime can apply them without reading the .sql file.
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS tracking_mapping (
      tracking_number TEXT PRIMARY KEY,
      order_id        TEXT,
      customer_email  TEXT NOT NULL,
      customer_name   TEXT,
      customer_phone  TEXT,
      status          TEXT NOT NULL DEFAULT 'pending',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql/*sql*/`CREATE INDEX IF NOT EXISTS tracking_mapping_email_idx ON tracking_mapping(customer_email);`;
  await sql/*sql*/`CREATE INDEX IF NOT EXISTS tracking_mapping_order_idx ON tracking_mapping(order_id);`;
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS sms_audit (
      id              BIGSERIAL PRIMARY KEY,
      received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      raw_from        TEXT NOT NULL,
      raw_text        TEXT NOT NULL,
      carrier         TEXT,
      status          TEXT,
      pickup_location TEXT,
      pickup_code     TEXT,
      tracking_number TEXT,
      matched         BOOLEAN NOT NULL DEFAULT FALSE,
      email_sent      BOOLEAN NOT NULL DEFAULT FALSE,
      resend_id       TEXT,
      error           TEXT
    );
  `;
  await sql/*sql*/`CREATE INDEX IF NOT EXISTS sms_audit_received_idx ON sms_audit(received_at DESC);`;
  await sql/*sql*/`CREATE INDEX IF NOT EXISTS sms_audit_tracking_idx ON sms_audit(tracking_number) WHERE tracking_number IS NOT NULL;`;
  // Added 2026-05-30 — records how an SMS was matched to a tracking row.
  // Values: 'tracking_number' (parser found the code in the SMS) | 'fifo'
  // (no code in SMS but exactly one or two in-transit packages, oldest picked)
  // | NULL (no match). Used by sms-inbound to throttle the FIFO fallback.
  await sql/*sql*/`ALTER TABLE sms_audit ADD COLUMN IF NOT EXISTS match_strategy TEXT;`;
  await sql/*sql*/`
    CREATE TABLE IF NOT EXISTS sms_unmatched (
      id              BIGSERIAL PRIMARY KEY,
      audit_id        BIGINT REFERENCES sms_audit(id) ON DELETE CASCADE,
      received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      raw_from        TEXT NOT NULL,
      raw_text        TEXT NOT NULL,
      tracking_number TEXT,
      reason          TEXT NOT NULL
    );
  `;
  await sql/*sql*/`CREATE INDEX IF NOT EXISTS sms_unmatched_received_idx ON sms_unmatched(received_at DESC);`;

  return { ok: true };
}
