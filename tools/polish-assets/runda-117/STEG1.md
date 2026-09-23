# Runda 117 Steg 1 — köksvagnar och köksöar

## Svepet

Hela katalogen läst via `products/search` i **ETT anrop den här gången**:
**5 623 rader, 57 sidor, `avhuggen: false`** (3 200 + 2 423 i två etapper vid
den första mätningen, samma tal). 696 tyska utkast, 1 432 publicerade.

## Familjen valdes på KVOTEN, inte på storleken

Fem kandidater mättes på båda språken innan någon valdes — och de tre största
föll, alla av samma skäl: **familjen är redan full.**

| familj | utkast | publicerade | kvot | utfall |
|---|--:|--:|--:|---|
| badrumsskåp | 44 | 40 | 1,1× | trång |
| soptunna | 42 | 26 | 1,6× | trång — 20/30/40/42/45/48/50/55/58/60/68 L finns redan |
| gungstol | 26 | 26 | 1,0× | trång |
| hundgrind | 57 | 18 | 3,2× | ☠️ se nedan |
| **köksvagn** | **19** | **10** | **1,9×** | **vald** |

☠️ **Hundgrindarna såg bäst ut på kvoten och valdes ändå bort.** Familjen
är inte en lucka — den är en dubblettmisstanke. Två av de arton publicerade
sidorna (`e4367833` "Hundgrind 154,5 cm med tre paneler" och `516cf07c`
"Fristående hundgrind 154,5 cm – hopfällbart 3-panelsstaket") bär samma mått
och samma panelantal, alltså en INTERN dubblett som redan ligger ute. Och
runda 54 fällde redan sju utkast i samma familj som dubbletter (uppgift #250).
Att lägga åtta nya sidor ovanpå det hade förvärrat ett problem, inte löst det.
Familjen behöver en dubblettaudit, inte en poleringsrunda — noterat separat.

**Köksvagnarna valdes för att luckan är verklig och ligger i PRISLÄGET.** De
tio publicerade är i huvudsak smala förvaringsvagnar för 349–919 kr; bara tre
är riktiga köksvagnar (1 599, 2 069, 2 919 kr). Utkasten ligger på
1 299–2 639 kr. Butiken säljer alltså nästan ingenting i mitten av spannet.

## Dubblettgrinden

Sju av de nio kandidaterna föll ut i **fyra modellgrupper** med identiska
paketmått OCH identisk vikt internt — färgsyskon enligt uppgift #420, inte
dubbletter:

| grupp | produkter | yttermått | vikt | maxlast |
|---|---|---|--:|--:|
| A | 63235957 · 37fb1ce1 · 4d044b44 | 106 × 42 × 87 | 29 kg | 50 kg |
| B | e16c1515 · d4db4bbc | 80 × 40 × 82 | 28 kg | 40 kg |
| C | 4ab392f7 · 0af14e23 | 109 × 40 × 89 | 29,5 kg | 40 kg |
| D | 41d31478 | 82 × 38 × 86,5 | 21 kg | 35 kg |

Ingen grupp delar yttermått med en publicerad sida. `matt.py:kontroll()`
fäller om två grupper skulle råka få samma yttermått.

## ☠️ Det nionde utkastet lyftes ur — och pixelgrinden kunde inte avgöra det

`6cf7cfcf` (1 569 kr) anger **67 × 37 cm, tre lådor, avtagbar bricka, två
öppna hyllplan, 40 kg totalt**. Den publicerade `cc1eb1d9` (1 599 kr) heter
ordagrant *"Köksvagn med 3 lådor och avtagbar bricka – vit med träskiva
67x37x85,5 cm"* och har samma 40 kg.

Ögat säger att de är OLIKA möbler: utkastet har hyllorna till vänster och
lådorna till höger, den publicerade tvärtom. Materialet skiljer också —
MDF + furu mot gummiträ + MDF — liksom hyllasten, 5 kg mot 3 kg.

Men **de konkurrerar om exakt samma kund på trettio kronors prisskillnad,
med samma mått, samma funktioner och samma formspråk.** Att publicera den
hade varit att bygga in kannibalismen frivilligt. Den lyfts ur rundan och
lämnas till Leonard.

⚠️ **Och grinden kunde inte hjälpa till, av ett skäl som är värt att skriva
ned:** se `familj.py`. Gråskalemåttet mäter LJUSHET. Uppmätt här:

| par | avstånd |
|---|--:|
| färgsyskon 4ab392f7 (vit) ~ 0af14e23 (svart) | **68,32** |
| främlingar 6cf7cfcf ~ 4ab392f7 | 18,37 |
| 6cf7cfcf ~ cc1eb1d9 (dubblettmisstanken) | 22,32 |

Färgsyskonen ligger nästan fyra gånger LÄNGRE isär än två helt olika
köksvagnar. Grinden får därför bara påstå EN sak — att två sidor delar en
bildfil (avstånd ≈ 0). Ett högt tal betyder ingenting alls. Självtestet
prövar numera en produkt mot SIG SJÄLV (0,00), vilket är precis det påstående
tröskeln vilar på. Formfrågan avgörs av ögat och av måtten.

**0 par under tröskeln 1,0.** Ingen av de nio delar en bildfil med någon annan
eller med den publicerade sidan.
