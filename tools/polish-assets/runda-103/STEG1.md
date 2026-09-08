# Runda 103 — Steg 1: katalogcensus

Hela katalogen svept i tre pass, sista till `cursor: null`. **Katalogen, inte
kön** (uppgift #346).

| | |
|---|---:|
| Produkter | **5 553** |
| Utkast | **3 183** |
| Publicerade | **2 370** |

## ☠️ Sessel-familjen säljs under FYRA namnmönster

Ett svep på ett namnmönster hade gett fel familjestorlek. Grupperat på de fyra
tyska orden i stället:

| namnmönster | utkast |
|---|--:|
| `Relaxsessel …` | 22 |
| `Massagesessel …` | 19 |
| `Aufstehsessel …` | 9 |
| `Fernsehsessel …` | 7 |
| **familjen totalt (räknat hittills)** | **57** |

Det är samma fälla som `#300` (familjen 833-359 under tre namnmönster) och
`#327` (sparkcyklarna i fem kategorikombinationer): **familjen definieras av
VARAN, inte av det tyska ordet leverantören råkade sätta först.**

⚠️ Namnen säger dessutom inte vad varan är. `Relaxsessel mit Massagefunktion`
och `Massagesessel mit Liegefunktion` är samma produkttyp med orden kastade om.
Steg 1-urvalet får därför inte gå på förstaordet.

## Runda 103:s batch — sex stolar i två modeller

Vald för att den är en KOHERENT modellgrupp, inte ett namnmönster: alla sex är
vipp-/liggfåtöljer med värme, så EN Steg 2-grind räcker för hela batchen.

**Modell A — vipp, ligg och värme, 3 modi, vridbar (fyra färgsyskon):**

| id8 | pris |
|---|--:|
| `c396356f` | 4 579 |
| `a7f029bf` | 4 619 |
| `7e84e482` | 4 819 |
| `297d8979` | 4 979 |

**Modell B — värme och liggfunktion, vridbar, bär 150 kg (två färgsyskon):**

| id8 | pris |
|---|--:|
| `5439026e` | 5 239 |
| `505eb413` | 5 399 |

## Vad som ÄRVS från runda 101–102

Familjen har redan tretton publicerade sidor med korslänkar. Det betyder att
Steg 7a måste skriva om dem igen när de sex nya tillkommer — syskonlistan säger
"tretton" idag och ska säga "nitton".

Verktygen från runda 102 återanvänds rakt av:
`runda-102/livegrind.py` (live-grind med kontrollsida) och
`runda-102/familjgrind.py` (hela familjen, färg i ingress + Färg-rad).

☠️ **Och färgregeln från runda 102 gäller från början den här gången:** färgen
ska stå i ingressen OCH som Färg-rad i spec-tabellen, med rätt genus —
*konstläder* och *tyg* är ett-ord (`cremevitt konstläder`, `mörkgrått tyg`).
