#### Wix:s regel för variantens bild (mätt 2026-10-23 på tre dolda testprodukter, raderade direkt efteråt)

| skrivning (Storlek och Färg har länkade bilder, Storlek först) | variantens bild |
| :-- | :-- |
| länkarna skrivna med `products` PATCH och val-id | huvudbilden för alla fyra (☠️ se rättelsen nedan: det var **nollställd**, inte oförändrad) |
| namn-skrivning (`products-with-inventory`, valen bara med namn), valen Storlek först | **storlekens första bild** (S → kort 1, L → kort 2, båda färgerna) |
| samma, men bara optionerna omvända, varianternas val kvar Storlek först | samma: storlekskortet |
| samma, optionerna OCH varje variants val Färg först | **färgens första bild** (Svart → svart, Silver → silver), kvar efter en omskrivning |

Regeln: **variantens bild är första länkade bilden hos det första valet i variantens egen `choices`-lista som har länkade bilder**, och den räknas om bara vid en namn-skrivning. Optionernas ordning ensam
räcker inte, och Wix tar emot en ändrad optionsordning (`optionsordning` gick från *Storlek > Färg* till *Färg > Storlek* i en PATCH). `forvantadBild` i `lib/wix/variant-media.ts` räknade då ett snitt i stället (borttaget samma natt, se nedan),
och på de åtta sidorna nedan (25 varianter), där snittet är tomt för någon kombination, var den lagrade bilden inte huvudbilden på någon av dem som skiljde sig (till exempel Svart × 99 tum på projektorduken
och alla fyra varianterna på förvaringskistan) utan alltid första bilden hos första valet.

☠️ **Rättelse 2026-10-23 ca 02:20 UTC: en id-skrivning av optionerna NOLLSTÄLLER variantens bild till huvudbilden.** Första raden i tabellen sa *oförändrad*, men variantbilden var redan huvudbilden i det provet, så
det gick inte att skilja *oförändrad* från *nollställd*. Ett nytt prov på en dold testprodukt (Storlek > Färg, färgerna länkade, raderad direkt efteråt) skilde dem åt:

| steg | Silvers variantbild |
| :-- | :-- |
| namn-skrivning (valen Storlek, Färg), bara färgerna länkade | **Y1**, färgens första foto |
| id-skrivning som omordnar Silvers lista (Y2, Y1) | **X1**, huvudbilden (nollställd, inte Y2) |
| namn-skrivning | **Y2**, färgens nya första foto |
| id-skrivning som länkar storlekarna (båda optionerna har länkar) | **X1**, huvudbilden igen |
| namn-skrivning med varianternas val Färg, Storlek och optionerna kvar Storlek > Färg | **Y2**, färgens första foto |

Följden är större än den här sidan. `lank-om-bilder.js`, `bygg-agare.py`, `avlank-delade.js` och `bilder-bort.yml` skriver optionerna med val-id, och varje sådan skrivning nollställer variantbilden på sidan.
`variantbild.yml` och nattens `/api/cron/variantbild` rättade det på sidor där `forvantadBild` kunde räkna (länkar på EN option), men på en sida med länkar på båda optionerna var snittet tomt (varje bild har en
ägare, så listorna har aldrig något gemensamt), och en variant utan förväntan hoppades över (lagat i motorn samma natt, se *Motorn rättar nu …* nedan). Sådana sidor förblir nollställda tills någon kör en namn-skrivning med färgen först. Det hände soptunnan
`c841717c` (`bilder-bort.yml` 00:51 UTC, två minuter efter att namn-skrivningen satt Silver → silverpackshoten; `variantbilder: rätt` i den körningens svar betydde bara att ingen förväntan fanns) och
alla 16 sidor nedan. Variantens egen valordning styr, inte optionernas: med varje variants val Färg först och optionerna kvar Storlek > Färg räknar Wix variantens bild ur färgens första foto även
när storleken också har länkar. Det betyder att optionerna inte behöver läggas om (som på soptunnan och förvaringskistan) för att varukorgen ska visa rätt färg.

☠️ **Ett galleritillägg nollställer också variantens bild** (mätt 2026-10-23 03:4x UTC på tre publicerade sidor, inte på en testprodukt). `galleri-tillagg.js` lägger filer sist i galleriet med en `products` PATCH och
fältmask `media`, och efteråt var Wix variantbild huvudbilden: på hammocken alla sju varianter (`1d1a5b`), på kantskydden Flerfärgad × Ø244 (`15ac19` → `13c2a1`) och på hundbädden Ljusgrå och svart × 75 × 51 × 18 cm
(`aef2eb` → `49d9fa`). Skrivningen rör varken valens länkar, varianternas id, SKU, pris eller lager (jämförs före och efter), men den räknar om variantbilden till huvudbilden. Kör alltså `variantbild-farg.js` (två optioner) eller
`variantbild.yml` (en option) efter varje galleriskrivning, som efter varje id-skrivning av optionerna.

☠️ **Och en annan bild än Wix egen heter också "variantens bild" i sidans data.** `variantTable[].image` i butikens sidodata är butikens uträkning ur färgvalets första länkade bild
(`lib/variant-price.ts`, `v3MultiVariantData`: färgens `linkedMedia[0]`, annars första axelns), inte Wix `variantsInfo.variants[].media`. Det är butikens första bild i galleriet för valet
(`synligaBilder` lägger den först), och den ändras av en listas ORDNING men aldrig av en nollställning. Varukorgen, Wix kassa och ordern läser Wix variantbild. Därför kunde
katalogkontrollens `VARUKORG` vara 0 medan Wix variantbild var huvudbilden på alla 16 sidor. Wix sida mäts med `tools/polish-gates/variantbild-farg.js` i torrläge (nedan).
