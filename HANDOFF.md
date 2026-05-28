# Fyndplats handoff — 2026-05-28

**Detta är startpunkten för Claude Code på telefon/annan dator.** Läs detta först — det räcker för att förstå exakt var vi är och vad som behöver göras härnäst.

---

## TL;DR — Var vi är

Fyndplats är en svensk dropshipping-butik. Två separata kodbaser:

1. **Headless storefront** (`fyndplats-headless`) — Next.js 16 / Wix Headless V3 / Vercel
   - Production: https://fyndplats-headless.vercel.app
   - Branch: `headless-site` (production-branch på Vercel)
   - Lokal: `C:\Users\leona\fyndplats-headless`
   - Senaste commit på `headless-site`: `54e3b41` (color swatches)

2. **Backend cache-warmer** (`fyndplats-cache-warmer`) — Next.js / Vercel
   - Production: https://fyndplats-cache-warmer.vercel.app
   - Branch: `main` (production-branch på Vercel)
   - Lokal: `C:\Users\leona\fyndplats-cache-warmer`
   - Senaste commit på `main`: `6459546` (Auto-pipeline 17TRACK + admin)

3. **Wix Velo backend** på `fyndplats.se` (gamla sajten)
   - Hanterar 17TRACK tracking + anonymisering + epost
   - Kod lever i Wix Studio Editor (inte git)
   - Git-record på branchen `feat/velo-lazy-fetch-tracking` i cache-warmer-repot

**OBS:** `main`-branchen i GitHub-repot (Leonardaraz/fyndplats-cache-warmer) är cache-warmer-koden. `headless-site`-branchen i samma repo är storefronten. Helt separata historik.

---

## Vad är gjort senaste sessionen (2026-05-28)

### Headless storefront — alla på `headless-site` branch, live
- **`/tack`** confirmation-sida efter checkout (premium animated checkmark, 3-stegs progress, order-nr från URL)
- **`/kopvillkor`** komplett svensk konsumentlag-konform köpvillkorssida
- **Premium hero-mosaik** med handplockade bilder (UGREEN-mus + 19cm-sminkborste bort, knivhållare in)
- **Premium kategori-mosaik** (curation + denylist mot text/logga)
- **Två-stegs CatNav** (huvudkategorier + underkategorier, "Alla 207" fix)
- **9 premium features** (wishlist, recently-viewed, sticky mobile buy, low-stock, hover-swap, branded 404, scroll indicator, view transitions, faceted filter)
- **Variant color swatches** som fallback när V3-migration tappat per-choice bilder
- **Live tracking-widget** kopplad till Velo `/_functions/track?tn=`
- **Smart event-driven stage-logik** för tracking

### Säkerhet
- **`EXTENSION_API_TOKEN` roterad** i Vercel (cache-warmer) efter chat-läcka. Verifierat: gamla token → 401 ✓
- Användare uppdaterade tokenet manuellt på 3 ställen (Vercel env, Wix Secrets Manager, Chrome extension)

### Velo lazy-fetch tracking (i git, INTE i Wix Editor än)
- Cherry-pickad till ren branch `feat/velo-lazy-fetch-tracking` på cache-warmer-repot
- Fixar: `/sparning?tn=...` visade tom timeline när 17TRACK-webhook failade
- **VIKTIGT:** Original-branchen `claude/lazy-fetch-tracking` innehöll OAuth-regression i `lib/aliexpress/client.ts` — använd INTE den, bara den cherry-pickade

---

## Vad är pending — manuella ANVÄNDARÅTGÄRDER

### Kritiskt (denna vecka)
1. **Avinstallera DSers** från Wix — ✅ KLAR (användaren bekräftade)
2. **Aktivera Velo lazy-fetch** i Wix Editor (se `docs/handoff/VELO_INSTRUKTIONER.md`)
3. **Lägg test-order end-to-end** för att verifiera hela kedjan

### Snart
4. **DNS-flytt** `www.fyndplats.se` → Vercel (när redo att stänga gamla Wix-site)
5. Cleanup oanvända env vars (`NEXT_PUBLIC_WIX_CLIENT_ID`, `WIX_CLIENT_ID` i Vercel — koden hardcodar clientId)

---

## Vad är pending — PARALLELL CLAUDE-arbete

Tre task-briefer för Vercel-backend-features. Klistra in i nya Claude Code-sessioner, en åt gången, i ordningen C → B → A.

| Brief | Filplats | Kort |
|---|---|---|
| **TASK C** | `docs/handoff/TASK_C_store_backend_wix_data.md` | Byt STORE_BACKEND memory→wix-data så tokens överlever Vercel cold start |
| **TASK B** | `docs/handoff/TASK_B_auto_refresh_token.md` | Auto-refresh AliExpress access_token via Vercel cron (kräver C) |
| **TASK A** | `docs/handoff/TASK_A_velo_lazy_fetch.md` | Cache-warm pris/lager från AliExpress vid produktsides-besök (Velo + Vercel endpoint) |

---

## Boundaries — RÖR INTE

