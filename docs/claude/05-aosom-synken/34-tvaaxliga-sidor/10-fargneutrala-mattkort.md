#### Färgneutrala måttkort på 16 sidor: alla färger på samma kort (Leonards skärmbilder 2026-10-23 06:47 svensk tid)

Leonard skickade två skärmbilder av matstationen `1d4eb6b1` och skrev *"Såg direkt fel på första produkten ku"*: måttbilden med den espressofärgade stationen visades under Grå och Vit. Det var den halva av felet som ägarlistorna
i *De 16 sidorna rättade* lämnade kvar. Butikens vy är unionen av de oägda bilderna och bilderna som ägs av de valda valen, så en måttbild som ägs av en storlek visas under varje färg i den storleken, också när den föreställer en annan
färg. Ägarlistorna lät sådana bilder ligga kvar (*Måttbilder med färgens motiv ägs av storleken*, lärdom 147, frågan låg hos Leonard), och skärmbilderna besvarar den: en bild på en viss färgs vara ska inte visas under en annan färg.
Det är min tolkning av hans rad, och jag byggde om alla sidor efter den. *Gemensamma bilder får delas* (Leonard, 03:0x UTC) gäller bilder som stämmer för alla färger, och ett kort med alla färger bredvid varandra gör det.

**Mätningen före** (`matning-2026-10-23.txt`, butikens sidodata på de 18 sidor som rättats under natten med ägarlistor, kort eller optionsordning): 16 sidor hade 31 bilder som visade en färg men syntes under en annan. De två andra,
hammocken och soptunnan, hade redan färgneutrala kort.

**Lagningen, en sida i taget** (mandatet är Leonards *Fixa alla 16 en i taget med visuell kontroll på varje bild*):

1. Ett kort per storlek, byggt som soptunnans och hammockens kort (`kort.tsv`, `gate-kort.py`, `bygg-kort.py`), men med ett hjältefoto som är en komposition av ett packshot per färg, sida vid sida (`bygg-hjaltar.py` ur `hjaltar.tsv`,
   som pekar på de exakta Wix-filerna, med layout `2`, `3`, `2,1` eller `1`). Förvaringskistans hjälte byggs av `bygg-hjalte-kista.py`, eftersom den vita kistan bara finns som miljöfoto. Talen i korten kommer ur sidans egen text
   (`kallor-tal.json`). Väggspegelns 50 × 110 cm saknar guldfoto i galleriet, så kortet visar den svarta spegeln ensam och alt-texten säger att den finns i guld.
2. Korten laddas upp (md5-parat mot de lokala filerna), läggs sist i galleriet (`galleri-tillagg.js`, planerna byggs av `planer.py`) och ägs av sin storlek (`bygg-agare.py`, specarna byggs av `agare.py` ur galleriet före,
   `kortfiler.json` och planen).
3. De gamla färgspecifika måttbilderna tas bort efteråt med `bilder-bort.yml` (torrt, sedan skarpt med planens sha), så att ingen vy någonsin saknar måttbild eller visar en bild utan ägare.
4. Variantbilderna rättas av motorn i samma körning: `bilder-bort.yml` loggade `[variantbild] <id>: N varianter rättade` för alla 14 sidor (31 varianter, 05:35 UTC) och för förvaringskistan (2 varianter, 05:47 UTC), mätt i Vercels
   runtime-logg. Det är `lib/wix/variant-media.ts` (mergad 04:25 UTC) som rättar sidor med länkar på båda optionerna.

**Utfall, mätt 05:35–06:01 UTC** (`kort` = nya måttkort, `borta` = borttagna färgspecifika måttbilder, `minsta vy` = minsta antal bilder i en vy):

| sida | kort | borta | galleri efter | minsta vy |
| :-- | --: | --: | --: | --: |
| matstationen `1d4eb6b1` | 2 | 2 | 27 | 8 |
| kattrappan `4d9ba658` | 2 | 2 | 16 | 5 |
| hundbädden `c3d1fa41` | 1 | 1 | 11 | 5 |
| kantskydden `44d4907b` | 1 | 1 | 12 | 5 |
| odlingstunneln `38f70f83` | 2 | 2 | 11 | 5 |
| julgranen `75a38b7b` | 1 | 1 | 10 | 4 |
| väggspegeln `c438d4ba` | 3 | 4 | 14 | 6 |
| hundsängen med tak `934297b1` | 1 | 1 | 12 | 4 |
| hundbädden med tak `01ac2f63` | 1 | 1 | 17 | 5 |
| sensorsoptunnan `92fc308c` | 3 | 3 | 15 | 7 |
| vedboden `4a2ab58e` | 1 | 1 | 17 | 5 |
| tunnelväxthuset `5466fe81` | 1 | 2 | 14 | 5 |
| bokhyllan `79ab08fe` | 2 | 3 | 12 | 6 |
| skrivbordet `3b868848` | 2 | 4 | 16 | 5 |
| buxbomsklotten `7d1fb82b` | 1 | 1 | 13 | 5 |
| förvaringskistan `b129d5ae` | 2 | 2 | 7 | 3 |
| **summa** | **26** | **31** | | |

