#### Härma Aosom: samma bilder som Aosom har kopplat, på varje färg och storlek (Leonards uppdrag 2026-10-24)

Leonard 2026-10-24: *"kan vi inte bah härma aosom så samma bilder de kopplat på sin sida gör vi på vår"*. Cowork-chatten
läste i Leonards Chrome galleriet för varje färg och storlek på aosom.de, för de 30 publicerade Aosom-sidorna med två val
(130 kombinationer, svaret mottaget 18:15 UTC). Svaret bär Aosoms artikelnummer och adresser och ligger bara hos Leonard och i
en privat scratchpad. Planen i repot bär bara Wix fil-id, svenska alt-texter och valens namn.
Rundan, planen, tabellerna och kontrollerna står i `tools/polish-assets/runda-harma-aosom/README.md`.

**Utfall (skrivet 19:56–20:22 UTC, varukorgens bild 20:24 UTC):** 356 foton på 30 sidor, 90 till uppladdade men inte placerade.
Bilderna i de 130 vyerna gick från 650 till 1 016 (snitt 5,0 → 7,8). 122 kombinationer fick fler bilder, 8 lika många och ingen
färre. Under fyra bilder: 16 → 2 (hundgrinden `8018bb95` Vit × 75–82 cm och dörrgrinden `a64af3a4` Vit × 75–95 cm, tre var).
Fyra eller färre: 36 → 4. Kontrollerat i butikens data (30 av 30 sidor), i en webbläsare (130 av 130 kombinationer), mot Wix
variantbild (30 av 30) och med skyddskoll (356 av 356 nya filer; 1 292 av 1 293 äldre, och den som saknas är fotot som Leonard
bad oss ta bort på cykelkärran `1004b036`).

Åtta egenskaper som inte ska tas bort:

1. **Ett foto är en post, och ägaren är en rektangel.** Samma foto i flera artiklars gallerier (md5, 96 × 96-pixlar och dHash)
   klustras till ett foto. Fotots ägare är färgerna × storlekarna i de kombinationer där Aosom visar det, och en axel som är helt
   täckt tas bort. Ett foto för alla storlekar i en färg ägs alltså av färgen.
2. ☠️ **Wix tar högst 15 länkade bilder per val** (mätt 2026-10-24: 15 gick, 16 till 21 gav `400 … optionSettings.choicesSettings is
   invalid`). Galleriets tak är 50, och det här är ett annat tak som varken `lib/wix/limits.ts` eller dokumentationen nämner. Ett
   foto som tillhör en färg OCH en storlek räknas mot båda valen, så på en sida med två färger och tre storlekar ryms 15 nya foton
   totalt. `harma-skriv.js` räknar varje vals länkar före skrivningen (`LANKTAK`) och tappar det som inte ryms: det foto vars
   borttagning lämnar sina kombinationer bäst försörjda med nya foton, och vid lika det sista i planen.
3. ☠️ **Ingenting gammalt får ändras.** Skriptet simulerar butikens regel (`imageKopplingar`, mätt mot sidodata: 47 av 47 antal och
   47 av 47 första bilder) före skrivningen, och avbryter allt innan något skrivs om en gammal bilds vy eller en kombinations första bild
   skulle ändras (`vy`, `forsta`). En gammal bild som skulle byta synlighet när ett nytt foto får en länk (en kombination utan kopplad bild
   visar hela galleriet, och en olänkad bilds alt-text kan göra den till en färgs bild) länkas uttryckligen till sina nuvarande val (pinnas),
   förstabilderna först. Går inte det inom 15 länkar avbryts allt (`tak`). ⚠️ Regeln lämnade de äldsta fotona på varje sida som färgfoton,
   och soptunnan visade därför fel storlek: se *Härma lämnade de äldsta fotona som färgfoton* nedan.
