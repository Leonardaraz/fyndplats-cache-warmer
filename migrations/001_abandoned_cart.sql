-- migrations/001_abandoned_cart.sql
-- Apply via: psql $POSTGRES_URL -f migrations/001_abandoned_cart.sql
-- Or call POST /api/dev/test-abandoned-cart?action=migrate with X-Dev-Secret header.

CREATE TABLE IF NOT EXISTS abandoned_carts (
  id                   TEXT PRIMARY KEY,                  -- Wix checkout id
  email                TEXT NOT NULL,
  phone                TEXT,
  shipping_addr_hash   TEXT,                              -- sha256 of normalised address
  items_json           JSONB NOT NULL,
  subtotal_minor       INTEGER NOT NULL,                  -- SEK öre
  currency             TEXT NOT NULL DEFAULT 'SEK',
  recover_url          TEXT,
  abandoned_at         TIMESTAMPTZ NOT NULL,
  next_step            SMALLINT NOT NULL DEFAULT 1,       -- 1, 2, or 3
  next_step_at         TIMESTAMPTZ NOT NULL,
  status               TEXT NOT NULL DEFAULT 'pending',   -- pending|converted|expired|done|skipped
  discount_code        TEXT,                              -- last code minted for this cart (step 3)
  discount_code_wix_id TEXT,                              -- wix coupon id for revocation
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS abandoned_carts_due_idx
  ON abandoned_carts(status, next_step_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS abandoned_carts_email_idx
  ON abandoned_carts(email);

CREATE TABLE IF NOT EXISTS sent_emails (
  id            BIGSERIAL PRIMARY KEY,
  cart_id       TEXT NOT NULL REFERENCES abandoned_carts(id) ON DELETE CASCADE,
  step          SMALLINT NOT NULL,                        -- 1 | 2 | 3
  resend_id     TEXT,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email         TEXT NOT NULL,
  discount_code TEXT,
  UNIQUE(cart_id, step)
);

CREATE INDEX IF NOT EXISTS sent_emails_email_window_idx
  ON sent_emails(email, sent_at);

-- Any shipping address / phone that has ever produced a real order is "known returning"
-- and must NOT receive the 5% code in mail 3.
CREATE TABLE IF NOT EXISTS used_addresses (
  hash        TEXT PRIMARY KEY,                           -- sha256(normalised address)
  email       TEXT,
  phone       TEXT,
  first_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS used_addresses_phone_idx ON used_addresses(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS used_addresses_email_idx ON used_addresses(email) WHERE email IS NOT NULL;
