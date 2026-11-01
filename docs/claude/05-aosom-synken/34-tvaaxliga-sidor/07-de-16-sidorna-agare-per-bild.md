#### De 16 sidorna rättade: en uttalad ägare per bild (`bygg-agare.py`, 2026-10-23)

Leonard 2026-10-23 ca 01:40 UTC: *"Fixa alla 16 en i taget med visuell kontroll på varje bild är kopplad till rätt variant och storlek"*. Alla 16 sidor är skrivna en i taget 01:4x–02:09 UTC, utanför Aosoms
synkfönster, efter att varje galleribild setts i full storlek på kontaktark (241 bilder: hela galleriet på varje sida, inte bara måttbilderna). Sidorna: matstationen `1d4eb6b1`, kattrappan `4d9ba658`, den
hopfällbara hundbädden `c3d1fa41`, kantskydden `44d4907b`, hammocköverdraget `91f5c078`, odlingstunneln `38f70f83`, julgranen `75a38b7b`, väggspegeln `c438d4ba`, hundsängen med tak `934297b1`, hundbädden med tak
`01ac2f63`, sensorsoptunnan `92fc308c`, vedboden `4a2ab58e`, tunnelväxthuset `5466fe81`, bokhyllan `79ab08fe`, det fällbara skrivbordet `3b868848` och buxbomsklotten `7d1fb82b`. 53 av de 241 bilderna bytte ägare.

☠️ **Skrivningarna hade två biverkningar jag inte såg förrän 02:2x UTC, och båda är rättade (*Biverkningen* nedan):** de nollställde Wix variantbild (varukorg, kassa, order) till huvudbilden på alla 16 sidor, och
mina första listor byggdes i galleriets ordning och bytte därmed butikens första bild på fem färger. Den första versionen av det här avsnittet påstod motsatsen, för jag hade läst butikens uträkning av variantbilden och inte Wix.

`tools/polish-gates/bygg-agare.py <ut.js> <spec.json> [--torr] [--kompakt]` gör `lank-om-bilder.js` till ett färdigt ExecuteWixAPI-skript där VARJE galleribild får en uttalad ägare
(`[{"id": "<fullt produkt-id>", "agare": {"<hex6>": "<valets namn>" | "-"}, "tomt": [], "forst": {"<valets namn>": "<hex6>"}}]`, hex6 = de sex första tecknen efter `b379ce_`, `-` = gemensam bild utan ägare,
`forst` = valfritt: valets första länkade bild). Skrivsteget, spärrarna och återläsningen
är `lank-om-bilder.js`:s, oförändrade: galleriet rörs aldrig, och varianternas id, SKU, synlighet och pris, produktens namn och adress och länkarna i den andra optionen jämförs efter skrivningen.
`tools/polish-gates/kolla-agare.py <spec.json> <slug>` läser sedan butikens egen sidodata och jämför ägare per bild och vy per kombination mot samma plan (exit 1 vid avvikelse). Mutationsprov: en ändrad
ägare i planen fäller exakt den bilden och de vyer den ändrar.

Reglerna jag valde ägare efter, mot butikens vymodell (en bild har ETT ägarval, och en vy är unionen av olänkade bilder och bilder som ägs av de valda valen):

- En måttbild eller ett kort vars tal gäller en storlek ägs av storleken. Ett färgfoto ägs av färgen. En bild som gäller alla val (faktakort, närbild på ett beslag) är olänkad.
- ☠️ **Ett val som finns i bara en kombination ger en exakt ägare.** Vit finns bara i 300 × 397 (tunnelväxthuset), Svart bara i 63 cm (skrivbordet), 150 cm bara i Mörkgrå (vedboden), Olivgrön bara i 40 cm och
  50 cm bara i Ljusgrön (buxbomsklotten), 76 × 61 bara i Blå och 61 × 46 bara i Ljusgrå (hundsängen), 76 × 61 bara i Mörkblå och 61 × 46 bara i Brun (hundbädden). En bild som hör till just den kombinationen
  ägs av det valet och syns bara där. Det är enda sättet att utesluta en bild ur en kombination, eftersom en vy är en union och aldrig en skärning.
