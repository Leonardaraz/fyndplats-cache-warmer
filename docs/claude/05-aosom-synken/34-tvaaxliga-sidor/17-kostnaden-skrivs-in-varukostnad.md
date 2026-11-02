#### Kostnaden skrivs in: `/api/admin/varukostnad` (punkt 5b, körd 2026-10-28)

Följd 2 ovan är byggd, testad och mutationsprövad och ligger på `main` sedan #779 (2026-10-28, 12:30 UTC). Rutten och workflowen måste finnas i produktion
(`workflow_dispatch` kör `main` som default). Workflowen heter **"Varukostnad — fyll i kostnaden på Aosom-varianter som saknar den"** (`varukostnad.yml`, lägena `torr` ·
`skarp`) → `/api/admin/varukostnad` → `lib/wix/varukostnad.ts` (planen, skrivningen, svepet) och `lib/wix/synkfonster.ts`. Torrt som default.

Nio egenskaper som inte ska tas bort:

1. ☠️ **Bara Aosom, med ett positivt filter** (`isAosomMapping`, aldrig "allt utom AliExpress"). AliExpress-radernas `landedCostSek` är importtidens tal och fryser, så ett
   skrivet tal hade gett Wix en för bra vinstsiffra. Ett annat värde på `leverantor` är 400, så att en tredje leverantör är ett beslut och ingen tyst följd. Pensionerade
   och raderade rader hoppas över.
2. ☠️ **En befintlig kostnad skrivs aldrig över**, varken i planen (`redanKostnad`) eller i skrivningen, som läser produkten färskt och räknar om vad som saknas: en kostnad
   som skrivits mellan planen och skrivningen ger `redan_klar`. Modulen fyller luckor och är ingen prisreparation.
3. ☠️ **Värdet är mappningens `landedCostSek.toFixed(2)`**, samma tal som importen skriver. Noll, minus och saknat tal ger ingen kandidat (`utanMappningskostnad`).
4. ☠️ **Skrivningen är en `products`-PATCH med varianterna ordagrant ur produktens egen GET (`fields=MERCHANT_DATA`)**, bara med kostnaden ifylld på de varianter som
   saknar den, och `visible` och `options` med (annars publicerar en variantsInfo-PATCH ett utkast, och en flervariantsprodukt ger 428). Priset hämtas aldrig ur planen: ett
   pris som prissynken skrivit mellan planen och skrivningen hade annars skrivits över med det gamla. Nekas `MERCHANT_DATA` (403) skrivs ingenting, för en skrivning som inte
   kan läsa kostnaden ersätter varianterna utan den, och det är felet som ska bort.
5. ☠️ **Före-och-efter-kontrollen stoppar vid minsta avvikelse.** Produkten läses om tills revisionen gått fram (Wix läsning släpar efter skrivningen), och allt utom kostnaden på
   de skrivna varianterna ska vara lika: namn, adress, synlighet, val, variant-id, SKU, pris, jämförpris, kostnaden på de andra varianterna och lagret. Belopp jämförs som tal
   (`1099.40` och `1099.4` är samma). Föll kontrollen efter skrivningen vet vi inte vad Wix har, och det är också en avvikelse.
6. ☠️ **Flervariantsprodukter får variantbilden uppföljd** (`refreshVariantMedia` med revisionen som skrevs), eftersom en skrivning med val-id nollställer variantens bild
   (lärdom 204 och 234). En avvikelse därifrån stoppar också.
7. ☠️ **Godkännandet är planens antal.** Första skarpa varvet kräver `bekrafta` = torrkörningens `totalt`, följande varv `hogst` = förra varvets `aterstod`, och planen får krympa
   men aldrig växa (samma form som *Pensionerade utkast raderas efter fjorton dygn*). Det finns ingen kör-allt-flagga. `ids` (högst 60 Wix-id) tar ett litet prov, och
   `bekrafta` gäller då deras antal. Svepet stannar vid första avvikelse och efter fem fel i följd (ett nekat `MERCHANT_DATA` fäller varje produkt), och markören (`efter`) är
   sista behandlade produktens id, så att en produkt som alltid faller inte ligger först i varje skiva.
8. ☠️ **Aldrig inne i Aosoms synkfönster** (`lib/wix/synkfonster.ts`: :12–:29 UTC var tredje timme, 00, 03 … 21). Skrivaren jämför lagret före och efter varje produkt, så en
   synkskrivning mitt i hade stoppat körningen. Rutten vägrar skarpt där (409, `vantaTillUtc`), kortar tidsbudgeten så att varvet slutar 30 sekunder före nästa fönster och
   vägrar när det inte ryms 45 sekunder. Workflowen väntar ut fönstret (från :10) och försöker om skivan om rutten ändå säger nej. Regeln stod förut bara här och i varje
   workflows egen bash-funktion, och en regel man måste komma ihåg glöms bort.
9. ☠️ **Svaret bär bara Wix-id och räknare**, eftersom workflowens logg är publik: inga kostnader, artikelnummer, namn eller sluggar. Wix felkroppar kan eka värdet som
   skickades, så decimaltal och artikelnummer redigeras (`redigeraFeltext`) i modulen, i rutten och en gång till i workflowen.

**Körordning** (alla tre med `lage=torr` först, och bara utanför synkfönstret när det blir skarpt):

1. `torr`: läs `totalt` och räknarna. `utanKatalogvariant` och `utanMappningskostnad` ska vara små, och `redanKostnad` rörs aldrig.
2. Ett prov med `ids`: en publicerad flervariantsprodukt, ett dolt utkast och en enkel produkt, `bekrafta` = 3. Läs tillbaka i Wix (kostnad, pris, SKU, synlighet, lager och
   variantbild) och kontrollera live att sidan och varukorgens bild är oförändrade.
