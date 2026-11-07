# Elmotorcykeln `5419c746`: rena foton till Röd och Himmelsblå (2026-11-05)

Leonard: *"Hämta båda alternativens rena bilder o koppla till rätt alternativ"*.

Röd visade en enda bild (ett barnfoto) och Himmelsblå fyra, varav två var våra egna kort. Listningen bakom sidan gick inte att läsa
(`ae-skubilder.yml`: HTTP 500 två gånger, tre andra AE-sidor gick samma minut), och importens originalfiler är borta ur Media Manager.
Fotona på sidan var däremot desamma som på den publicerade syskonsidan `5c506192` (samma modell, Röd och Mintgrön, sex rena bilder
var), så tio filer därifrån lades på med fil-id. Två av syskonets bilder låg redan på sidan (byte-lika) och togs inte med.

| | före | efter |
| :-- | :-- | :-- |
| galleri | ecd6a4fe 857bcf63 43f68eeb c16a7e5e 90b469a3 | ecd6a4fe 2174fb74 960fdead 349021c6 82f3c75d 43f68eeb c16a7e5e 90b469a3 f9c7bbf5 857bcf63 24b059dc 0574f5f5 a0365a06 5d09d6d4 203291b3 |
| Röd | 857bcf63 | f9c7bbf5 857bcf63 24b059dc 0574f5f5 a0365a06 5d09d6d4 203291b3 |
| Himmelsblå | ecd6a4fe 43f68eeb 90b469a3 | ecd6a4fe 2174fb74 960fdead 349021c6 82f3c75d 43f68eeb c16a7e5e 90b469a3 |
| variantbild Röd | 857bcf63 | f9c7bbf5 |

Fil-id:n är de åtta första tecknen efter `b379ce_`. Nya filer (alla 2 000 × 2 000, OCR REN eller bara siffror, dHash ≥ 21 mot allt annat i samma färgvy):
Himmelsblå `2174fb74` (på banan), `960fdead` (snett framifrån, vit botten), `349021c6` (sits), `82f3c75d` (strålkastare).
Röd `f9c7bbf5` (packshot), `24b059dc` (gångväg), `0574f5f5` (barnrum), `a0365a06` (fotpedal), `5d09d6d4` (sits), `203291b3` (måttbild).

1. `skriv.js`: galleriet vid fil-id, sedan länkarna med options och variantsInfo ordagrant ur GET:en, `visible` explicit. Ordningen är utpekad
   (packshot först, miljöbild två, måttbilden sist), eftersom `skriv-fargbilder.js` bara placerar efter färgens sista bild. Torrt först
   (`TORR = true`), sedan skarpt 04:55 UTC. Återläst utan avvikelse: galleri, länkar, alt-texter, variant-id, SKU, pris, kostnad, synlighet, namn, adress.
2. `lank-kort.js` (05:02 UTC): egenskapskortet `c16a7e5e` visar den blå scootern och började visas som andra bild under Röd. Det länkades till
   Himmelsblå.
3. `variantbild.yml` (skarp, `ids`) efter varje skrivning, 1 av 1 rättad båda gångerna.
4. Live 05:06 UTC (`live-galleri.mjs`): Röd `f9c7bb 857bcf 24b059 0574f5 a0365a 5d09d6 203291`, Himmelsblå
   `ecd6a4 2174fb 960fde 349021 82f3c7 43f68e c16a7e 90b469`. Alla tio nya alt-texter står på sidan.