- ☠️ **Foton av en annan storlek ligger kvar på sin färg när alla kombinationer finns.** Unionen går inte att undvika där, och att äga fotot av storleken hade visat det under fel färg. Det är mest sådana
  foton katalogkontrollen fortfarande flaggar som FOTO.
- ☠️ **Varje vy ska ha minst fyra bilder.** En bild som hade lämnat en vy under fyra blev kvar där den låg: fotona #1 och #2 på Mörkblå hos hundbädden `01ac2f63` hade gett Mörkblå × 92 × 76 tre bilder om de ägts av 122 × 92.
- Måttbilder med färgens motiv (ett foto av en viss färg med tal i) ägs av storleken och visas därför också under de andra färgerna i den storleken. Det är husets standard, och frågan om de ska länkas till sin
  färg väntar på Leonard (lärdom 147).

| sida | bilder som bytte ägare | bilder per vy före → efter |
| :-- | :-- | --: |
| `1d4eb6b1` matstationen | #14 och #27 (måttbilderna) → sin storlek | 8–10 → 8–11 |
| `4d9ba658` kattrappan | #4 och #16 → 60 × 40 och 45 × 40 | 5–6 → 5–6 |
| `c3d1fa41` hundbädden | #5 → 75 × 51 × 18, #10 → 107 × 61 × 20 | 4–6 → 5 |
| `44d4907b` kantskydden | #5 → Ø244 | 5 → 4–6 |
| `91f5c078` hammocköverdraget | #5, #14, #18 → 205 cm | 5 → 4–8 |
| `38f70f83` odlingstunneln | #4, #11 → 200 cm, #12 → 300 cm | 5–7 → 5–7 |
| `75a38b7b` julgranen | #4 → 120 cm | 5 → 4–6 |
| `c438d4ba` väggspegeln | #4, #14 → 50 × 70, #7 → 60 × 90, #9 → 50 × 110 | 6–9 → 6–8 |
| `934297b1` hundsängen | #3 → 106 × 76, #9, #10 → 76 × 61, #11, #12 → 61 × 46 | 5–7 → 4–6 |
| `01ac2f63` hundbädden | #3 → 122 × 92, #12 → 92 × 76, #14, #15 → 76 × 61, #16 → 61 × 46 | 4–8 → 5–6 |
| `92fc308c` sensorsoptunnan | #6 → 50 liter, #8, #16 → 42 liter, #10 → 30 liter | 7–9 → 7–8 |
| `4a2ab58e` vedboden | #2, #5, #7, #15–#17 → 150 cm, #9 → 213 cm | 8–12 → 5–11 |
| `5466fe81` tunnelväxthuset | #11 → 300 × 397, #12–#15 → 300 × 597 | 6–10 → 6–8 |
| `79ab08fe` bokhyllan | #6, #11 → 109 cm, #8 → 136 cm | 6–7 → 6–7 |
| `3b868848` skrivbordet | #3, #15 → 63 cm, #5, #8 → 80 cm | 5–7 → 6–7 |
| `7d1fb82b` buxbomsklotten | #5 → 40 cm, #12 → 50 cm | 6–8 → 5–7 |

Sex egenskaper som inte ska tas bort:

1. ☠️ **Planen ska omfatta HELA galleriet.** Saknas en bild svarar skriptet `ok: false, steg: "agare"` och skriver ingenting, i stället för att lämna bilden som den var. Ägaren ska också vara exakt ett val på
   sidan (namnet är unikt bland alla val i alla optioner).
2. ☠️ **Alla val i alla optioner får sin lista skriven**, så ingen gammal länk blir kvar på ett val som planen inte nämner. Val som saknar bilder i planen töms, och `lank-om-bilder.js` kräver `tomt` för ett val
   som hade bilder.
3. ☠️ **Optioner som inte är Färg skrivs först och Färg sist.** En bild som flyttas från färg till storlek är då ägd av båda en kort stund (butiken ser färgens länk) i stället för av ingen (butiken visar den
   under varje val).
