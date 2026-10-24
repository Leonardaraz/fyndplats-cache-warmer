# Härma Aosom: samma bilder som Aosom har kopplat, på varje färg och storlek (2026-10-24)

Leonard 2026-10-24: *"kan vi inte bah härma aosom så samma bilder de kopplat på sin sida gör vi på vår"*.
Cowork-chatten läste i Leonards Chrome galleriet för varje färg och storlek på aosom.de, för de 30 publicerade
Aosom-sidorna med två val (130 kombinationer). Svaret (`aosom_varianter_rad1_130.json`, mottaget 18:15 UTC) bär Aosoms
artikelnummer och adresser och ligger bara hos Leonard och i en privat scratchpad. **Inget av det finns i det här
katalogen**: planen här bär bara Wix fil-id, svenska alt-texter och valens namn.

Beskrivningen av egenskaperna som inte ska tas bort står i `CLAUDE.md`, *Härma Aosom*. Lärdomarna är 217–222 i
`tools/polish-gates/FLAGGADE.md`.

## Utfall

| | |
| :-- | --: |
| sidor / kombinationer (färg × storlek) | 30 / 130 |
| distinkta Aosom-foton på sidorna (samma foto i flera artiklars gallerier räknas en gång) | 1 446 |
| varav fanns redan i galleriet / möjliga (bedöms med ögat) / nya | 418 / 29 / 999 |
| valda efter granskning (text, märke, lagerfoto, fel färg och dubbletter ströks) | 448 |
| utelämnade före skrivningen (se nedan, `926ec7a2`) | 2 |
| i planen (`plan.json`) | 446 |
| **skrivna: ligger i galleriet, med alt-text, länkade till rätt färg och storlek** | **356** |
| tappade av Wix tak på 15 länkade bilder per val (`tappade.json`), uppladdade men inte placerade | 90 (på 12 sidor) |
| bilder i vyerna, summa över de 130 kombinationerna | 650 → 1 016 (snitt 5,0 → 7,8) |
| kombinationer med fler bilder / lika många / färre | 122 / 8 / 0 |
| kombinationer under fyra bilder | 16 → 2 |
| kombinationer med fyra bilder eller färre | 36 → 4 |

De två kombinationer som står kvar på tre bilder är Vit × 75–82 cm på hundgrinden `8018bb95` (2 → 3) och Vit × 75–95 cm
på dörrgrinden `a64af3a4` (3 → 3). Aosom har inga fler rena foton för dem.

Uppladdningen gjordes 19:16–19:31 UTC (högst tolv adresser per anrop: Aosoms bildserver svarar 429 på fler, och ordningen i
uppladdningens svar är ingen bevisning, så varje fil hämtades hem från Wix CDN och paras med sin kandidat på md5). Skrivningen
gjordes 19:56–20:22 UTC, utanför Aosoms synkfönster (xx:12–xx:29 UTC vid 18 och 21). Variantbilderna rättades 20:24 UTC.

## Per sida

