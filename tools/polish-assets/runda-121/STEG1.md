# Runda 121 Steg 1 — städvagnar och mopphinkar

## ☠️ Katalogsvepet gick inte att köra alls förrän ETT FÄLTNAMN var mätt

Uppgift #404 skrev att svepet "läste samma sida 30 gånger" och gissade att
`filter` och `cursorPaging` låg på fel nivå i kroppen. Det var fel diagnos.

`wix.request` tar request-kroppen i **`body`**, inte i `data`. Med `data`
slukas kroppen **tyst**: anropet lyckas, Wix svarar 200 med
standardprojektionen, och markören man skickade in fanns aldrig i förfrågan.
Uppmätt på `limit: 5`:

| kroppsfält | rader tillbaka |
|---|--:|
| `data` | 100 |
| `json` | 100 |
| `payload` | 100 |
| **`body`** | **5** |
| `body` som JSON-STRÄNG | `400 Expected an object` |

☠️ Det är husets vanligaste felform en gång till: **ett fel fältnamn ger ett
friskt svar, inte ett fel.** Alla tre paging-placeringar (`search.cursorPaging`,
toppnivå, `search.paging`) såg likadant ut just därför — ingen av dem nådde
fram, så mätningen kunde inte skilja dem åt.

⚠️ Följdregeln: **pröva att kroppen biter innan du mäter något med den.**
`limit: 5` mot ett API som svarar 100 är den billigaste kontrollen som finns.

## Svepet: hela katalogen, `cursor === null`

| | |
|---|--:|
| sidor | **57** |
| utkast | **3 116** |
| publicerade | **2 507** |
| katalogen | **5 623** |

✅ **Kvitterat mot en OBEROENDE mätning.** Runda 120 mätte samma katalog till
3 124 utkast / 2 499 publicerade och publicerade sedan åtta sidor. Skillnaden
är exakt åtta åt vardera hållet. Ett svep som stämmer mot en tidigare mätning
minus det man själv gjort är kvitterat, inte antaget.

## Tre kandidatfamiljer mätta — svenska OCH tyska ord

Uppgift #421: ett rent tyskt svep tappar de redan polerade syskonen, som heter
svenska namn. Mönstren bar därför båda språken.

| familj | utkast | publicerade |
|---|--:|--:|
| soptunnor och tvättkorgar | 53 | **33** |
| skärmtak (`Vordach`) | 12 | 3 |
| **städvagnar och mopphinkar** | **12** | **0** |

Soptunnorna är uteslutna: trettiotre publicerade sidor heter redan
`soptunna-…`, och den andra sessionen har uppenbart arbetat där. Femtiotre nya
sidor på samma huvudord hade kannibaliserat varenda en — exakt runda 120:s
barstolsfall.

## Sökordskrocken: noll

Svept över hela katalogen på `mopp|hink|kärra|städvagn|rullvagn|vagn`. Sjuttio
publicerade sidor bär ett `vagn`-ord, och **ingen av dem är en städvagn**:

| närmast | vad det är |
|---|---|
| `torkvagn-*` (fem sidor) | tvättorkställ på hjul |
| `trappkarra-6-hjul-hopfallbar` | säckkärra |
| `transportvagn-2-i-1-natsidor` | transportvagn |
| `verktygsvagn-*`, `verkstadsvagn-*` | verkstadsvagnar med lådor |
| `rullvagn-fyra-utdragslador-24-cm` | köksvagn (runda 118) |

⚠️ **Därför är `rullvagn` förbjudet som huvudord här** — det sitter på en
publicerad köksvagn. Huvudordet blir `städvagn`, med `mopphink` och `moppvagn`
som relaterade.

## Måttgrinden MELLAN utkasten

Kördes innan batchen valdes, av samma skäl som runda 120: tvillingarna sitter
oftare i utkastshögen än mot en publicerad sida.

| id | pris | mått (L × B × H) | färg |
|---|--:|---|---|
| `45bac2cb` | 1 179 | 73 × 45 × 95 | **gul** |
| `731c8bfc` | 1 129 | **73 × 45 × 95** | **blå** |
| `da0f30b2` | 1 119 | 72 × 49,5 × 95 | **gul** |
| `d8ebb279` | 1 119 | **72 × 49,5 × 95** | **blå** |
| `74ea10dc` | 1 569 | 78 × 45 × 95 | orange |
| `e526fd01` | 969 | 54 × 41,5 × 91,5 | svart + orange |
| `9aa46e31` | 1 479 | 121 × 50,5 × 100 | svart |
| `75fcdcfb` | 2 269 | 122 × 46,5 × 101 | svart + blå |

**Två färgsyskonpar**, inga dubbletter. Identiska mått och skilda färger är
enligt uppgift #420 ett färgsyskon, inte en dubblett — och här står färgen
uttryckligen i leverantörens egen `Farbe`-rad, så det är mätt och inte tolkat.

## Batchen: åtta av tolv

Runda 121 tar de sex hink-/moppvagnarna plus de två städvagnarna med hyllplan.
Kvar till runda 122 ligger de fyra systemvagnarna med press:
`6490e360` (1 299), `0cbffcd9` (2 339), `740fa6d0` (2 429), `832f9eec` (2 699).
De tre sista delar konstruktion och behöver granskas som en egen grupp.
