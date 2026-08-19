# Fyndplats cache-warmer — projektanvisningar

## Import-arbetsflöde & AI-kostnad (`AI_ENRICHMENT_ENABLED`)

Import-pipelinen (`lib/import/pipeline.ts → importProduct`) kan köras i två lägen.
Master-switchen är env-variabeln **`AI_ENRICHMENT_ENABLED`** (default `true`).

### Default-läge: RÅ import → polera via chatten (GRATIS)

Sätt `AI_ENRICHMENT_ENABLED=false` i Vercel (production). Då:

- Importen gör **inga dyra Claude-anrop** (ingen SEO-text, FAQ/flik-generering,
  kategorisering eller Sonnet-bildanalys). Undantag: **variantöversättningen** har
  en egen, billig AI-fallback — se nästa avsnitt (kan stängas av för hård $0).
- Produkten skapas ändå komplett i Wix från rå AliExpress-data: **rå titel/
  beskrivning**, svensk **variant-översättning** (statisk tabell + ev. cachad
  Haiku-fallback, via `variant-translations.ts` / `variant-ai-translate.ts`),
  **prissättning** + **lager** (deterministiskt), bilder, EU-lager-ribbon,
  spec-fliken från råa specs.
- Produkten blir **draft** (`visible:false`) och hamnar i **`/admin/queue`** med
  badgen **"✨ Behöver AI-polering"** (filter-chip finns).
- I kön finns knappen **"✨ Be Claude i chatten att polera"** → kopierar
  produkt-info + Wix-ID till urklipp. Klistra in i Cowork-chatten och säg
  *"polera denna"* så skriver Claude SEO/beskrivning/FAQ/kategori gratis i chatten
  istället för via betald API-pipeline.

### Variantöversättning: tabell → cache → Haiku → svenskhets-grind → färg-grind (egen switch `VARIANT_AI_TRANSLATION_ENABLED`)

Variantvärden (t.ex. "Warm White", "100 inch") översätts till svenska FRÅN START
vid import — viktigt, för i Wix V3 speglar `choice.name` den låsta `choice.key`:en,
så värden kan inte döpas om i efterhand. Fem lager (`lib/import/variant-ai-translate.ts`);
färg-grinden (5) körs sedan 2026-08-09 i BÅDA lägena — även hård-$0/sync-läget
(`colorGateFlags` i pipeline-else-grenen), eftersom den är deterministisk och gratis:

1. **Statisk tabell** (`variant-translations.ts`, $0): golden-testad, auktoritativ.
2. **AI-fallback** (Haiku, default PÅ): bara för värden tabellen missar, **ett**
   batchat anrop per produkt, **cachat per värde för alltid** (→ nära $0; samma
   råvärde översätts en gång, någonsin). Routas via `completeJsonRouted` → ärver
   daglig budgetcap + Gemini-fallback + `failOpen` (importen fälls aldrig).
   Eko-asymmetri: rent-ord-ekon misstros (flaggas + självläker); halvöversättningar
   som behåller engelska tokens flaggas.
3. **Olösta värden** (AI av/fail/kvarvarande engelska) → produkten flaggas
   `needsAiPolish` och hamnar i poleringskön i stället för att nå kunden halv-engelsk.
4. **Svenskhets-grinden** (slutsteg, AI-läget): de FAKTISKA skeppningsklara
   värdena/axelnamnen språkverifieras av Haiku ("är detta naturlig svenska?") —
   fångar kategoriskt det heuristiken missar (VERSAL-engelska som "STRIPED",
   exotiska AE-former). Cachat verdikt per slutvärde (30 d TTL, ≈$0), fail-open
   (transient fel cachas ALDRIG som "ok"), flaggade värden → samma poleringskö +
   kö-badge som listar dem ordagrant.
5. **Färg-grinden** (deterministisk, $0, `nonColorValuesOnColorAxis` i
   `color-match.ts`): svenskhets-grinden godkänner varje äkta svenskt ord — även
   när betydelsen är fel. En röd bil skeppades som färgen **"Nät"** (2026-08-08);
   ordet är invändningsfri svenska och passerade. Oöversatt spanska utan engelska
   tokens ("Naranja") blir dessutom aldrig AI-kandidat. Grinden tittar därför på de
   SLUTGILTIGA värdena per axel: på en axel vars värden i majoritet är färger
   (`isColorAxis`) flaggas det som varken är färg eller yta. Konservativ — rör inte
   axlar där AE lagt storlekar under "Color", och släpper språkneutrala mått/koder.

