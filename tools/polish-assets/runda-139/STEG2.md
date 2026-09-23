# Runda 139 — Steg 2: laglighets- och sanningsgrinden

Tio produkter. Mätt mot leverantörens egen tyska `Technische Daten`, inte mot
produktnamnet (#462: namnet räknade fel på tre av elva).

## Vad som INTE gäller

**SJVFS 2019:15 (L80) gäller inte här.** L80 sätter minimimått på
FÖRVARINGSUTRYMMEN för hund och katt — burar, boxar, transportlådor. Ett
klösträd är inredning som katten rör sig fritt till och från, inte ett utrymme
den hålls i. Ingen minimiyta ska räknas, och ingen sida ska påstå att den
"uppfyller Jordbruksverkets krav" — det finns inget krav att uppfylla.

**CE-märkning finns inte för kattmöbler.** Ingen CE-direktivsfamilj täcker
husdjursmöbler (leksaksdirektivet gäller barnleksaker, inte djur). Noll
CE-påståenden i texten — samma regel som #252 satte efter en ogrundad
certifiering.

## ☠️ Fyra POSITIVA villkor — sånt som måste STÅ, inte utelämnas

### 1. Maxvikten på katten är batchens viktigaste kundfakta

| id8 | leverantörens gräns |
|---|---|
| `3a96740e` | **under 4,5 kg** |
| `b813d037` | **4,5 kg** per katt (30 kg totalt på möbeln) |
| `1467588a` · `27b607dc` · `3addfbf8` · `4faf9f4c` · `b04b5375` | under/max 5 kg |
| `8d074911` | 1–3 katter, **var och en** upp till 5 kg |
| `90573e36` | upp till 5 kg (1–2 katter) |
| `a4d8feca` | — (bärighet 10 kg, ingen kattviktsgräns angiven) |

En svensk huskatt väger 4–5 kg. En norsk skogkatt eller maine coon väger 6–9.
**En gräns på 4,5 kg utesluter en stor del av marknaden**, och kunden kan inte
se det på bilden. Gränsen ska stå i brödtexten på varje sida som har en — inte
bara i spec-tabellen.

`4faf9f4c` har dessutom tre skilda tal: 15 kg totalt, 10 kg på bädd/hylla,
8 kg i hängmattan. Alla tre ska med; det högsta ensamt vore vilseledande.

### 2. Takhöjden på den takspända (`90573e36`)

Spänns mellan golv och tak, ställbar **220–240 cm**. Svensk normalhöjd är
240–250 cm, och **många hem har 250**. Den kunden kan inte montera den alls.
Det här är batchens mest sannolika returorsak och ska stå i första stycket,
inte i en flik.

### 3. Väggmonteringen (`8d074911`, `b04b5375`)

Båda är väggset. `b04b5375`:s tyska text säger rakt ut att plugg krävs och att
skruvvalet beror på väggtypen. Texten ska säga att infästningen väljs efter
vägg och att en katt som landar från ett hopp belastar mer än sin vikt — och
den får ALDRIG lova att det "passar alla väggar" eller att skruv ingår, för det
står inte i leveranslistan.

### 4. Materialet är SPÅNSKIVA

Alla tio bär `Spanplatte` i stommen. Ingen sida får säga massivt trä.

⚠️ `3addfbf8`:s svenska spec-rad säger **"Technisches Holz"** — en omskrivning
för spånskiva. Använd inte den formuleringen mot kund; skriv spånskiva.

## ☠️ Tre självmotsägelser i leverantörens EGNA data

### a) Spec-etiketten säger KATTLÅDA, geometrin säger HÅLA — på två produkter

| | spec-etikett | mått | dörröppning |
|---|---|---|---|
| `4faf9f4c` | `Größe des Katzenklos` | 40 × 30 × 27 cm | — |
| `90573e36` | `Katzentoilettengröße` | Ø33 × 31H cm | 20 × 22 cm |

Båda produkternas TITEL säger `Katzenhöhle` respektive `Höhle`. En Ø33 × 31 cm
box med en 20 × 22 cm dörröppning, monterad på en takspänd stolpe två meter upp,
är ingen kattlåda. Att två produkter bär samma feletikett gör det systematiskt —
troligen leverantörens egen översättning.

**Beslut: båda beskrivs som HÅLA.** Ordet kattlåda får inte förekomma. Att sälja
en håla som kattlåda är ett konkret kundfel: kunden köper förvaring för sand och
får ett sovutrymme.

### b) `b813d037` anger två olika färger

Tyska `Technische Daten` säger **Grau**, den svenska spec-raden **Hellgrau**.
Avgörs på bilden i Steg 4 — inte på någon av raderna.

### c) `8d074911` säger fyra delar och listar sex

Namnet säger `4 Teile`. Spec-blocket listar trevåningsdel, hyllplan med håla,
mjuk stege, molnplattform, molnklösbräda och kattbädd. **Antalet räknas på
bilden i Steg 4**, aldrig ur namnet.

⚠️ Och `Größe der Katzenhöhleplattform: 151B x 30T x 30H cm` är inte en
produktdimension i vanlig mening — 151 cm är sannolikt hela väggspannet när
delarna sitter i rad. Det talet skrivs inte ut som "produktens mått".

## ⚠️ Vikten i spec-tabellen är FRAKTVIKTEN (#488)

| id8 | tyska `Gewicht` | svensk spec `Vikt` |
|---|--:|--:|
| `3a96740e` | 14 kg | 15 kg |
| `05c91630` (uppskjuten) | 9,2 kg | 12 kg |

Skillnaden är emballaget. Där de två talen finns används det tyska; där bara
spec-raden finns skrivs ingen vikt alls hellre än ett tal som är fel.

## Utfall

**Noll produkter fälls.** Tio går vidare till Steg 3 med fyra villkor som
måste stå i texten och tre motsägelser som avgörs på bilden i Steg 4.
