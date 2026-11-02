### Delade måttbilder på storleksidor visas under fel storlek (2026-10-22)

Leonards skärmbild 22:31 (svensk tid) av skrivbordet `041fa621`: under 200 × 60 cm visades måttbilden för 180 × 60 cm. Den låg olänkad i galleriet (bild 8, alt-texten
slutade på *180 × 60 cm, bild 2*), och en bild som inget val länkar visar butiken för ALLA val. Givarens första bild var länkad till sin storlek och resten låg gemensamma.
Sammanslagningen länkar sedan 2026-09-30 alla givarens bilder till det nya valet, så sidan är troligen äldre (datumet är inte kontrollerat i historiken). Rättat 20:51 UTC med
`lank-om-bilder.js` (bara länkar: 180 × 60 cm 1 → 2, galleri, id, SKU, pris och synlighet orörda och återlästa utan avvikelse), och mätt live direkt efteråt: 200 × 60 visar sex bilder
utan 180-bilden och 180 × 60 sex med sin egen. Samma miljöfoto låg dessutom två gånger i galleriet (bild 2 och 3, pixelskillnad 0). Leonard sa ja till att ta bort den ena, och `bilder-bort.yml`
(torrt 21:10 UTC, skarpt 21:30 UTC med planens sha) tog bort bild 2, den med den allmänna alt-texten: galleriet 8 → 7, återläst (galleri, alt-texter, länkar, synlighet och varianter), och miljöfotot
med den beskrivande alt-texten är andra bild i båda vyerna. Live 21:38 UTC: 180 × 60 visar fem bilder och 200 × 60 fem, den borttagna syns inte i någon.

☠️ **En måttbild som anger ETT vals tal är inte gemensam.** På en färgsida delar färgerna oftast mått (frågan om gemensamma måttbilder står under *Väntar på Leonard*), men på en
storleksida anger bilden olika tal per val och motsäger de andra storlekarna. Kort som listar ALLA storlekar (*Tre storlekar med 10, 31 och 49 liter*, *WiFi eller 4G*, en
storleksguide) ska vara gemensamma. ☠️ **Ett antal visar inte felet:** skrivbordet hade sex bilder i vardera vyn både före och efter, och bara bilden avgör.

Skanningen `katalogkontroll-delade-malbilder.js` (läser bara, 32 s): av de 210 sidorna med ett enda val som inte är färg har 40 en olänkad bild vars alt-text nämner ett val eller är en
måttbild (18 på namn, 27 måttbilder utan nämnt val). Alla 45 bilderna granskades på kontaktark med OCR (`ocr-forgranska.py --tal`). De flesta är kort som listar alla storlekar, eller delar
mått mellan valen (västen, skivorna, stenarna, slalomstolparna), och står rätt. **Sju Aosom-sidor visade en måttbild för EN storlek under alla:** hönsgården `946d76bb` (3 × 2 m), terrariet
`ebf8a214` (30 × 30 × 30 cm), plyo-boxen `3a5e0e72` (61 × 51 × 41 cm), soptunnan `9d2c88bd` (30 liter), polytunneln `5556a448` (295 × 195 cm), hantelsetet `c6ff6fe8` (1, 3 och 5 kg) och buxbomen
`0fda8bfe` (varje storleks foto). Leverantören kontrollerades för resten med `polish-mapping.yml` (`las`, fältet `supplier` i den allowlistade loggen): sängramen `b996cd55`, soptunnan `dcd756bd`,
verktygslådan `370918a9` och byråerna `15c66a4d`, `57873e12` och `7b12a7f5` är Aosom, medan elementskyddet `675ba9bc` och förvaringslådan `a2a51783` inte har någon `supplier` (alltså AliExpress, som
huset räknar en rad utan fältet) och rörs inte utan Leonards ja. Sju sidor (`52a5d92b`, `4e58a5de`, `f258d141`, `834c9648`, `60f84a27`, `f6ab1dd4`, `1c883b87`) har en måttbild som gäller alla val
(samma mått eller en tabell över alla) och står rätt, och fyra sidor med rå valnamn (julgranen `6e72bacc`, lekhagen `147f159f`, mahjongbordet `250487a8`, jaktstolen `e0e6dd5a`) liknar
AliExpress och rörs inte utan ja.

