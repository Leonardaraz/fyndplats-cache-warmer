#### Motorn rättar nu sidor med länkar på båda optionerna (Leonards ja 2026-10-23)

Leonard 2026-10-23, på frågan om motorn ska rätta de här sidorna av sig själv: *"Fixa alla frågor så proffsigt som möjligt"*. Varje id-skrivning på en sida med länkar på båda optionerna
(`lank-om-bilder.js`, `avlank-delade.js`, `bilder-bort.yml`, färgbildsverktygen) nollställer variantbilden, och nattens `/api/cron/variantbild` såg det inte. Ändrat i `lib/wix/variant-media.ts`
(PR #762, 53 tester, mutationsprövade).

✅ **Mergad 2026-10-23 04:25 UTC** (squash `048ac5b6`, Leonards *Merga*). Produktionsbygget `dpl_5F7P2hiFDGyysHLKBnRLAXt47wZR` blev READY efter ungefär 84 sekunder, och butiksprojektets bygge
blev CANCELED med `#ignored-build-step`, så butikens ISR-cache rördes inte. Första nattkörningen på den nya koden gick 05:35 UTC (utfallet står i punkt 5 nedan). ☠️ **Fönstret på upp till ett dygn finns kvar** mellan en
galleri- eller länkskrivning och nästa 05:35: kör `variantbild-farg.js` (två optioner) eller `variantbild.yml` (`ids`) direkt efter en sådan skrivning som förut. Cronen är nätet under, inte ersättningen.

☠️ **Wix räknar ingen skärning, och det är mätt, inte antaget.** Motorn förväntade tidigare första bilden som ligger i ALLA valens listor. Ett prov på en dold testprodukt (raderades direkt, 404 efteråt) med
**överlappande** listor: Färg Svart [X2, X1], Silver [Y2, Y1]; Storlek S [K1, X1], L [K2, Y1]. Skärningen för S × Svart är X1 och för L × Silver Y1.

| namn-skrivning | S × Svart | S × Silver | L × Svart | L × Silver |
| :-- | :-- | :-- | :-- | :-- |
| efter länkning med val-id (id-skrivning) | huvudbilden | huvudbilden | huvudbilden | huvudbilden |
| färgen först i varje variant | **X2** | **Y2** | **X2** | **Y2** |
| storleken först | **K1** | **K1** | **K2** | **K2** |
| färgen först igen | **X2** | **Y2** | **X2** | **Y2** |

Ingen variant fick X1 eller Y1. Regeln är alltså alltid första bilden hos det första valet i variantens egen valordning som har kopplade bilder, också när listorna överlappar. I katalogen 2026-10-23 följer
**82 av 82 varianter** med bilder på två val (22 sidor, 93 varianter) den regeln, 81 av 82 med färgen först (undantaget är hamsterburen `13fe619f`, Naturträ × 85 × 45), och **ingen** har överlappande listor.

Fem egenskaper som inte ska tas bort:

1. ☠️ **Förväntan är första bilden hos första valet i skrivordningen** (färgoption först, sedan optionernas ordning), `forsta_val` när flera val har bilder. `snitt` och `inget_snitt` finns inte längre.
   Utan färgoption gäller optionernas ordning.
2. ☠️ **Skrivkroppen lägger färgen först i VARJE variant, men bara när minst en variant har bilder hos flera av sina val** (`behovFargForst`). Annars rörs valordningen inte. Optionerna skickas ordagrant:
   variantens egen valordning styr, inte optionernas, så väljarna i butiken är oförändrade.
3. ☠️ **Kontrollen före och efter jämför valen som en mängd.** Ordningen läggs om med flit, men vilka val varianten har ska stå still (annat val, saknat val eller annat variant-id fäller).
4. **Räknar Wix inte om bilden efter skrivningen** blir utfallet `ej_rattad`, och cronen skriver högst en gång per natt och sida. Det stoppar inte körningen (bara `avvikelse` gör det).
5. **Torrkörningen efter mergen och nattens första körning på den nya koden fann tre sidor, inte en (mätt 2026-10-23).** `variantbild.yml` i läget `torr` mot `main` (run 39900434263, 04:28–04:50 UTC) kontrollerade
   **1 174 flervariantsprodukter** (utkast med): 1 171 redan rätt, **3 med fel kvar**, 0 ej rättade, 0 som inte gick att kontrollera och 0 avvikelser. De tre är hamsterburen `13fe619f` (Naturträ × 85 × 45: varukorgens bild blir
   Naturträts första foto i stället för den grå burens), elbilen `7511fc56` (Röd, Grå och Vit) och hundbädden `3c104444` (Brun). Den här raden sa tidigare att hamsterburen var den enda, men den mätningen räknade bara de 22 sidor
   med bilder på två val; torrkörningen läser alla flervariantsprodukter. Nattens körning (`/api/cron/variantbild`, 05:35 UTC, Vercels runtime-logg) gjorde exakt det torrkörningen förutsade: **1 174 av 1 174 kontrollerade,
   `{"ratt":1171,"rattad":3}`, 0 publicerade och 0 utkast med fel bild efteråt**, och rättade hamsterburens Naturträ-variant (1), elbilens tre varianter och hundbäddens Brun (1). Galleriet, länkarna och väljarna rörs inte av
   cronen, och frågan om hamsterburens storlekar ska bära bilderna är fortfarande Leonards. Orsaken till att elbilen och hundbädden hade fel variantbild är inte utredd.
