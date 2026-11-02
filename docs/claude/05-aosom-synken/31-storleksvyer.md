### Storleksvyer och andra enkla val: mätta först 2026-10-22

Leonards skärmbild 2026-10-22 18:29 UTC: växthusplasten `b729a465` (Aosom) visade **en** bild för storleken 6 × 10 m, fast galleriet har sex.
Färgkontrollerna kunde aldrig se den, eftersom `katalogkontroll-farg-antal.js` bara mäter sidor med en option som heter Färg. **Storlekar och andra
val (modell, volym, antal) var aldrig mätta förrän nu**, och allt ovan om *4 är godkänt* gäller färgvyer.

Butikens regel på en sida med EN option som inte är färg, kontrollerad live på 17 sidor (varje val stämde):

1. En länkad bild visas bara för det FÖRSTA val i optionen som länkar den.
2. En bild som inget val länkar är gemensam och visas för alla val.
3. Äger ett val ingenting och ingen bild är gemensam visar butiken hela galleriet (8 × 10 m på växthusplasten).

Verktyg i `tools/polish-gates/`, båda körs via ExecuteWixAPI:

- `katalogkontroll-val-antal.js` räknar varje val på sidor med ett enda val som inte är färg (36 s för hela katalogen). Svaret säger hur många sidor som
  hoppades över (`utanOption`, `endastFarg`, `flerAxlar`). Sidor med två axlar mäts live per kombination med `live-galleri.mjs`.
- `avlank-delade.js` lagar överlappande länkar: en bild som länkas från två eller fler val i optionen blir olänkad och därmed gemensam. ☠️ Den vägrar
  skriva om någon vy skulle få färre bilder, vägrar en färgoption och en sida med två axlar, rör aldrig galleriet och läser tillbaka länkar,
  varianternas id, SKU, synlighet och pris. Kör `variantbild.yml` (skarp, `ids`) efteråt; den svarade *redan rätt* på de två sidor som rättats.

Utfall 2026-10-22: av 5 092 publicerade sidor har 3 923 ingen option med två val, 910 bara färg, 49 två axlar och **210 ett enda val som inte är färg**.
Av de 210 har **115 sidor ett val på fyra bilder eller färre** (69 Aosom, 46 AliExpress) och **49 sidor ett val på tre eller färre** (98 val, 27 Aosom
och 22 AliExpress). Orsakerna är två. (1) Överlappande länkar, där ett senare val svälts: 17 sidor med svaga val, bara två Aosom (`b729a465` 1, 5, 6 → 6, 6, 6
och `0fda8bfe` 6, 1 → 6, 6, båda rättade samma dag och mätta live). (2) En artikel per storlek som fick få rena bilder kvar efter poleringen (hantelsetet
`cad08bfe`: 5, 5 och 2 av tolv), som behöver fler bilder. På de 37 sidor med två axlar som inte är kläder (186 kombinationer, live) har sju en kombination
på fyra bilder eller färre och ingen på färre än tre.

☠️ **Ett mått som kräver ett visst optionnamn mäter namnet, inte katalogen.** Räkna alltid de sidor ett mått hoppar över.

✅ De 15 AliExpress-sidorna med överlappande länkar (PR #762:s lista *Väntar på Leonard*) löstes av butiksändringen (PR #770, mergad 2026-10-24 00:33 UTC) och är mätta live 2026-10-24 14:12 UTC: alla 57 val visar den bildmängd den nya regeln ger, och val under fyra bilder är 15 av 57 (räknat 38 med den gamla regeln på samma länkar). De fyra sidor som har kvar val på tre bilder eller färre rörs inte (Leonard: *låt dom va*), se `FLAGGADE.md` lärdom 216. Storlekarna på Aosom-sidor med få bilder (99 val på 67 sidor
efter de två rättade) gick till Leonard som fil 2 i Cowork-uppdraget 2026-10-22 19:25 UTC, se nästa avsnitt. Detaljerna står i `tools/polish-gates/FLAGGADE.md`
(lärdom 163 och 164).
