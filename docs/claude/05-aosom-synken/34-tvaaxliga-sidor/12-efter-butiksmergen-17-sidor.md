#### Efter butiksmergen: de 17 sidorna omlänkade en och en, och mätta i en riktig webbläsare (2026-10-24)

Butiksändringen mergades **2026-10-24 00:33:14 UTC, 27 minuter före den planerade tiden** (01:00 UTC, 03:00 svensk tid). Tre butiks-PR:ar mergades efter varandra på 27 sekunder: #771
(köpguiden för elbilar, 00:32:47), #772 (GTIN i Prisjakt-flödet, 00:32:58) och #770 (galleriet och värmaren, 00:33:14, squash `5d53d4e3`). Jobbet som skulle verifiera mergen och länka om sidorna startades därför
på läget och inte på klockan: först var #770 mergad och bygget klart, sedan började skrivningen. ☠️ **Ett schemalagt klockslag är en plan, inte ett läge.** Läs `merged_at` på PR:en och bygget i
deployment-listan innan du räknar med att butiken har den nya koden.

**Bygget och värmaren** (butiksprojektets produktionsbygge och runtime-logg, avläst 01:0x UTC):

- Produktionsbygget `dpl_8YPRkyCQkNo3dw9cSK2v3WXLcuzS` av `5d53d4e3` skapades 00:33:17, byggde 00:35:36 och blev READY 00:38:05 (149 s). Alla 49 sidor med två val bär `imageKopplingar` i sin sidodata (mätt 01:01 UTC).
- Värmaren gick i tre led, och loggraderna är dessa (butikens runtime-logg, ordagrant):

  ```
  00:49:10  GET   [varm-katalogen] prov 12/12 MISS → kall. Värmde 1480/5116. Bildkartan: ok. Varukorgens underlag: 3684 varor. Avbruten på deadline: 3636 kvar → led 1: startat
  00:52:31  POST  [varm-katalogen] led 1: värmde 1840/3636, 1796 kvar → led 2: startat
  00:56:09  POST  [varm-katalogen] led 2: värmde 1796/1796 — katalogen klar. Listor: 0/133 (avbruten på deadline)
  ```

  1 480 + 1 840 + 1 796 = **5 116 produktsidor, hela katalogen, på ungefär tio minuter**. Natten före värmde ett enda pass 1 824 av 5 092 och slutade (lärdom 189). Ett stickprov på 40 slumpade produktsidor
  00:58 UTC gav **40 av 40 HIT** (age 192–722 s, 0,18–0,48 s), mot 21 av 40 HIT och 5 MISS 2026-10-23 13:19.
- ☠️ **Listorna värmdes inte: `Listor: 0/133 (avbruten på deadline)`.** Det led som gör katalogen klar värmer listsidorna sist, och här gick hela dess deadline åt till de sista 1 796 produkterna. Inget led
  startades för listorna, eftersom katalogen var klar. Skadan uteblev: 21 listsidor (startsidan, `/butik`, sexton kategorier och tre blogginlägg) svarade på 0,28–0,66 s, 18 av dem som `PRERENDER` (sidor som
  byggdes med deployen), två som `HIT` och startsidan som `STALE`. Luckan finns ändå kvar: på en deploy där listsidorna inte prerenderas hade de stått kalla till första besökaren. Förslag till nästa butiksdeploy
  (inte gjort, butiken deployas inte för det här): låt ett led som slutar före listorna starta ett led till bara för dem.

**De 17 sidorna** (alla 18 planer i `tools/polish-assets/tva-axlar-revision-2026-10-23/` utom hamsterburen). Skrivet 00:43:53–00:54:37 UTC, efter Aosoms lagerfönster (00:12–00:29) och före prisfönstret (03:12). Kombinationerna är
de som en kund kan välja, och bilderna per kombination är mätta i en webbläsare 00:57–01:00 UTC (alla 78 kombinationer är varianter i Wix, och varje variant fick sin bild räknad om):

