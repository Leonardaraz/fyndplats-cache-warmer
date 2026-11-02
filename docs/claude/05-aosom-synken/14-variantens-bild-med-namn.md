### ☠️ Variantens bild följer bara valet om valen skickas med NAMN (2026-10-03)

Wix räknar själv fram `variantsInfo.variants[].media` ur valets `linkedMedia`,
och fältet är skrivskyddat. Men Wix räknar bara om det när varianterna skickas
med valen angivna **enbart med namn** (`optionChoiceNames`), som Wix egen
redigerare gör. Motorns skrivningar skickar `variantsInfo` ordagrant ur GET:en,
alltså med `optionChoiceIds`, och då står den gamla bilden kvar. Bilderna
kopplas efter att produkten skapats, när variantbilden redan är huvudbilden, så
den fastnade där. **Varukorgen (Cart v2 `lineItems[].image`), kassan och ordern
visade första färgens bild oavsett vald färg.** 566 publicerade produkter
rättades för hand samma dag, med id, SKU, pris, lager, synlighet, bildordning
och kostnad kontrollerade före och efter.

Receptet bor i `lib/wix/variant-media.ts` (`refreshVariantMedia`):
`PATCH /stores/v3/products-with-inventory/{id}` utan fältmask, med `options`
ordagrant, produktens `visible`, och ALLA varianter med `id`, valen bara med
namn, `price` (med `compareAtPrice`), `sku`, `barcode`, `visible`,
`physicalProperties` och `revenueDetails.cost`. Aldrig `inventoryItem` (då rörs
lagret inte) och aldrig variantens `media` (Wix ignorerar den). Förväntad bild =
första bilden i valets `linkedMedia`; flera optioner med bilder → första bilden
i snittet; inga kopplade bilder → huvudbilden. Efter skrivningen läses produkt
och lager om, och minsta avvikelse stoppar.

- **Den anropas efter varje bildkoppling:** `linkChoiceMedia` (importen),
  färgbilderna (`fargbilder-kor.ts`), miljöbilden (`livsbild.ts`) och
  sammanslagningen. Kollapsen (`remap-kollaps.ts`) kopplar inga bilder och
  lämnar en variant utan val, så den har inget att räkna på.
- **Den dagliga kollen** `/api/cron/variantbild?dryRun=false` (05:35 UTC)
  sveper alla produkter med val, utkast med. Först läses alla flervariantsprodukter
  (fyra i taget, inget skrivs), sedan rättas de med fel bild en i taget.
  Leonards ja 2026-10-03: "kör den så det fungerar fullt ut". Ett handanrop
  utan `dryRun=false` bara listar.
- ☠️ **Svepet frågar bara efter produkter med val** (`MED_VAL_FILTER`,
  `options.id $exists`, sedan 2026-10-29). En produkt med fler än en variant
  har alltid val, så filtret kan inte missa en. Uppmätt mot hela katalogen,
  utkast med: samma 1 211 flervariantsprodukter med och utan filtret, 13 sidor
  i stället för 64 och 14 sekunder i stället för 57. VEVOR-varorna har en
  variant och inga val, så importen gör inte svepet längre. Utan filtret hade
  katalogsvepet blivit ungefär tre och en halv gånger så långt efter importen,
  och kollen har 240 sekunder. Det som inte hinns med en natt hinns inte heller
  nästa, för varje körning börjar från början. Filtret går bara med på första
  sidan (filter plus markör ger 400 INVALID_CURSOR).
- **En skiva är inget fel.** `variantbild.yml` delar listan i skivor om 60
  (`?limit=`). Rapporten säger varför körningen slutade (`slutade`: `klar`,
  `grans`, `tid` eller `avvikelse`), och bara `tid` och `avvikelse` loggas som
  fel. Förut loggades varje skiva utom den sista som "tidsbudgeten tog slut":
  20 fel i Vercel 14–28 oktober, och inget av dem var nattens cron, som blev
  klar varje natt (2026-10-29: 1 210 av 1 210 på drygt två minuter).
- ✅ **Utkast är prövade och rättas också** (2026-10-03, utkastet d4118d39):
  efter skrivningen fortfarande `visible: false`, rätt bild, SKU och pris lika,
  lagret orört (antal och revision). Kontrollen fäller en ändrad synlighet.
  `utkast: false` / `?utkast=0` hoppar dem.
- ☠️ **Skrivningen kräver `fields=MERCHANT_DATA`**, annars saknas kostnaden.
  Motorns nyckel fick 403 på den 2026-09-27 (se sammanslagningen). Då skriver
  rättningen ingenting och säger `nyckeln får inte läsa varukostnaden`. Kollen
  behöver inte fältet.
- ☠️ **Skrivningar med `optionChoiceIds` NOLLSTÄLLER variantbilden på en
  flervariantssida, också prissynkens.** Det stod här att de behåller den, och
  det stämde inte. Mätt 2026-10-24: Aosom-synken skrev regelpriset på klöspelaren
  `81a60db2` 09:21:21 UTC, och direkt efteråt hade Beige och Brun huvudbilden som
  variantbild i stället för sina egna. `variantbild.yml` rättade den. Nattens
  `/api/cron/variantbild` (05:35 UTC) rättar samma sak, och det var den som
  rättade Svart på skrivbordsstativet `ee3a9dbc` 05:37 UTC samma morgon: ett rätt
  utfall, inget fel. Tills dess visar varukorgen, kassan och ordern fel färg på
  en sida vars pris just skrivits. ✅ `updateV3VariantPrices` anropar sedan
  2026-10-28 `refreshVariantMedia` direkt efter en prisskrivning på en
  flervariantsprodukt (Leonards ja 2026-10-27, FLAGGADE lärdom 204 och 234,
  mergat med #779 2026-10-28). Uppföljningen läser om tills PATCH-svarets revision
  nåtts, ger den aldrig upp skrivs inget, och ett fel i den fäller aldrig
  prisskrivningen (`foljUppVariantbild: false` hoppar den).
