# runda-alt-2: alt-texter på galleribilder som saknade dem (2026-11-20)

Leonards uppdrag: *"jag vill att du skriver alt texter på alla som saknar dom där 889 också"* (svepet i FLAGGADE 359, resultatet i FLAGGADE 360).
Den här rundan: **44 publicerade sidor, 285 bilder, 262 nya alt-texter och 23 befintliga som ligger kvar.**

**En befintlig alt-text är omskriven:** `654d3653` bild 4 (en storleksskiss på en sida med bildval) började på *Måttskiss* och stod på plats 4 av 7. `bygg-media.py` lägger en sådan bild sist, så rundan hade flyttat den. Inledningen är därför ändrad från "Måttskiss av olivträdet, 180 cm högt med kruka på 15 cm" till "Skiss av olivträdet med inritade mått, 180 cm högt och kruka på 15 cm". Alla andra befintliga alt-texter i rundan är byte för byte oförändrade.

- `ids.tsv`: sidorna (kort, produkt-id, namn).
- `bilder.tsv`: varje sidas bilder i den ordning de ligger i Wix, med positionerna 101, 102 … så att `bygg-media.py` inte flyttar någon bild (runbook steg 3).
- `alt.tsv`: alt-text per bild, `kort ⇥ position ⇥ text`. Skrivna ur kontaktark och enskilda bilder, på svenska och olika för varje bild.
- `kallor.json`: de tal som får stå i en alt-text per sida (`gate-alt.py`).
- `grind-undantag.txt`: tom, ingen grind kvitterad.
- `nyttolast-media.json` och `bildplan.json`: byggda med `bygg-bildplan.py` (`gate-alt.py` och `bygg-media.py` rena). `plan_sha256` = `18a34c819b0941bdd8c604ed07ead69ca420f2ba316a54053a2390c3d6f03c99`.
- `anmarkningar-grupp-3.md`, `anmarkningar-grupp-4.md`: skribenternas iakttagelser (bilder som borde bytas, kort med leverantörsord, märken i bild, bild och text som inte stämmer).

Körning (alla utanför Aosoms synkfönster): torr 05:28 UTC (körning 475), skriv 05:29–05:31 UTC (körning 476), i `polish-bilder.yml` med `ref` på poleringsgrenen.
Efter skrivningen lästes varje sida om ur Wix och jämfördes med planen (`id::alt` per bild, i ordning), tillsammans med namn, adress, synlighet och revision.
