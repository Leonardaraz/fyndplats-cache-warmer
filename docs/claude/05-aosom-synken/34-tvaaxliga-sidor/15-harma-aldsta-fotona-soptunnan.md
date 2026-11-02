#### Härma lämnade de äldsta fotona som färgfoton: soptunnan `c841717c` rättad (2026-10-27)

Leonard 2026-10-27, två skärmbilder av Svart × 60 liter: *bilderna är inte kopplade helt rätt efter storlek*. Han föreslog att radera alla bilder och
hämta om dem en storlek och färg i taget. Det behövdes inte: felet satt i länkarna, inte i filerna. Regel 3 ovan (*ingenting gammalt får ändras*) hade
lämnat galleriets nio äldsta bilder länkade bara till färgen, så butiken visade under Svart × 60 liter 45-litersartikelns packshot som första bild och
tre av dess miljöbilder, och under Silver × 45 liter 60-litersartikelns packshot. Härma-analysen (Aosoms galleri per artikel) säger att varje gammalt
foto ligger i exakt en kombinations galleri hos Aosom, och planen `tools/polish-assets/runda-bilder-soptunna-exakt/agare-c841717c.json` gav därför
alla 25 bilder exakt ägare (färg och storlek). `bygg-agare.py` skrev bara Storlek (45 liter 7 → 12 länkade bilder, 60 liter 13 → 13), `variantbild-farg.js`
rättade varukorgens bild strax efter, och galleriet, alt-texterna, varianternas id, SKU, pris, kostnad, synlighet och lager lästes tillbaka oförändrade.
Live visar varje kombination exakt de foton Aosom har för den, med sitt eget packshot först (6, 7, 6 och 6 bilder, före 7, 11, 9 och 7), 4 av 4
kombinationer i en webbläsare, priserna oförändrade. Rundans README har före och efter och hur det återställs.

Tre egenskaper som inte ska tas bort:

1. ☠️ **Aosoms galleri per artikel är facit för ett fotos ägare** (`foton[].S` i Härma-analysen). Alt-texten och ögat räcker inte, för två miljöbilder med
   samma scen i olika färg ser ut att höra ihop.
2. ☠️ **En rättning av ägare rör bara länkarna.** Filerna ligger kvar (bildstädningen är avstängd), och en radering och ny hämtning hade gett samma foton
   med nya fil-id utan att ägarna ändrats.
3. ☠️ **Varukorgens bild är fortfarande färgens första foto för båda storlekarna** (Svart × 60 liter visar 45-litersartikelns packshot i varukorg, kassa
   och order). Det gäller alla tvåaxliga sidor och kräver motorändringen (d) under *Kvar efter natten*.

✅ **Samma mönster fanns på de andra Härma-sidorna och är rättat 2026-10-28** (Leonards ja 2026-10-27, punkt 6, FLAGGADE lärdom 232 och 238, rundan
`tools/polish-assets/runda-bilder-harma-exakt/`). Efter att soptunnan rättats hade 12 av de 30 sidorna minst en kombination där butikens första bild var ett foto Aosom
visar för en annan kombination (22 av 130 kombinationer). Tabellen `harma-aldre-bilder.tsv` och underlaget `aosom-galleri-per-kombination.json` (vilka kombinationer
Aosom visar varje gammalt foto under, utan artikelnummer) ligger i soptunnans mapp, eftersom Härma-analysen bara finns i en privat scratchpad.
