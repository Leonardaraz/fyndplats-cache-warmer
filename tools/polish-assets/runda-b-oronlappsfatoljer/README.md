# Runda B — öronlappsfåtöljer (`^Ohrensessel`), sex produkter

Familjen tilldelad i `tools/polish-assets/FORDELNING.md`. Polerad 2026-09-05.
Runbooken flaggade *"högst dubblettrisk av alla fyra rundorna — mät FÖRST"*.
Mätningen gjordes, och den ändrade bilden av rundan.

## ☠️ Fem av sex är SAMMA STOL som en redan publicerad

Alla mått identiska: **74 × 86 × 102 cm, sits 48,5 × 53 cm på 47 cm höjd,
rygg 67 × 15 × 68 cm, maxlast 160 kg.**

| | pris | färg | tyg | vikt |
|---|--:|---|---|--:|
| `a29af9b5` **redan publicerad** | 2 299 | blå | polyester | 21,6 |
| `121ce68f` | 2 159 | grå | slätvävd polyester | 21,6 |
| `72f30eb9` | 2 199 | cremevit | flanell | 21,6 |
| `80e4ed24` | 2 329 | brun | avtagbart tvättbart | 21,6 |
| `16f36d37` | 2 599 | grå | **sammet** | 22,6 |
| `7b98c4c1` | 2 599 | mörkgrå | avtagbart tvättbart | 21,6 |

Det är inga dubbletter — det är en tyg- och färgfamilj, och butiken publicerar
färgsyskon med flit. Men det ställer ett krav på texten: när måtten är
identiska är **tyget den enda skillnaden**, och då måste texten leda med det.
Varje sida namnger sitt tyg i rubriken och länkar till tre syskon.

⚠️ **Två av dem kostar exakt 2 599** — sammeten och den mörkgrå med avtagbar
klädsel. Och tre av sex är gråa (grå polyester 2 159, grå sammet 2 599,
mörkgrå 2 599). Det är ingen defekt i någon produkt, men det är en hylla som
är svår att välja ur. Prissättningen är inte poleringens att röra.

## Den sjätte är ett färgsyskon till en annan publicerad

`c0e67ea5` (grå linnelook med fotpall, 3 369) är måttidentisk med publicerade
`oronlappsfatolj-med-fotpall-gul` (3 199): fåtölj 75 × 83 × 104, pall
48 × 35 × 40, sits 50 × 56 på 45 cm, armstöd 18 cm över sitsen, 10 cm sits och
13 cm rygg. Samma stomme, annan färg. Den länkar dit.

## ☠️ En tysk leveransklausul i källan

`c0e67ea5` bar ordagrant:

> WICHTIG:Wir liefern lhnen den Artikel kostenfrei bis Bordsteinkante.

Ett fraktlöfte som inte är vårt, på tyska, i produkttexten. Det når aldrig
kund — och det är värt att leta efter i resten av sortimentet.

## SKU-fällan igen

Fyra av sex delade SKU: `FP-ohrensessel-relaxsessel` på två och
`FP-ohrensessel-sessel-mit` på två. Alla sex har nu var sin.

## Mätt i drift

- Texten i Wix **teckenidentisk med källfilerna** för alla sex.
- 30 alt-texter, noll tomma. Tre produkter bar tyska alt-texter före.
- Live-grind: **6/6 rena, noll orddiffar**, alla korslänkar överlevde.
- Priserna orörda: 3 369 / 2 599 / 2 599 / 2 329 / 2 199 / 2 159.

## En arbetsmetod värd att återanvända

De fem chassi-lika texterna genererades ur EN mall med parametrar för tyg, ben,
färg och vikt. Samma mall skrevs sedan om i JavaScript inne i skrivanropet — och
checksumman mot filerna blev identisk på alla fem. Det gör inklistringen
verifierbar i stället för betrodd: en mall som ger samma bytes två gånger kan
inte ha tappat ett tecken på vägen.
