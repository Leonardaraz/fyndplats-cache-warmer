# Runda 136 — Steg 1

## Katalogen, mätt klart

Svepet kördes i två etapper och **`avhuggen: false`** på den sista — det är
kvittot, inte radantalet. Båda etapperna hittade de kända publicerade sidor
svepet ombads leta efter, så läsningen var frisk och inte tom.

| | |
|---|--:|
| Produkter totalt | **5 688** |
| Publicerade | 2 630 |
| Utkast | **3 058** |
| Klösmöbel-utkast kvar | **37** |

⚠️ Familjen är 37, inte 19. Gruppering på leverantörens FÖRSTA ord gav 19
`kratzbaum` — men `Katzenbaum`, `Katzenturm` och `Katzenkratzbaum` står lika
ofta i mitten av namnet. Samma fälla som uppgift #421: leverantörens namn är
inget familjefilter.

## De två som föll — fyra tal på decimalen

Steg 1 säger att den farliga dubbletten inte syns i något id-baserat test,
bara i spec-tabellen. Två av kandidaterna föll på just det.

### ☠️ `a4d8feca` = publicerade `klostunna-60-cm-ljusgra`

| | utkastet | den publicerade |
|---|---|---|
| yttermått | Ø35 × 60 cm | **Ø35 × 60 cm** |
| maxlast | 10 kg | **10 kg** |
| ingång | 17 cm | **17 cm** |

Leverantörens namn — *"Katzenbaum mit viel Platz, Plüschbezug,
Sisal-Oberfläche, Φ35 x 60H"* — döljer att varan är en KLÖSTUNNA. Hade
urvalet gått på namnet hade den polerats som ett klösträd och publicerats
bredvid sin egen tvilling.

### ☠️ `fcfe68f1` = publicerade `klostrad-140-cm`

| | utkastet | den publicerade |
|---|---|---|
| yttermått | 48 × 48 × 140 cm | **48 × 48 × 140 cm** |
| maxlast | 15 kg | **15 kg** |
| per plan | 5 kg | **5 kg** |

## Tre som SÅG ut som dubbletter men inte är det

Måttlikhet ensam räcker inte åt andra hållet heller — de här tre delar ett
tal med en publicerad sida och är ändå olika varor:

| utkast | mot | vad som skiljer |
|---|---|---|
| `68bc6c0c` 60 × 44 × 225–255 | `klostrad-golv-till-tak-225-255-cm` | djup 44 mot 38, plattform 48 mot 25 |
| `105c685a` 48 × 44 × 139 | `klostrad-140-cm` 48 × 48 × 140 | djup 44 mot 48, fraktvikt 9,7 mot 12,8 kg |
| `1366a476` 59 × 59 × 200 | `klostrad-200-cm-tva-grottor` 60 × 60 × 200 | maxlast 20 mot 10 kg |

⚠️ `1366a476` är den svåraste: 59 × 59 mot 60 × 60 är inom vad en
avrundning kan förklara. Det som avgör är **maxlasten** — 20 kg mot 10 kg
är ingen avrundning.

## ☠️ Min egen mätning hade en fälla i sig

Första extraktionen föll tillbaka på "första `N × N × N cm` i texten" när
`Gesamtabmessungen` saknades. Den plockade **paketmåttet**, inte varans:
`a73a1a1c` och `c7bd00b9` såg då ut att dela `60 × 48,5 × 22 cm` exakt.

De är inte tvillingar — talet var fel fält. **Samma klass som husets
`sku`-förväxling: två fält som betyder olika saker, läst som ett.**
Publicerade sidor har samma problem åt andra hållet — sex takhöga sidor
visar paketmåttet i sin `Mått:`-rad (`58 × 29 × 28 cm` på en 228–260 cm
möbel), vilket gör dem obrukbara som jämförelse.

## Batchen

| pid | mått | vad det är |
|---|---|---|
| `4a5acc7d` | 41 × 41 × 100 | fyra plan, tre hålor |
| `860b6eb9` | 50 × 36 × 101 | tre plan, tre sovhålor, lekbollar |
| `05136778` | 48 × 48 × 160 | flera plan, sisalstolpar, hålor |
| `105c685a` | 48 × 44 × 139 | håla, lekbollar |
| `7f8e495b` | 60 × 40 × 79 | kaveldun och sisal, lekboll, plattform |
| `ae1c848f` | 70 × 49 × 79 | en håla, en liggyta |
| `f8528666` | 60 × 40 × 98 | håla, bädd, liggyta |
| `63a586da` | 60 × 40 × 104 | håla, två liggytor |

### ☠️ Tre sökordskrockar som måste lösas i NAMN, SLUG OCH TITEL

1. **`05136778` (160 cm)** delar sockel `48 × 48` med publicerade
   `klostrad-140-cm`. Höjden är det enda som skiljer — den måste med.
2. **`f8528666` (98 cm)** möter TVÅ publicerade 98 cm-sidor:
   `klostrad-98-cm-bladkrona` och `klostrad-98-cm-fardesign-tunnel`.
   Höjden ensam duger alltså inte; konstruktionen måste in i namnet.
3. **`63a586da` (104 cm)** möter `klostrad-med-koja` (65 × 30 × 104).
   Olika sockel, samma höjd.

## Kvar i familjen efter rundan

27 utkast, varav en tät **takhög** grupp på nio (`90573e36`, `839a2ef5`,
`68bc6c0c`, `c7bd00b9`, `fecadb3e`, `e5b31270`, `a73a1a1c`, `505a0dde`,
`7bdc47b8`). Den gruppen möter sex publicerade takhöga sidor och kräver sin
egen måttgrind — och den grinden måste gå på varans mått, inte på de
publicerade sidornas `Mått:`-rad, som på flera av dem är paketmåttet.