| sida | namn | kombinationer | nya foton | tappade (tak 15) | galleri | bilder per kombination före → efter |
| :-- | :-- | --: | --: | --: | --: | :-- |
| `0136e7d9` | Förvaringsmöbel för barnrummet med utdragbar… | 4 | 11 | 0 | 16 → 27 | 3–5 → 6–8 |
| `01ac2f63` | Höjd hundbädd med tak och UV-skydd | 6 | 14 | 0 | 17 → 31 | 2–4 → 4–7 |
| `13fe619f` | Hamsterbur i trä med akrylfront och uppfällb… | 3 | 7 | 0 | 15 → 22 | 5–5 → 7–8 |
| `14fb0f98` | Kantskydd till studsmatta – 15 mm stoppning | 4 | 8 | 0 | 14 → 22 | 6–8 → 8–10 |
| `1d4eb6b1` | Matstation för hund med två rostfria skålar | 6 | 9 | 4 | 27 → 36 | 5–6 → 6–8 |
| `233c83cf` | Dörrgrind för hund av järn – justerbar bredd… | 6 | 18 | 12 | 12 → 30 | 4–7 → 5–10 |
| `351d244c` | Matta med abstrakt mönster i mjuk polyester | 5 | 19 | 3 | 10 → 29 | 5–5 → 6–12 |
| `38f70f83` | Låg odlingstunnel med nätfönster – 45 cm hög | 4 | 17 | 1 | 12 → 29 | 4–6 → 8–11 |
| `3b868848` | Fällbart skrivbord på hjul med hylla och sid… | 5 | 15 | 12 | 18 → 33 | 2–6 → 6–9 |
| `44d4907b` | Kantskydd till studsmatta – skumstoppning | 4 | 5 | 0 | 12 → 17 | 5–5 → 7–8 |
| `4a2ab58e` | Vedbod i galvaniserat stål – upphöjd botten… | 3 | 10 | 0 | 17 → 27 | 5–10 → 10–12 |
| `4d9ba658` | Kattrappa med klösstolpar och boll – tre ell… | 6 | 15 | 16 | 18 → 33 | 3–5 → 6–7 |
| `543b9076` | Hundtrappa för små hundar och katter – avtag… | 6 | 13 | 7 | 27 → 40 | 4–7 → 7–9 |
| `5466fe81` | Tunnelväxthus med uppvikbara sidoväggar | 3 | 8 | 0 | 15 → 23 | 5–8 → 8–11 |
| `6d35a04f` | Hinderset med koner för hund – låga hinder i… | 3 | 5 | 0 | 13 → 18 | 4–6 → 6–7 |
| `75a38b7b` | Fiberoptisk julgran med stjärna | 3 | 7 | 0 | 10 → 17 | 4–5 → 5–10 |
| `79ab08fe` | Bokhylla i trädform med lutande hyllplan och… | 4 | 17 | 2 | 13 → 30 | 2–5 → 7–9 |
| `7bc96b8f` | Upphöjd hundbädd med avtagbart tak | 5 | 16 | 4 | 12 → 28 | 5–7 → 7–11 |
| `7d1fb82b` | Konstgjorda buxbomsklot 2-pack | 3 | 10 | 0 | 13 → 23 | 5–7 → 7–12 |
| `8018bb95` | Hundgrind med liten husdjursdörr – justerbar… | 4 | 11 | 0 | 13 → 24 | 2–5 → 3–10 |
| `8901f76d` | Justerbar viktväst med 38 avtagbara viktpåsar | 3 | 13 | 0 | 10 → 23 | 5–5 → 8–12 |
| `91f5c078` | Hammocköverdrag i oxfordtyg – blixtlås och s… | 7 | 18 | 0 | 21 → 39 | 5–6 → 5–11 |
| `926ec7a2` | Manuell projektorduk i format 1:1 | 3 | 5 | 0 | 15 → 20 | 5–9 → 8–11 |
| `92fc308c` | Sensorsoptunna i rostfritt stål med mjukt st… | 6 | 14 | 6 | 16 → 30 | 4–5 → 7–7 |
| `934297b1` | Upphöjd hundsäng med tak i tre storlekar | 4 | 15 | 0 | 13 → 28 | 4–6 → 7–11 |
| `a64af3a4` | Dörrgrind för hund med klämmontage | 3 | 4 | 0 | 12 → 16 | 3–6 → 3–8 |
| `aafbf543` | Verktygslåda 51 cm i stål med hänglåsöglor –… | 4 | 17 | 4 | 14 → 31 | 3–6 → 8–10 |
| `c3d1fa41` | Hopfällbar upphöjd hundbädd med stålram och… | 3 | 8 | 0 | 13 → 21 | 3–6 → 7–8 |
| `c438d4ba` | Väggspegel med spröjs i nio fält | 6 | 15 | 19 | 15 → 30 | 2–5 → 4–8 |
| `c841717c` | Soptunna med 3 fack i rostfritt stål | 4 | 12 | 0 | 13 → 25 | 5–6 → 7–11 |
| | **summa** | **130** | **356** | **90** | 446 → 802 | **650 → 1 016** |

`kombinationer.tsv` har antalet per kombination, `plan.json` varje fil med alt-text och ägare, `tappade.json` de fil-id (sex
första tecknen efter `b379ce_`) som Wix tak stoppade.

## Arbetsgång

1. **Underlag.** Cowork-svaret: en rad per kombination med galleriets bildadresser i den stora storleken. Samma foto ligger i flera
   artiklars gallerier och kluster­as till ETT foto (md5, 96 × 96-pixlar och dHash), som ägs av alla kombinationer där Aosom visar det.
2. **Jämförelse mot sidans galleri** (418 fanns redan) och **granskning med ögonen** på kontaktark, med OCR före: tysk eller engelsk text,
   märke eller logotyp som motiv, lagerfoto, en annan färg än kombinationens, tillbehör sidan inte säljer och dubbletter ströks.
   Text på rekvisitan och märken som sitter tryckta på varan stryks inte (runbooken). Alt-texterna skrevs på svenska utan märken och adresser.
3. **Ägare = rektangel.** Ett fotos ägare är färgerna × storlekarna i de kombinationer där Aosom visar det. En axel som är helt täckt
   tas bort, så ett foto som Aosom visar för alla storlekar i en färg ägs av färgen.
4. **Uppladdning** (högst tolv per anrop) och md5-parning mot de lokala filerna.
5. **Skrivning** med `harma-skriv.js` (byggt av `bygg-harma.py`, högst fem sidor per ExecuteWixAPI-körning): torrt först, sedan skarpt.
6. **Variantbilderna** nollställs av skrivningen och rättas direkt efter med `variantbild.yml` (`ids`, skarp): 30 kontrollerade, 30 rättade,
   0 avvikelser (run 40129592550, 20:24 UTC). Torr efteråt (run 40130258901, 20:33 UTC): 30 redan rätta, 0 kvar.
7. **Kontroller**, se nedan.

### Verktygen (alla i `tools/polish-gates/`)

