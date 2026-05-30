-- migrations/002_sms_forwarding.sql
-- Apply via: psql $POSTGRES_URL -f migrations/002_sms_forwarding.sql
-- Or call POST /api/dev/tracking-map?action=migrate with X-Dev-Secret header.
--
-- Schema for the SMS-forwarding flow. Leonard's iPhone receives carrier SMS
-- (the customer's phone is replaced with his at AliExpress checkout), an iOS
-- Shortcut forwards each SMS to /api/sms-inbound, and we look up the matching
-- order from tracking_mapping to send a Fyndplats-branded delivery email.

-- Mapping from carrier tracking number → real customer. Populated either by
-- the Wix order webhook (once tracking is added there) or via the dev endpoint.
CREATE TABLE IF NOT EXISTS tracking_mapping (
  tracking_number TEXT PRIMARY KEY,
  order_id        TEXT,
  customer_email  TEXT NOT NULL,
  customer_name   TEXT,
  customer_phone  TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',   -- pending|in_transit|out_for_delivery|available_for_pickup|delivered
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tracking_mapping_email_idx ON tracking_mapping(customer_email);
CREATE INDEX IF NOT EXISTS tracking_mapping_order_idx ON tracking_mapping(order_id);

-- Append-only audit of every SMS we received. Lets us replay if a parser bug
-- silently drops a notification, and surfaces patterns for new carriers.
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

CREATE INDEX IF NOT EXISTS sms_audit_received_idx ON sms_audit(received_at DESC);
CREATE INDEX IF NOT EXISTS sms_audit_tracking_idx ON sms_audit(tracking_number) WHERE tracking_number IS NOT NULL;
-- match_strategy: 'tracking_number' | 'fifo' | NULL (no match).
-- Added so we can throttle the FIFO fallback (escalate if used too often).
ALTER TABLE sms_audit ADD COLUMN IF NOT EXISTS match_strategy TEXT;

-- Subset of sms_audit: rows where we couldn't match a tracking number to a
-- customer. Kept separate so it's trivial to monitor & purge after fix-up.
CREATE TABLE IF NOT EXISTS sms_unmatched (
  id              BIGSERIAL PRIMARY KEY,
  audit_id        BIGINT REFERENCES sms_audit(id) ON DELETE CASCADE,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_from        TEXT NOT NULL,
  raw_text        TEXT NOT NULL,
  tracking_number TEXT,
  reason          TEXT NOT NULL                       -- no_tracking|no_mapping|parser_unknown
);

CREATE INDEX IF NOT EXISTS sms_unmatched_received_idx ON sms_unmatched(received_at DESC);
