# Runda 95 — fyra reservtak med DUBBELTAK, i två storlekar

## Steg 1 — urval

| id8 | wixProductId | grupp | tysk färg | mätt färg | pris | bilder |
|---|---|---|---|---|--:|--:|
| `b6ebc5ba` | `b6ebc5ba-1fb0-462a-9b85-3c4056a8e81d` | D — 3 × 3 m | Kohlegrau | **mörkgrön** | 749 | 5 |
| `271327e1` | `271327e1-bab8-4bbf-b491-ca33a6a4b41b` | D — 3 × 3 m | Rostrot | roströd | 779 | 5 |
| `ef0a812d` | `ef0a812d-e06c-4470-9a57-f62db2ee71e5` | E — 3 × 4 m | Rostrot | roströd | 819 | 5 |
| `dc7d2513` | `dc7d2513-788c-4952-9412-72c57ee853d6` | E — 3 × 4 m | Cremeweiß | cremevit | 769 | 5 |

Familjen är samma som runda 94:s (reservdukar till paviljong), men de här fyra
har alla **tak i två nivåer** och kommer från en annan leverantörsröst: tyskan
är kortare, och passformen uttrycks mot leverantörens EGET sortiment
("geeignet für UNSERE Gartenpavillons") i stället för i mått.

☠️ **De två 3 × 3-taken är INTE samma duk i två färger.** Varje produkt har sin
egen måttritning, och de säger olika saker:

| vad | `b6ebc5ba` | `271327e1` |
|---|---|---|
| stomme | 3 m | 300 × 300 cm |
| lilla taket | **88 × 88 cm** | **86 × 86 cm** |
| snedställd kant | 174 cm | — |
| öppning | — | 68 × 68 cm |
| kanthöjd | 18 cm | 18 cm |

Varje sida publicerar därför BARA sin egen ritnings tal, och korslänken säger
uttryckligen att måtten skiljer sig två centimeter. Att låna grannens är precis
den förväxling runbooken kallar "syskonets mått i sin egen spec-tabell" — och
den är rundans farligaste fel, eftersom sidorna i övrigt är nästan identiska.

Grupp E:s två delar däremot ritning: samma 94 × 47 cm, samma 20 cm kanthöjd.

## Steg 2 — laglighetsgrind

| fråga | utfall |
|---|---|
| Djurbostad, barnprodukt, elsäkerhet | ej tillämpligt |
| CE / EN-normer | ej tillämpligt — en textilduk utan konstruktionslast |
| Vattentäthet | ☠️ tyskan säger själv **"wasserabweisendes Dach, NICHT wasserdicht"** — texten får aldrig säga vattentät |
| Snölast | inget påstående i källan; sidan säger uttryckligen sommartak |

## Steg 4 — bilderna

Fem bilder per produkt, alla 2000 × 2000.

✅ **Ingen leverantörslogotyp i något övre vänstra hörn** — alla tjugo hörn
granskade i eget kontaktark (`horn.jpg`). Men **tysk text finns inbränd**:

| bild | vad | åtgärd |
|--:|---|---|
| 1 | ren render på vit botten | — |
| 2 | banderoll "Nur Pavillondach" / "Ersatzteile Nur Vordach des Pavillons" | **toppkapad** 15 / 22 / 20 / 25 % |
| 3 | "Wie misst man eine Gartenlaube?" + tre tyska rader | **toppkapad** 34 / 35 / 35 % |
| 3 (`271327e1`) | ren ritning överst, tysk "HINWEIS"-ruta under | **bottenkapad** till 55 % |
| 4, 5 | detaljfoton | rena |

Kapningen är vald så att HELA produkten och HELA måttritningen står kvar —
kontrollerad i `kapade.jpg` efteråt, inte bara räknad.

### ☠️ Två tal i källan är fel, och bilden är facit

| id8 | källan säger | mätt RGB på bild 1 | HSL | vårt ord |
|---|---|---|---|---|
| `b6ebc5ba` | tyskan "Kohlegrau", feeden "Grün" | 24, 72, 36 | H 135°, S 50 %, **L 19 %** | **mörkgrön** |
| `271327e1` | Rostrot | 216, 72, 36 | H 12°, S 71 %, L 49 % | roströd |
| `ef0a812d` | NAMNET säger "Kaffee" | 180, 36, 0 | H 12°, S 100 %, L 35 % | **roströd** |
| `dc7d2513` | Cremeweiß | 216, 216, 204 | H 60°, S 13 %, L 82 % | cremevit |

Två av fyra: en tysk färgetikett och ett produktnamn som båda säger fel om
varan i sin egen bild. Grinden fäller numera båda riktningarna namngivet
(regel 12 i `lint.py`).

## Steg 5 — faktaavstämning

**Publiceras:**

| påstående | källa |
|---|---|
| lilla taket 88 × 88 / 86 × 86 / 94 × 47 cm | respektive produkts EGEN ritning |
| snedställd kant 174 cm (`b6ebc5ba`) | ritningen 1,74 m |
| öppning 68 × 68 cm (`271327e1`) | ritningen |
| stora duken 300 × 300 cm (`271327e1`) | ritningen |
| kanthöjd 18 / 20 cm | ✅ etiketterad: grupp E:s tyska säger ordagrant "Randhöhe: 20 cm" OCH ritningen visar 0,2 m; grupp D:s ritningar visar 18 cm |
| polyester 180 g/m² med PA-beläggning | tyskan (utom `271327e1`, se nedan) |
| vattenavvisande, inte vattentät | tyskans egen formulering |
| remmar med kardborreband (grupp D) | tyskan + bild 4 |

**Publiceras INTE:**

☠️ **Ytvikten på `271327e1`.** Källan motsäger sig själv i SAMMA dokument:
punktlistan säger "Polyester (170 g/m²)", Technische Daten säger "180g/m²".
Grannen säger 180 på båda ställena och får publicera talet. Ett tal källan
bråkar med sig själv om publiceras inte — och grinden fäller om det smyger in
(`lint.py` regel 13, egen mutation).

⚠️ **1,45 / 1,75 / 1,85 / 0,64 / 0,45 / 0,9 m på grupp E:s ritning.** Sex tal
utan etikett som inte går att para ihop med tyskan. Samma disciplin som runda
94:s 1,65 m: ett omärkt mått som får en etikett är ett påhittat mått. Talen
syns i bilden, som är källan — de står bara inte i texten.

⚠️ **Passformen mot leverantörens eget sortiment.** "geeignet für UNSERE
Gartenpavillons" betyder ingenting hos oss och uttrycks i MÅTT plus källans
egen uppmaning att jämföra med bilden.

## Grindarna

| grind | utfall |
|---|---|
| `lint.py` | **0 brister** på alla fyra |
| `lint.py --sjalvtest` | **29/29** regler faller på SIN EGEN skada |
| `mutationstest.py` | **31/31** mutationer gav rätt utfall |
| dokumenterade blinda fläckar | 2 (kastad ordning i paketmått) |

☠️ **Grinden fällde ett fel i utkastet innan något skrevs:** syskonlänken bar
runbookens egen varningsemoji (⚠️) mitt i en säljande mening. Regel 18 finns
sedan dess, och en mutation återinför tecknet.
