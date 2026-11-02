#### Härma-sidorna: exakt ägare på 13 sidor (2026-10-28)

Sensorsoptunnan `92fc308c` togs som prov, sedan de tolv sidor där första bilden var fel. **137 av 361 foton fick ny ägare**, bilderna per kombination gick från 500 till
379, första bilden bytte på 23 av 61 kombinationer, och ingen kombination ligger under fyra bilder. Skrivet två sidor per körning 02:25–02:47 UTC utanför Aosoms fönster,
`variantbild-farg.js` direkt efter (02:48–02:50 UTC), 0 avvikelser i Wix-återläsningen på alla 13. Live: 13 av 13 sidor lika med planen (`kolla-agare.py`) och 61 av 61
kombinationer OK i en riktig webbläsare. Före-och-efter-tabellen per kombination, planerna, README och en återställningsplan (`fore-agare.json`) ligger i rundans mapp.

Fem egenskaper som inte ska tas bort:

1. **Planen byggs av `tools/polish-gates/bygg-harma-agare.py` och är ett förslag.** Ett äldre foto som Aosom visar under en REKTANGEL av kombinationer (färger × storlekar,
   räknat mot de kombinationer sidan har) får exakt den rektangeln som ägare, ett foto utan uppgift eller utan rektangel behåller sina länkar, och `ordning` lägger
   kombinationens packshot först i färgens lista. Planen granskas på kontaktark med planens ägare och nuvarande länkar under varje bild, prövas torrt med `bygg-agare.py --torr`
   och skrivs sedan, utanför Aosoms synkfönster.
2. ☠️ **15 länkade bilder per val, och regeln glömdes (FLAGGADE lärdom 217–219 och 238).** Odlingstunneln `38f70f83` föll med `400 … choicesSettings is invalid` (200 cm skulle få
   16) och hammocken `91f5c078` hade 17 på 205 cm. Ett foto med en ägarlista räknas mot varje val i listan, så ett foto för en kombination kostar en länk i färgen och en i storleken.
   Lagat så att regeln inte behöver minnas: `bygg-agare.py` vägrar bygga en plan över 15, `lank-om-bilder.js` avvisar den innan något skrivs (`LANKTAK`), och `bygg-harma-agare.py`
   märker de över 15 i rapporten.
3. ☠️ **Butikens första bild per kombination är `variantTable[].image`, inte vyns första bild i galleriets ordning.** Den är lika med webbläsarens första bild på 61 av 61.
   `verifiera-live.py` jämför bara mängden foton per kombination, inte ordningen, så första bilden kontrolleras för sig.
4. ☠️ **Fyra kombinationer hade bara tre egna foton och fick ett foto till** (minimum fyra bilder): `3b868848` Vit × 63 cm, `7bc96b8f` Ljusgrå × 91 × 76 cm, `91f5c078`
   Mörkgrå × 205 cm och `c438d4ba` Guld × 50 × 110 cm. Det är undantag från exakt ägare och väntar på Leonards besked.
5. **Varukorgens, kassans och orderns bild är fortfarande färgens första foto för alla storlekar** (motorändringen (d) under *Kvar efter natten*). Elva sidor hade dessutom kvar
   foton under en kombination Aosom inte visar dem under, men rätt första bild (`harma-aldre-bilder.tsv`): sju är rättade 2026-10-28 och fyra lämnades, se *De elva
   Härma-sidorna som låg utanför* nedan.

☠️ **Wix-varukostnaden (`revenueDetails.cost`) saknas på 28 av de 30 sidorna, och på 2 633 produkter i katalogen (2026-10-24).** Den här rundan tappar
den inte (skriptet läser med `MERCHANT_DATA`, skickar kostnaden tillbaka och jämför den före och efter), men en skrivning av `options` och `variantsInfo` som är
läst UTAN `MERCHANT_DATA` gör det. Mätt på en dold testprodukt som raderades i samma körning (kostnad 50 och 60): läst utan fältet kommer kostnaden inte med
(`null`), efter en PATCH med formen i `lank-om-bilder.js` (`options` + `variantsInfo` + `visible`, ordagrant ur den läsningen) är den `null` på båda varianterna,
och en PATCH med `variantsInfo` ur en läsning med `MERCHANT_DATA` (och `profit`/`profitMargin` borttagna) gav 50 och 60 igen. Räkningen över hela katalogen
(`products/query-variants` med `fields: ["MERCHANT_DATA"]`, nio sidor om 1 000, 15 sekunder): 6 221 produkter och 8 644 varianter, 3 595 med kostnad.

| | alla med kostnad | delvis | ingen |
| :-- | --: | --: | --: |
| publicerade, en variant (3 961) | 2 249 | 0 | 1 712 |
| publicerade, flera varianter (1 185) | 3 | 331 | 851 |
| dolda, en variant (1 071) | 1 005 | 0 | 66 |
| dolda, flera varianter (4) | 0 | 0 | 4 |