4. ☠️ **Skrivningen går i två steg och går att köra om.** Galleriet först (ensamt, med alt-texterna), sedan `options` och `variantsInfo`
   ordagrant ur produktens egen GET med bara de val som ändrats och `visible` med, och efter varje steg en återläsning. Ligger planens filer
   redan sist i galleriet (en halvskriven sida) känns de igen (`atertag`) och bara länkarna skrivs. Efteråt jämförs galleriet, alt-texterna,
   valens länkar, optionernas ordning, varianternas id, SKU, pris, kostnad och synlighet, namn, adress, produktens synlighet och lagret.
5. ☠️ **Ett nytt foto som skulle flytta en gammal förstabild avvisas.** På projektorduken `926ec7a2` avbröt skriptet före skrivningen
   (`forsta`): pinningen av ett Vit × 85-foto gjorde att Vit × 99 tums första bild bytte. De två Vit × 85-fotona utelämnades ur planen
   i stället för att listorna omordnades, för Wix räknar varukorgens bild ur första bilden i första valet som har kopplade bilder.
6. ☠️ **Variantbilden nollställs av skrivningen** (lärdom 169, 204, 210), och `variantbild.yml` ska köras direkt efter med `ids` och
   `lage=skarp` (30 kontrollerade, 30 rättade, 0 avvikelser, 38 sekunder). En torrkörning efteråt är kvittot (30 redan rätta).
7. ☠️ **Svaret och loggen bär bara Wix-id, de sex första tecknen i fil-id och räknare.** Aldrig alt-texter, namn eller adresser.
   Alt-texterna kontrolleras mot en förbudsregex (märken, adresser, leverantörsord) före skrivningen, och planens FNV-1a-summa räknas
   om i samma anrop som skriver (ett avskriftsfel avbryter allt).
8. **Skrivningen går utanför Aosoms synkfönster** (xx:12–xx:29 UTC vid 00, 03, 06, 09, 12, 15, 18 och 21) och högst fem sidor per
   `ExecuteWixAPI`-körning (skriptet hoppar över resten efter 36 sekunder och ber om en omkörning).

Verktygen (`tools/polish-gates/`):

- `bygg-harma.py <plan.json> <ut.js> [--ids id8,…] [--torr] [--kompakt]` bäddar in planen i `harma-skriv.js`. `--torr` ersätter alt-texterna
  med platshållare (torr och skarp har därför olika kontrollsumma) och skriver ingenting.
- `harma-kolla.py <plan> <slugs.txt> <fore-katalog> --katalog DIR [--hamta] [--tappade tappade.json] [--live DIR]` kontrollerar butikens
  sidodata mot planen: filerna (exakt de tappade saknas), alt-texterna, synligheten för varje ny fil i varje kombination, gamla bilders vy,
  varje variants första bild och antal per kombination (före → efter). Med `--live` jämförs också webbläsarens galleri.
- `harma-live.sh <slugs.txt> <utkatalog>` mäter sidorna i en riktig webbläsare, en kombination i taget (tre sidor åt gången, 2,5 minuter för 30).
- Före-läget är `kk.sidodata` sparad som JSON per sida (`sida_<id8>.json`) och måste hämtas FÖRE skrivningen.

Kvar efter rundan:

- **90 foton ryms inte** (`tappade.json`). De ligger uppladdade i Media Manager (bildstädningen är avstängd sedan #773) och kan skrivas om någon gör
  plats. Verktyg som länkar alla en färgs bilder till färgen (`lib/aosom/fargbilder-kor.ts`, `sammanslagning.ts`, `livsbild.ts`) möter samma tak: en
  färg med 15 länkade bilder kan inte ta emot en till. Det är inte prövat per verktyg, och det förväntade felet är ett 400 från Wix, inte en tyst förlust.
- **`233c83cf` skrevs med den första, enklare tappregeln** (det sista i planen först) och 74–94 cm fick därför bara en bild till (Vit 5 → 5, Svart 4 → 5).
  Sidan är inte omskriven, för skriptet tar aldrig bort en bild.
- **Åtta kombinationer fick inga nya foton** och två står på tre bilder, se README.
