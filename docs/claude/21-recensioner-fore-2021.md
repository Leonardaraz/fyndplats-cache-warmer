## Recensioner daterade före 2021 visas inte (2026-09-23)

Leonards beslut: "Alla recensioner som är äldre än 2021 måste bort." Butiken
startade 2021, och Aosoms API ger omdömen ända från 2015 (159 av 1 086 i
omgång 3). Regeln bor i `lib/reviews/datumgrans.ts` (`TIDIGASTE_RECENSIONSDATUM`)
och används på två ställen:

1. **Husets filter** (`rankaMedGolv` i `lib/import/review-import.ts`) slänger
   omdömen daterade före gränsen vid inläsningen — alla källor, även i
   räddningssvepet för korta texter.
2. **Städningen** `POST /api/admin/recensioner-datumrensning` (workflow
   `recensioner-datumrensning.yml`, torrt som default) DÖLJER det som redan
   ligger i lagret: status → `rejected` på varje synlig eller väntande rad
   före gränsen. Inget raderas; en rad kan återställas i /admin/reviews.

☠️ Okänt datum behålls — att gissa hade tagit bort äkta omdömen. ☠️ Rutten
läser HELA lagret: `listAll` sorterar nyast först och kapar vid 5 000 som
standard, så de äldsta raderna — just de som söks — hade fallit bort tyst.
Svaret säger `trunkerad: true` om läsgränsen ändå nås, och workflowen stannar.
