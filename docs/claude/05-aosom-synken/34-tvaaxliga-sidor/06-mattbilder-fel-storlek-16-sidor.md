#### Måttbilder för fel storlek på 16 sidor till (Leonards fråga 2026-10-23)

Leonards fråga efter soptunnan: *"Har vi fler produkter som har samma fel som soptunnan?"* `katalogkontroll-tva-lankade-optioner.js` ovan ser bara sidor med länkade bilder på BÅDA optionerna och svarade
därför nej på den halva av felet som är länkarna. Soptunnans andra fel, att måttbilden för en annan storlek visas under valet, uppstår också när färgen ensam bär bilderna: butikens vy är bilder utan ägare plus
bilder som ägs av det valda färg- eller storleksvalet, och en måttbild som ägs av färgen visas under varje storlek. Det var aldrig mätt på tvåaxliga sidor (`katalogkontroll-delade-malbilder.js` tar bara sidor
med ETT val).

`katalogkontroll-tva-axlar-bilder.py` (ren läsning; `--hamta` hämtar sidorna från butiken; indata ur `katalogkontroll-tva-axlar-slugs.js`, 29 s) läser butikens EGEN sidodata (`images`, `imageOwners`,
`imageAlts`, `variantAxes`, `variantTable`) och räknar vyn per kombination. Modellen är mätt mot webbläsaren (`live-galleri.mjs`) på skrivbordet `3b868848` och matstationen `1d4eb6b1`: samma bilder i samma
ordning på alla elva kombinationer. Körd 2026-10-23 01:2x UTC över alla 49 sidor med två val:

| | sidor |
| :-- | --: |
| minst en MÅTTBILD som hör till ett annat val än det valda (SPEC) | **16** |
| bara foton som nämner ett annat val (FOTO) | 6 |
| varukorgens bild fel där färgen bär bilderna, enligt BUTIKENS uträkning (☠️ inte Wix variantbild, se rättelsen under *Wix:s regel för variantens bild*) | **0** (hamsterburen `13fe619f`, där storleken bär dem, är redan känd) |
| färgträffar (tips) | 8: sammansatta färger, "på vit bakgrund" och avsiktliga kompilationer, utom hamsterburen och projektorduken |

SPEC, måttbild för fel storlek: matstationen `1d4eb6b1` (2 måttbilder), kattrappan `4d9ba658`, den hopfällbara hundbädden `c3d1fa41`, kantskydden `44d4907b`, hammocköverdraget `91f5c078`, odlingstunneln
`38f70f83` (3), julgranen `75a38b7b`, väggspegeln `c438d4ba` (+7 foton), hundsängen med tak `934297b1` (2), hundbädden med tak `01ac2f63` (3), sensorsoptunnan `92fc308c` (+8 foton), vedboden `4a2ab58e`
(+5 foton), tunnelväxthuset `5466fe81` (2), bokhyllan `79ab08fe` (+5 foton), det fällbara skrivbordet `3b868848` (+4 foton) och buxbomsklotten `7d1fb82b`. Bara FOTO: hundgrinden med husdjursdörr `8018bb95`
(5), verktygslådan `aafbf543` (6), de runda kantskydden `14fb0f98`, förvaringsmöbeln för barnrummet `0136e7d9` (2), projektorduken `926ec7a2` (butiksfelet) och soptunnan `c841717c` (två foton av 60-litersversionen
i färgens egen uppsättning, lämnade med flit: de visar samma tunna).

Orsaken är en annan än på soptunnan. Sammanslagningen och färgbildsverktygen länkar givarens och värdens bilder till FÄRGEN (*färgen bär bilden*), och en måttbild som anger måtten för en storlek följer med
dit. Butiken visar sedan färgens alla bilder under båda storlekarna, så under 44 × 24 cm ligger matstationens måttbild för 58,4 × 30,5 cm, och tvärtom. Varukorgens, kassans och orderns bild mättes inte här: kontrollens
VARUKORG-rad är butikens egen uträkning ur färgens första foto, inte Wix variantbild (se rättelsen under *Wix:s regel för variantens bild*).

**Förslaget (Leonard sa ja 2026-10-23 ca 01:40 UTC, och utfallet står i nästa avsnitt):** soptunnans recept, sida för sida. En måttbild som är en ritning utan färg (vit botten, bara mått) länkas bort från färgen och till sin
storlek med `lank-om-bilder.js` (galleriet rörs inte), och Färg sätts före Storlek med `farg-forst.js`. En måttbild som är ett foto av en viss färg (den vita tunnelns måttbild) går inte att länka utan att
visas under fel färg, och ersätts då av ett färgneutralt kort per storlek som på soptunnan (`bygg-kort.py`, `gate-kort.py`, `skriv-storlekskort.js`). Foton som nämner en annan storlek rörs inte: de visar
samma vara och en länk till storleken hade visat dem under fel färg. ⚠️ **Det blev ett enklare recept:** bara länkar, inga nya kort, inga ändrade galleri och ingen ändrad optionsordning (`bygg-agare.py`, nästa avsnitt), följt av en namn-skrivning av varianterna med färgen först (`variantbild-farg.js`), eftersom varje länkskrivning nollställer Wix variantbild.

Tre egenskaper som inte ska tas bort:

1. ☠️ **Kontrollen läser butikens sidodata, inte bara Wix länkar.** En räkning av länkar (`katalogkontroll-tva-lankade-optioner.js`) ser 9 av de 49 sidorna, och 13 av de 16 sidorna med en måttbild för fel
   storlek ligger utanför de 9. Vyn är unionen av ägare, så den räknas ur `imageOwners`. Kontrollen kan fälla (mutationsprov: variantens bild byttes mot en annan färgs på verktygslådan, och VARUKORG fällde
   på just den varianten).
2. ☠️ **Alt-texten är ett tips, bilden avgör.** SPEC och FOTO bygger på att alt-texten nämner ett annat vals tal. En bild vars alt-text inte nämner något val syns inte, och sammansatta färger ("Svart och Röd")
   ger FÄRG-träffar på den egna färgen. Titta på bilden innan en sida rättas.
3. ☠️ **Mät hela katalogen när ett fel hittas på en sida.** Soptunnan hittades av Leonards skärmbild, och samma slags fel låg på 16 sidor som tidigare mätningar (antal bilder per färgvy och per storleksvy) inte
   kunde se, eftersom de räknade bilder och aldrig läste vad bilderna visar.
