# Abandoned-cart flow

Sequel to Resend Phase 2 (`306c347` on `headless-site`). Three emails, strict anti-abuse, no scheduled jobs outside Vercel Cron.

## Flow

| # | Send delay (from `abandoned_at`) | Subject | Discount | Template |
|---|---|---|---|---|
| 1 | +1h  | Du glömde något i kundvagnen          | none                              | `emails/abandoned-cart-1.tsx` |
| 2 | +24h | Vi sparade din kundvagn — fri frakt   | universal free shipping reminder  | `emails/abandoned-cart-2.tsx` |
| 3 | +72h | 5% extra för att slutföra             | unique per-cart 5% code           | `emails/abandoned-cart-3.tsx` (or `-3-no-code.tsx`) |

## Anti-abuse rules

All enforced in `lib/abandoned-cart.ts`:

1. **One flow per email per 30 days.** `enqueueAbandonedCart` queries `sent_emails` for any row with the same email in the last 30 days and refuses to enqueue. A second cooldown check runs at send time (in `processDueCart`) to defend against the race where a second flow was already enqueued before any send.
2. **Shipping address lock for the 5% code.** A normalised SHA-256 hash of the address (line1 + line2 + postal + city + country, diacritics and non-alnum stripped) is computed on every order; if that hash is in `used_addresses`, the customer is treated as a returning buyer and email 3 falls through to the no-code variant.
3. **Phone lock for the 5% code.** Same logic against the normalised phone (Swedish format → `+46…`).
4. **24 h TTL** on the code (`expirationTime` on Wix coupon).
5. **Single-use** on the code (`usageLimit: 1`, `limitedToOnePerCustomer: true`).
6. **Cart subtotal must be > 200 kr** to receive the code (Wix `minimumSubtotal: 200`; we also guard locally so we don't waste a coupon mint on a sub-200kr cart).
7. **Convert cancels the flow.** When `order_created` fires for a cart we already have in `abandoned_carts`, `onOrderConverted` flips the row to `converted`, revokes the Wix coupon if one was minted, and seeds the shipping address + phone into `used_addresses`.

## Architecture

- **Storage**: Vercel Postgres (3 tables, all idempotent constraints). See `migrations/001_abandoned_cart.sql`. Run via `POST /api/dev/test-abandoned-cart?action=migrate` with the dev secret header, or `psql $POSTGRES_URL -f migrations/001_abandoned_cart.sql`.
- **Scheduling**: Vercel Cron `*/15 * * * *` → `GET /api/cron/abandoned-cart-sender`. We chose this over Upstash QStash because: delays are hours-scale, the cron secret is a single env var, and we wanted a single deployable surface. Rows carry their own `next_step_at`; the cron picks any row where `status='pending'` and `next_step_at <= NOW()` and advances it one step. Idempotency is enforced by a unique `(cart_id, step)` constraint on `sent_emails`.
- **Webhook**: `wix.ecom.v1.abandoned_checkout` slug `created` — Wix fires this for Headless sites. We DID NOT implement polling against the Abandoned Checkouts REST list endpoint; if Leonard ever wants a belt-and-braces fallback, add a second cron at `*/30` that hits `GET /stores/v1/abandonedCheckouts` and reuses `handleAbandonedCheckoutCreated`.
- **Coupons**: minted on demand at email 3 send time via `POST https://www.wixapis.com/stores/v2/coupons`. The Wix coupon id is stored on the cart row so `onOrderConverted` can revoke it.

## Files

```
app/api/cron/abandoned-cart-sender/route.ts      -- Vercel Cron entry (every 15 min)
app/api/dev/test-abandoned-cart/route.ts         -- Gated simulator endpoint
lib/abandoned-cart.ts                            -- Orchestration + anti-abuse
lib/discount-codes.ts                            -- Wix coupons wrapper
lib/wix-client.ts                                -- Minimal Wix REST fetcher
lib/db.ts                                        -- @vercel/postgres + runMigration
lib/address-hash.ts                              -- SHA-256 address + phone normaliser
lib/handlers/abandoned-checkout-handler.ts       -- Parses Wix webhook payload
lib/handlers/order-conversion-hook.ts            -- Called from existing order_created branch
emails/abandoned-cart-1.tsx                      -- +1h reminder
emails/abandoned-cart-2.tsx                      -- +24h free shipping
emails/abandoned-cart-3.tsx                      -- +72h 5% code
emails/abandoned-cart-3-no-code.tsx              -- +72h no-code variant
emails/_abandoned-cart-helpers.tsx               -- Shared email layout + money formatter
migrations/001_abandoned_cart.sql                -- DB schema
vercel.json.snippet                              -- Cron entry to merge into vercel.json
WEBHOOK-PATCH.md                                 -- 3-line patch for the existing wix-webhook route
```

## Env vars / secrets

Add in Vercel (project `fyndplats-headless`, scope = Production + Preview unless noted):

| Var | Why | Sensitive? |
|---|---|---|
| `POSTGRES_URL`             | Vercel Postgres connection string. Auto-injected if you add the Vercel Postgres integration to the project. | yes |
| `WIX_API_KEY`              | Wix account API key (Wix Dev Center → App Management → API Keys). Used to mint coupons. | yes |
| `WIX_SITE_ID`              | The Headless site ID (already in Wix dashboard URL). | no |
| `CRON_SECRET`              | A random hex string. Vercel will send it as `Authorization: Bearer …` to the cron endpoint. | yes |
| `DEV_ENDPOINT_SECRET`      | Long random string. Gates `/api/dev/test-abandoned-cart`. Production-only. | yes |
| `RESEND_API_KEY`           | Already set up in Phase 2. | yes |
| `WIX_WEBHOOK_PUBLIC_KEY`   | Already set up in Phase 2. | no |

Generate the two random secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Wix dashboard steps Leonard still needs to do

1. **Subscribe the webhook to the new event.** Wix Dev Center → app `wix-vibe-site-u4lp` (app ID `3d8fdd09-3b3c-475f-aac2-b6bfa9e05153`) → Webhooks → Add webhook. Entity = **Abandoned Checkout (wix.ecom.v1.abandoned_checkout)**, action = **Created**. URL = the same endpoint already used for `order_created` (`https://fyndplats.se/api/wix-webhook`).
2. **Generate / paste in `WIX_API_KEY`.** Dev Center → API Keys → create one scoped at minimum to `SCOPE.STORES.COUPON-WRITE` and `SCOPE.STORES.COUPON-READ`. (If your existing key is already scoped broadly, you can reuse it.)
3. **Add Vercel Postgres integration** to the `fyndplats-headless` project so `POSTGRES_URL` is injected.
4. **Run the migration once.** After deploy, `curl -X POST -H "X-Dev-Secret: $DEV_ENDPOINT_SECRET" https://fyndplats.se/api/dev/test-abandoned-cart?action=migrate`.
5. **Confirm Resend domain.** Already verified in Phase 2 (`fyndplats.se`); no change.

## Testing locally / on preview

The dev endpoint `app/api/dev/test-abandoned-cart` accepts these actions (POST, `X-Dev-Secret` header required):

| Action | What it does |
|---|---|
| `migrate`             | Run/repair the schema. Idempotent. |
| `simulate`            | Enqueue a fake cart and run all 3 steps inline (delays collapsed to ms). Will send 3 real Resend emails to a `test+…@fyndplats.se` address. |
| `simulate_no_code`    | Pre-seeds the address hash into `used_addresses` so step 3 falls to the no-code template. |
| `simulate_below_min`  | Cart subtotal = 150 kr → step 3 falls to no-code (under 200 kr). |
| `simulate_cooldown`   | Enqueues one, processes step 1, then tries a second enqueue with the same email → expects `{ enqueued: false, reason: 'cooldown' }`. |
| `simulate_conversion` | Enqueues, sends step 1, fires `onOrderConverted`, verifies cart moved to `converted` and `fetchDueCarts` returns 0. |

```bash
curl -X POST -H "X-Dev-Secret: $DEV_ENDPOINT_SECRET" \
  "https://fyndplats.se/api/dev/test-abandoned-cart?action=simulate"
```

## What this PR DOES NOT touch

- Existing Phase 2 email templates (`emails/_layout.tsx`, `order-confirmation.tsx`, etc.) — unchanged.
- Existing webhook verification (RS256 JWT against `WIX_WEBHOOK_PUBLIC_KEY`) — unchanged.
- Existing `order_created` Resend send — unchanged; we only **prepend** a call to `onWixOrderCreatedForAbandonedCart`.
