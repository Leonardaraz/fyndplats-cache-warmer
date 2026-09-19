# Runda 140 — Steg 1: dubblettgrinden, avgjord på BILDEN

Steg 1:s första utkast kallade två par "trolig dubblett" på att texten var
byte-identisk. Måtten och **bilderna** avgör, och de avgör åt andra hållet:
**noll dubbletter, fyra färgpar.**

## Den publicerade grannen är samma modell — i en FEMTE färg

`hundsoffa-stor-hund-upphojd` (`64f5d64b`, 1 229 kr, publicerad) bär exakt
grupp A:s hela måttuppsättning:

| | publicerad `64f5d64b` | utkasten `01fcdf1d` · `bb3cd4ed` · `881540a6` |
|---|---|---|
| Totalmått | 98 × 67 × 25 | 98 × 67 × 25 |
| Sittyta | 86 × 59 × 14 | 86 × 59 × 14 |
| Dyna | 86 × 59 × 4,5 | 86 × 59 × 4,5 |
| Benhöjd | 8 cm | 8 cm |
| Hund | 30 kg / 60 cm | 30 kg / 60 cm |

☠️ **Beviset är inte tabellen — det är att MÅTTRITNINGEN är samma ritning.**
`01fcdf1d`s bild 3 och den publicerade sidans bild 5 har identisk layout,
identiska måttetiketter och identisk vy. Det enda som skiljer är att möbeln i
renderingen är omfärgad. Två renderingar ur samma källfil = en modell.

Och färgen skiljer dem åt. Dominerande tygfärg, mätt på hjältebilden med vit
bakgrund, husmärkesfärgat trä och hundpäls bortmaskade:

| sida | RGB | färg |
|---|---|---|
| `64f5d64b` **publicerad** | 80, 80, 80 | **mörkgrå** |
| `01fcdf1d` | 176, 176, 160 | **ljusgrå** |
| `bb3cd4ed` | 112, 160, 144 | **grön** |
| `881540a6` | 64, 80, 128 | **blå** |

