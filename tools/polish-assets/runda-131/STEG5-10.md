# Runda 131 Steg 5–10 — fem produkttyper bytte, och kontaktarket var fel

## ☠️ FYRA AV SJU BYTTE PRODUKTTYP EFTER STEG 4 — I BÅDA RIKTNINGARNA

| id8 | Steg 3 (`Lieferumfang`) | Steg 4 (kontaktark) | **Steg 5 (förstoring)** |
|---|---|---|---|
| `2166c50f` | ramp | TRAPPA, 8 steg | **TRAPPA, 10 steg** |
| `9a513e9a` | ramp | TRAPPA, 8 steg | **TRAPPA, 10 steg** |
| `c2be0f30` | ramp | TRAPPA, 8 steg | **TRAPPA, 10 steg** |
| `15e4c7a7` | **RAMP** | TRAPPA, 6 steg | **RAMP** — Steg 3 hade rätt |

☠️ **En HALKBATT på en ramp och en NOSNING på en trappa ser identiska ut i
miniatyr.** Det är hela lärdomen. `15e4c7a7`:s förstoring visar att den grå
mattan löper **sammanhängande under** trälisterna — det finns inga avsatser.
Kontaktarket läste listerna som steg och kullkastade ett riktigt Steg 3-svar
med ett felaktigt Steg 4-svar.

**Regeln, skärpt igen:** produkttypen avgörs inte av kontaktarket. Den avgörs
av om ytan MELLAN listerna är sammanhängande (ramp) eller avsatsad (trappa),
och det syns först i förstoring. `Anti-Rutsch-Abstand: 10 cm` i specen är
battavståndet — en trappa har ingen sådan rad, den har `Trittgröße`.

## ☠️ ANTALET STEG: 10, INTE 8 — mitt eget tal var fel

Steg 4 skrev "8 steg" efter en miniatyrräkning. Två oberoende källor säger 10:

1. Leverantörens EGEN slug: `hunderampe-auto-klappbar-hundetreppe-mit-10-stufen-…`
2. En uppmärkt räkning på den svarta modellens hjältebild
   (`markerade-steg.jpg`): topplattform, tio trampytor, bottenläpp.

Mellanliggande försök gav 8, 11, 12 och 16 beroende på metod. **Ett tal som
ger fyra olika svar beroende på hur man räknar är inte mätt förrän två
oberoende källor möts.**

## ⚠️ HALKLISTERNA: 4 st, mekaniskt räknade på ALLA TRE syskonen

Första mätningen gav **4 / 0 / 0** — tröskeln var satt efter den GRÅA
modellens klargula lister, och syskonens är blekare. Med lösare tröskel:
4 / 4 / 4, med klumpstorlekar 1 576–6 273 px. **En färgtröskel är ingen
mätning förrän den prövats på varje syskon.**

## ☠️ FYRA AV SJU UTKAST DELADE REDAN EN SKU

| SKU i utkastet | satt på |
|---|---|
| `FP-hunderampe-auto-klappbar` | `2166c50f` OCH `9a513e9a` |
| `FP-haustierrampe-mit` | `935cd17b` OCH `1b64abde` |

Och det uppenbara sluggförslaget hade återinfört krocken: `hundtrappa-bil-
154-cm-gra` är 25 tecken, `PRODUCT_PART_MAX` är 24, och kapningen tar bort
**FÄRGEN** — alla tre syskonen hade blivit `FP-hundtrappa-bil-154-cm`.
Lösningen är runbokens: behåll den SÄRSKILJANDE svansen, kapa mitten. "cm"
ströks ur sluggen och då ryms färgen på alla tre.

**Verifierat mot HELA katalogen 2026-09-11:** 5 649 produkter på 57 sidor,
**noll** av de sju SKU:erna och **noll** av de sju sluggarna redan tagna.

## Steg 5 — vad som INTE fick skrivas

- ☠️ **`935cd17b` anger TVÅ maxlaster** för samma konstruktion i samma block:
  `Belastbarkeit: 75 kg` och `Empfohlenes Gewicht: Nicht mehr als 40 kg`.
  Sidan skriver **40**, och 75 nämns inte alls.
- ☠️ **Biltrappans egen grafik motsäger sin egen maxlast**: "GEEIGNET FÜR
  MITTELGROSSE & GROSSE HUNDE" bredvid "Maximales Gewicht < 25 kg", med
  raser som väger 20–38 kg. Sidan skriver 25 kg, beskriver aldrig varan som
  "för stora hundar", och **bilden är borttagen**. Alt-texten bar samma
  motsägelse ordagrant (`für groß Hunde bis 25kg`) — omskriven.
