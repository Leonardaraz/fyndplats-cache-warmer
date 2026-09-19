# Runda 77, Steg 2–5 — lagligheten, bilderna, färgen och specarna

## Steg 2: vad som INTE får stå

1. ☠️ **Ingen av de sju bär någon certifiering, och ingen ska påstås.** Källan
   nämner varken EN 1335, AFS eller ergonomigodkännande. Ordet **`ergonomisk`
   är helt förbjudet i rundans text** (`ERGONOMI_RE` i linten, ärvd från
   runda 76) — den tyska titeln säger `Ergonomischer Bürostuhl` på fyra av
   sju, och det ordet får inte följa med över språkgränsen som ett påstående
   vi inte kan belägga.
2. **120 kg maxlast på alla sju**, en person i taget. Talet står i källan för
   varenda modell och skrivs ut.
3. ☠️ **Hjärtryggsstolen är INTE en ritstol.** 78–88 cm total höjd och sitthöjd
   44–54 — en vanlig låg skrivbordsstol. Den får inte korslänkas som ett
   alternativ till ritstolarna, bara till sitt eget färgsyskon.
4. **Montering krävs på alla sju** (`Montage erforderlich`). Skrivs ut.
   ⚠️ `d739872f` lovar dessutom "Montage in nur 30 Minuten" — en mjuk
   säljutsaga, inte ett mått. Den utelämnas; huset skriver inte tider vi inte
   kan mäta.
5. **Inga hälsopåståenden.** Ingen av rundans modeller har massage eller värme
   — de 52 massagemodellerna i familjen ligger kvar för en egen runda med egen
   grind.

## Steg 4: bilderna

40 källbilder granskade på kontaktark (`ark-G.jpg`, `ark-H.jpg`).

☠️ **Fyra bilder bär INBRÄND TYSK TEXT och plockas bort:**

| id8 | bild | vad som står |
|---|--:|---|
| d739872f | 4 | `SICHER FÜR ALLE ARTEN VON BÖDEN`, `Geeignete Boden`, `PU-Räder`, `Ruhig` |
| 795c5ee2 | 4 | `Mesh-Gewebe`, `dicke Polsterung`, `Hochwertiger Gaslift`, `Stabile Basis` |
| 3033003c | 4 | `FLEXIBEL UND BEQUEM`, `Für Multitasking-Komfort` |
| 3033003c | 5 | `Mesh-Gewebe`, `Hochwertiger Gaslift`, `dicke Polsterung`, `Stabile Basis` |

`3033003c` blir därmed tre källbilder plus kortet. Hellre en bild färre än en
tysk mening på en svensk sida.

Hjärtryggsparets tio bilder är alla rena — första gången i den här familjen.

### ☠️ En VINSETTO-etikett sitter insydd under sitsen på `83fd57c9`

Bild 5 är en närbild där leverantörens husmärke är fullt läsbart på en vit
tygetikett under sitskanten.

**Bilden stannar.** Leonards regel 2026-08-06: sitter märket fysiskt på varan
gör vi ingenting åt det — avgörande-testet är om det skulle synas när kunden
packat upp stolen, och en insydd etikett gör det. Vi tvättar bort det som är
PÅLAGT i bildfilen, aldrig varan själv.

⚠️ Men **märket får aldrig nämnas i text eller alt-text**, och alt-texten för
just den bilden beskriver därför sitsens framkant och fotringen — inte
etiketten. Det är skillnaden mot runda 64:s fynd, där logotypen var inbränd i
pixlarna och bilden plockades bort.

## Steg 4: färgen är MÄTT, inte läst

Runda 76 hittade fyra felaktiga färgord av åtta i källan. Här mättes
hjärtryggsparet på sitsen i hjältebilden (`farg.py`, rutorna sparade i
`beskuret/`):

| id8 | källan | rgb | H | L | S | gren | skrivs |
|---|---|---|--:|--:|--:|---|---|
| df0d351f | Weiß | 224 · 225 · 224 | — | 88,0 | **0,9** | neutral | **vit** |
| cc0ec7ba | Rosa | 226 · 197 · 195 | 2,5 | 82,6 | 34,3 | kulört | **rosa** |

S = 0,9 % är kliniskt neutralt — ingen gulton, alltså **vit** och inte
gräddvit. Båda källorden stämmer den här gången; det är mätningen som gör det
till ett besked i stället för en förhoppning.

De fem ritstolarna är alla svart nät på svart bas och mäts inte — det finns
inget att skilja dem åt med.

## Steg 5: specarna, och de två som INTE skrivs

Alla mått ur `Gesamtabmessungen`/`Gesamtmaße`, verifierade mot måttritningen
(bild 3) i `ark-ritningar.jpg`. **Ritningen är facit** — bokstäverna L/B/T
betyder olika saker i samma spec-block.

| id8 | mått B×T×H | sits | sitthöjd | armstöd över sits | fotring | material |
|---|---|---|---|---|---|---|
| d739872f | 60 × 60 × 108–132 | 48 × 50 | 53–78 | 26,5 cm, uppfällbara | — | nätväv 100 % polyester, stål |
| 795c5ee2 | 59 × 61 × 93–113 | 46 × 44 | 50–70 | inga | Ø45, 17–34,5 | nätväv 100 % polyester, stål |
| 3033003c | 59 × 65 × 102–122 | 53 × 50 | 52–72 | 20 cm, uppfällbara | Ø45, 20–37 | nätväv 100 % polyester |
| 83fd57c9 | 59 × 59 × 95–115 | 48 × 45 | 52–72 | 19 cm | Ø45, 20–37 | nätväv 100 % polyester, stål |
| f1f861ea | 60 × 56 × 110–132 | 48 × 49 | 65,5–87 | 19 cm | 18–46 | nätväv 100 % polyester, stål |
| df0d351f | 45 × 56 × 78–88 | 46 × 39 | 44–54 | inga | — | teddytyg 100 % polyester |
| cc0ec7ba | 45 × 56 × 78–88 | 46 × 39 | 44–54 | inga | — | teddytyg 100 % polyester |

Ryggstöd: `3033003c` 67 × 53, `83fd57c9` 45 × 45, `f1f861ea` 44,5 × 45,5,
`795c5ee2` 41 × 39, hjärtryggsparet 45 × 38. Svankstödet på `3033003c` är
40 × 37 cm.

⚠️ **`d739872f`:s ryggstödsmått UTELÄMNAS.** Källan säger `59L x 49B`, men
måttritningen visar 60 cm tvärs över ryggen och 59 cm på höjden. Vilket tal
som är bredden går inte att avgöra, och ett mått som kanske är fel är sämre
än inget mått. Samma beslut som runda 76 tog på grupp E.

☠️ **`f1f861ea` har TVÅ olika totalmått i samma utkast.** Spec-blocket säger
`60L x 56B x 110-132H`, medan Wix egen `Mått:`-rad säger `64L x 57B x 132H`.
Måttritningen visar 60 cm bas och 110–132 cm höjd → **ritningen vinner**, och
60 × 56 × 110–132 är det som skrivs. Samma klass som runda 66:s fyra fåtöljer
med två maxlaster: leverantören motsäger sig själv, och bilden är den enda
skiljedomaren.

**Ingen vikt skrivs.** Källan anger vikt för noll av de sju — bara
belastningskapaciteten, som är något annat. Huset hittar inte på siffror.