| sida | komb. | bilder per kombination | länkade bilder per val, före → efter |
| :-- | --: | --: | :-- |
| projektorduken `926ec7a2` | 3 | 5–9 | Vit 4 → 9, Svart 5 → 5 |
| bokhyllan `79ab08fe` | 4 | 2–5 | 109 cm 1 → 7, 136 cm 1 → 3 |
| hundgrinden i järn `233c83cf` | 6 | 4–7 | 74–94 cm 0 → 2, 74–87 cm 0 → 3, 74–80 cm 0 → 5 |
| matstationen `1d4eb6b1` | 6 | 5–7 | 58,4 × 30,5 cm 1 → 10, 44 × 24 cm 1 → 11 |
| förvaringstornet `0136e7d9` | 4 | 3–5 | 6 lådor 0 → 3, 9 lådor 0 → 2 |
| hundbädden med tak `01ac2f63` | 6 | 2–5 | 122 × 92 cm 1 → 3, 92 × 76 cm 1 → 5, 76 × 61 cm 2 → 2, 61 × 46 cm 1 → 1 |
| skrivbordet `3b868848` | 5 | 2–6 | 63 cm 1 → 5, 80 cm 1 → 2 |
| vedboden `4a2ab58e` | 3 | 5–10 | 150 cm 7 → 7, 213 cm 1 → 2 |
| kattrappan `4d9ba658` | 6 | 3–5 | 60 × 40 cm 1 → 8, 45 × 40 cm 1 → 5 |
| hundtrappan `543b9076` | 6 | 4–7 | 4 steg 0 → 9, 3 steg 0 → 4 |
| hindersetet `6d35a04f` | 3 | 4–6 | 6 hinder 0 → 3, 3 hinder 0 → 4 |
| hundgrinden med husdjursdörr `8018bb95` | 4 | 2–5 | 75–103 cm 0 → 3, 75–82 cm 0 → 2, 75–131 cm 0 → 3 |
| sensorsoptunnan `92fc308c` | 6 | 5 | 50 liter 1 → 3, 42 liter 1 → 3, 30 liter 1 → 3 |
| dörrgrinden `a64af3a4` | 3 | 3–6 | 75–95 cm 0 → 3, 75–145 cm 0 → 3 |
| verktygslådan `aafbf543` | 4 | 3–6 | 3 lådor 0 → 7, 4 lådor 0 → 4 |
| hopfällbara hundbädden `c3d1fa41` | 3 | 3–5 | 75 × 51 × 18 cm 1 → 4, 107 × 61 × 20 cm 2 → 2 |
| väggspegeln `c438d4ba` | 6 | 2–6 | 50 × 70 cm 1 → 6, 60 × 90 cm 1 → 6, 50 × 110 cm 1 → 4 |

Skrivningarna var nio körningar för länkarna (`bygg-agare.py <ut.js> <plan> --kompakt --utan-vy`, en eller två sidor per körning) 00:43:53–00:52:19 och fyra för variantbilderna
(`bygg-variantbild-farg.py --kompakt`, 5 + 5 + 5 + 2 sidor) 00:47:23–00:54:37. Alla 17 sidor gav `ok: true` och `avvikelser: []`, med revision +1 per skrivning. Spärren i `bygg-agare.py` hämtade varje sidas adress
före bygget och släppte igenom alla (`<id8> sidan bär imageKopplingar`). Planerna skrevs som de ligger i repot: de 33 posterna i nattens specar var lika `agare-<id8>.json` (jämfört som JSON), så ingen plan
ändrades på vägen.

**Mätningen**, fem oberoende kontroller:

| kontroll | utfall |
| :-- | :-- |
| Wix läser tillbaka i varje skrivning (galleri, länkar, variant-id, SKU, pris, synlighet, namn och adress) | 17 av 17 sidor, 0 avvikelser |
| `variantbild-farg.js`: variantens bild i Wix är färgens första foto (varukorg, kassa, order) | 78 av 78 varianter |
| `kolla-agare.py` mot butikens sidodata | 17 av 17 stämmer med planen. Fyra sidor (`a64af3a4`, `aafbf543`, `c3d1fa41`, `c438d4ba`) gav ☠️ vid första körningen, med en cache som var ungefär tio minuter gammal, och var rätt några minuter senare |
| **webbläsare, en kombination i taget** (`live-alla-kombinationer.sh`, 00:57–01:00 UTC) | **78 av 78 kombinationer visar exakt planens bilder**. Mutationsprov: en ändrad ägare i bokhyllans plan ger två avvikelser och exit 1 |
| `katalogkontroll-tva-axlar-bilder.py` över alla 49 sidor med två val (hämtade 01:01 UTC) | 0 med en måttbild för fel val, 5 med foton som nämner en annan storlek (11 före mergen), 7 färgträffar (14 före mergen), 1 varukorgstips (vedboden, se nedan), 0 oläsbara |