| Område | Regel |
|---|---|
| Origin/carrier-maskering | Maskning sker i `wix-velo/backend/tracking.js → filterEvents()`. NEVER stärk, replikera eller flytta till frontend. |
| AliExpress DS-pipeline | Lever i cache-warmer-repot. Storefront pratar aldrig direkt med AliExpress. |
| OAuth-tokens | ALDRIG committa till git. ALDRIG paste:a i chat. Endast i Vercel env / Wix Secrets Manager. |
| Wix Catalog V1 | Inte implementera (Fyndplats är V3-only Studio site). |
| Velo-kod | Deployas inte från git. Lever i Wix Studio Editor. Git är bara backup/record. |

---

## Critical project knowledge

### Wix Headless V3-quirks
- **V1 products SDK funkar mot V3-sajt** (backward compat). Kod använder `@wix/stores` products.
- **V1 collections SDK funkar INTE mot V3.** Vi använder `@wix/categories` med `treeReference: { appNamespace: "@wix/stores" }`.
- **Per-choice variant images TAPPADES under V3-migration** — vi har därför `color`-swatch fallback i `lib/products.ts` `extractOptions()` baserat på COLOR_HEX-mappen.
- `product.collectionIds` matchar `category._id` direkt — fungerar med befintlig mixByCategory.

### ClientId & säkerhet
- Wix Headless clientId `3d8fdd09-3b3c-475f-aac2-b6bfa9e05153` är **hardcoded** i `lib/products.ts` + `components/cart.tsx`. Publik OAuth client = inte secret. Hardcoding bypassar stale Vercel env vars.
- Site ID: `8c62127f-c07a-4596-86b8-4e88b5cc502d` (wix-vibe-site-u4lp).
- Branch-strategi: `headless-site` = storefront production, `main` = cache-warmer production. Aldrig merga mellan dem.

### Köpvillkor (företagsinfo)
- Fyndplats, org.nr `199509144037`, momsregnr `SE199509144037 01`
- Bergviksgatan 10, 152 44 Södertälje
- E-post: info@fyndplats.com, Telefon: +46 (0) 73 663 09 90

---

## Quick reference URLs

### Dashboards
- Vercel headless: https://vercel.com/leonardarazs-projects/fyndplats-headless
- Vercel cache-warmer: https://vercel.com/leonardarazs-projects/fyndplats-cache-warmer
- GitHub repo: https://github.com/Leonardaraz/fyndplats-cache-warmer
- Wix Studio Editor: https://manage.wix.com (välj `wix-vibe-site-u4lp`)
- AliExpress Open Platform: https://openservice.aliexpress.com/app/index.htm

### Production URLs
- Headless storefront: https://fyndplats-headless.vercel.app
- Cache-warmer backend: https://fyndplats-cache-warmer.vercel.app
- Old Wix site (Velo): https://www.fyndplats.se

### API-endpoints i bruk
- Tracking: `GET https://www.fyndplats.se/_functions/track?tn=<TN>` (Velo)
- Cache-warm endpoint planerad: `POST https://fyndplats-cache-warmer.vercel.app/api/cache-warm` (TASK A skapar)

---

## Vad som hände i sessionen — komplett lista

Senaste 8 commits på `headless-site`:
```
54e3b41 Variant color swatches as fallback when V3 per-choice images saknas
46f1797 Add /kopvillkor + premium Google G icon + content polish
ec28a55 Add premium /tack confirmation page after checkout
108bf10 Replace heart balloons with premium knife rack in hero + mosaic
e2c8655 Premium hero curation + expanded mosaic denylist
6627b8e Wire tracking widget to live Velo /_functions/track API
4aa2388 Two-tier CatNav + premium homepage mosaic + polish fixes
a9b6254 Add 9 premium storefront features
```

`feat/velo-lazy-fetch-tracking` på cache-warmer:
```
b10b08e Velo: lazy-fetch fallback för TNs där 17TRACK-pushen failade
```

---

## Hur du fortsätter

### Från telefon eller annan dator (Claude Code)
1. Klona repo: `git clone https://github.com/Leonardaraz/fyndplats-cache-warmer.git`
2. Checkout headless: `git checkout headless-site`
3. Läs denna fil först (`HANDOFF.md`)
4. För specifika tasks: läs `docs/handoff/TASK_*.md`
5. Säg till Claude Code: *"Läs HANDOFF.md och fortsätt med [specifik task eller fråga]"*

### Lokala utvecklingskommandon
```powershell
cd C:\Users\leona\fyndplats-headless
pnpm install     # om första gången
pnpm dev         # local dev server på port 3000
pnpm build       # validate build
vercel --yes     # preview deploy
git push origin headless-site   # production deploy (auto via Vercel)
```

---

## Säg detta till Claude Code för att börja

> "Läs HANDOFF.md och alla filer i docs/handoff/. Berätta för mig var vi är och vilken som är nästa lämpliga task att fortsätta med."

Eller direkt:

> "Läs HANDOFF.md. Fortsätt med TASK [A/B/C]."

> "Läs HANDOFF.md. Kolla om det finns nya commits på cache-warmer-branchen feat/velo-lazy-fetch-tracking och säg om de är OK att merga."

---

*Senast uppdaterad: 2026-05-28*
*Sessionens fokus: Premium UX-polish + Velo lazy-fetch implementation + säkerhet (token-rotation)*
