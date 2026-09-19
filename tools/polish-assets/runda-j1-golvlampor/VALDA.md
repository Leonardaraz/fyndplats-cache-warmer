# Runda J1 — golvlampor

Åtta Aosom-utkast i prisbandet 839–1 439 kr. Belysning valdes på mätning:
**3 303 tyska utkast kvar** i 776 namnfamiljer, och lampor är den starkaste
säsongsträffen i september.

## Lagret kollades i urvalssteget

| kort | pris | saldo | vad |
|---|--:|--:|---|
| `9e81d573` | 1 439 | 62 | båglampa 190 cm, tygskärm |
| `13a53d52` | 1 259 | 85 | LED 170 cm, böjd stång, dimbar |
| `09e62d6e` | 1 119 | 32 | 153 cm, guld och vit tygskärm |
| `79411b09` | 1 099 | 72 | 157,5 cm, akrylskärm, 4000 K |
| `65ca6f6d` | 1 029 | 21 | 170 cm, bambuhylla och USB |
| `03be42ca` | 969 | 197 | 155 cm, skålformad skärm |
| `d2dfd1fa` | 949 | 170 | LED 161 cm, tre hyllplan |
| `2a9d6c01` | 839 | 73 | LED 134 cm, mässing, 3000 K |

Familjen har 37 utkast; fem grupper av färg-/storlekssyskon valdes bort så att
de åtta är distinkta designer.

## ☠️ Texten beskrev en lampa som inte finns

`13a53d52`: källan säger *"Doppellagiger Lampenschirm"* och listar TVÅ
skärmmått (`Ø24 × 13` och `Ø33 × 16`). Det lästes som två skärmar, och texten
beskrev "en liten läsarm" och "en stor skärm". **Bilden visar en enda
dubbellagrad skärm** på en böjd stång — Ø24 är det inre lagret.

Ingen grind kunde ha fångat det: båda talen står i källan, svenskan var
korrekt. Regeln som följer står i CLAUDE.md — **kontaktarket byggs FÖRE
brödtexten**, inte efter för alt-texternas skull.

Mildare i samma runda: `d2dfd1fa` beskrevs som "tre hyllplan runt stången" när
lampan är en öppen fyrkantsstomme utan stång.

## ✅ Kollisionskollen jämförde den här gången

Sökningen bär inte `variantsInfo`, så SKU:erna lästes med **GET per produkt**
över hela lampfamiljen: **56 lampor, 0 utan varianter, 43 unika SKU:er.**

⚠️ **Det talet är i sig ett fynd: 56 produkter delar 43 SKU:er.** Ingen av
krockarna rör de åtta i den här rundan, men tretton lampor bär en SKU någon
annan också har. Samma sort som `FP-2er-set-barstuhle-mit` — importen härleder
SKU:n ur den tyska titelns första ord.

| kort | tysk SKU | ny svensk |
|---|---|---|
| `9e81d573` | `FP-stehlampe-gebogene` | `FP-golvlampa-bage-190` |
| `13a53d52` | `FP-led-stehlampe-mit` | `FP-golvlampa-dimbar-170` |
| `09e62d6e` | `FP-stehleuchte-stehlampe` | `FP-golvlampa-guld-153` |
| `79411b09` | `FP-stehlampe-fu-schalter` | `FP-golvlampa-akryl-157` |
| `65ca6f6d` | `FP-stehleuchte-inkl-regal` | `FP-golvlampa-bambuhylla-170` |
| `03be42ca` | `FP-stehlampe-runder-schirm` | `FP-golvlampa-gra-155` |
| `d2dfd1fa` | `FP-led-stehlampe-mit` | `FP-golvlampa-hyllplan-161` |
| `2a9d6c01` | `FP-led-stehlampe-wohnzimmer` | `FP-golvlampa-massing-134` |

`13a53d52` och `d2dfd1fa` delade `FP-led-stehlampe-mit`.

## Bilder

En bild borttagen: `65ca6f6d` #4 bar en tysk rubrik om ljuskällor inbränd i
pixlarna. `9e81d573` har fyra bilder i Wix, inte fem — och både `gate-alt.py`
och `bygg-media.py` fällde en korrekt alt-fil för det, eftersom båda antog
fem. Antalet mäts ur `bilder.tsv` sedan dess.

SEO gick från importens FEM tyska taggar till TVÅ på alla åtta, med
nyckelordslistan tömd. Kategorierna är `Hem & Inredning` + `Belysning` — samma
par som samtliga tio redan publicerade golvlampor bär.

## ✅ SKU-krockarna i lampfamiljen är MÄTTA — och ingen är publicerad

Hela lampfamiljen läst med GET per produkt (sökningen bär inte `variantsInfo`):

| | |
|---|--:|
| Lampor lästa | 67 |
| Utan varianter | 0 |
| Unika SKU:er | 57 |
| **Krockande SKU:er** | **6** |
| **Produkter i en krock** | **16** |
| Krockar som rör en PUBLICERAD sida | **0** |

| SKU | antal | vad de är |
|---|--:|---|
| `FP-stehlampe-mit-regalen` | 4 | fyra utkast, samma modell i olika utförande |
| `FP-stehlampe-mit` | 3 | tre utkast, "Stehlampe mit Fernbedienung…" |
| `FP-led-stehlampe-5-stufige` | 3 | tre utkast, "LED Stehlampe 5-stufige…" |
| `FP-stehlampe-mit-3-stufigem` | 2 | två utkast |
| `FP-stehleuchte-im-modernen` | 2 | två utkast |
| `FP-led-stehlampe-mit` | 2 | två OLIKA lampor (glashylla mot hyllor) |

⚠️ **Alla sexton är opolerade tyska utkast.** Ingen kund kan träffa på dem, och
ingen order kan hamna på fel rad. Krocken uppstår i importen — SKU:n härleds ur
den tyska titelns första ord, och syskon som heter likadant får samma sträng.

**Slutsatsen är att krockarna löser sig själva av poleringen.** Varje syskon som
poleras får en egen svensk SKU, precis som `13a53d52` och `d2dfd1fa` fick i den
här rundan. Något separat städjobb behövs alltså inte — bara att poleringen
fortsätter, och att SKU-kollen faktiskt går via GET så att den kan falla.

☠️ **Det sista är inte en detalj.** Den här mätningen var omöjlig med den kollen
som kördes tre gånger tidigare samma dag: den läste `variantsInfo` ur en sökning
som aldrig bär fältet, och hade svarat "noll krockar" på en familj med sexton
produkter i krock.
