# runda-alt-1: alt-texter på galleribilder som saknade dem (2026-11-20)

Leonards uppdrag: *"jag vill att du skriver alt texter på alla som saknar dom där 889 också"* (svepet i FLAGGADE 359, resultatet i FLAGGADE 360).
Den här rundan: **44 publicerade sidor, 267 bilder, 249 nya alt-texter och 18 befintliga som ligger kvar.**

- `ids.tsv`: sidorna (kort, produkt-id, namn).
- `bilder.tsv`: varje sidas bilder i den ordning de ligger i Wix, med positionerna 101, 102 … så att `bygg-media.py` inte flyttar någon bild (runbook steg 3).
- `alt.tsv`: alt-text per bild, `kort ⇥ position ⇥ text`. Skrivna ur kontaktark och enskilda bilder, på svenska och olika för varje bild.
- `kallor.json`: de tal som får stå i en alt-text per sida (`gate-alt.py`).
- `grind-undantag.txt`: tom, ingen grind kvitterad.
- `nyttolast-media.json` och `bildplan.json`: byggda med `bygg-bildplan.py` (`gate-alt.py` och `bygg-media.py` rena). `plan_sha256` = `79577afc4a142dffbfb78cdb5b251ebeb2eb5c8e39a396c57fd829ef0ef8afe0`.
- `anmarkningar-grupp-1.md`, `anmarkningar-grupp-2.md`: skribenternas iakttagelser (bilder som borde bytas, kort med leverantörsord, märken i bild, bild och text som inte stämmer).

Körning (alla utanför Aosoms synkfönster): torr 05:24 UTC (körning 473), skriv 05:25–05:27 UTC (körning 474), i `polish-bilder.yml` med `ref` på poleringsgrenen.
Efter skrivningen lästes varje sida om ur Wix och jämfördes med planen (`id::alt` per bild, i ordning), tillsammans med namn, adress, synlighet och revision.