Switchen är **`VARIANT_AI_TRANSLATION_ENABLED`** (default `true`), FRIKOPPLAD från
`AI_ENRICHMENT_ENABLED` — variantöversättningen kör alltså även i rå-läget (billig +
cachad). Sätt `=false` för hård $0 på varianter (svansen lämnas då engelsk + flaggas
för polering). Explicit `flags.translateVariants` vinner över env. Beslutspunkt:
`variantAiTranslationEnabled(flags)`. Golden-testet i `variant-translations.test.ts`
låser kända/fäll-fixade översättningar i CI.

### Bulk-läge: AI-berikning PÅ (kostar Anthropic-credits)

När du vill köra en riktig AI-batch:

1. Sätt `AI_ENRICHMENT_ENABLED=true` i Vercel (eller ta bort variabeln — default är på).
2. Kör batch-/bulk-importen.
3. Sätt tillbaka `AI_ENRICHMENT_ENABLED=false` när batchen är klar.

Alternativt, utan att röra env: anropa pipelinen med `flags.enableAI: true` per
import (t.ex. en admin "kör AI-batch"-knapp). **Explicit `flags.enableAI` vinner
alltid över env-flaggan** — `true` tvingar PÅ trots env=false, `false` tvingar AV
trots env=true. Flaggan är default men inte hård (`aiEnrichmentEnabled()`).

### Var det gatas

`aiEnrichmentEnabled(flags)` i `lib/import/pipeline.ts` är enda beslutspunkten.
När AI är av: `runSeo/runImageAnalysis/runCategory/batched` blir alla `false`,
`importProduct` returnerar `needsAiPolish:true`, och `lib/bulk-import/worker.ts`
tvingar realtidsvägen (ingen Batch API-pre-generering som annars kostar).

## Dubblett-spärr vid import

**Båda** importvägarna vägrar nu importera en AliExpress-listning som redan finns,
med `supplierProductId` som nyckel:

- Bulk/CSV: `lib/bulk-import/worker.ts → scrapeAndDedupe` — hoppar över raden.
- Extension: `app/api/import/route.ts` — svarar **409** med den befintliga
  produktens `wixProductId`. Skicka `allowDuplicate: true` för att medvetet
  importera ändå (t.ex. när produkten raderats men mappningsraden blivit kvar).

Båda är **fail-open**: ett trasigt mappnings-uppslag blockerar aldrig en i övrigt
giltig import. `/api/check-duplicate` (pHash + titel, `lib/import/duplicate-check.ts`)
finns kvar som en *rådgivande* varning i tillägget och fångar dessutom det spärren
inte kan se: samma fysiska produkt såld under en **annan** listning. Den varningen
går att klicka förbi — så den ersätter inte spärren, den kompletterar den.

## Recensioner: hämtas server-side från AliExpress, översätts i chatten

Recensionskedjan (filtrering → `FyndplatsImportedReviews` → moderering i
`/admin/reviews` → produktsidans "Kundrecensioner") har funnits sedan 2026-07-08 men stod **tom på
876 produkter** fram till 2026-08-16. Orsaken var inmatningen, inte kedjan:

- Enda vägen in var tilläggets DOM-skrapa (`extension/content.js → scrapeReviews`),
  och AE **lazy-laddar** recensionssektionen — klickar man importera högst upp på
  sidan har den oftast inte renderats, så skrapan returnerade `[]`.
- **Bulk-/CSV-importen rör aldrig recensioner** (`lib/bulk-import/worker.ts` har
  ingen webbläsare). Katalogens senaste ~800 produkter kom in den vägen.

`lib/aliexpress/reviews.ts` hämtar dem nu i stället från AE:s feedback-endpoint
(ren JSON, inget tillägg, $0). Två äkthetsspärrar sitter i mappningen och ska inte
tas bort: recensioner som AE själv markerar som **AI-genererade** (`aigc`) och
sådana som inte är publicerade hos AE (`status !== "1"`) släpps aldrig igenom.
Anonyma konton ("AliExpress Shopper") får inget namn vidare — annars blir varenda
rad "A.S." och sidan ser förfalskad ut.

