#### Katalogkontrollen och de åtta sidorna

`katalogkontroll-tva-lankade-optioner.js` (35 s, bara läsning): av 5 092 publicerade sidor har 49 två optioner med minst två synliga val, och **8 har länkade bilder på båda**, alla med tomt snitt för någon
kombination. Ett tomt snitt är ingen defekt i sig. De åtta mättes live per kombination med den lagade `live-galleri.mjs` och mot sidornas `variantTable`:

| sida | vad kunden ser | åtgärd |
| :-- | :-- | :-- |
| hundgrinden `6eb13a16` | rena vyer, varukorgens bild rätt | ingen |
| bänkdynan `a7aa9370` | rena vyer (varje färg finns i en storlek), varukorgens bild rätt; Ljusgrå visar två bilder | ingen |
| vedboden `4a2ab58e` | rena vyer, varukorgens bild rätt (150 × Mörkgrå och 213 × Grön är slutsålda) | ingen |
| tunnelväxthuset `5466fe81` | rena vyer; Grön × 397 visar tre måttbilder (397 två gånger, 597 en gång) | låg |
| buxbomsklotten `7d1fb82b` | en olänkad 50 cm-bild visas under 40 cm; 50 cm-bilderna nämner ingen färg | låg |
| projektorduken `926ec7a2` | storlekarnas bilder visas **aldrig**: butikens `imageOwners` bär etiketten *85 tum (216 cm)* medan väljaren säger *85 tum*; färgen Svart har ingen variant i 85 tum | butiksfel, se nedan |
| hamsterburen `13fe619f` | ☠️ Naturträ × 85 × 45 visar de fem bilderna av den grå burens storlek och varukorgen en grå bur | kan inte rättas med länkar, Leonard avgör |
| förvaringskistan `b129d5ae` | ☠️ varukorgens, kassans och orderns bild var storlekens måttkort på alla fyra varianter (Storlek först, storlekarna bär länkar) | rättad 2026-10-23 med Leonards ja: Färg först och en namn-skrivning (`farg-forst.js`), se *Förvaringskistan* nedan |

(Kolumnen *varukorgens bild* i tabellen är läst ur sidans `variantTable`, alltså butikens uträkning. Wix egen variantbild mättes för alla 49 sidor först 2026-10-23 02:5x UTC, se *Biverkningen* under *De 16 sidorna rättade*.)

Hamsterburen har tre varianter (100 × 52 Mörkgrå, 85 × 45 Mörkgrå, 85 × 45 Naturträ) och tre bildset. Med unionen går det inte att ge Naturträ bara sina fem och Mörkgrå × 85 × 45 bara sina: det kräver
att valen blir ett enda (*100 × 52 Mörkgrå* med flera). Förvaringskistan har färgfoton på färgen och ett måttkort per storlek: den får Färg först och en namn-skrivning, som soptunnan.

☠️ **Projektorduken är ett fel i BUTIKEN (headless-site), inte i motorn.** Sidans data har två etiketter för samma val, och storleksbilderna matchas mot den som inte stämmer med väljaren. Det finns inget
att göra här, men en storleksbild på en sida där butiken lägger till ett måttord i etiketten visas aldrig. Sidans Wix-data är rätt (`85 tum`).

Fem saker som inte ska tas bort:

1. ☠️ **På en tvåaxlig sida bär EN option bilderna.** Länkar på båda optionerna ger blandade vyer, och en bild som visar en färg i en storlek kan aldrig visas för just den kombinationen. Undantaget är
   färgneutrala måttkort som länkas till storleken.
2. ☠️ **Variantens bild kommer från första valet i variantens `choices`-lista som har länkade bilder.** Skriv Färg först i varje variants val (optionernas ordning behöver inte ändras) och gör en namn-skrivning efteråt.
   En skrivning med val-id (`lank-om-bilder.js`, `skriv-fargbilder.js`, `bilder-bort.yml`) räknar inte om bilden utan NOLLSTÄLLER den till huvudbilden (rättelsen ovan), så `variantbild-farg.js` ska följa efter varje sådan
   skrivning på en sida med länkar på båda optionerna.
3. ☠️ **Läs sidans `imageOwners` och `variantTable` innan du kallar en sida rätt eller fel.** Räknarna i katalogkontrollerna ser länkar, inte vad butiken gör av dem, och en mätning ensam (`live-galleri.mjs`)
   visar bara vyn, inte varför.
4. ☠️ **Mät en kombination i taget, med valen uppslagna på namnet.** `live-galleri.mjs` letade upp valen på etiketten som stod när listan lästes, och den ändras med det andra valet (*Beige – finns inte i
   100 cm*, *150 cm – slut i lager*). Klicket missade då varje färg som saknades i den storlek som var vald, och raden visade föregående färgs galleri (buxbomsklotten Olivgrön och bänkdynan Ljusgrå).
   Lagat 2026-10-23: valet letas upp på namnet före ` – `, i den färska sidan, vid varje klick.
5. ☠️ **En ny test kräver en dold testprodukt som raderas direkt.** De tre testerna ovan gjordes mot `products-with-inventory` (POST, tre PATCH och DELETE, 11–15 s per körning), med bilder som redan låg
   i Media Manager. Produkten raderades i en `finally`, och en läsning efteråt gav 404.
