# Barstolar 2-pack, industristil — `557491d0`

Enskild polering utanför rundorna, 2026-09-06. Produkten togs fram genom att
Leonard länkade en konkurrentsida och frågade om vi har varan.

| | |
|---|---|
| Wix-produkt | `557491d0-be20-4792-92f4-579570adb4ab` |
| Aosom-artikel | `83A-358V00DR` |
| Landat inkl. moms | 747,71 kr (44,5 % frakt) |
| Pris | 899 kr — prisgrinden `stammer: true` |
| Saldo hos Aosom | 130 |

## Så identifierades den

Konkurrentens sida bär **inte** Aosoms artikelnummer den här gången — dess
`sku`/`mpn` i JSON-LD är `LBC069B81V2`, alltså deras egen kod. Matchningen
gjordes på spec i stället, och den avgörande siffran är **sitthöjden 75,5 cm**:

| | konkurrenten | vårt utkast |
|---|---|---|
| Sitthöjd | 75,5 cm | 75,5 cm |
| Vikt | 9,6 kg | 9,5 kg |
| Höjd | 100 cm | 99,5 cm |
| Färg | vintage brun-svart | rustikbrun, svart |
| Material | spånskiva, PU, skum, metall | spånskiva, konstläder, metall |
| Bredd × djup | 39 × 39 cm | 41,5 × 36,5 cm |
| Max last | 100 kg | 110 kg |

Bredden och maxlasten skiljer. Måttskissen (bild 3) visar 41,5 × 36,5 och
110 kg, alltså är det vårt underlag som är rätt och konkurrentens datablad som
är avskrivet från en annan revision.

## ⚠️ Den är INTE en ersättare för order 10030

Kunden köpte en stol med **60 cm sitthöjd**, avsedd för köksbänk 89–99 cm.
Den här sitter på 75,5 cm och är gjord för bord på 104–109 cm. Skillnaden är
15,5 cm och den är funktionell, inte kosmetisk — sidan säger det i klartext i
både brödtext och FAQ, så en kund som mäter kan inte råka köpa fel.

## Grindar

| grind | utfall |
|---|---|
| `gate.py` (mönster, siffror, taggar, flikar) | 0 fynd |
| `gate-alt.py` (5 alt-texter) | REN |
| `gate-seo.py` (titel 50 tecken, beskrivning 144) | 0 fynd |
| Återläsning: FNV-1a mot källfilen | `8d8a0b273665c162` = identisk, 4 711 tecken |

☠️ `gate-seo.py` fällde först på siffran `2` i "2-pack": den fanns inte i
brödtexten, som skrev "Två" med bokstäver hela vägen. Spec-radens `Ingår` bär
den nu — grinden hade rätt, och det är precis den sortens fynd den finns för.

## Bilderna

Alla fem är rena — noll tysk text inbränd, kontrollerat okulärt. Position 3 är
måttskissen och bär bara siffror.