De 16 kombinationerna som fortfarande visar **färre än fyra bilder** är ett beslut, inte en miss (steg 3, väntar på Cowork-raderna för Härma Aosom): förvaringstornet Blå × 9 lådor (3), hundbädden med tak Mörkblå × 92 × 76 (3),
Mörkblå × 76 × 61 (3) och Brun × 61 × 46 (2), skrivbordet Natur och vit × 80 cm (2), kattrappan Grå × 45 × 40 (3) och Brun × 45 × 40 (3), hundgrinden med husdjursdörr Vit × 75–103 (3), Vit × 75–82 (2) och
Vit × 75–131 (3), dörrgrinden Vit × 75–95 (3) och Vit × 75–145 (3), verktygslådan Röd × 4 lådor (3), väggspegeln Svart × 50 × 110 (2), bokhyllan Vit × 136 cm (2) och hopfällbara hundbädden Brun och svart × 107 × 61 × 20 (3).
Lagerläget för dem är inte kontrollerat här. De fem kombinationer i lager som saknade eget foto (skrivbordet Vit × 63 cm, spegeln Guld × 50 × 110, järngrindens tre) visar alla fyra eller fler bilder, ur sin färgs foton.
Vedbodens Mörkgrå × 150 cm är kvar som varukorgstips: den varianten är slutsåld, och bara 213 cm × Mörkgrå har lager (lärdom 175).

**Hamsterburen `13fe619f` skrevs inte.** Planen är torrkörd, men skrivningen ger Mörkgrå × 85 × 45 100-burens packshot i varukorgen (färgens första bild), och det är ett val som Leonard inte har gjort. Burens
vy är orörd: Naturträ × 85 × 45 visar fortfarande den grå burens bilder (en av de sju färgträffarna).

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Variantbilden skrivs efter varje länkskrivning, i en egen körning.** En id-skrivning av optionerna nollställer variantens bild i Wix till huvudbilden (lärdom 169). Nattens cron (05:35 UTC) hade rättat det
   först då, och varukorgen, kassan och ordern hade visat fel bild under tiden. Alla 17 sidor fick `variantbild-farg.js` 00:47–00:54, och Wix variantbild är färgens första foto på alla 78 varianter.
2. ☠️ **Mät i en webbläsare per kombination, inte bara i sidans data.** `kolla-agare.py` läser vad butiken tänker visa, och bara webbläsaren visar vad kunden ser. De två skiljer sig åt när sidans cache är gammal,
   och en kontroll som kan ge falskt rött lär mottagaren att sluta läsa. Mät om efter några minuter innan en sida kallas trasig. Verktygen är `live-galleri.mjs`, `live-galleri-kortfarg.mjs` (färgen som kort, storleken som
   knappar, bokhyllan), `live-galleri-kort.mjs` (båda axlarna som kort, hundbädden) och `verifiera-live.py`, som räknar butikens regel mot planen. `live-alla-kombinationer.sh <planmapp> <utkatalog> <id8>…` kör dem i rätt
   ordning och väljer själv kortskriptet när sidan har färgkort.
3. **`--utan-vy` ger skarpa skript utan förhandsvisningen** (13,6 kB mot 19,4 kB). Skriptet klistras in i ExecuteWixAPI, och sex kilobyte som inte skrivs till Wix är sex kilobyte som kan bli fel i avskriften.
   Skrivvägen och alla kontroller är oförändrade: `--utan-vy` ger byte för byte den fil som kördes skarpt 00:43–00:52, och flaggan avvisas tillsammans med `--torr`, vars svar ÄR förhandsvisningen. Vyn läses i
   stället efteråt med `kolla-agare.py` och `verifiera-live.py`.
4. ☠️ **Två sidor per körning som mest.** Varje ändrad option är en skrivning, en tre sekunders paus och en återläsning, taket för ExecuteWixAPI är 60 sekunder, och skriptet hoppar över resten av sidorna
   med `tid` efter 40 sekunder. Två tvåaxliga sidor, alltså upp till fyra ändrade optioner, tog 8–17 sekunder per körning i natt. Tre sidor i en körning har inte prövats, och en sida som hoppas över med `tid`
   ska köras om i en egen körning.

**Kvar efter natten:** (a) de 16 kombinationerna ovan väntar på chattens svar för Härma Aosom (130 varianter på 30 sidor, filen ligger hos Leonard). (b) Hamsterburen väntar på Leonards besked. (c) Rad 137 i färgfilen
(`c3d1fa41`) kan tas nu, eftersom sidans nya vyer finns: de 12 kandidaterna jämförs med `cowork-jfr.py` mot varje kombination. (d) Motorn (steg 4): varukorgens bild är färgens första för alla storlekar, och
sammanslagningen kopplar fortfarande en ny storlek i en befintlig färg bara till färgen eller storleken. (e) Nattens `/api/cron/variantbild` (05:35 UTC) ska kontrollera alla flervariantsprodukter (1 174 natten före) och inte rätta någon
av de 17 sidornas varianter: läs raden `{"ratt":…}` i Vercels runtime-logg. (f) Listsidorna i värmarens sista led (se ovan). Patchen för ett eget listled ligger klar i `tools/polish-assets/butik-varmning-listor-2026-10-28/` (inte deployad, FLAGGADE lärdom 235):
den väntar på Leonards ja till en butiks-PR och bör följa med nästa butiksdeploy.