De tre utkasten är alltså **färgsyskon till en publicerad sida**, inte
dubbletter av den. Korslänken ska gå åt båda håll (anmärkning #480).

⚠️ **`01fcdf1d` heter "Grau" hos leverantören och den publicerade sidan heter
"mörkgrå".** Samma ord, två olika tyger — 176 mot 80 i alla tre kanalerna.
Namnet och sluggen måste därför skilja dem, annars säljer vi två sidor som
utger sig för att vara samma färg.

## Paret som såg ut som en dubblett var ett FÄRGPAR

`5b8162d1` och `1835c144` har byte-identisk källtext, identiska mått
(64 × 45 × 36, sits 54 × 40,5 × 24,5, 7,8 kg, paket 65 × 48 × 31) och **samma
färgnamn i tyskan: `Dunkelgrau`**. Det är dubblettens signatur.

Bilden säger något annat:

| | `5b8162d1` | `1835c144` |
|---|---|---|
| tyskt `Farbe` | Dunkelgrau | **Dunkelgrau** |
| svenska spec-raden | Dunkelgrau | **Blau** |
| alt-texten | Samt-Touch **Grau** | **Blau** |
| **mätt på bilden** | **176, 176, 176 — ljusgrå** | **32, 112, 112 — petrolblå** |

☠️ **Tre källor säger tre olika saker, och den tyska säger fel på båda.**
Steg 5 regel 16 gäller: *bilden vinner*. Det är samma modell i två färger.

`9ee2fa6e` (112, 144, 128 — grön) och `c11948ac` (64, 64, 64 — mörkgrå) är
samma sak: identiska mått, snäckformad rygg på båda, två färger.

## Två som INTE hör till familjen

**`68f8cae9`** bär grupp A:s materialsträng och ligger tio kronor från
`881540a6`, men är en annan möbel: 96 × 66 × 24 (inte 98 × 67 × 25), sits
80 × 50 (inte 86 × 59), och bilderna visar kantstöd runt tre sidor med ett
avtagbart överdrag i stället för grupp A:s svepande rygg. Egen modell,
petrolblå.

**`01ac2f63`** — *Outdoor-Hundeschlafplatz mit Baldachin*, 122 × 92 × 108,
4,4 kg, stål och nätväv. Det är en **upphöjd nätbädd med soltak**, inte en
stoppad tygsoffa. Den publicerade `upphojd-hundbadd-xl-utomhus-122x92`
(639 kr) delar bäddramens tal men saknar soltaket. Den hör hemma i en
nätbäddsrunda med de sex publicerade `upphojd-hundbadd-…`-sidorna som grannar
— **lagd åt sidan**, inte poleras här.

## Rundans fjorton

| grupp | p8 | slug | SKU | färg (mätt) |
|---|---|---|---|---|
| A | `01fcdf1d` | `hundsoffa-98-cm-ljusgra` | `FP-hundsoffa-98-cm-ljusgra` | ljusgrå |
| A | `bb3cd4ed` | `hundsoffa-98-cm-gron` | `FP-hundsoffa-98-cm-gron` | grön |
| A | `881540a6` | `hundsoffa-98-cm-bla` | `FP-hundsoffa-98-cm-bla` | blå |
| B | `5b8162d1` | `hundsoffa-64-cm-ljusgra` | `FP-hundsoffa-64-cm-ljusgra` | ljusgrå |
| B | `1835c144` | `hundsoffa-64-cm-petrol` | `FP-hundsoffa-64-cm-petrol` | petrolblå |
| C | `9ee2fa6e` | `hundsoffa-snackrygg-gron` | `FP-hundsoffa-snackrygg-gron` | grön |
| C | `c11948ac` | `hundsoffa-snackrygg-gra` | `FP-hundsoffa-snackrygg-gra` | mörkgrå |
| — | `c9ccf5a3` | `hundbadd-kantstod-90-cm` | `FP-hundbadd-kantstod-90-cm` | grå |
| — | `4c5d4687` | `hundsoffa-sammet-102-cm` | `FP-hundsoffa-sammet-102-cm` | grå |
| — | `68f8cae9` | `hundbadd-96-cm-petrol` | `FP-hundbadd-96-cm-petrol` | petrolblå |
| — | `ee19a8c8` | `husdjurssoffa-70-cm-krem` | `FP-husdjurssoffa-70-cm-krem` | krämvit |
| — | `2ba6baf0` | `hundsoffa-sammet-82-cm` | `FP-hundsoffa-sammet-82-cm` | ljusgrå |
| — | `22c7de56` | `husdjurssoffa-rund-gron` | `FP-husdjurssoffa-rund-gron` | mörkgrön |
| — | `07ac9918` | `husdjurssoffa-med-forvaring` | `FP-husdjurssoffa-forvaring` | ljusgrå |

☠️ **SKU:n är räknad NU, inte i Steg 8.** Den publicerade grannens slug
`hundsoffa-stor-hund-upphojd` är 27 tecken efter fogeordsrensning och kapas
till `FP-hundsoffa-stor-hund` — färgen och `upphojd` faller bort. Hade de tre
i grupp A hetat `hundsoffa-stor-hund-<färg>` hade `ljusgra` kapats på exakt
samma sätt och sidan fått **samma SKU som den publicerade**. `98-cm` i stället
för `stor-hund` håller alla tre under 24 tecken med färgen kvar.

Noll SKU-krockar inom rundan, noll slugkrockar mot sitemapens 2 684 sidor.

## ☠️ Färgzoomen mätte en HUND första gången

Första zoomen tog en fast ruta ur kontaktkartan och landade mitt i en golden
retriever på två av sju rader — `64f5d64b` gav 110, 104, 100 och `68f8cae9`
gav 67, 89, 99, båda päls och skugga, inte tyg. Talen såg fullt rimliga ut.

Mätningen ovan maskar därför bort vit bakgrund, svart, och allt med varm ton
(hundpäls, trä) innan den klustrar, och den körs på hela hjältebilden i stället
för en gissad ruta. **En färg skrivs aldrig ur en fast ruta heller** — bara ur
en mätning som vet vad den INTE tittar på.