Det påverkar bara Wix egen vinst- och marginalrapport. Husets lönsamhetsöversikt läser mappningens `landedCostSek` och är orörd, och inga priser, lager eller
kundsidor berörs. Verktygen som läser med `MERCHANT_DATA` (och skickar kostnaden tillbaka där de skriver `variantsInfo`) är `lib/aosom/sammanslagning.ts`, `lib/wix/variant-media.ts`,
`farg-forst.js`, `galleri-tillagg.js`, `skriv-storlekskort.js`, `variantbild-farg.js` och `harma-skriv.js`. Filer som skriver `variantsInfo` utan att nämna fältet
är bland andra `lib/aosom/bilder-bort.ts`, `fargbilder-kor.ts`, `livsbild.ts`, `remap-kollaps.ts`, `lib/polish/skrivplan.ts`, `lank-om-bilder.js`,
`skriv-fargbilder.js`, `bygg-agare.py` och rundornas skript (inte prövat fil för fil). **(1) är gjort och mergat (PR #779, 2026-10-28, FLAGGADE lärdom 233). (2) körs sedan 2026-10-28 14:29 UTC (se *Kostnaden skrivs in* nedan).** Leonard sa ja till båda
2026-10-27 (de sex punkterna), och ja till prov och hela svepet 2026-10-28:
(1) de verktygen läser med `MERCHANT_DATA` och skickar kostnaden tillbaka, så att fler sidor inte tappar den, och (2) kostnaden skrivs tillbaka på de 2 964
sidorna (2 633 utan och 331 med delvis) ur mappningens `landedCostSek`, torrt först och med samma före-och-efter-kontroll som resten.

☠️ **Prissynken är oberoende av fältet, men dess egen skrivfunktion tappar kostnaden på syskonvarianter (Leonards fråga 2026-10-24: *om vi inte gör något funkar
inte vår prissynk som den ska?*).** Synken räknar priset ur feeden och mappningens `landedCostSek` och jämför med butikens PRIS (`jamforelsePris`). Ingen kod i
`lib/` eller `app/` läser Wix `revenueDetails.cost`, utom `lib/wix/variant-media.ts`, som bär tillbaka den. Vercels logg 2026-10-24: priskörningen 15:20 UTC
granskade 3 500 sidor (stoppade på tidsbudget, 1 209 kvar) och skrev 5 priser, och 21:20 UTC fortsatte den från den sparade markören med 1 209 sidor, 0 priser och
0 kvar. 0 misslyckade och 0 varningar i båda, tillsammans 4 709 sidor, lika många som lagerkörningen 18:20 UTC.

Men `updateV3VariantPrices` (`lib/wix/v3-products.ts`, anropas av Aosom-synken, `/api/cron/price-repair` och `/api/admin/ae-prishojning`) läser produkten med
`fields=VARIANT_OPTION_CHOICE_NAMES` utan `MERCHANT_DATA` och skriver tillbaka hela `variantsInfo`. Varianter som inte står i anropet går därför tillbaka utan
kostnad, och varianten som står i anropet får kostnad bara om `costAmount` skickas (synken och prisreparationen gör det, AliExpress-prishöjningen 2026-09-13 skickade
den medvetet inte). Synken anropar funktionen en gång per variant som ska få nytt pris (`p.varianter` i `lib/aosom/sync.ts`), så på en flervariantssida behåller bara
den sist skrivna varianten sin kostnad. Det är härlett ur koden och ur testet ovan, inte mätt på en riktig sida, men det kan förklara en del av de 331 delvis
ifyllda sidorna och en del av de 732 AliExpress-produkterna. Takten är låg (5 prisskrivningar 15:20 UTC och 0 klockan 21:20) och det påverkar bara Wix vinst- och
marginalvisning, aldrig priset, lagret eller sidan.

Tre följder för den som tar fråga 5:

1. (a) ska också gälla `updateV3VariantPrices`, inte bara verktygen som redan nämns ovan.
2. (b) utan (a) ångras delvis av synken på sidor med flera varianter. Gör (a) först, och börja (b) med Aosom-sidorna: AliExpress-radernas `landedCostSek` är
   importtidens tal (se *AE-radernas kostnad FRYSER vid importen*) och skulle ge Wix en för bra vinstsiffra.
3. ☠️ **Läs inte med `MERCHANT_DATA` i `updateV3VariantPrices` utan återfall.** Motorns Wix-nyckel saknade `SCOPE.STORES.PRODUCT_READ_ADMIN` 2026-09-27 (403
   `NO_PERMISSION_TO_READ_MERCHANT_DATA`, se `lib/wix/variant-media.ts`), och `variantbild.yml` (skarp, run 40129592550, 2026-10-24 20:24 UTC) läste med fältet på
   30 av 30 sidor utan fel, så nyckeln har behörigheten nu. Men ett 403 skulle annars stoppa varje prisskrivning (synken, prisreparationen och prishöjningen) för
   ett kosmetiskt fält. Antingen faller läsningen tillbaka på dagens vid 403, eller så tas kostnaden ur mappningen, som `sammanslagning.ts` gör.

✅ Följd 1 och 3 är gjorda 2026-10-28: `updateV3VariantPrices` läser med `MERCHANT_DATA`, skickar kostnaden tillbaka på varje variant och faller tillbaka på dagens läsning
vid 403 (svaret säger då att kostnaden inte följde med), och verktygen i `lib/aosom/` och `tools/polish-gates/` som skriver `variantsInfo` gör likadant (`lib/wix/produkt-kostnad.ts`,
FLAGGADE lärdom 233). Följd 2, att skriva kostnaden på sidorna som saknar den, ligger på `main` sedan #779 och körs 2026-10-28 (se *Kostnaden skrivs in* nedan).

`products/query-variants` ger varianterna för hela katalogen på 15 sekunder (1 000 per sida, markör, `productId` går inte att filtrera på): `sku`, `visible`,
`optionChoices`, `price`, `media`, `productData` (produkt-id, namn, adress, synlighet) och med `MERCHANT_DATA` kostnaden. Det är den bulkväg till variant-SKU:erna
som raden om SKU-kollisionskollen (2026-09-07) säger saknas: en SKU-revision över hela katalogen är nio anrop, inte 5 527.
