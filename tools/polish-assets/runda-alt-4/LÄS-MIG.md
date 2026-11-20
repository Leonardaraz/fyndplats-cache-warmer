# runda-alt-4: alt-texter på galleribilder som saknade dem (2026-11-20)

Leonards uppdrag: *"jag vill att du skriver alt texter på alla som saknar dom där 889 också"* (svepet i FLAGGADE 359, resultatet i FLAGGADE 360).
Den här rundan: **21 publicerade sidor, 127 bilder, 120 nya alt-texter och 7 befintliga som ligger kvar.**

- `ids.tsv`: sidorna (kort, produkt-id, namn).
- `bilder.tsv`: varje sidas bilder i den ordning de ligger i Wix, med positionerna 101, 102 … så att `bygg-media.py` inte flyttar någon bild (runbook steg 3).
- `alt.tsv`: alt-text per bild, `kort ⇥ position ⇥ text`. Skrivna ur kontaktark och enskilda bilder, på svenska och olika för varje bild.
- `kallor.json`: de tal som får stå i en alt-text per sida (`gate-alt.py`).
- `grind-undantag.txt`: tom, ingen grind kvitterad.
- `nyttolast-media.json` och `bildplan.json`: byggda med `bygg-bildplan.py` (`gate-alt.py` och `bygg-media.py` rena). `plan_sha256` = `88540b504283694853980ab20acb0542c6d5bd122914cbac862e7bb9c5fc580e`.
- `anmarkningar-grupp-7.md`: skribenternas iakttagelser (bilder som borde bytas, kort med leverantörsord, märken i bild, bild och text som inte stämmer).

Körning (alla utanför Aosoms synkfönster): torr 05:35 UTC (körning 479), skriv 05:35–05:37 UTC (körning 480), i `polish-bilder.yml` med `ref` på poleringsgrenen.
Efter skrivningen lästes varje sida om ur Wix och jämfördes med planen (`id::alt` per bild, i ordning), tillsammans med namn, adress, synlighet och revision.
