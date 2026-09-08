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

-----

# ☠️ KOLLISION — den andra sessionen polerar SAMMA familj just nu

Upptäckt vid Steg 3, när prisgrindens workflow-körningar låg varvade med en
annan sessions. Grenen `claude/…-uq6fwl`, session `014sbYs9…`, körde
**"Runda K12: åtta massagefåtöljer 3 599–6 549 kr"** klockan 15:26–15:28 —
en halvtimme före mina 15:57.

Det är tredje gången samma sak (`#262`, `#302`), och den här gången överlappar
batcherna.

## Vad de har tagit

Deras commit namnger fem av sina åtta: `522103fd`, `c79c22f7`, `7a4ec9c6`,
`ed03b52f` och ☠️ **`505eb413`** — som är **runda 103:s modell B beige**.

**`505eb413` stryks ur runda 103.** Två sessioner som skriver samma produkt är
precis det `#302` kostade sist.

## ⚠️ Och färgparet är SPLITTRAT

Deras egen anteckning: *"505eb413 är tyg (chenille), inte konstläder — **enda i
gruppen**"*. Mitt `5439026e` är också tyg (`Stoffbezug, 100 % Polyester`).
Vore det i deras batch hade `505eb413` inte varit ensam om tyget — alltså är
**`5439026e` INTE deras**.

Följden: modell B:s två färgsyskon poleras av två olika sessioner, utan att
någon av dem kan skriva en korrekt syskonlista. Det är `#295` i vardande.

**`5439026e` skjuts upp** tills deras runda är klar och `505eb413` går att
korslänka mot. Att skriva den ensam ger en sida som säger fel antal syskon från
dag ett.

## ☠️ Och de hittade FEM där jag hittade fyra

Deras urval: *"Fyra färgkluster föll bort — det största är **FEM identiska på
82 × 99 × 103** med 560 kr spann."*

`82 × 99 × 103` är modell A:s mått. Jag hittade **fyra** (4 579 · 4 619 ·
4 819 · 4 979 = 400 kr spann). Deras femte förklarar spannet: **`a0760ed1`,
4 419 kr** — 4 979 − 4 419 = 560. ✓

Och varför jag missade den: den heter *"Massagesessel mit Wärmefunktion,
drehbarer Schaukelsessel…"*, inte *"…mit Wipp-, Liege- & Wärmefunktion, 3 Modi,
drehbar"*.

☠️ **Jag gjorde exakt det jag själv skrev att man inte får göra.** STEG1.md
ovan säger *"familjen definieras av VARAN, inte av det tyska ordet leverantören
råkade sätta först"* — och sedan valde jag batchen på hela namnsträngen, vilket
är samma fel ett steg ned. **Deras klustring gick på MÅTTEN och hittade en till.**

Regeln skärps: **kluster på måttraden, aldrig på namnet — inte ens på hela
namnet.**

## Runda 103 byggs om

| id8 | modell | pris | status |
|---|---|--:|---|
| `c396356f` | A ljusgrå | 4 579 | kvar — prisgrind **grön** |
| `a7f029bf` | A mörkbrun | 4 619 | kvar |
| `7e84e482` | A cremevit | 4 819 | kvar |
| `297d8979` | A svart | 4 979 | kvar |
| **`a0760ed1`** | **A?** | **4 419** | ⚠️ **måttverifieras innan den tas in** |
| ~~`5439026e`~~ | B blå | 5 239 | **uppskjuten** — syskonet poleras av annan session |
| ~~`505eb413`~~ | B beige | 5 399 | **struken** — annan session äger den |

Rundan blir alltså **modell A ensam**, fyra säkra plus en att verifiera. Det är
dessutom precis det kluster den andra sessionen medvetet lade undan.

## Steg 3 — prisgrinden, det som hann köras

| id8 | landat | förväntat | faktiskt | dom |
|---|--:|--:|--:|---|
| `c396356f` | 3 813,71 | 4 579 | 4 579 | **stämmer** |

Leverantörsartikel `aosom:700-050V94GY`, DE-lager, fraktandel 0,306.
