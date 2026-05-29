# Aktivering – automatisk dropship-pipeline (Fyndplats nya sajten)

> Status-/aktiveringsdokument. Skapat 2026-05-29. Beskriver exakt vad som är gjort
> och vad som återstår för att göra hela kedjan automatisk:
> **kund handlar → orderbekräftelse → AliExpress-order → 17TRACK-tracking → "På väg"-mejl.**

## Arkitektur i korthet
- **Storefront** = headless Next.js (Vercel-projekt `fyndplats-headless`). Visar produkter, kundvagn. Checkout sker i **Wix**.
- **Wix-backend för nya sajten** = Wix-site **`wix-vibe-site-u4lp`** (`e6d27e90-4749-4720-9afe-0bbe91c1b3d3`). Här skapas ordrar, mejl och Velo-events.
- **Pipeline** = Vercel-projekt `fyndplats-cache-warmer` (branch `main`). Tar emot order-webhooks, skapar fulfillment-tasks, beställer på AliExpress (via tillägg/admin), pollar tracking och pushar till Wix.
- **17TRACK** = Velo-backend (`wix-velo/backend/tracking.js`) på Wix-siten.

OBS: gamla `fyndplats.se` = Wix-site `8c62127f…` (separat backend). Order 10057 låg där, inte på nya sajten.

---

## ✅ Klart
- Storefront + checkout + orderregistrering fungerar på nya sajten (207 produkter live).
- Blogg-länkar döljs tills det finns inlägg (PR #47, merged).
- **De 6 Wix Data-collections skapade på nya siten** (`e6d27e90…`):
  - `FyndplatsTasks`, `FyndplatsWebhookEvents`, `FyndplatsMappings`,
    `FyndplatsAudit`, `FyndplatsAliExpressTokens` (privata, ADMIN)
  - `TrackingEvents` (publik läsning för `/sparning`, admin-skrivning)

---

## 🔧 Återstår (kräver Vercel / Wix-UI-access)

### Steg 1 — Cache-warmer: Vercel env vars (`fyndplats-cache-warmer`)
```
STORE_BACKEND=wix-data
WIX_SITE_ID=e6d27e90-4749-4720-9afe-0bbe91c1b3d3      # nya siten – VIKTIGT
WIX_API_TOKEN=<HEMLIG: Wix API-token, Data + Stores write>
ALIEXPRESS_APP_KEY=535350
ALIEXPRESS_APP_SECRET=<HEMLIG>
WIX_WEBHOOK_PUBLIC_KEY=<HEMLIG: PEM från Dev Center, se steg 3>
CRON_SECRET=<HEMLIG: openssl rand -hex 32>
```
Redeploya efteråt.

### Steg 2 — AliExpress OAuth
Öppna `https://fyndplats-cache-warmer.vercel.app/api/aliexpress/auth` → godkänn.
Tokens sparas i `FyndplatsAliExpressTokens`.

### Steg 3 — Order-webhook (Wix Dev Center)
Registrera eCommerce-händelsen "Order approved/created" →
`https://fyndplats-cache-warmer.vercel.app/api/wix-order`.
Kopiera den publika nyckeln → lägg som `WIX_WEBHOOK_PUBLIC_KEY` (steg 1).

### Steg 4 — Backfilla mappningar
`FyndplatsMappings` är tom. Om-importera de 207 produkterna med store live
(`STORE_BACKEND=wix-data`) så att `saveMapping()` fyller variant→leverantörs-SKU.
Utan detta kan auto-order inte resolva AliExpress-produkten för **befintliga** produkter.
(`AliExpressMapping`-collectionen är en oanvänd rest – rör inget i koden.)

### Steg 5 — 17TRACK / Velo
Deploya `wix-velo/backend/tracking.js` på nya siten (kräver Velo/Dev Mode aktivt).
Lägg `SEVENTEEN_TRACK_API_KEY` i Wix Secrets Manager. (`TrackingEvents` finns redan.)

### Steg 6 — Cron (GitHub Actions, cache-warmer-repot)
Repo-secrets:
```
POLL_TRACKING_URL=https://fyndplats-cache-warmer.vercel.app/api/cron/poll-tracking
CRON_SECRET=<samma som i Vercel>
```
Aktivera workflowen "Poll AliExpress tracking".

### Steg 7 — Orderbekräftelse-mejl
I nya sitens dashboard: verifiera att köp-bekräftelsemejlet är aktivt.

### Steg 8 — Rök-test (end-to-end)
Lägg en testorder på nya sajten → kontrollera:
1. Rad i `FyndplatsTasks` (status `pending`)
2. Beställd via tillägget/admin → status `ordered`
3. Cron hämtar spårningsnr → `TrackingEvents` fylls + status `shipped`
4. "På väg!"-mejl skickas + `/sparning` visar status

---

## Snabbaste vägen
Starta en **ny Claude Code-session i samma repo med Vercel kopplad**. Då kan icke-hemliga
env-värden (`STORE_BACKEND`, `WIX_SITE_ID`) sättas direkt; de hemliga klistrar du in själv.