4. ☠️ **Listornas ordning bevaras, och `forst` anger ett vals första bild.** En bild valet fortfarande äger står kvar på sin plats och nya bilder läggs sist i galleriets ordning. Första versionen byggde varje lista
   i galleriets ordning och bytte därmed butikens första bild på fem färger (*Biverkningen*). En option vars listor redan stämmer skrivs inte alls, och stämmer allt svarar skriptet `redan_ratt` utan att skriva.
5. ☠️ **`variantbild-farg.js` körs efter varje skrivning med verktyget.** En id-skrivning av optionerna nollställer Wix variantbild till huvudbilden (rättelsen under *Wix:s regel för variantens bild*), och
   `variantbild.yml` kan inte rätta det på en sida med länkar på båda optionerna, eftersom `forvantadBild` då gav `inget_snitt` och en variant utan förväntan hoppades över (motorn är ändrad, se *Motorn rättar nu …*).
6. ☠️ **Jämför butikens första bild före och efter**, inte bara vilka bilder som syns. En vy kan innehålla exakt planens bilder och ändå börja med fel bild.

**Biverkningen: Wix variantbild nollställdes, och butikens första bild byttes på fem färger** (upptäckt 02:2x UTC, rättat 02:31–02:37 UTC):

- ☠️ **Wix variantbild (`variantsInfo.variants[].media`, den som varukorgen, kassan och ordern läser) var huvudbilden på alla varianter på alla 16 sidor** från skrivningen (01:47–02:09 UTC) tills den rättades. Jag hade skrivit
  att den inte rörs, men jag hade läst butikens uträkning (`variantTable[].image` och katalogkontrollens VARUKORG: färgvalets första länkade bild, `lib/variant-price.ts`), som bara ändras av en listas ordning. Wix egen läsning gjordes
  först när jag läste `lib/wix/variant-media.ts`, såg att `forvantadBild` gav `inget_snitt` på sidor med länkar på båda optionerna, och körde provet på en dold testprodukt (tabellen under *Wix:s regel för variantens bild*).
  Soptunnan `c841717c` hade samma fel sedan `bilder-bort.yml` 00:51 UTC. Ingen order lades under fönstren: Search Orders utan statusfilter 2026-10-23 ca 03:00 UTC gav inga ordrar efter 10116
  (2026-10-22 20:50 UTC, och samma fråga hittade 23 ordrar sedan 15 oktober, så filtret biter). Varukorgar som aldrig blev order går inte att kontrollera.
