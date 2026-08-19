# Recensions-import (AliExpress → Fyndplats)

Social proof från dag 1: hämta AliExpress-recensioner, filtrera/ranka dem, spara
i Wix Data och visa dem på produktsidan efter moderering.

**Ingen översättningstjänst.** DeepL togs bort 2026-08-19 (Leonards beslut: "vi
polerar alla via chatten"). Importen sparar källtexten som `pending`; svenskan
skrivs in för hand i `/admin/reviews`. Kostnaden är därmed noll — varken
Anthropic-credits eller DeepL-tecken.

## Arkitektur

```
AE feedback-endpoint  lib/aliexpress/reviews.ts  ──┐   (ren JSON, ingen webbläsare)
extension/content.js  scrapeReviews()  ────────────┤   (best-effort, lazy-laddad DOM)
                                                    ▼
cache-warmer  importReviewsForProduct()   filter/rank → anonymisera → hämta hem bilder
                                                    ▼
Wix Data: FyndplatsImportedReviews   (status: pending)
                                                    ▼
cache-warmer  /admin/reviews   →   skriv om texten till svenska (editReviewText → "edited")
                                                    ▼
headless  lib/reviews.ts  →  components/ProductReviews.tsx   (bara approved/edited visas)
```

Två äkthetsspärrar sitter redan i mappningen (`lib/aliexpress/reviews.ts`) och
ska inte tas bort: recensioner AE själv markerar som **AI-genererade** (`aigc`)
och sådana som inte är publicerade hos AE (`status !== "1"`) släpps aldrig
igenom. Anonyma konton ("AliExpress Shopper") får inget namn vidare.

Filtrering (server, `lib/import/review-import.ts`): ≥3 stjärnor, **50–1200
tecken**, ingen spam (upprepningsmönster), deduplicerad, ingen text som pratar
om leverans till fel land (`review-locale-filter.ts`).
Rankning: foto > senaste 30 dgr > EU-land > längre text. Topp 15 per produkt
(`REVIEW_FILTER.maxReviews`); backfillen kör med tak 8 som default.

> Längdtaket var 300 tecken fram till 2026-08-19. Det sorterade bort precis de
> recensioner som är mest värda att visa — Leonards fall var en femstjärnig
> recension med två foton på 331 tecken, som hade rankats 6,0 av max men kastades
> före rankningen. Butikens EGNA kunder får skriva 2000 tecken.

## Visning, moderering & integritet

- **Visningsformat:** BARA initialer, t.ex. "M.K." — aldrig hela namnet, aldrig
  land, aldrig "Verifierad köpare"-toggle. Riktiga och importerade recensioner ser
  identiska ut. Initialer härleds av `deriveInitials()`: ur AE-namnet om det har
  bokstäver (maskerat "M***a" → "M.A."), annars deterministiskt ur `reviewIdAE`
  (samma recension får alltid samma initialer).
- **Killswitch:** `REVIEW_DISPLAY_MODE` på headless — `initials` (default) visar
  "M.K."; `verified_buyer` byter ALLA till "Verifierad köpare" (panic-läge vid t.ex.
  Konsumentverket-anmälan). En enda env-flagga per deploy, ingen DB-migration.
- **Moderering:** status `pending | approved | rejected | edited`. **Allt
  importerat är `pending`** — inget når produktsidan förrän en människa skrivit
  om texten. `/admin/reviews` = tabell över ALLA med Godkänn/Avvisa/Redigera.
  Bara `approved`/`edited` visas publikt.
- **Bilder:** upp till **3** kundfoton per recension (`MAX_REVIEW_IMAGES` i
  `lib/reviews/images.ts`). De hämtas hem till vår egen mediahantering vid
  import — en `aliexpress-media.com`-adress i produktsidans HTML pekar ut
  leverantören för den som högerklickar. `lib/store/reviews.ts → upsert` är enda
  vägen in i kollektionen och grindar det, så ingen ny väg kan glömma det.
- **Disclaimer** (fine print på PDP): "Recensioner visas med initialer för att
  skydda kundernas integritet. Importerade recensioner från verifierade köpare av
  samma produkt är översatta från ursprungsspråk."
- **Bevisdata lagras internt, visas aldrig:** `textOriginal`, `sourceLanguage`,
  `customerNameRaw` (rått AE-namn), `customerCountry`. Vi byter ALDRIG namn
  baserat på ursprung — vi visar bara inte hela förnamnet. Detta är hur vi kan
  bevisa att recensionerna är från verkliga köpare om Konsumentverket frågar.
- **Betygen skickas INTE till Google.** `PRODUCT_REVIEW_SCHEMA` på headless är
  default av: ingen `aggregateRating`/`Review` i JSON-LD så länge omdömena är
  AliExpress-köpares. Se `lib/review-schema.ts` i butiksrepot.

## Så körs den

| Vad | Anrop |
|---|---|
| En produkt | `POST /api/reviews/import` med `{ wixProductId }` — utan `reviews` hämtar rutten själv |
| Hela katalogen | `GET /api/cron/review-backfill` (torrkörning som default — `?dryRun=false` för skarpt) |
| Från admin | `/admin/reviews` → backfill-knappen (`runReviewBackfillAction`) |

Backfillen (`lib/reviews/backfill.ts`) stannar själv på tre sätt: `limit`
(produkter, default 25), `timeBudgetMs` (240 s mot ruttens `maxDuration` 300) och
slut på kandidater. Varje produkt AE svarat på stämplas med `reviewsCheckedAt` —
även när AE inte hade några recensioner — så körningen konvergerar i stället för
att hämta om de ~40 % recensionslösa produkterna i all evighet. En **strypt**
hämtning stämplas aldrig (då hade rate-limiting dolt produkten i en månad).
Omkontroll efter `REVIEW_RECHECK_DAYS` (30).

Rutten är **inte schemalagd**, medvetet: se `CLAUDE.md`.

## Driftsättning

1. **Wix Data-kollektionen** (idempotent, patchar även befintlig kollektion med
   fält som saknas):
   ```
   node scripts/ensure-reviews-collection.mjs
   ```
   Skapar/uppdaterar `FyndplatsImportedReviews`.
2. **Headless**: ingen ny env krävs — `lib/reviews.ts` läser kollektionen med
   befintliga `WIX_API_KEY` + `WIX_SITE_ID`. (Valfritt: `WIX_DATA_COL_REVIEWS`,
   samt `REVIEW_DISPLAY_MODE=verified_buyer` för panic-läge.)
3. Deploya cache-warmer + headless.

Ingen `DEEPL_API_KEY` behövs. Har du kvar `DEEPL_API_KEY` /
`DEEPL_MONTHLY_BUDGET` i Vercel läses de inte av någon kod och kan tas bort;
kollektionen `FyndplatsTranslationUsage` kan raderas i Wix.

## Verifiering

- Enhetstester: `npx vitest run lib/import/review-import.test.ts lib/reviews/`
  (filter/rank/anonymisering, dedup, bildfält, backfillens stoppvillkor).
- Moderering: `/admin/reviews` — inget publiceras utan att någon rört texten.
- Rich snippets: `aggregateRating`/`Review` skickas medvetet INTE (se ovan).

## Filer

cache-warmer: `lib/aliexpress/reviews.ts`, `lib/import/review-import.ts`,
`lib/reviews/{backfill,backfill-deps,images,queue}.ts`, `lib/store/reviews.ts`,
`lib/wix/media-import.ts`, `app/api/reviews/import/route.ts`,
`app/api/reviews/[productId]/route.ts`, `app/api/cron/review-backfill/route.ts`,
`app/admin/reviews/`, `scripts/ensure-reviews-collection.mjs`. Inkoppling i
`app/api/import/route.ts` + `extension/{content,background}.js`.

headless (`headless-site`): `lib/reviews.ts`, `lib/review-images.ts`,
`components/ProductReviews.tsx`, `app/produkt/[slug]/page.tsx`, `app/globals.css`.
