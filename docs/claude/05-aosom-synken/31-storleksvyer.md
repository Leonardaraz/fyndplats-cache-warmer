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

#### Valens ordning: storlekarna ska ligga i storleksordning (2026-11-06)

Leonards skärmbild 2026-11-06 08:00 svensk tid: hantlarna `4bc344de` visade storlekarna 2 × 4, 2 × 5, 2 × 10 och sedan 2 × 6 kg. **Sammanslagningen lägger
givarens val SIST i optionen** (`lib/aosom/sammanslagning.ts`, `choices: [...valAv(o), valBody(plan.nyttVal[a]!)]`), och 6 kg-givaren slogs ihop med
värden 2026-11-04. Butiken visar valen i den ordning Wix har dem.

Svepet `tools/polish-gates/sortera-val-svep.js` (ExecuteWixAPI, 30 s för alla publicerade sidor med filtret `visible: true`) mätte 6 016 publicerade sidor.
1 220 har en option med minst två val, 238 val som inte är färg har tal i varje val, och **16 låg tydligt fel** (nio Storlek, tre Modell och en vardera
Bärförmåga, Antal, Typ och Längd): hantlarna, rosenträdet (2 träd före 1 träd), tre krypmattor, elskrivbordet, ett taktält, en cirkulationspump, ett
sortimentskåp, en handdammsugare (Typ 2 före Typ 1), skjutdörrsbeslaget (3 m före 2,4 m), ett katthjul, ett arbetsbord, en trädgårdsbänk och en hundgård.
Alla 16 rättades 2026-11-06 före 07:16 UTC med `tools/polish-gates/sortera-val.js`. Bokstavsstorlekarna (13 val) låg alla rätt.

Regler som inte ska tas bort:

1. **Ordningsregeln flaggar bara ett tydligt fel.** Ett val flaggas när ett val före det är större i varje mått (hantlarnas 2 × 6 kg efter 2 × 10 kg), inom
   samma grupp: texten före första siffran, så att *Metall 46 tum* och *Trä 63 tum* är två grupper. Målordningen sorterar varje grupp på måttens produkt
   (area) och därefter måttens ordning, på de platser gruppen redan har. Val utan tal (*Liten – Mellan – Stor*), val med olika antal tal eller blandade
   enheter, och Färg bedöms inte. Sju sidor har en ordning som kan diskuteras (bara produkten går åt fel håll, till exempel 25 mm × 4,6 m före 40 mm × 2,4 m)
   och rördes inte.
2. **☠️ Skrivningen nollar variantens bild.** Wix ger varje variant första valets första bild (hantlarna: alla fyra fick 4 kg-bilden), samma fälla som i
   storleksvalen på vinkylaren. Kör `variantbild.yml` (skarp, `ids` = sidornas fulla id, `utkast=nej`) direkt efter `sortera-val.js`. Körningen 07:16 UTC:
   16 kontrollerade, 13 rättade, 3 redan rätt, 0 avvikelser. Wix lästes tillbaka efteråt (varje varians bild är sitt vals första bild, priser och
   synlighet oförändrade) och butikens sidor hämtades (`age` 88–115 s, alla 16 i den nya ordningen).
3. **Bara publicerade sidor skrivs.** En variantsInfo-PATCH publicerar ett utkast (se `13-variantsinfo-patch-publicerar.md`), så verktyget vägrar dolda sidor.
   13 av 11 414 dolda utkast har samma fel, de flesta AliExpress-sidor med blandade val som *Färg-kvantitet*. De sorteras när de publiceras.
4. **Kör svepet efter varje sammanslagning som lägger till en storlek.** Svepet är torrt och tar 30 s. **Motorfixen är byggd 2026-11-11** (`lib/aosom/valordning.ts`,
   `valPlats` och `valPar`, anropade från `lib/aosom/sammanslagning.ts` både där optionen redan finns och där den skapas med två val): givarens val hamnar på sin plats i
   storleksordning i stället för sist. Funktionen följer svepets regler (bokstavsstorlekar och tal med lika många mått och samma enhetsfamilj, gruppen är texten före första
   siffran), flyttar aldrig ett val som redan finns och låter allt den inte kan bedöma (Färg, *Liten – Mellan – Stor*, olika antal tal, blandade enheter) hamna sist som förut.
   ☠️ **Den gäller först när PR #870 är mergad och bygget är klart:** workflowen `aosom-sammanslagning.yml` anropar den driftsatta appen, så en `ref` på grenen hjälper inte.
   Fram till dess och en tid efteråt gäller svepet efter varje sammanslagning, och det blir kvar som kontroll därefter. Fixen rättar inga sidor som redan ligger fel,
   det gör `sortera-val.js`. Svepet 2026-11-11 fann växthuset `e891b752` (rättat, 180 före 270 cm) och fyra VEVOR-sidor med fel ordning (`605e12f2`, `cf5bdddc`, `d9a8b523`
   och `fef11978`, VEVOR-chattens sidor, orörda här).
5. **Jämför ordningen i butiken, inte texten.** Butiken skriver tum som cm (*29.5 tum* visas som *75 cm*) och lägger *– slut i lager* efter slutsålda val i
   `aria-label`.
