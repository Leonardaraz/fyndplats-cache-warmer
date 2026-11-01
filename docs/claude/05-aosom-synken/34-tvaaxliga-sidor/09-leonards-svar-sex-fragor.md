#### Leonards svar på de sex frågorna: ett kort per storlek, dubbletter borta, gemensamma bilder delas (2026-10-23)

☠️ **Historik:** korten i det här avsnittet är ersatta. Originalen kom tillbaka 2026-10-24 och
inga Fyndplats-kort byggs alls sedan 2026-10-27 (se *Originalen tillbaka* längre ned).

Leonard 2026-10-23 ca 03:0x UTC, på de sex frågorna ovan: *"Fixa alla frågor så proffsigt som möjligt, gemensamma bilder får delas mellan varandra såklart"*. Allt är skrivet 03:42–04:01 UTC, utanför Aosoms
synkfönster, och mätt live 04:01–04:10 UTC.

| fråga | beslut och utfall |
| :-- | :-- |
| 1. foton av en annan storlek under fel storlek där alla kombinationer finns (11 sidor) | **De får vara kvar.** Butikens vy är en union, och ett foto av samma vara i en annan storlek är en gemensam bild. Katalogkontrollen räknar dem fortfarande som FOTO-tips, och bilden avgör. |
| 2. dubbletter | **Hammocken:** de tre måttbilderna (en per färg, samma tal) är ersatta av två färgneutrala kort, `205 cm` och `177 cm`, med alla färger sida vid sida. **Odlingstunneln:** den vita 200-cm-bilden är borta, den gröna står kvar som storlekens enda. **Sensorsoptunnan:** silverbilden med 68 cm är borta, den svarta 42-litersbilden står kvar. |
| 3. måttbilder som saknas | Ett kort per storlek, byggt ur sidans egen text: hammockens 177 cm, kantskyddens Ø305 och Ø366 och hundbäddens 107 × 61 × 20 cm. |
| 4. vedbodens första bild under 150 cm × Mörkgrå | **Ingen ändring.** Bara 213 cm × Mörkgrå har lager (35 st, mätt 2026-10-23 04:0x UTC), och den varianten har rätt bild: färgens första foto, 213-cm-packshoten. 150 × Mörkgrå och 213 × Grön är slutsålda. Ett annat första foto för färgen hade gett den enda varan i lager en bild av fel storlek i varukorgen. |
| 5. nattens variantbild | Motorn är ändrad (föregående avsnitt) och mergad 2026-10-23 (PR #762, squash `048ac5b6`). |
| 6. gemensamma måttbilder under andra färger (lärdom 147) | **De får delas.** Skumklossarnas måttbild, som länkades till *Gul och grå* som prov 2026-10-22, är gemensam igen och visas under båda färgerna. |

**Korten** ligger i `tools/polish-assets/runda-bilder-tva-axlar-kort/` (`kort.tsv`, fem kort, 1 600 × 1 600). Texten och talen kommer ur sidans egen text (`kallor-tal.json`, `<kort>.html`), och `gate-kort.py` fäller på ett tal
som sidan inte bär. Fem rader (Fraktvikt och Paketmått för Ø305 och Ø366, Fraktvikt för hundbäddens stora storlek) klipps av grindens parentesstrippning, eftersom sidan skriver alla storlekarnas värden på samma rad,
och kvitteras med skäl i `kort-avvik.txt`. Hammockens hjältefoto är fyra packshots sida vid sida (`komponera-hjalte.py`; 205 cm: mörkgrön, ljusgrå, svart och mörkgrå, 177 cm: ljusgrå, mörkgrå och mörkgrön), eftersom ett
kort för en storlek inte ska visa EN färg när varan finns i flera. `orig/` med leverantörens foton checkas aldrig in.

**Ordningen per sida** (verktygen ligger i `tools/polish-gates/`):

1. Kortet byggs (`gate-kort.py`, sedan `bygg-kort.py`) och laddas upp (`UploadImageToWixSite`, md5-parat mot den lokala filen, tills Wix säger READY).
2. `galleri-tillagg.js` lägger kortet sist i galleriet med alt-text (`bygg-galleritillagg.py <ut.js> <plan.json>`; planen byggs av rundans `planer.py` ur `kortfiler.json` och `kortalt.tsv`, aldrig för hand).
3. `bygg-agare.py` ger varje bild en uttalad ägare (kortet ägs av sin storlek) och `lank-om-bilder.js` skriver länkarna.
4. De gamla måttbilderna tas bort med `bilder-bort.yml` (torrt, sedan skarpt med planens sha).
5. `variantbild-farg.js` rättar varukorgens bild (två optioner), `variantbild.yml` på en sida med EN option.
6. Live: `kolla-agare.py` (butikens sidodata), `live-galleri.mjs` eller `live-galleri-kort.mjs` (webbläsaren, en kombination i taget) och `katalogkontroll-tva-axlar-bilder.py` över alla 49 sidor.

Sex egenskaper som inte ska tas bort:

1. ☠️ **`galleri-tillagg.js` lägger bara till.** Galleriets gamla bilder står kvar i samma ordning med samma alt-text, och huvudbilden rörs inte.
2. ☠️ **En fil som inte är READY hos Wix hamnar aldrig i ett galleri**, och planens kontrollsumma (FNV-1a) räknas om i samma anrop som skriver, så en plan som skrivits av för hand avvisas.
3. ☠️ **Före och efter jämförs:** varianternas id, SKU, pris, kostnad, synlighet och val, lagret, produktens namn, adress och synlighet, och varje vals länkade bilder. Minsta avvikelse ger `ok: false`.
4. ☠️ **Svaret bär bara wix-id, de sex första tecknen i fil-id, antal och avvikelser.** Aldrig alt-texter, namn eller adresser.
5. ☠️ **Variantbilden nollställs av galleriskrivningen** (se *Wix:s regel för variantens bild*). `variantbild-farg.js` ska följa efter, och skriptet rapporterar variantbilderna före och efter.
6. **Alt-texten till ett kort kontrolleras av `gate-kort.py`** (`kortalt.tsv`: formen, att kortet finns, längd 20–250 tecken, samma grindar som texten och sifferkontrollen mot sidans facit). Mutationsprövat: ett tal sidan inte
   bär ger `[SIFFRA UTAN KÄLLA]` och en saknad alt-text `[ALT SAKNAS]`.

Tre mindre verktyg som kom ur arbetet:

- **`live-galleri-kort.mjs`** mäter en sida där BÅDA axlarna är kort (`.varcard`, hundbädden `c3d1fa41`). `live-galleri.mjs` klickar korten ett i taget och kallar varje kort ett val, så raderna för storlekarna visade den
  färg som klickats sist och såg ut som att storleken inte ändrade något.
- **`kolla-agare.py` klarar en sida med EN option** (skumklossarna `d70e483e`): sidans data har då `variantAxes` och `variantTable` som `$undefined`, och skriptet kraschade på det. Det kontrollerar nu ägarna per bild och
  hänvisar till `live-galleri.mjs` för vyn per val. Mutationsprövat: en ändrad ägare i planen ger exakt den bildens avvikelse och exit 1.
- **`skyddsplan.json`** i rundan är en plan för `bygg-skyddskoll.py` (`python3 -P tools/polish-gates/bygg-skyddskoll.py <ut-katalog> tools/polish-assets/runda-bilder-tva-axlar-kort/skyddsplan.json`), eftersom standardkörningen bara läser
  `fargtillagg-*/tillagg.json`.

**Utfall, mätt 03:42–04:10 UTC:**

- Wix: varje skrivning återlästes utan avvikelse. Hammocken: galleri 20 → 22 → 19, 205 cm äger sitt kort och 177 cm sitt, de tre färgmåttbilderna borta. Kantskydden 10 → 12 (Ø305 och Ø366 äger var sitt kort). Hundbädden
  10 → 11 (107 × 61 × 20 cm äger fotot och kortet). Odlingstunneln 12 → 11. Sensorsoptunnan 16 → 15. Skumklossarna: Gul och grå 5 → 4 länkade, galleriet orört.
- Variantbilden är färgens första foto på alla 26 varianter (7 + 4 + 3 + 4 + 6 + 2), mätt i Wix egen läsning.
- `kolla-agare.py`: hammocken (7 av 7 kombinationer), kantskydden (4 av 4), hundbädden (3 av 3), odlingstunneln (4 av 4) och sensorsoptunnan (6 av 6) stämmer med planen, och skumklossarnas nio bilder har rätt ägare.
- I en riktig webbläsare visar **26 av 26 kombinationer och val** exakt planens bilder. Måttkorten visas bara under sin storlek, och skumklossarnas gemensamma måttbild visas under båda färgerna. Alla fem korten är sedda live
  i huvudbilden, valda med sin storlek (hammockens 205 och 177, kantskyddens Ø305 och Ø366, hundbäddens 107).
- `katalogkontroll-tva-axlar-bilder.py` över alla 49 sidor: **0 med en måttbild för fel val**, 11 bara med foton för fel val (oförändrat, se fråga 1), 12 färgträffar (var 14, de två borttagna måttbilderna) och 0 med fel
  varukorgsbild.
- Skyddskollen: 5 av 5 kortfiler sitter i sina gallerier, bildstädningens egen tolkning ser alla fem och Media Manager har dem (READY). De har källklassen `annan-kalla`, som städningen aldrig raderar.
- Priser, SKU, synlighet och lager är oförändrade (jämförs före och efter i varje skrivning).

De borttagna måttbilderna (fem filer) ligger kvar i Media Manager tills bildstädningen tar dem, tidigast tre dygn efter att den först såg dem oanvända (karenstiden).