3. Hela svepet med `bekrafta` = torrkörningens antal. Mätt 2026-10-28: ungefär 1 minut 55 sekunder per skiva om 40 produkter, utanför synkfönstren.

**Utfall 2026-10-28 (Leonards *ja prov och hela*, FLAGGADE lärdom 255–258).** Hela svepet skrev **2 168 produkter och 3 373 varianter** i fem körningar mellan 14:29 och 16:37 UTC, utan en enda
riktig avvikelse i kostnaden (fyra variantbilder behövde rättas efteråt, punkt 4). Kvitton: torrkörningen efteråt ger *PLAN: 0 produkter* och 6 299 av 6 299 varianter i aktiva Aosom-mappningar har en kostnad; antalet varianter med kostnad i hela katalogen
(`products/query-variants` med `MERCHANT_DATA`) steg med exakt de 1 881 som torrkörningen 15:10 sa skulle återstå (5 130 → 7 011 av 8 792); delvis ifyllda produkter är noll (var 331). Kvar utan
kostnad är 886 produkter (1 781 varianter): AliExpress-sidor och pensionerade eller saknade mappningar, som modulen aldrig rör.

Fyra saker att ta med vid nästa sådan körning:

1. ☠️ **Svepet stannade fyra gånger, alltid på ett övergående läsproblem, och stoppet är rätt även då:** fem Wix 500 i rad, en Wix 503 på läsningen efter skrivningen (`75e1a5b6`) och två gånger
   variantbildsuppföljningens egen före-och-efter-jämförelse när EFTER-läsningen släpade (`97b5e7e9` och `c5541fef`: *revisionen gick inte fram*, så kostnaden såg ut att ha försvunnit). Läs
   produkten i Wix innan du startar om, för stoppraden ser likadan ut för ett läsproblem och en riktig avvikelse. Omstarten är torr, läs `PLAN: N produkter`, skarp med `bekrafta` = N (planen får
   krympa men aldrig växa, och produkten som stoppade körningen är redan skriven, så N är ett färre än *kvar* i stoppraden).
2. **En pågående körnings logg går inte att läsa** (404 tills jobbet är klart). Följ den i Vercels runtime-logg: `skarpt: planen` ger en rad per skiva, `avvikelse` orsaken.
3. ✅ **Kontrollen efter skrivningen läser lagret med POST, och `skapaWixAnrop` försökte bara om GET** (`lib/polish/skrivplan-wix.ts`, används av ungefär femton rutter). En övergående 503 där blev en
   avvikelse. Lagat 2026-10-28 (Leonards ja): en POST vars sökväg slutar på `/query`, `/search` eller `/query-variants` (frågesträngen oräknad) försöks om som en GET, tre försök med 1 och 3
   sekunders paus på 429, 5xx och nätverksfel. ☠️ En skrivande POST och en PATCH försöks ALDRIG om (en bulk-POST kan ha gått igenom fast svaret uteblev), och en sökväg som har `/query`
   mitt i adressen räknas inte. Varje återförsök loggas som `[wix-anrop] försöker om <metod> <sökväg> (<felets början>)`. `lib/polish/skrivplan-wix.test.ts` låser det (35 tester, åtta
   mutationer fälldes av rätt test). Det löser stopp 2 men inte stopp 3 och 4, där läsningen svarade 200 med ett äldre läge. Katalogsvepets och sökningens egna återförsöksslingor
   (`variantbild-koll.ts`, `livsbild.ts`) ligger kvar som yttre lager. ✅ Mergad 2026-10-28 20:31 UTC (#789, squash `19f464ee`, Leonards *merga 789*): motorbygget `READY` på 182 s, butiksbygget `CANCELED` med
   `#ignored-build-step` (efter 8,5 minuter, mest kloning) och butikens cache orörd (lärdom 261). ⚠️ Obevisat i drift tills en rad `[wix-anrop] försöker om` syns i runtime-loggen följd av att körningen går igenom (felet var sällsynt, så det kan dröja).
4. ☠️ **Kör `variantbild.yml` torr över hela katalogen efteråt, för uppföljningen kan missa.** Kontrollen 2026-10-28 (1 210 flervariantsprodukter, 30 minuter) fann 1 206 rätta och **fyra där variantbilden (varukorgens, kassans och orderns bild) var huvudbilden på 6 varianter** (`96451d83`, `973e6901`, `97b1d071` och `c519b4fe`). Alla fyra skrevs av svepet under de två minuter där Wix läsning släpade och som slutade i stopp 3 och 4 (15:53 och 16:12), och uppföljningen loggade ingen rättning för dem: den såg bilderna som rätta, och Wix nollställde dem därefter. Orsaken är inte bevisad, men mönstret talar för läsfördröjning. De rättades med `variantbild.yml` skarp på just de fyra (4 av 4 rättade, 0 avvikelser) och lästes tillbaka: variantbilden är färgens första foto på varje variant, kostnad på alla, priserna orörda. Nattens `/api/cron/variantbild` (05:35 UTC) hade rättat dem också, men då hade varukorgen visat fel färg i ungefär tolv timmar.

⚠️ **Varje skrivning ändrar produktens `updatedDate`**, och butikens cron `uppdatera-andrade` (var femte minut) bygger då om sidan (ISR-skrivning). Mätt under svepet i butikens runtime-logg: 177
respektive 236 ändrade sidor i två fönster (före svepet 4 till 9), och cron-jobbet värmde 120 per körning utan fel. Kostnaden i kronor är inte mätt.
