# Recensions-import (AliExpress → Fyndplats) med DeepL Free

Social proof från dag 1: skrapa AliExpress-recensioner, översätt EN/ZH → svenska
via **DeepL Free** (ingen Anthropic-användning), spara i Wix Data och visa på
produktsidan med schema.org-markup (rich snippets).

## Arkitektur

```
extension/content.js  scrapeReviews()  ──┐
                                          │  reviewsToImport[] i payloaden
extension/background.js  ─────────────────┘
                                          ▼
cache-warmer  POST /api/import  ── importReviewsForProduct() (best-effort)
                                          │  filter/rank → DeepL → anonymisera
                                          ▼
Wix Data: FyndplatsImportedReviews   +   FyndplatsTranslationUsage (budget)
                                          ▲
headless  lib/reviews.ts  ────────────────┘  läser SYNLIGA (ej hidden) recensioner
headless  app/produkt/[slug]/page.tsx  →  Kundrecensioner-sektion + AggregateRating/Review
cache-warmer  /admin/reviews  →  moderera (visa/dölj) — hidden=true exkluderas på PDP
```

Filtrering (server, `lib/import/review-import.ts`): ≥3 stjärnor, 50–300 tecken,
ingen spam (upprepningsmönster), deduplicerad. Rankning: foto > senaste 30 dgr >
EU-land > längre text. Topp 10–15 per produkt.

Anonymisering: AE-användarnamn visas **aldrig**. Vi sätter "Verifierad kund" eller
"Verifierad kund från {land}".

## DeepL-budget

Free-tiern = 500 000 tecken/månad. `FyndplatsTranslationUsage` bokför månadssumman.
När summan + nästa batch skulle överskrida `DEEPL_MONTHLY_BUDGET` (default 450 000)
importeras recensionerna **otranslaterade** (originaltext) och en varning loggas —
budgeten spräcks aldrig. Topp-15 × ~150 tecken × 209 produkter ≈ långt under taket.

## Driftsättning (Leonard — engångs)

1. **Skapa DeepL Free-nyckel** på <https://www.deepl.com/pro-api> (gratis).
   Nyckeln slutar på `:fx`. Lägg in i Vercel (cache-warmer) som `DEEPL_API_KEY`.
2. **Skapa Wix Data-kollektionerna** (idempotent):
   ```
   node scripts/ensure-reviews-collection.mjs
   ```
   Skapar `FyndplatsImportedReviews` + `FyndplatsTranslationUsage`.
3. **Headless**: ingen ny env behövs — `lib/reviews.ts` läser kollektionen med
   befintliga `WIX_API_KEY` + `WIX_SITE_ID`. (Valfritt override `WIX_DATA_COL_REVIEWS`.)
4. **Ladda om tillägget** i Chrome (chrome://extensions → uppdatera) så den nya
   `scrapeReviews()` aktiveras.
5. Deploya cache-warmer + headless.

Därefter bär **varje ny import** automatiskt med sina recensioner.

## Backfill av befintliga produkter

Recensioner skrapas live från AliExpress-sidan (klient-renderad), så backfill
kräver att tillägget besöker produktsidan. Två vägar:

- **Standalone-endpoint** `POST /api/reviews/import` tar
  `{ supplierProductId | sourceUrl | wixProductId, reviews:[...] }` och slår upp
  Wix-produkten via mappningarna. `scripts/backfill-reviews.mjs` postar en
  JSON-fil med skrapade recensioner hit (se skriptet för format).
- **Re-import** av en produkt via tillägget bär med recensionerna i samma anrop
  (dedup på `reviewIdAE` gör att redan sparade hoppas över).

> OBS: en dedikerad "Importera endast recensioner"-knapp i popupen byggdes **inte**
> (popup.js/html redigeras parallellt av andra tasks). Det är nästa naturliga steg
> för en ett-klicks-backfill per produktsida.

## Verifiering

- Enhetstester: `npx vitest run lib/import/review-import.test.ts lib/translate/deepl.test.ts`
  (filter/rank/anonymisering, dedup, budget-fallback, DeepL-batchning).
- Moderering: `/admin/reviews` (cache-warmer) — visa/dölj per recension.
- Rich snippets: validera en produktsida i Google Rich Results Test efter deploy +
  minst en produkt med recensioner. AggregateRating/Review skickas BARA när det
  finns riktiga recensioner (den gamla hårdkodade 4.9/20 är borttagen).

## Filer

cache-warmer: `lib/translate/deepl.ts`, `lib/translate/usage.ts`,
`lib/import/review-import.ts`, `lib/store/reviews.ts`,
`app/api/reviews/import/route.ts`, `app/api/reviews/[productId]/route.ts`,
`app/admin/reviews/`, `scripts/ensure-reviews-collection.mjs`. Inkoppling i
`app/api/import/route.ts` + `extension/{content,background}.js`.

headless (`headless-site`): `lib/reviews.ts`, `components/ProductReviews.tsx`,
`app/produkt/[slug]/page.tsx`, `app/globals.css`.
