# Runda 107 — tvåplansstall med löpgård

Sju utkast ur samma familj som runda 106, valda för att de är den undergrupp
där golvytan räcker till en marsvinsGRUPP. Marsvin får inte hållas ensamma, så
en bur som rymmer exakt ett djur är ingen marsvinsbostad — det tar bort de
mindre stallen ur urvalet.

## Steg 1 — svepet

| | |
|---|---:|
| Produkter lästa | 5 580 |
| Sidor | 56 |
| `avhuggen` | `false` |
| Publicerade | 2 410 |
| Unika publicerade | 2 410 |
| …med läsbar måtttrippel | **1 902** |
| **Måttkrockar mot rundans sju** | **0** |

Kontrollmätningen är det som gör nollan värd något: två sidor som med säkerhet
är publicerade och bär sina mått — `27dc50ae` (110 × 50 × 86) och `f3fdcd4a`
(90 × 53 × 59) — hittas båda av svepet. Runda 106 lärde varför det steget
behövs: en trasig svepversion hittade 285 av 2 404 sidor och rapporterade
"noll krockar" med gott samvete.

Alla sju stod `visible:false`, `revision:1` — orörda av den andra sessionen.

## ☠️ Steg 2/5 — leverantören blandar INNER- och YTTERMÅTT mellan syskonsidor

`a75fcfde` och `c0770388` har exakt samma yttermått, 230 × 53 × 93,5. Första
läsningen gav dem olika golvyta (0,99 mot 0,86 m²) och därmed olika antal djur
(fem mot fyra marsvin) — **två svar på samma bur.**

Beviset att det ÄR samma bur står i deras egna spec-block:

| | `a75fcfde` | `c0770388` |
|---|---|---|
| Dörrar | 30 × 26 · 30 × 25 · 29 × 47,5 | **identiska** |
| Ramp | 61 × 14,8 | **identisk** |
| Huset | 74 × 45,5 × 50 | 74 × 45 × 49 **+ innermått 70 × 41 × 48** |
| Löpbox under huset | 74 × 45,5 × 35 | 70 × 41 × 32 |

`c0770388` anger huset BÅDE utvändigt och invändigt. Skillnaden mellan
syskonen är alltså inte konstruktionen utan vad som mäts. Grinden räknar på
**innermåttet** — det är den yta djuret faktiskt har — och då ger båda 0,86 m²
och fyra marsvin. Samma klass av fel som runda 106:s ytterhöjd: ett för
generöst mått släpper igenom en bur som inte klarar kravet.

### Verdikt: noll av sju räcker till någon kanin — inte ens en dvärgkanin

| id | pris | yttermått | golv | dvärgkanin | marsvin | degu |
|---|---:|---|---:|---|---:|---:|
| `a75fcfde` | 3 179 | 230 × 53 × 93,5 | 0,86 m² | **NEJ** | 4 | 2 |
| `c0770388` | 3 119 | 230 × 53 × 93,5 | 0,86 m² | **NEJ** | 4 | 2 |
| `2253c509` | 1 949 | 141 × 60 × 86 | 0,75 m² | **NEJ** | 4 | 4 |
| `2435c4d1` | 1 649 | 156 × 58 × 68 | 0,76 m² | **NEJ** | 4 | 1 |
| `dcdf889d` | 1 519 | 156 × 58 × 68 | 0,76 m² | **NEJ** | 4 | 1 |
| `525e6acf` | 1 669 | 123,5 × 62,6 × 92,5 | 0,61 m² | **NEJ** | 3 | 1 |
| `079f2901` | 1 649 | 123,5 × 62,6 × 92,5 | 0,61 m² | **NEJ** | 3 | 1 |

Det som fäller dem är inte ytan utan **kortaste sidan**. Dvärgkaninen kräver
50 cm; modell P:s boxar är 41 cm breda. Ytan räcker gott på fem av de sju.

Fem av sju heter ändå *Hasenstall*, *Kaninchenstall* eller
*Zwergkaninchenstall*, och `c0770388` skriver ut det:

> "Die großzügige Fläche von 1,2 m² bietet 2–4 kleinen Kaninchen bequem Platz"

Talet 1,2 m² är dessutom inte bottenytan — det är summan inklusive huset ovanpå.

## ✅ Steg 4 — bottenfrågan var ingen motsägelse

Syskonen i modell S sa emot varandra i texten: `525e6acf` skriver *"Grasiger
Boden mit bodenlosem Design"*, `079f2901` skriver *"Herausnehmbare Bodenwanne"*
med måttet 54 × 18,5. Samma mått i övrigt, så en av dem såg ut att ljuga.

Bilderna visar att **båda har rätt om var sin halva**: löpgården är bottenlös
och står på gräset, huset har en utdragbar bottenbricka. Att bara skriva det
ena hade blivit fel om den andra halvan — och texten hade sett verifierad ut,
eftersom den citerade leverantören ordagrant.

⚠️ **`079f2901`:s måttritning säger emot sin egen spec-text** (122 × 53 × 92 och
48,5 cm mot textens 123,5 × 62,6 × 92,5 och 54 cm). Syskonets ritning stämmer
mot spec-texten på varje tal, så det är ritningen som är fel. Texten gäller;
ritningens tal skrivs inte ut.

## ☠️ Steg 4 — tre bilder ska inte till kunden

| id | bild | varför |
|---|---:|---|
| `2253c509` | 4 | Fristående gånghage med bågtak som **inte ingår** |
| `dcdf889d` | 4 | **Samma foto**, samma problem |
| `525e6acf` | 4 | Tysk text i pixlarna + löfte om kanin, höns och anka |

De två första är samma bild på två olika produkter — och hagen i bilden är den
ORANGEA modellen, så den kan på sin höjd visa en av dem. Den tredje bär
*"GEEIGNET FÜR VERSCHIEDENE KLEINTIERE"* med ikonerna Kaninchen / Hühner /
Enten inbränt i pixlarna. Språket går inte att polera bort, och löftet är
dessutom fel: L80-grinden ger noll kaniner, och höns och ankor är en annan
storleksklass.

De tre produkterna får sitt eget Fyndplats-kort på platsen i stället.