- ☠️ **Mina första listor byggdes i galleriets ordning.** Butiken lägger valets första länkade bild först i galleriet, så den bytte på fem färger: julgranens Vit (#7 → #3), väggspegelns Guld (#10 → #3), sensorsoptunnans Silver
  (#11 → #5), vedbodens Grön (#10 → #3) och bokhyllans Vit (#9 → #2), alltså från ett packshot mot vit botten till ett miljöfoto. Det syntes i jämförelsen av butikens första bild före och efter. Återställt 02:31 UTC med
  `forst` (två skrivningar, fem sidor, 0 avvikelser, antalet länkade bilder per val oförändrat).
- **Variantbilden rättades 02:34–02:37 UTC med `variantbild-farg.js`** på de 16 sidorna, soptunnan och förvaringskistan (17 skrivna med 0 avvikelser i återläsningen, revision +1 per sida, förvaringskistan `redan_ratt`).

**`variantbild-farg.js`** (`python3 tools/polish-gates/bygg-variantbild-farg.py <ut.js> <fullt produkt-id>... [--torr] [--kompakt]`, byggt för ExecuteWixAPI, högst fem sidor per skrivkörning och 60 sekunder; en torrkörning
får ta fler, 49 sidor ryms i en körning): på en publicerad sida med färg och en annan option där BÅDA har länkade bilder skrivs varianterna om med valen bara med namn (`products-with-inventory`, ingen fältmask, aldrig
`inventoryItem`) och Färg först i varje variant. Wix räknar då variantens bild ur färgens första länkade foto, utan att optionernas ordning, galleriet eller länkarna ändras. Fem egenskaper som inte ska tas bort:

1. ☠️ **En färg utan länkade bilder avvisas** (`steg: "plan"`), och en sida utan en option som heter Färg eller med fler än två optioner likaså. Då skulle variantens bild bli något annat än färgens foto.
2. ☠️ **Återläsningen jämför allt som inte ska ändras:** galleriet i ordning med alt-texter, optionernas ordning, varje vals länkar, varianternas id, SKU, pris, jämförpris, kostnad, synlighet och val, produktens namn, adress
   och synlighet, och lagret. Kostnaden kräver `MERCHANT_DATA`, och går den inte att läsa skrivs ingenting.
3. ☠️ **En sida som redan är rätt skrivs inte** (`redan_ratt`), så skriptet går att köra om, och en torrkörning (`TORR`, `hasMutations false`) visar variantbilderna före och efter.
4. ☠️ **Nya försök bara på 404, 409, 429 och 5xx**, med omläsning före varje försök. Varje annat fel stoppar med `ingenting ändrat`.
5. ☠️ **Svaret bär bara wix-id, de sex första tecknen i fil-id, antal och avvikelser.** Aldrig alt-texter, namn eller adresser.

**Mätt efteråt, i Wix egen läsning (inte butikens):**

- `variantbild-farg.js` i torrläge 02:37 UTC: **81 av 81 varianter** på de 18 sidorna har färgens första foto som variantbild, och valen ligger Färg först i varje variant.
- Samma läsning mot alla 49 tvåaxliga sidor (02:5x UTC): Wix variantbild är färgens första foto på **47 av 49**. Undantagen är hamsterburen `13fe619f` (storleken bär bilderna, känd och väntar på Leonard) och
  skjutdörrsbeslaget (ingen färgoption, inga länkade bilder). Inga andra tvåaxliga sidor är alltså nollställda, inte heller hundgrinden `6eb13a16` och bänkdynan `a7aa9370`, som färgbildsomgångarna skrev med id kvällen innan.
- Nattens `/api/cron/variantbild` (05:35 UTC) rättar sidor med länkar på EN option, och de ligger utanför den här mätningen.

**Utfall, mätt 02:11–02:17 UTC och på nytt 02:38–02:41 UTC efter rättelserna** (butikens cache hade hunnit ikapp på alla 16, `age` 23–910 s):

- `kolla-agare.py`: **16 av 16 sidor stämmer med planen**, både ägare per bild och vy per kombination. Ingen vy har färre än fyra bilder.
- En riktig webbläsare per kombination (`live-galleri.mjs`, och ett eget klickskript för `c3d1fa41` och `79ab08fe`, som väljer färg med kort): **74 av 74 kombinationer** visar exakt planens bilder, och **butikens första
  bild är densamma som före skrivningarna på alla 74**. Priserna rördes inte.
- Butikens `variantTable` (första bilden per variant): lika som före skrivningarna på **73 av 73 varianter**.
- `katalogkontroll-tva-axlar-bilder.py` över alla 49 sidor: **0 sidor med en måttbild för fel val** (var 16) och 0 som inte gick att läsa. 11 sidor har kvar foton som nämner en annan storlek (var 6) och 14 har
  färgträffar (var 8), mest för att en måttbild som ägs av storleken har färgens motiv. Båda tipsen bygger på alt-texter, och bilden avgör. Dess VARUKORG-rad (0) är butikens uträkning, inte Wix variantbild.

**Det som inte gick att rätta med länkar, och som Leonard avgjorde samma natt (se *Leonards svar på de sex frågorna* nedan):** foton av en annan storlek under fel storlek där alla kombinationer finns (väggspegeln,
sensorsoptunnan, bokhyllan, skrivbordet, matstationen, kattrappan), de tre måttbilderna (en per färg, samma tal) under varje hammock-variant i 205 cm och två under 200 cm (odlingstunneln) och 42 liter (sensorsoptunnan),
måttbilder som saknas (107 × 61 × 20 hos hundbädden, 305 och 366 hos kantskydden och 177 hos hammocköverdraget), och vedbodens 213-cm-packshot som första bild och variantbild under 150 cm × Mörkgrå (färgens enda eget foto).
Det första sätter butikens vymodell (en union) som gräns, det sista kräver att bilden tas bort eller ersätts, och båda var Leonards beslut.