| fil | gör |
| :-- | :-- |
| `harma-skriv.js` | ExecuteWixAPI-funktionen: läser sidan, simulerar butikens regel före och efter, lägger till filerna sist i galleriet med alt-text, länkar dem och läser tillbaka allt. Torrt läge skriver ingenting. |
| `bygg-harma.py <plan.json> <ut.js> [--ids id8,…] [--torr] [--kompakt]` | Bäddar in planen och dess FNV-1a-kontrollsumma i skriptet. `--torr` ersätter alt-texterna med platshållare, så torr och skarp har olika summa. |
| `harma-kolla.py <plan> <slugs.txt> <fore-katalog> --katalog DIR [--hamta] [--tappade tappade.json] [--live DIR]` | Kontrollerar butikens sidodata mot planen (sju kontroller, åtta med `--live`). Exit 1 vid avvikelse. |
| `harma-live.sh <slugs.txt> <utkatalog> [id8 …]` | Mäter sidorna i en riktig webbläsare, en kombination i taget, tre sidor åt gången (2,5 minuter för 30 sidor). |

## Kontroller (2026-10-24, efter sista skrivningen och variantbilderna)

| kontroll | utfall |
| :-- | :-- |
| varje skrivning återläst (galleri, alt-texter, valens länkar, optionernas ordning, varianternas id, SKU, pris, kostnad och synlighet, namn, adress, lager) | 30 av 30 sidor, 0 avvikelser |
| `harma-kolla.py`, butikens egen sidodata 20:28 UTC (cache `HIT`, `age` 142–147 s, efter variantbildskörningen): filerna, alt-texterna, synlighet för varje ny fil i varje kombination (356 × 130), gamla bilders vy, förstabild | 30 av 30 sidor utan avvikelse |
| webbläsare (`harma-live.sh`, 20:30–20:32 UTC): bilderna per kombination, första bilden, ordningen | 130 av 130 kombinationer lika med butikens modell |
| varukorgens bild (Wix variantbild) | 30 av 30 sidor rätt (`variantbild.yml` torr) |
| skyddskoll för de 356 nya filerna (`bygg-skyddskoll.py`) | 356 av 356 i galleriet, i städningens egen tolkning och kvar i Media Manager (`OK`, `READY`), alla från leverantören; största galleriet 40 |
| skyddskoll för alla tidigare färgbildsrundor (437 sidor, 1 293 filer) | 1 292 av 1 293. Den som saknas är fotot med den tyska skylten på cykelkärran `1004b036` (Svart), som Leonard bad oss ta bort (Cowork-rundan, omgång 2, punkt 6) och som fortfarande står i en gammal `tillagg.json` |
| stickprov med bilder på tre sidor (väggspegeln, skrivbordet och soptunnan, en rad per kombination med nya foton ringade) | svarta speglar och skrivbord under Svart, guld och vit under sina färger, silvertunnor under Silver |

## Det som inte blev som man önskat

- **90 foton ryms inte.** Wix tar högst 15 länkade bilder per val (CLAUDE.md, *Härma Aosom*, punkt 2). På en sida med två färger och tre
  storlekar (väggspegeln `c438d4ba`) är det 15 nya foton totalt, för varje foto ligger på både sin färg och sin storlek. De tappade fotona
  ligger uppladdade i Media Manager (bildstädningen är avstängd sedan #773) och kan skrivas senare om någon gör plats.
- **`233c83cf` skrevs med den första, enklare tappregeln** (det sista i planen först). Den gav 74–94 cm bara en bild till (Vit 5 → 5, Svart 4 → 5).
  Den balanserade regeln, som resten av sidorna fick, hade fördelat om fotona. Sidan är inte omskriven, för skriptet tar aldrig bort en bild.
- **`926ec7a2` (projektorduken):** två foton för Vit × 85 tum utelämnades ur planen. Att länka det ena (för att det skulle synas under rätt kombination)
  hade fått Vit × 99 tums första bild att byta, och skriptet avbröt före skrivningen (`forsta`). Inget skrevs.
- **Åtta kombinationer fick inga nya foton** (matstationens Grå × 58,4 × 30,5 cm, hundbäddens Grå × 92 × 76 cm, julgranens Vit × 120 cm,
  dörrgrindens Vit × 75–95 cm, projektorduken Vit × 85 tum, hindersetets Blå och gul × 6 hinder, järngrindens Vit × 74–94 cm och hammockens
  Mörkgrå × 205 cm). Orsaken är per kombination antingen att granskningen inte lämnade något nytt foto kvar eller att taket tappade det.
  Ingen kombination fick färre bilder.

## Obeslutat: Wix-varukostnaden

Under arbetet syntes att varukostnaden (`revenueDetails.cost`) saknas i Wix på 28 av de 30 sidorna. Den här rundan tappar den inte
(skriptet läser med `MERCHANT_DATA`, skickar kostnaden tillbaka och jämför den före och efter, och den var oförändrad på alla 30), men
tidigare skrivningar utan `MERCHANT_DATA` gör det. Mekanismen är mätt på en dold testprodukt, och hela katalogen är räknad
(`CLAUDE.md`, *Härma Aosom*, och lärdom 220 i `FLAGGADE.md`). Ingenting är rättat; beslutet är Leonards.
