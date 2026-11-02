### Tvåaxliga sidor: färgfoton på färgen, ett kort per storlek (2026-10-23)

☠️ **Receptet med ett kort per storlek är ersatt:** 2026-10-24 kom originalen tillbaka (se
*Originalen tillbaka* längre ned), och sedan 2026-10-27 byggs inga Fyndplats-kort alls. Kortstegen
i det här avsnittet och i *Leonards svar på de sex frågorna* är historik.

Leonards skärmbild 2026-10-23 00:16 (svensk tid) av soptunnan `c841717c` (Aosom, tre fack i rostfritt stål, Storlek 45 och 60 liter × Färg Svart och Silver, 1 959 kr): med Silver och 60 liter valda
var andra bilden en kvinna i ett kök med en **svart** tunna och tredje en svart tunna. Leonard: *"storleken o färgen har blandade bilder"*, och bad mig rätta sidan (*"kommer du typ fixa denna"*).
Det var hans ja för just den här sidan.

Mätt live per kombination (`live-galleri.mjs`), galleriets plats som siffra (1–7 svarta bilder, 8–14 silverbilder):

| kombination | butikens vy före | efter |
| :-- | :-- | :-- |
| 45 liter × Svart | 2 · 1 · 3 · 4 · 5 · 14 | 1–7 |
| 45 liter × Silver | 8 · **1** · **4** · **5** · 9–14 | 8–14 |
| 60 liter × Svart | 2 · 3 · 4 · 6 · 7 · 14 | 1–7 |
| 60 liter × Silver | 8 · **4** · **6** · **7** · 9–14 | 8–14 |

Sidan hade länkade bilder på **båda** optionerna: Storlek 45 liter länkade den svarta packshoten (1) och en svart måttskiss (5), 60 liter en svart packshot (6) och en svart måttbild (7), eftersom givarnas
första bilder var svarta, och Färg länkade två svarta lifestylefoton till Svart och sex silverbilder till Silver. Två bilder var olänkade, det svarta köksfotot (4) och silvertunnans måttbild för 45 liter (14).
Silver fick därför svarta bilder via storleken och via den olänkade, och Svart fick silvertunnans måttbild.

☠️ **Varukorgens bild var fel på alla fyra varianter.** Wix räknade variantens bild ur storlekens länkar (regeln nedan), så Silver fick en svart tunna i varukorgen, kassan och ordern.
`variantbild.yml` kunde inte laga det: `forvantadBild` räknade då ett snitt mellan optionernas länkar, snittet var tomt för varje kombination (`inget_snitt`), och rutten rapporterade det som `okanda`,
rättade ingenting och gav ingen röd körning. (Motorn rättades samma natt, se *Motorn rättar nu sidor med länkar på båda optionerna* nedan.)

Rättat med `lank-om-bilder.js`, bara länkar, två planer på samma sida (Färg, sedan Storlek med `tomt`): **Svart länkar alla sju svarta bilder (1–7), Silver alla sju silverbilder (8–14) och Storlek inga.**
Galleriets ordning, varianternas id, SKU, pris, lager och synlighet och produktens namn och adress orörda (revision 36 → 38, 0 avvikelser i återläsningen). `variantbild.yml` rättade 1 av 1 (Svart → svart
packshot, Silver → silverpackshoten; revision 39). Skrivet 23:46–23:47 UTC, före Aosoms lagerfönster 00:12–00:29. Live 23:5x UTC (sidans cache renderad 23:50:51, efter skrivningen): Svart visar 1–7 och Silver 8–14 i båda
storlekarna, priserna 1 299, 2 029, 1 959 och 1 179 kr oförändrade. Silver 45 liter är slutsåld sedan 2026-10-17 (lagret orört). Skärmbilder med en mobilstor webbläsare av 60 liter × Svart och × Silver visar rätt färg.
