# Runda 116 Steg 1 — hundvagnsfamiljen

## Svepet

Hela katalogen läst i två etapper via `products/search`, **5 623 rader**
(3 154 utkast, 2 469 publicerade), `avhuggen: false` i båda etapperna.

Familjen ringades in på **båda språken** — `hundewagen|hundebuggy|haustierwagen`
OCH `hundvagn|hundbuggy|cykelvagn-for-hund`. Det är uppgift #421:s lärdom från
runda 115, där ett svep på leverantörens tyska ord missade fem redan polerade
svenska syskon. Utfallet:

| | |
|---|---:|
| Utkast | **33** |
| PUBLICERADE hundvagnar | **16** |
| Bilder bakom dem | 253 |

Sexton levande sidor slåss redan om ordet `hundvagn`. Trettiotre nya hade
kannibaliserat dem — familjen är alltså inte en lucka, den är trång.

## ☠️ Grinden mätte FEL SAK, och det tog två försök att se

Första versionen av `familj.py` jämförde **huvudbild mot huvudbild** och ärvde
`NARA = 6.0` rakt av från runda 115. Den rapporterade:

> `0 utkast ligger nära en PUBLICERAD sida`

Ögat sa något annat. `ca84c48b` (729 kr) och publicerade `hundvagn-liten-hund`
(629 kr) är samma vagn: samma teleskophandtag med samma rem, samma fyra små
hjul, samma PawHut-logotyp på samma panel. Paret låg på **6,18** — arton
hundradelar över ett tak som aldrig mätts på den här familjen.

☠️ **Och runbooken hade redan mätt exakt det paret till 0,10** (runda 47,
2026-09-01). Den siffran är *lägsta bildskillnad över ALLA bilder*. Min
hjälte-mot-hjälte gav 6,18 på samma par, för de två sidorna delar en
byte-identisk bild — men inte på plats 1. Den publicerade huvudbilden har en
hund i vagnen, utkastets har inte.

Jag skrev alltså en **svagare tvilling** av en grind runbooken redan beskriver,
och lappade sedan tröskeln i stället för metoden. Husets vanligaste bugg en gång
till: *tvillingar glider isär*.

**Lagat, och lagningen är mätt:**

| | hjälte mot hjälte | hela uppsättningen |
|---|--:|--:|
| `ca84c48b` mot `hundvagn-liten-hund` | 6,18 | **0,00** |
| negativ kontroll (cykelvagn mot liten hundvagn) | 72,53 | 38,22 |

`avstand()` tar nu minimum över alla bildpar. Den positiva kontrollen går mot
runbookens egen siffra och **fäller om metoden glider tillbaka**. Och eftersom
avståndet inte överlever ett familjebyte — hälften av hundvagnarna har en HUND i
bilden, och hunden ensam flyttar medelavvikelsen flera enheter — lämnar grinden
alltid över de åtta närmaste paren till ögat, oavsett avstånd. **En grind som kan
svara "noll" är en grind som lär mottagaren att lita på tystnaden.**

⚠️ **Men minimum-över-allt fäller också på DELADE TILLGÅNGAR.** Fyra utkastpar
ligger på 0,00 utan att vara dubbletter — de delar en måttritning, en detaljbild
eller en reklamgrafik. Grinden rapporterar därför vilka POSITIONER som gav
minimumet, och ögat avgör: en träff på en produktbild är produktidentitet, en
träff på en generisk grafik är en delad fil.

| par | d | positioner | vad bilden ÄR | dom |
|---|--:|---|---|---|
| `ca84c48b` ≡ `7b344636` | 0,00 | 3↔5 | **måttritning**, 75/45/53/28/21 cm | ☠️ DUBBLETT |
| `3bc2f3f7` ≡ `066a7f98` | 0,00 | 5↔5 | detaljfoto på hjul och broms | färgsyskon |
| `7bc8e179` ≡ `73f881f0` | 0,00 | 5↔5 | reklamgrafik | delad fil |
| `3b0aca0a` ≡ `7bc8e179` | 0,00 | 5↔5 | reklamgrafik | delad fil |

En måttritning med samma tal är produktidentitet. En reklamgrafik är det inte.

## ☠️ En LEVERANTÖRSREKLAM ligger i bilduppsättningen — märke och tysk text