### Så körs den

| Vad | Anrop |
|---|---|
| En produkt | `POST /api/reviews/import` med `{ wixProductId }` — utan `reviews` hämtar rutten själv |
| Hela katalogen | `GET /api/cron/review-backfill` |

`review-backfill` är **torrkörning som default** — utan `?dryRun=false` skrivs
ingenting, du får bara siffrorna. Parametrar: `limit` (produkter per körning,
default 25), `maxPerProduct` (default 8), `includeExisting`, `onlyPublished`,
`ignoreCheckedAt`.

Rutten är **inte schemalagd**. Den var det en kort stund 2026-08-16, men Leonard
valde bort maskinöversättning helt ("skit i deep l") — texterna skrivs i stället
om av Claude i chatten, gratis, och sparas via `/admin/reviews`. En
översättnings-cron i bakgrunden hade motverkat det beslutet. Vill du tillbaka
till schemalagd hämtning: lägg in cron-raden igen — hämtningen i sig är gratis.

Backfillen stannar dessutom själv efter **240 s** (`timeBudgetMs`, mot ruttens
`maxDuration` 300 s). Varje recension kan dra upp till tre mediaimporter med
retry, så en körning hann annars dödas mitt i en produkt.

Körningen **konvergerar**. Varje produkt AE svarat på stämplas med
`reviewsCheckedAt` i mappningen — även när AE inte hade några recensioner. Utan
den stämpeln skulle de ~40 % recensionslösa produkterna hämtas om vid varje
körning i all evighet. Produkter som redan har recensioner hoppas över helt, och
en **strypt** hämtning stämplas aldrig (då hade rate-limiting dolt produkten i en
månad). Omkontroll efter `REVIEW_RECHECK_DAYS` (30) — nya recensioner dyker upp
hos AE över tid.

### Betygen skickas INTE till Google

Butiken (`headless-site`) har `PRODUCT_REVIEW_SCHEMA`, **default av**. Recensions-
texten visas för kunden, men `aggregateRating`/`Review` läggs inte i produktsidans
JSON-LD medan omdömena är AliExpress-köpares. Googles riktlinjer för review
snippets vill ha betyg från sajtens egna användare. Sätt `=on` först när datan är
förstahands (Trustpilot Product Reviews / egna kundrecensioner). Se
`lib/review-schema.ts` i butiksrepot.

### Översättningen görs i chatten — DeepL är borttaget (2026-08-19)

Kedjan har **ingen översättningstjänst** längre. `lib/translate/` finns inte;
`DEEPL_API_KEY` och `DEEPL_MONTHLY_BUDGET` läses inte av någon kod och kan tas
bort ur Vercel. Wix-kollektionen `FyndplatsTranslationUsage` skapas inte längre
av `scripts/ensure-reviews-collection.mjs` och kan raderas i Wix.

Det var redan så det fungerade i praktiken — cronen var avstängd sedan
2026-08-16 — men koden bar kvar API-nyckel, månadsbudget, ett användningslager
och en **tyst fallback som sparade originaltexten** när budgeten tog slut.

Följdändringen är den viktiga: importerade recensioner **auto-godkänns inte
längre**. De sparas som `status: "pending"` med källtexten i både `textOriginal`
och `textSwedish`, och blir svenska när någon skriver om dem i `/admin/reviews`
(`editReviewText` sätter `edited` → först då syns de publikt). Samma regel som
för butikens egna kundomdömen. Alternativet — direktpublicering utan
översättare — är exakt vad den gamla budget-fallbacken gjorde: engelska omdömen
på en svensk produktsida.

Kostnaden är därmed **noll**, i både credits och tecken. Kvar som mått är
`chars` per produkt i backfill-svaret: hur mycket text som väntar på att skrivas
om, inte vad något kostar. Mätt 2026-08-16 på 40 slumpade publicerade produkter
(692 publicerade mappningar av 876): träffkvot 60 %, ~240 tecken/produkt vid
tak 8 — alltså ~166k tecken för hela butiken. Cirka 40 % av produkterna får inga
recensioner alls, mest nya Aosom-EU-listningar som inte hunnit få några hos AE.

Övriga LLM-/kostnads-env-variabler dokumenteras i **`LLM-CONFIG.md`**.