- ⚠️ **Montering står i INGEN av de sju källorna.** Ingen sida påstår därför
  något om den; det som står är vad `Lieferumfang` listar. Grinden fäller
  ordet i egen text men släpper det i ett länkstycke, där det är grannens
  uppgift (`hundramp-bil-155-cm` har den).

## ☠️ FYRA BATCHSUPERLATIV I MIN EGEN FÖRSTA TEXT

Runbokens Steg 5 regel 14 säger att ett "högst/lägst/mest" kräver en sökning
bland de PUBLICERADE sidorna, inte bland rundans sju. Jag skrev fyra ändå:

- *"Den högsta rampen i den här uppsättningen"*
- *"mest av de sju varorna här"*
- *"den lägsta bärigheten av ramperna på Fyndplats"*
- *"15 kilo — den lättaste i uppsättningen"*

De tre första hittade jag själv; **den fjärde hittade grinden**, som fick en
egen `BATCHSUPERLATIV`-regel av de tre första. Alla fyra omskrivna.

## Grinden och mutationstestet

`grindar._sjalvtest(): 56 fall, 0 fel` · `grind.sjalvtest(): 36 fall, 0 fel` ·
**25 mutationer, 0 missade.** Rundans två egna huvudgrindar:

- **TYPGRINDEN** kräver rätt typord i namn, titel, slug och meta — och
  förbjuder fel. Brödtexten är undantagen med flit: biltrapporna SKA få säga
  "ramp" när de förklarar att ramper finns som alternativ.
  ☠️ Grindens första version var trasig: `\bramp` matchar INTE "hundramp",
  för `d` och `r` är båda ordtecken. **Självtestet hittade det.**
- **LASTGRINDEN** kräver produktens EGEN last i namn och meta, och fäller en
  ANNAN produkts last i den egna texten. Rundans fyra laster (15/25/40/50 kg)
  står på varor som ser likadana ut på ett kontaktark.

Fyra fel i min egen prosa hittades utanför grinden, på en genomläsning:
`mäter din lastkant` (imperativ), `Vikt på mitten` (läses som substantivet
vikt på en sida om maxlast), `Den måttet` (genus), och en gemen
meningsbörjan i korslänksstycket. **Rättade PER ORD i alla sju texterna**,
inte per förekomst — CLAUDE.md:s mätta regel.

## Steg 7–10: skrivet och verifierat

| steg | vad | kvitto |
|---|---|---|
| 7 | namn, slug, `plainDescription`, `seoData` | **7/7** byte för byte (längd + hash) |
| 8a | Wix variant-SKU | **7/7**, jämförd som STRÄNG, inte förekomst |
| 9 | bilder | 35 → **24**, elva borttagna, noll utan alt-text |
| 10 | kategorier | 14 skrivningar, **0 misslyckade** |

☠️ **Förgrinden före Steg 7 skrev ingenting förrän JS-mallen reproducerat
Python-källan byte för byte.** Tvillingar glider isär; hashen mäter det, och
den mäter FÖRE skrivningen. 3/3 respektive 4/4 matchade.

☠️ **`visible` utelämnades i Steg 7 och skickades explicit i Steg 8** —
reglerna är MOTSATTA i de två stegen. Kvittot lästes på
`variantsInfo.variants[].visible`, inte på produktens: `false` / `[true]` på
alla sju, alltså köpbar variant den dag sidorna publiceras.

⚠️ **`?fields=MEDIA_ITEMS_INFO,DIRECT_CATEGORIES_INFO` i SAMMA GET svarar
400** (`Failed to parse JSON or deserialize protobuf message`). De två
projektionerna kräver var sin läsning.

## Kategorierna: familjen delar sig på TRANSPORT mot HEM

| | publicerade grannar | rundan |
|---|---|---|
| **Husdjur** + *Selar, Koppel & Transport* | `hundramp-bil-155-cm`, `hopfallbar-hundramp-bil-158-cm` | de tre biltrapporna |
| **Husdjur** + *Lek & Tillbehör för husdjur* | `hundtrappa-med-forvaring`, `hundtrappa-sma-hundar-katter-4-steg` | de fyra möbelramperna |

⚠️ `vikbar-husdjurstrappa-4-steg` ligger bara på `Husdjur` utan löv — den
saknar alltså lövet sina fyra syskon har. Noterat, inte rättat i rundan.
