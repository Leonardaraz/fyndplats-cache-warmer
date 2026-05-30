# SMS Forwarding — Branded Carrier Notifications

When Fyndplats places an AliExpress order on behalf of a Swedish customer,
the supplier and carrier (PostNord, DHL, DPD, Instabox, Budbee, …) text the
**phone number listed on the order**. To stop customers from receiving SMS
that say "Ditt paket från AliExpress C/o ...", Leonard's iPhone number is
used as the order phone. His phone receives the carrier SMS, an iOS
Shortcut forwards them to `/api/sms-inbound`, and the backend sends a
Fyndplats-branded delivery email to the real customer instead.

## Architecture

```
+-------------------+      +-------------------+      +-------------------+
| AliExpress order  |      | Carrier           |      | Leonard's iPhone  |
| (phone replaced   | ---> | (PostNord, DHL,   | ---> | (receives SMS)    |
|  with Leonard's)  |      |  DPD, Instabox..) |      |                   |
+-------------------+      +-------------------+      +---------+---------+
                                                                |
                                                                v
                                                       +-------------------+
                                                       | iOS Shortcut      |
                                                       | (autoruns on SMS) |
                                                       +---------+---------+
                                                                 |  POST { from, text }
                                                                 |  + X-Sms-Secret
                                                                 v
                                                       +-----------------------+
                                                       | /api/sms-inbound      |
                                                       |  - parseSms()         |
                                                       |  - tracking_mapping   |
                                                       |  - Resend (branded)   |
                                                       +-----------+-----------+
                                                                   |
                                                                   v
                                                       +-----------------------+
                                                       | Real customer mailbox |
                                                       | (Fyndplats branding)  |
                                                       +-----------------------+
```

## Files

- `app/api/sms-inbound/route.ts` — webhook endpoint (POST + GET healthcheck).
- `lib/sms-parser.ts` — carrier detection + status / pickup-code / ombud /
  tracking-number extraction. Pure function, no I/O.
- `lib/sms-parser.test.ts` — 14 unit tests against real carrier SMS bodies.
- `emails/delivery-notification.tsx` — React Email template that produces
  the branded "your package is at ICA Maxi" email.
- `migrations/002_sms_forwarding.sql` — schema for `tracking_mapping`,
  `sms_audit`, `sms_unmatched`. Also inlined in `lib/db.ts#runMigration`.
- `app/api/dev/tracking-map/route.ts` — dev endpoint for migrating the
  schema, inserting mappings manually, and inspecting recent audit rows.
- `outputs/IOS-SHORTCUT-SETUP.md` — Swedish step-by-step for the iPhone
  side. Leonard sets the shortcut up by hand from this guide.

## Environment variables (Vercel)

| Name                  | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `SMS_INBOUND_SECRET`  | Shared secret. Generate with `openssl rand -hex 32`. Required. Mark **Sensitive**. |
| `RESEND_API_KEY`      | Already set — reused.                                |
| `POSTGRES_URL` etc.   | Already set by the Vercel Postgres integration.      |
| `DEV_ENDPOINT_SECRET` | Already set — gates `/api/dev/*`.                    |

## Running the migration

After deploy, apply the new tables:

```bash
curl -X POST \
  -H "X-Dev-Secret: $DEV_ENDPOINT_SECRET" \
  https://www.fyndplats.se/api/dev/tracking-map?action=migrate
```

The migration is idempotent (every CREATE is `IF NOT EXISTS`).

## Manual end-to-end test

1. **Insert a test mapping** so the webhook has something to find:

   ```bash
   curl -X POST \
     -H "X-Dev-Secret: $DEV_ENDPOINT_SECRET" \
     -H "Content-Type: application/json" \
     -d '{
       "tracking_number": "JJFI6700000000123456789SE",
       "order_id": "TEST-001",
       "customer_email": "you@example.com",
       "customer_name": "Anna Andersson"
     }' \
     "https://www.fyndplats.se/api/dev/tracking-map?action=insert"
   ```

2. **Simulate the SMS arriving** (this is what the iOS Shortcut would post):

   ```bash
   curl -X POST \
     -H "X-Sms-Secret: $SMS_INBOUND_SECRET" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "PostNord",
       "text": "Ditt paket JJFI6700000000123456789SE finns nu vid ICA Maxi Södertälje. Hämtkod: 1234"
     }' \
     https://www.fyndplats.se/api/sms-inbound
   ```

   Response should be:

   ```json
   { "received": true, "matched": true, "sent": true, "resendId": "..." }
   ```

   The customer (`you@example.com`) should receive an email with subject
   "Ditt paket är nu vid ICA Maxi Södertälje (hämtkod 1234)".

3. **Inspect audit rows** to see exactly what the parser captured:

   ```bash
   curl -H "X-Dev-Secret: $DEV_ENDPOINT_SECRET" \
        https://www.fyndplats.se/api/dev/tracking-map
   ```

## Setting up the iPhone

Hand the Swedish guide at `outputs/IOS-SHORTCUT-SETUP.md` to Leonard. He
needs the `SMS_INBOUND_SECRET` value to fill into the Shortcut's
`X-Sms-Secret` header.

## Extending with a new carrier

Open `lib/sms-parser.ts` and add a new entry to `CARRIERS`:

```ts
{
  carrier: "MyCarrier",
  fromPatterns: [/mycarrier/i],
  trackingPatterns: [/\b[A-Z]{2}\d{10,14}\b/],
},
```

If the carrier uses Swedish phrasing already covered by `STATUS_PATTERNS`
and `PICKUP_CODE_PATTERNS`, you're done. If the wording is novel, add a
matching pattern to the relevant constant table. Always add a test in
`lib/sms-parser.test.ts` against a real SMS body before shipping.

## Running the parser tests

```bash
pnpm test
```

(Uses Node's built-in `node:test` runner via `--experimental-strip-types`,
so there are no test-framework dependencies.)

## Privacy notes

- **What lands on Leonard's iPhone**: every SMS sent by carriers to his
  number. Some contain partial customer info — typically only an address
  or a pickup-point name. The iOS Shortcut forwards the *entire* SMS body.
- **What is stored in our database**:
  - `sms_audit`: every received SMS, including raw text + sender. Retained
    so we can replay if the parser drops something. Acceptable because no
    sensitive customer PII is in carrier SMS (no name, no address line
    other than what the customer themselves typed at AliExpress).
  - `tracking_mapping`: the bridge between tracking number and customer
    email/name/phone. Populated by us, not by external systems. Same
    retention rules as our existing `abandoned_carts` table.
  - `sms_unmatched`: subset of `sms_audit` for SMS we couldn't link to
    an order. Purge after fix-up.
- **What is forwarded to Resend**: branded email containing customer's
  first name, pickup code, pickup location, and tracking number.
  Identical privacy posture to existing order/shipping confirmations.

## Why some SMS don't trigger an email (by design)

- `status === "in_transit"`: noisy (every scan triggers one). We email on
  out-for-delivery, pickup-available, delivered, and exceptions only.
- `status === "unknown"`: parser couldn't classify. Logged to
  `sms_unmatched` for follow-up; no email goes out.
- `tracking_number` not found in `tracking_mapping`: either the order
  wasn't recorded (Wix integration race) or this SMS belongs to a
  package we didn't place. Logged, ack:ed with 200.
