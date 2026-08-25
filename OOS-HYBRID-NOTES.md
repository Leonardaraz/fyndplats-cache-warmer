# Hybrid slut-i-lager · real-tids-larm · alternativa leverantörer · prioriterad sync

Bygger ut den dagliga AliExpress-syncen (`/api/cron/aliexpress-sync`) med fyra
sammanhängande funktioner. **Allt respekterar `SYNC_DRY_RUN=true`** — i dry-run
görs inga Wix-skrivningar och inga mejl skickas (de komponeras bara).

## Vad som ändrats (cache-warmer)

| Funktion | Var |
|---|---|
| **F1 — Hybrid OOS** | `lib/sync/aliexpress-sync.ts` (justRestocked), `lib/restock/store.ts`, `app/api/restock-subscribe/route.ts`, `app/admin/restock-list/page.tsx` |
| **F2 — Real-tids-larm** | `lib/sync/aliexpress-sync.ts` (justWentOos + debounce), `lib/email/resend.ts` (`buildOosAlertEmail`) |
| **F3 — Alternativ** | `lib/aliexpress/alternatives.ts` + `alternative-cache.ts` (gratis deterministisk primär väg, Haiku-fallback) |
| **F4 — Prioriterad sync** | `lib/sync/bestsellers.ts`, sort i `runDailySync`, enqueue i `app/api/wix-order/route.ts` |

## Viktigt designbeslut — `visible:false` vs. headless-filtrering

Spec:en sa "sätt `visible:false` på listningarna men behåll produktsidan". I Wix
Stores finns **ingen per-yta-synlighet** — `visible:false` tar bort produkten
överallt, inkl. produktsidan (Wix slutar serva den). Det skulle bryta kravet
"behåll `/produkt/<slug>` nåbar".

**Lösning (headless-arkitektur):** vi sätter INTE `visible:false`. OOS-signalen
är `inventory = 0` (sätts redan av syncen). Headless-sajten:
- **listnings-queries** (`/butik`, `/alla-produkter`, `/kategori/*`) filtrerar bort
  produkter med 0 i lager → de försvinner från listningarna.
- **produktsidan** renderar ändå, med "Slutsåld"-banner, inaktiverad köp-knapp,
  bevakningsformulär och `availability: OutOfStock` i JSON-LD.

Detta uppfyller intentionen (dolda i listningar, sidan lever) utan att slå sönder
produktsidan. Samma mönster som "vi auto-ändrar inte pris"-beslutet i
`SYNC-CRON-NOTES.md`.

## Wix Data-kollektion att skapa

`FyndplatsRestockSubscribers` (Admin-only). Auto-skapas vid första
prenumerationen, men skapa den gärna manuellt för index/sortering:

| Fält | Typ |
|---|---|
| `_id` | text (`<productId>:<sha1(email)>`) |
| `productId` | text |
| `email` | text |
| `subscribedAt` | text (ISO) |
| `notifiedAt` | text (ISO) eller tom |

> **Status:** kollektionen är SKAPAD i produktion via Wix Data Collections REST
> API (`scripts/ensure-restock-collection.mjs`) — Wix-MCP var inte ansluten i
> bygg-sessionen och Wix Data auto-skapar inte kollektioner vid första skriv.
> Verifierad live: `POST /api/restock-subscribe` → `{ok:true, status:"subscribed"}`,
> dubblett → `already_subscribed`. Test-raden raderades efteråt. Kör skriptet igen
> om kollektionen någonsin måste återskapas (idempotent).

## Nya env-vars (se `.env.example`)

`WIX_DATA_COL_RESTOCK`, `OOS_ALTERNATIVES`, `PRIORITY_SYNC`,
`STORE_PRODUCT_BASE_URL`, `NEXT_PUBLIC_STORE_URL`, `STOREFRONT_ORIGINS`.
`OPS_ALERT_EMAIL` återanvänds för real-tids-larmen. Inga nya cron-jobb —
restock-utskick och bestseller-prioritet körs i den befintliga dagliga syncen.

## Cron-schema

`/api/cron/aliexpress-sync` körs **varannan timme** (`0 */2 * * *`, Vercel Pro) —
12 körningar/dygn × ~100 produkter = ~1 200 checkar/dygn.