Position 5 på fyra utkast är ingen produktbild alls. Det är PawHuts egen
reklamgrafik: en golden retriever med frisbee, **husmärket två gånger** (logotyp
plus vattenstämpel) och tysk annonstext inbränd i pixlarna —
*"Pfoten hoch, draußen entspannen. Ein Rückzugsort im Garten für deinen besten
Freund."*

Uppmätt över hela familjens 253 bilder:

| | |
|---|---:|
| Bilder som bär grafiken | **4** |
| Av dem på PUBLICERADE sidor | **0** |
| Utkast som bär den | `0fdf9aba`, `3b0aca0a`, `73f881f0`, `7bc8e179` |

Läckan har alltså inte nått kund. Men den kom förbi `RENA_BILDPOSITIONER`, som
finns just för att hålla tysk text ute — grafiken ligger på en position importen
räknar som ren. Två av de fyra ligger i den här rundans batch och **ska bort i
Steg 4**.

## Klustren — ögat har dömt varje ett

| kluster | rader | avstånd | dom |
|---|---|--:|---|
| `ca84c48b` mot PUBLICERADE `hundvagn-liten-hund` | 729 mot 629 kr | **0,00** | ☠️ **BEVISAD DUBBLETT** |
| `97ead85f` mot PUBLICERADE `hundvagn-regnskydd-mugghallare` | blå mot grå | 12,36 | färgsyskon till en LEVANDE sida |
| 4 kg: `40f46441` röd · `adc81917` grå · `cbb38884` blå | 979 / 939 / 999 | 0,75–1,10 | färgsyskon |
| tre hjul: `eb02039b` röd · `3b0aca0a` blå · `1f311250` taupe · `0fdf9aba` vit | 1129 / 899 / 899 / 999 | 2,36–2,38 | färgsyskon |
| stor jogger m. helskydd: `3bc2f3f7` grå · `066a7f98` blå | 2429 / 1949 | 0,00 (detaljfoto) | färgsyskon |
| jogger m. öppen ram: `ec81220f` mint · `68e59405` grå | 2199 / 2269 | 2,47 | färgsyskon |

Färgsyskon poleras med korslänk, inte med pensionering — uppgift #420.

## ☠️ Dubbletten är TIO DYGN GAMMAL, inte ny

`ca84c48b` flaggades redan i **runda 47** (2026-09-01) och står ordagrant i
runbooken. Den ligger fortfarande kvar i utkastshögen. Att grinden hittade den
igen, med en helt annan metod och från noll förkunskap, är ett kvitto på
metoden — men det säger också att **ett fynd som lämnas till Leonard utan att
åtgärdas kommer tillbaka som arbete i varje kommande runda som rör familjen.**

Den hålls ur rundan och går till Leonard tillsammans med #422.

## Batchen

**Sju utkast i två färgfamiljer**, båda små/mellanstora stadsvagnar:

| # | id | färg | pris |
|---|---|---|---:|
| 1 | `40f46441` | röd | 979 |
| 2 | `adc81917` | grå | 939 |
| 3 | `cbb38884` | blå | 999 |
| 4 | `eb02039b` | röd | 1129 |
| 5 | `3b0aca0a` | blå | 899 |
| 6 | `1f311250` | taupe | 899 |
| 7 | `0fdf9aba` | vit | 999 |

☠️ **Sökordet är låst mot de två närmaste LEVANDE sidorna, inte mot varandra.**
Bilderna visar fyra olika varor:

| sida | hjul | kropp |
|---|---|---|
| batch 1–3 (4 kg) | fyra små | låg, mesh-kupol |
| batch 4–7 (10 kg) | tre | hög, djup korg med formgjutet bakstycke |
| PUBLICERAD `hundvagn-hopfallbar-liten-hund-sufflett-broms` | fyra små | öppen oval korg med separat dragkedjeskydd |
| PUBLICERAD `hundvagn-tre-hjul-lasbart-framhjul` | tre STORA ekerhjul | jogger med låsbart framhjul |

Därav:

- 4 kg-trion äger **viktgränsen** (`hundvagn liten hund 4 kg`) — den publicerade
  granne har ingen viktsiffra i sin slug.
- ☠️ **Kvartetten får INTE äga `tre hjul`.** Ordet tillhör `594d5f4b`, som redan
  ligger live på det. Kvartetten äger i stället **korg + kudde** och 10 kg.

Låses slutgiltigt i Steg 4, enligt runbokens regel att bilderna avgör vad varan
faktiskt är.
