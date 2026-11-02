#### Korten per storlek: `runda-bilder-soptunna-storlekskort` (2026-10-23)

Fem måttbilder går inte att rätta med länkar (se ovan), så de ersattes av **två färgneutrala kort, ett per storlek**: `c841717c-45` och `c841717c-60`, byggda med `bygg-kort.py` ur `kort.tsv` (kortgrinden 0 fynd,
två jämförelser mot sidans parentesrader kvitterade i `kort-avvik.txt`: sidan skriver båda storlekarna på samma rad och grindens parentesstrippning tar bort 60-litersvärdet). Fotot är en svart och en silvertunna
sida vid sida (kortet säger *Svart eller silver*), siffrorna kommer ur sidans text (mått 61,9 × 36,6 × 43,2 respektive 56,7 cm, 3 × 15 respektive 3 × 20 liter, fraktvikt 9,8 respektive 11 kg) och
etiketten är *Fraktvikt*, som sidan säger. Korten ligger i grenen, var uppladdade (`b379ce_255c27…` och `b379ce_4731c0…`, byte-lika med de lokala filerna, READY) och skrevs med `skriv-storlekskort.js`
(byggt av `bygg-storlekskort.py` ur `storlekskort-plan.json`; planens FNV-summa räknas om i skriptet). Leonard sa ja 2026-10-23 strax före 00:50 UTC, och skrivningen gjordes 00:49 UTC, före Aosoms
lagerfönster 03:12.

`skriv-storlekskort.js` gör fyra steg, var och ett med återläsning: korten sist i galleriet med alt-text, korten länkade till sin storlek och optionerna Färg först (id-skrivning), varianterna omskrivna med
valen bara med namn och Färg först (namn-skrivning, så att Wix räknar om variantbilden), och en jämförelse av allt som inte ska ändras (varianternas id, SKU, pris, kostnad, synlighet och lager, namn, adress,
färgens länkar och galleriets gamla bilder). Faller länkningen rullas galleriet tillbaka. Det vägrar en storlek som redan bär länkade bilder och ett färgval utan länkade bilder. Torrkörningen 00:3x UTC
(ingenting skrivet) gav `galleri 14 → 16`, `Storlek > Färg` → `Färg > Storlek` och en vy per kombination på de sju färgbilderna plus storlekens kort.

☠️ **Skrivningen är också provad på riktigt, på en dold testprodukt av samma form** (14 filer ur soptunnans galleri, Storlek 45 och 60 liter × Färg Svart och Silver, färgerna länkade, storlekarna olänkade, en lagerrad per
variant). Svaret var `ok: true` med 0 avvikelser, `revision 2 → 5`, `galleri 14 → 16`, optionerna `Färg > Storlek` och variantbilderna Svart → svart packshot (båda storlekarna) och Silver → silverpackshoten (båda storlekarna).
Varje vy visade de sju färgbilderna plus sin storleks kort som sista bild. Testprodukten raderades direkt efteråt, och en läsning gav 404. Torrkörningen ser vad som ska ske, men bara en riktig skrivning visar
att Wix räknar om variantens bild, så en ny sådan sida ska provas på samma sätt först.

De fem gamla måttbilderna togs bort **efteråt** med `bilder-bort.yml` (torrt, sedan skarpt med planens sha), så att ingen vy någonsin visar en bild utan ägare. Efter borttagningen har Svart fem bilder
(1, 2, 3, 4, 6 i det gamla galleriet) och Silver fyra (8, 11, 12, 13), plus ett kort per storlek: varje kombination visar fem bilder.

☠️ **Utfallet på soptunnan, skrivet 2026-10-23 00:49 UTC:** `ok: true`, 0 avvikelser, revision 39 → 42, galleriet 14 → 16, optionerna `Färg > Storlek` och variantbilderna Svart → svart packshot (`9a66fa`)
och Silver → silverpackshoten (`c63be6`) i båda storlekarna. Varianternas id, SKU, pris, kostnad, synlighet och lager var orörda. `bilder-bort.yml` tog bort de fem måttbilderna direkt efteråt (torrt 00:50 UTC,
run 39880507743, skarpt 00:51 UTC, run 39880590274, planens sha `a6438d5f…`): galleriet 16 → 11, återläst (galleri, alt-texter, länkar, synlighet och varianter), `variantbilder: rätt`, revision 44.
Galleriet är nu Svart 1–5, Silver 6–9, kortet för 45 liter (10) och kortet för 60 liter (11); varje storlek länkar bara sitt kort.
☠️ **Variantbilden nollställdes av just den borttagningen och rättades först 02:3x UTC.** `bilder-bort.yml` skriver valens länkar med val-id (se rättelsen under *Wix:s regel för variantens bild*), och
Wix gjorde då Silver → `9a66fa`, huvudbilden, på alla fyra varianterna. `variantbilder: rätt` i körningens svar betydde bara att `forvantadBild` då inte kunde räkna (`inget_snitt`). Mätt 02:2x UTC med
Wix egen läsning, och rättad 02:37 UTC med `variantbild-farg.js` (Silver → `c63be6`, revision 44 → 45, 0 avvikelser). Wix variantbild, som varukorgen, kassan och ordern läser, var alltså den svarta tunnan för
Silver i ungefär 1 tim 45 min. Ingen order lades under fönstret: Search Orders utan statusfilter 2026-10-23 ca 03:00 UTC gav inga ordrar efter 10116 (2026-10-22 20:50 UTC). Varukorgar som aldrig blev order går inte att kontrollera.

**Live 01:0x UTC** (butikens cache renderad 00:55:51, efter sista skrivningen 00:51:31; `live-galleri.mjs` en kombination i taget): Svart × 45 liter visar de fem svarta fotona och 45-kortet (1 299 kr),
Svart × 60 liter de fem och 60-kortet (2 029 kr), Silver × 45 liter de fyra silverfotona och 45-kortet (1 179 kr, slutsåld sedan 2026-10-17) och Silver × 60 liter de fyra och 60-kortet (1 959 kr). Varje storlek
visar bara sitt eget kort, och ingen kombination visar en bild av fel färg. Väljaren står Färg före Storlek. Mobilskärmbilder av Silver × 45 och × 60 liter visar silvertunnan som första bild.