Takten höjdes från var 4:e timme 2026-08-25. Katalogen hade vuxit till 980
mappningar medan budgeten stod kvar på 600 checkar/dygn, alltså **1,65 dygns
rotation** — en produkt kunde dö hos leverantören och ligga köpbar hos oss i
över ett dygn innan vi ens tittade på den.

Varför frekvens och inte större budget per körning: `boundBy` i synk-summeringen
visade `"calls"`, men bara nätt och jämnt — 100 produkter tog nästan hela
väggklocka-budgeten på 240 s, och funktionens `maxDuration` är 300 s. En höjning
till 150 hade därför bara flyttat gränsen till `"clock"` (~10 % fler produkter)
och pressat körtiden mot taket där Vercel dödar funktionen mitt i en
Wix-skrivning. Fler körningar kostar ingenting av de budgetarna.

Utrymmet fanns: `throttled: 0` i varje mätt körning — vi blev aldrig
frekvensspärrade av AliExpress. Om en DYGNSKVOT finns (odokumenterad, varken i
repot eller i AE:s publika dokumentation) syns den som `throttled > 0` i
audit-raden och i morgonmejlet — det är facit att backa på.

## Feature 3 — kostnad nära noll

- **Primär väg (GRATIS, ingen Claude):** strippad generisk sökning →
  AliExpress text.search → rank **EU-lager först → orders desc → pris ±50% av
  originalet** → topp 3. Resultatet **cachas 30 dagar** i
  `FyndplatsAlternativeCache`. Vid OOS-händelse: cache-träff (färsk + ≥3
  alternativ) → ingen sökning alls.
- **Fallback (Claude Haiku):** bara när deterministiskt ger **< 3 träffar**
  ELLER när träffarna ser ut att blanda kategorier (lågt token-överlapp mot
  originalet). Då re-rankar Haiku en bredare kandidatlista. Budget-capad via
  `lib/llm/router` (`ANTHROPIC_DAILY_BUDGET_USD`, default $2) + Gemini-fallback.
- Nettoeffekt: ~$0 för ~90% av fallen, ~$0.005 bara för de ~10% där den
  deterministiska rankningen inte är trygg. `OOS_ALTERNATIVES=off` stänger av.

## Debounce + dry-run-semantik

- Real-tids-larm: max 1 per produkt per 24h (`lastOosAlertAt`), och bara vid en
  **faktisk övergång** aktiv→slut (inte på första observationen).
- **Dry-run muterar inte övergångs-tillståndet.** real-tids-larm, restock-mejl
  och alternativ-sökning körs ENDAST i live-läge; i dry-run fryses
  `listingStatus` + `lastOosAlertAt` i state. Annars skulle en dry-run-körning
  "konsumera" en övergång (persistera oos/active) så att inga riktiga mejl
  skickas när `SYNC_DRY_RUN` slås av. Dagsrapporten listar däremot fortfarande
  OOS-händelser (detektering ≠ utskick). *(Bug funnen av den adversariella
  review-workflowen — den deterministiska transition-logiken vilade på state
  som muterades i dry-run.)*

## Verifiering

- `pnpm test` → 300 tester gröna (inkl. nya: alternativ, bestsellers, restock,
  OOS-övergångar, mejl-rendering).
- `pnpm typecheck` + `next build` → rent.
- Leverabler: kör `GEN_DELIVERABLES=1 npx vitest run scripts/generate-deliverables.test.ts`
  → skriver `deliverables/` (renderat OOS-mejl, restock-mejl, alternativ-JSON).

## Dry-run-test (utan att skicka mejl)

1. `SYNC_DRY_RUN=true` (default i Vercel) → inga Wix-skrivningar, inga utskick.
2. Trigga manuellt:
   ```powershell
   curl -X POST "https://fyndplats-cache-warmer.vercel.app/api/cron/aliexpress-sync" `
        -H "x-fyndplats-token: $env:EXTENSION_API_TOKEN"
   ```
3. Svaret innehåller `summary.oosRealtimeAlerts`, `oosEvents`,
   `restockNotificationsSent`. Mejlen komponeras men skickas inte i dry-run.
4. Sätt `SYNC_DRY_RUN=false` först när loggen ser rätt ut.

## Headless (separat repo, branch `headless-site`)

Produktsidans OOS-state + bevakningsformulär ligger i `fyndplats-headless`
(separat commit). Se det repots README/commit.
