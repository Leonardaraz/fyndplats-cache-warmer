# Runda 140 — Steg 2: laglighetsgrind

**Ingen stoppklass träffar.** En hundsoffa är en MÖBEL, inte ett djurbostad:
djuret hålls inte inneslutet, så SJVFS 2019:15 (L80) minimimått gäller inte,
och SJVFS 2020:8 om hund i stängd bur har ingen dörr att tillämpas på. Ingen
leksak, ingen el, ingen licensfigur.

Grinden fäller alltså ingen produkt. Men den hittar **fyra saker som styr
texten**, och tre av dem är säkerhetsrelevanta gränser som enligt Steg 2:s
sista stycke ska skrivas som ett POSITIVT villkor med egen rubrik.

## 1. Bärförmågan är ett köpvillkor, inte en fotnot

Fem av fjorton bär en uttrycklig `Belastbarkeit`, och två av dem är låga nog
att avgöra köpet:

| p8 | bärförmåga | hundens kroppslängd | totalmått |
|---|---:|---:|---|
| `ee19a8c8` | **4,5 kg** | 35 cm | 70 × 47 × 30 |
| `22c7de56` | **4,5 kg** | 30 cm | 65 × 64 × 37 |
| `07ac9918` | 15 kg | — | 76 × 45 × 43 |
| `9ee2fa6e` | 25 kg | 55 cm | 98,5 × 60,5 × 35,5 |
| `c11948ac` | 25 kg | 55 cm | 98,5 × 60,5 × 35,5 |

☠️ **4,5 kg är mindre än soffan själv väger.** `22c7de56` väger 8,5 kg och
bär 4,5. Den som köper "hundsoffa" till en beagle på tolv kilo har köpt fel
möbel, och det syns inte på bilden — möbeln ser stor ut. Gränsen får därför
egen rubrik med talet i klartext, aldrig bara en rad i spec-tabellen.

De nio övriga anger ingen `Belastbarkeit` alls, bara hundens vikt och längd.
**Då skrivs hundens vikt, inte en påhittad bärförmåga.**

## 2. ☠️ `07ac9918`s egen bild säger PVC — spec-blocket säger plysch och trä

Bild 5 är en leverantörsgrafik med rubriken **"PVC MATERIALS"** och punkterna
*"Water-resistant · Easy to clean · Fashionable and beautiful"*. Tyskans
`Technische Daten` säger `Naturholz, Plüsch, Schaumstoff`.

De kan inte båda stämma, och ingen av dem går att verifiera. **Varken PVC
eller vattenavvisande skrivs.** Materialraden följer spec-blocket, som är
feedens kolumn och inte en säljgrafik. Bilden plockas dessutom bort i Steg 9
(engelsk text i pixlarna).

## 3. Ingen CE-märkning, ingen standard

Det finns ingen CE-direktivsfamilj för husdjursmöbler och leverantören namnger
ingen norm någonstans i de fjorton källtexterna. Ordet skrivs inte.

## 4. Lukten är leverantörens egen upplysning — och den ska med

`01fcdf1d` och `881540a6` bär en `Hinweis` i spec-blocket: *"Ein leichter
Geruch ist anfangs normal. Lassen Sie das Sofa 1-2 Tage lang an einem
belüfteten Ort auslüften."* Det är en förväntanssättande uppgift om varan som
kunden har nytta av före köpet, och den hör hemma under *Användning och
skötsel*.

⚠️ Den står bara i två av tre källrader i grupp A trots att de är samma möbel i
tre färger. Samma logik som hundburarnas: **att upplysningen bara står i vissa
källrader betyder inte att den bara gäller dem.** Den skrivs på alla tre.
