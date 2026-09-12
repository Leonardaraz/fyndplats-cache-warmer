# Runda 136 — Steg 4: bildgranskningen

Granskat: **40 bilder** (8 produkter × 5). Underlaget är `ark-<pid>.jpg`
(kontaktark, fem rutor per produkt) plus `zoom-hornsvep.jpg` och
`zoom-loggor.jpg`. Originalen till de fyra bilder som ändras är hämtade
OTRANSFORMERADE (2000 × 2000) till `orig/`.

☠️ **Wix-plats är inte leverantörens plats.** Importen tar hem
`RENA_BILDPOSITIONER = [1, 2, 3, 8, 9]`, så Wix 1–5 = källa 1, 2, 3, 8, 9.
Kontaktarken är märkta med BÅDA, så granskningen frågar rätt bild rätt fråga.

## Utfallet

| pid | wix | källa | fynd | åtgärd |
|---|--:|--:|---|---|
| `4a5acc7d` | 5 | 9 | ☠️ leverantörsreklam: gult band, **tysk slogantext** och ordmärke + vattenstämpel. Ingen produkt i bild | **BORT** |
| `860b6eb9` | 5 | 9 | ☠️ samma reklam, samma mall | **BORT** |
| `05136778` | 5 | 9 | ☠️ samma reklam, samma mall | **BORT** |
| `05136778` | 4 | 8 | ⚠️ fyra dugliga detaljfoton under en **tysk rubrik** i eget band upptill | **beskärs** |
| `ae1c848f` | 3 | 3 | ⚠️ måttritning med **tysk textruta nedtill** (`MODELL-INFO`) | **beskärs** |
| `f8528666` | 3 | 3 | ⚠️ måttritning med **tysk textruta nedtill** (`Produktinformation`) | **beskärs** |
| `63a586da` | 3 | 3 | ⚠️ måttritning med **tysk textruta nedtill** (`Produktinformation`) | **beskärs** |
| `105c685a` | — | — | fem rena bilder | — |
| `7f8e495b` | — | — | fem rena bilder | — |

## ☠️ Reklambilden på källposition 9 är en MALL, inte ett sammanträffande

Tre av åtta bär EXAKT samma bild: gult band nedtill, ordmärke och en
halvgenomskinlig vattenstämpel, tre rader tysk slogan, och ett foto på en
kattunge som sträcker sig mot en hand. **Varan syns inte alls.**

Runbokens tabell har två rader som kunde gälla, och det är den andra:

| Bilden är… | Gör |
|---|---|
| Marknadsgrafik med användbara delfoton | Klipp ut fotona, bygg eget svenskt kort |
| Ren textinfografik utan foto | Ta bort |

Fotot här är inte ett *delfoto av varan* — det är reklamens dekor. Det finns
inget att klippa ut, alltså faller den på Leonards egen gräns: *"Släng bara
exakta dubbletter och bilder utan visuellt värde."*

Det är samma fynd som uppgift **#428** (leverantörsreklam på bildposition 5)
och **#282** (leverantörens logotyp i pixlarna). Att den ligger på tre av åtta
i EN batch säger att den är regel i den här delen av sortimentet, inte undantag.

## ✅ Sydd etikett på plyschen RÖRS INTE — det är Leonards regel

`zoom-loggor.jpg` visar `860b6eb9-4` och `4a5acc7d-4` i 4× förstoring: bägge
bär en **sydd tygetikett** på bäddens plyschkant. Den sitter fysiskt på varan.

> *"om märket sitter fysiskt på varan så gör vi inget åt det, det är så
> produkten ser ut"* — Leonard

Skillnaden mot reklambilden är inte storleken utan VAD det är: en sydd etikett
är en egenskap hos varan kunden får hem, en vattenstämpel är tryckt ovanpå
bilden i efterhand. Den första får stå, den andra kan aldrig stå.

## Hörnsvepet: noll träffar på 40 bilder

Uppgift **#282** gäller: leverantörens namn kan ligga inbränt i ÖVRE VÄNSTRA
hörnet, där en `grep` över källkoden aldrig kan se det.
`zoom-hornsvep.jpg` visar alla fyrtio hörnen i 2× — **ingen** bär ett ordmärke.
Den enda texten i något hörn är `05136778-4`:s rubrik (känd, kapas) och
silhuettens `180 cm` på de tre ritningarna, som är språkneutralt.

## Kapet är MÄTT, inte gissat (`bildfix.py`)

Varje bild skannas rad för rad mot sin EGNA bakgrundsfärg; innehållssjoken
skrivs ut och kaplinjen läggs i GAPET mellan varan och textrutan:

| bild | sjok före | kaplinje | kapat sjok |
|---|---|--:|---|
| `ae1c848f-3` | `(51,1460)` `(1541,1972)` | 1500 | `(1541,1972)` |
| `f8528666-3` | `(14,57)` `(78,1498)` `(1523,1954)` | 1510 | `(1523,1954)` |
| `63a586da-3` | `(66,1475)` `(1541,1972)` | 1508 | `(1541,1972)` |
| `05136778-4` | `(165,248)` `(354,1143)` `(1163,1918)` | 300 *(upptill)* | `(165,248)` |

Tre grindar i skriptet, alla åt samma håll:

1. ☠️ **Kaplinjen får aldrig ligga MITT I ett sjok.** Gör den det har den
   skurit in i ritningen eller i ett foto — runbokens egen varning om att
   *"en bandbeskärning som ska ta bort text skär in i varan"*.
2. ☠️ **Kapet måste ta MINST ett sjok.** Ett kap som inte tar något har
   lämnat textrutan kvar och ser ändå ut att ha gjort jobbet.
3. ☠️ **Kvadratgrinden.** PDP:n hämtar galleriet med `fill/w_N,h_N,al_c` och
   centrumbeskär. Efter kapet är bilden liggande, så den paddas tillbaka till
   kvadrat (`max(size) × 1,02`) och skriptet kontrollräknar att
   centrumkvadraten rymmer ALLT innehåll. Utan paddningen hade
   måttetiketterna i sidkanterna kapats — exakt uppgift **#354**.

⚠️ **Paddningsfärgen för kollaget är gräddvit, inte vit — och det är mätt.**
Runbokens regel är *"padda på VITT, inte på en uppmätt kantfärg"*, och skälet
står i den: *"kantfärgen mäter det du just tog bort"*. Här mäts tre kanter som
INTE rörs — topp-vänster, botten-vänster och topp-höger ger alla exakt
`(252, 245, 235)`. Det är kollagets designade botten, inte en rest av rubriken.
Vit padding hade gett en synlig tvåtonad ram runt en i övrigt hel bild.

**Grinden före uppladdning** är `faith-steg4.jpg`: original och beskuren sida
vid sida i SAMMA skala (båda skalade med originalets faktor). Frågan är
"saknas det yta?", inte "följer kanten?". Läst: alla måttetiketter står kvar på
de tre ritningarna, alla fyra detaljfoton står kvar i kollaget, och de tyska
rutorna är borta.

## ⚠️ Ritningarna bär FLER tal än leverantörens spec-block

Ritningen är en tredje mätkälla vid sidan av feed-kolumnerna och den tyska
brödtexten — uppgift **#447** ("Steg 3 behöver TRE källor, inte två"). Talen
nedan är AVLÄSTA ur ritningen, inte ur någon text:

| pid | ritningens tal |
|---|---|
| `4a5acc7d` | 100 · 41 · 41 · 18 · 18 |
| `860b6eb9` | 101 · 50 · 36 · 36 · 16 · 17 · 7 |
| `05136778` | 160 · 48 · 48 · 45 · 30 · 30 · 29 · 21 · 43 · 78 |
| `105c685a` | 139 · 48 · 44 · 30 · 27,5 · 22 · 40 |
| `7f8e495b` | 79 · 60 · 40 · 34 · 25 · 24 · 20 · 9 · 30 · 40 |
| `ae1c848f` | 79 · 70 · 49 · 60 · 40 · 36 · 24 · 17,5 · 17 · 9,5 |
| `f8528666` | 98 · 60 · 40 · 46 · 34 · 33,5 · 24,5 · 30 · 20 · 12 |
| `63a586da` | 104 · 60 · 40 · 51 · 33 · 32 · 31 · 29 · 18 · 7 |

Alla åtta ritningars **totalmått stämmer med `matt.py`:s FACIT** — det är
kvittot på att FACIT är byggt på rätt rad och inte på ett syskons.

☠️ **`Gewicht — 5 Kg` i de tre kapade rutorna är MODELLKATTEN, inte en
maxlast.** Rutan namnger en ras och katten på bilden; den säger ingenting om
vad möbeln bär. Att läsa den som bärighet hade gett tre produkter en
lastsiffra leverantören aldrig angett — och den siffran hade sett belagd ut
just för att den stod i en bild. Steg 2/5-beslutet står oförändrat:
**ingen last- eller kattantalssiffra skrivs på någon av de åtta.**