**Leonards ja (2026-10-22) gällde dubbletten, de sju sidorna och tre till som torrkörningen visat säkra. Skrivet 21:31–21:34 UTC**, efter att Aosoms priskörning (21:20) loggat sin summering 21:21
(skrivningar går inte i :12–:29 vid synktimmarna). `bygg-lank.py` byggde skripten ur en spec (`[{id, axel, val: {valets namn: [hex6]}}]`) och `lank-om-bilder.js` skrev dem via ExecuteWixAPI, tre sidor
per körning. Varje körning läste tillbaka valens länkar, galleriets ordning, varianternas id, SKU, synlighet och pris, andra optioners länkar, namn och adress: **10 av 10 utan avvikelse**, revision +1
per sida. `variantbild.yml` (skarp, `ids`, de tio och skrivbordet) rättade varukorgens bild på 10 av 11 sidor och fann en redan rätt, 0 avvikelser. **Live 21:37 UTC** (`live-par.sh` och det nya
`kolla-delade-live.py`): varje måttbild syns under sin egen storlek och under ingen annan, ingen storlek visar färre än fyra bilder, och antalet per storlek är det modellen räknade fram på 10 av 10
sidor.

| sida | storlek: före → efter (butikens vy) |
| :-- | :-- |
| hönsgården `946d76bb` | 3 × 2 m 4 → 4 · 3 × 4 m 5 → 4 · 3 × 6 m 5 → 4 |
| terrariet `ebf8a214` | 30 × 30 × 30 cm 4 → 4 · 50 × 30 × 25 cm 5 → 4 · 50 × 30 × 35 cm 5 → 4 |
| plyo-boxen `3a5e0e72` | 61 × 51 × 41 cm 5 → 5 · 51 × 48 × 41 cm 5 → 4 · 76 × 61 × 51 cm 5 → 4 |
| soptunnan `9d2c88bd` | 50 liter 5 → 4 · 30 liter 4 → 4 |
| polytunneln `5556a448` | 295 × 195 cm 4 → 4 · 395 × 297 cm 5 → 4 |
| hantelsetet `c6ff6fe8` | 1, 3 och 5 kg 5 → 5 · 3, 4 och 5 kg 5 → 4 |
| buxbomen `0fda8bfe` | 90 cm 6 → 5 · 115 cm 6 → 5 |
| sängramen `b996cd55` | 140 × 200 cm 6 → 6 · 90 × 200 cm 6 → 5 |
| soptunnan `dcd756bd` | 58 liter 5 → 5 · 48 liter 5 → 4 |
| verktygslådan `370918a9` | Två lådor 5 → 5 · Fyra lådor 6 → 5 |

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Kontrollen kan fälla.** `kolla-delade-live.py <spec.json> <katalog> <prefix> [--fore <katalog> <prefix>]` kräver tre saker per sida: bilden syns under sitt eget val, under inget annat, och varje val
   visar minst fyra bilder. Mot mätningen FÖRE rättningen gav den **14 avvikelser på exakt de tio sidorna** och efter rättningen noll. En kontroll som aldrig prövats mot felet den ska fånga kan inte skilja ett
   rent resultat från ett blint.
2. ☠️ **Rättningen sänker de andra storlekarnas antal, och det är rätt.** Bilden visades under en storlek den inte gäller. Sjunker en vy under fyra av det skälet väntar sidan på nya bilder i stället för att
   felbilden får ligga kvar. Det gäller byråerna `15c66a4d` (4 lådor 2 → 2, 5 lådor 5 → 4), `7b12a7f5` (3 lådor 3 → 2, 6 lådor 6 → 5) och `57873e12` (4 lådor 4 → 3, 5 lådor 5 → 5), som torrkörningen
   2026-10-22 21:1x UTC visade. De är rad 326, 327 och 380 i Cowork-filen för storlekar, och rättas i SAMMA skrivning som de nya bilderna (`skriv-fargbilder.js` med `axel: "Storlek"` och
   `"gemensam": true` i picks.json för en bild som ska gälla alla).
3. ☠️ **Leverantören kontrolleras före skrivningen.** En sida utan `supplier` räknas som AliExpress och rörs inte utan Leonards ja, hur lik den än är en Aosom-sida (`675ba9bc` och `a2a51783`).
4. **Hexkoderna är de sex första tecknen efter `b379ce_`** och ska ge exakt en träff i galleriet; `bygg-lank.py` avbryter annars, och lägger de nya länkarna i galleriets ordning utan att släppa en gammal länk.