- Wix: alla skarpa körningar av `bilder-bort.yml` (14 sidor och förvaringskistan) gick igenom, och rutten stoppar vid första avvikelse i återläsningen av galleri, alt-texter, länkar, synlighet och varianter. Galleritilläggen och
  ägarskrivningarna jämförde före och efter (varianternas id, SKU, pris, synlighet och val, produktens namn och adress) utan avvikelse. Förvaringskistan lästes dessutom om i en separat läsning 05:48 UTC: galleriet 7, Mörk Khaki äger tre
  foton, Vit två, M och L äger var sitt kort, varianternas bild är Mörk Khakis första foto (`b5e78a`) respektive Vits (`6bfbb0`), och SKU, pris (1 459 och 1 559 kr) och synlighet är oförändrade.
- **`efter.py` (`kolla-agare.py` mot butikens egen sidodata, 05:58 UTC, cachens `age` 184–790 s, matstationens 2 579 s): 70 av 70 kombinationer på 16 sidor stämmer med planen**, SPEC-tipsen är tomma på alla 16 sidor (ingen måttbild
  visas under ett val den inte hör till) och VARUKORG är 0. FOTO-tips finns kvar på fem sidor (väggspegeln, sensorsoptunnan, vedboden, bokhyllan och skrivbordet): foton av en annan storlek, som får ligga kvar enligt Leonards besked
  på fråga 1. FÄRG-tips finns på matstationen, kantskydden och odlingstunneln, och bilden avgör.
- Webbläsaren (`live-galleri.mjs`, en kombination i taget): förvaringskistans fyra kombinationer 05:51 UTC. Mörk Khaki × M visar färgens tre foton plus M-kortet, Mörk Khaki × L tre foton plus L-kortet, Vit × M och Vit × L färgens två foton
  plus sitt kort (tre bilder), och priserna är oförändrade. De andra sidorna mättes i webbläsaren 05:36–05:37 UTC, direkt efter skrivningarna.
- **Skyddskollen** (`bygg-skyddskoll.py` med `skyddsplan.json`, 06:01 UTC): 26 av 26 kortfiler sitter i sina gallerier, bildstädningens egen tolkning ser alla 26 och Media Manager har dem (`OK`, `READY`). De har källklassen `annan-kalla`,
  som städningen aldrig raderar. De 31 borttagna måttbilderna ligger kvar i Media Manager tills städningen tar dem, tidigast tre dygn efter att den först såg dem oanvända.
- **Slutkontroll av varukorgens bild** (`variantbild.yml`, läget `torr` mot `main`, run 39908059310, 05:52–06:13 UTC, efter den sista skrivningen): **1 174 flervariantsprodukter kontrollerade, 1 174 redan rätt, 0 rättade, 0 med fel kvar,
  0 ej rättade, 0 som inte gick att kontrollera och 0 avvikelser.** Nattens tre sidor (hamsterburen, elbilen och hundbädden) är alltså rättade, och inga av de 16 sidornas varianter har fel bild. Torrkörningen tog 21 minuter och delar
  concurrency-grupp med `polish-write`, så starta den inte mitt i en poleringsskrivning.

Fem egenskaper som inte ska tas bort:

1. ☠️ **En bild som föreställer en viss färgs vara ägs aldrig av en storlek som flera färger delar.** Butiken visar storlekens bilder under varje färg i storleken. Det som går är ett kort som stämmer för alla färger, ägt av storleken.
2. ☠️ **Kortets hjältefoto bär de färger sidan har.** Det byggs av ett packshot per färg ur sidans eget galleri vid fil-id, och `hjaltar.tsv` bär hela fil-id:t, inte en plats i galleriet, eftersom platserna flyttar sig när en bild tas bort.
3. ☠️ **De gamla måttbilderna tas bort efter att korten ligger i galleriet och är ägda av sin storlek, aldrig före.** Faller något halvvägs har sidan ett kort för mycket och ingen vy saknar måttbild.
4. ☠️ **Mät mot en spec utan de borttagna bilderna.** `agare_<id8>.json` skrevs före borttagningen, och `kolla-agare.py` svarar `planen nämner … men bilden finns inte i galleriet` om bilder som är borta med flit. Matstationen gav två sådana
   falska avvikelser (`59c65b` och `2d7a79`) i första körningen, med alla sex kombinationer OK. `efter.py` tar bort bilderna i `bort.json` ur specarna före kontrollen.
5. ⚠️ **Förvaringskistans Vit visar tre bilder i båda storlekarna** (två egna foton och storlekens kort), under minimimåttet på fyra, och det var så före också. Sidan finns inte i färgbildsspårets lista, och frågan om Vit ska få fler bilder
   står hos Leonard.
