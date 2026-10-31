# Elkaminer: Fyndplats-korten sist och fler rena leverantörsbilder (2026-10-31)

Leonard 2026-10-31 (kategorin /kategori/elkaminer): *"Gör samma sak du gjorde för elementskydden"*, alltså
korten sist och fler rena bilder ur leverantörens egen uppsättning.

Kategorin har 40 sidor, och alla är Aosom-sidor (kontrollerat med "Leverantörslänkar", krypterat). Fem är
sammanslagna sidor med val (färg eller storlek). De andra 35 har en artikel var.

- **Korten ligger nu sist** på de 17 enartikelsidor som har dem (3200 px-bilderna med Fyndplats-logotyp).
  `elkamin-74-cm-glas-tre-sidor` hade dem redan sist. Inga kort byggs och inga tas bort.
- **Position 10 ur leverantörens bilder** hämtades för 34 sidor (`aosom-bildkandidater`, 34 av 34 uppladdade,
  inga missar) och granskades på kontaktark. 26 var rena miljöfoton som sidan saknade och lades till. Åtta
  ströks som dubbletter av en bild som redan låg på sidan (dHash 0–10 mot en befintlig bild, och för några
  jämfört sida vid sida): glas-tre-sidor-1800-w, vaggkamin-72, vaggkamin-65x52, vit-55-27, vit-54-1850,
  konsol-9-lagfarger, brun-hylla-80 och ultratunn-termostat.
- **Fyra sidor som fortfarande hade för få rena bilder** fick feedens position 3–9 hämtade. Nästan allt var
  tyska säljgrafiker eller dubbletter. Det som togs med: `elkamin-vit-54-cm-1850-w` position 7 (baksidan,
  med ventilationsgaller och typskylt), `elkamin-vit-sprojsat-fonster` position 4 och 5 (två miljöbilder)
  och ett utsnitt ur position 4 för `vaggkamin-72-cm-svart-ram` (rummet över textraden, via Wix crop-adress,
  1 380 × 1 380 px från x 330). Termostatkaminen (`ultratunn-elkamin-termostat-veckoschema`) står kvar på
  fyra bilder: alla andra positioner bär tysk text.
- **Position 1 på `vit-omramning-98-cm`** hämtades men är samma 688 × 667 px-bild som redan ligger där: feeden
  har ingen större version. Den lades inte till.
- Bildplanen bär bara Wix fil-id. 31 sidor ändras, fyra är orörda. En sida (`74-cm-glas-tre-sidor`) hade
  inga alt-texter alls på sina sju bilder, och de är skrivna i samma plan.
- De fem sammanslagna sidorna (val med länkade bilder) ligger utanför planen, eftersom en bildplan kan
  nollställa valens länkar (lärdom 273). De två som har ett kort (`45-cm-svart-2000-w`,
  `45-cm-oppningsbar-lucka`) hanteras separat med länkarna lästa före och efter.

## Utfall (2026-10-31, skrivet 22:18–22:24 UTC, långt från Aosoms synkfönster)

- Skrivet med "Polering — skriv bara bilderna", torrt först: 31 sidor (plan-sha `26c588c7…`, 128 s) och de två
  sidorna med färgval (plan-sha `01d79a45…`, 110 s).
- Läst tillbaka i en separat läsning: **35 av 35 enartikelsidor** har galleriordning och alt-texter lika med
  planen (de fyra orörda oförändrade), alla publicerade. De två sidorna med färgval: kortet sist i galleriet,
  valens länkar, variantbilder (`47677b`/`54ff52` och `5e33d2`/`c85859`), SKU, priser (879, 879, 1 019, 1 059 kr)
  och synlighet **oförändrade**. Bildplanen nollställde alltså inte länkarna när den bara flyttade ett kort.
- Live (butikens sidor): **37 av 37** visar galleriet i Wix ordning, med kortet sist. Bilder per sida efter
  rundan: de flesta har fem eller fler rena bilder, `ultratunn-elkamin-termostat-veckoschema` har fyra.
- OCR på de 30 nya bilderna: 22 helt rena, resten text på rekvisita (bokryggar, en skylt i bakgrunden, en
  burketikett). Ingen tysk eller engelsk säljtext.
