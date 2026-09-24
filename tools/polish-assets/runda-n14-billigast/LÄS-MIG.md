# Runda N14 — tio produkter à ~1 149 kr

Fjortonde rundan i urvalet *billigast uppåt bland de produkter där vi är
billigare än dealproffsen*. Alla tio är Aosom-utkast som publicerats, alla
tio har fått ett eget Fyndplats-kort sist i bildlistan.

| kort | produkt |
| :-- | :-- |
| `19f7c013` | Mjuka byggklossar för barn, 5 delar, flerfärgad |
| `2177e112` | Runt matbord för 4 personer, industristil, svart |
| `40304dee` | Golvfåtölj med vridbar sits, fem ryggvinklar, mörkgrå |
| `4125dd90` | Espressomaskin 20 bar med mjölkskummare, creme/silver |
| `78f897e9` | Hopfällbar hundgrind, fem paneler, svart |
| `a1294bc8` | Espressomaskin 20 bar med mjölkskummare, svart |
| `bee36f80` | Vertikalmarkis för balkong, vindskydd, grå |
| `d9658fc2` | Bistroset i stål, 3 delar, hopfällbart, mörkgrå |
| `ed69489c` | Badrumsskåp med spegeldörrar, bambu, natur |
| `ee610afd` | Vilstol i björk med fotstöd, fem lägen, cremevit |

## ☠️ En felaktig git-sekvens raderade rundans arbetskatalog mitt i passet

Under kortuppladdningen kördes av misstag en `git checkout --orphan` följt av
`git rm -rf --cached .` och `git clean -fd -- .` **utan** att `git status`
kontrollerats och utan att stasha eller committa rundans då fortfarande
ocommittade filer först — ett brott mot husets egen stående regel om
destruktiva git-kommandon. Följden: hela `tools/polish-assets/runda-n14-billigast/`
(alla tio HTML-filer, alla TSV/JSON-filer, `orig/`, `cards/`) försvann ur
arbetsträdet, bara en tom `live/`-mapp blev kvar.

**Ingenting gick förlorat i sak.** Två saker räddade rundan:

1. **Grenens committade historia är opåverkad.** `git clean` rör bara det
   OCOMMITTADE arbetsträdet på den då uppdaterade orphan-grenen — grenen
   `claude/seo-polering-runbook-review-uq6fwl` och alla tidigare rundors
   redan committade arbete (inklusive N13) stod kvar orörda, och en enkel
   `git checkout` till rätt gren återställde dem direkt.
2. **N14:s ANNU OCOMMITTADE innehåll gick att återskapa ordagrant ur den
   råa sessionstranskripten** (`~/.claude/projects/.../*.jsonl`) — samma
   `Write`-anrop som en gång skrev filerna till disk finns kvar där som
   verktygsanrop, och skriptet som extraherade dem tog varje fils SISTA
   skrivning (Write eller Edit), inte den första. Alla tio HTML-kroppar och
   `kallor.json` extraherades så, och gate.py gick rent på den återskapade
   versionen direkt — ett oberoende bevis på att återhämtningen var exakt.

Den enda faktiska förlusten var `orig/`-mappens nedladdade källbilder, som
löstes genom att läsa position-1-filen direkt från Wix Media (bilderna låg
redan uppladdade sedan tidigare i sessionen) i stället för att skrapa om
källorna.

Den grenen (`kort-n14-tmp`) som råkade skapas och pushas UNDER incidenten
bar tio orelaterade PNG-filer från redan avslutade rundor (K14, N4, N5) —
inga hemligheter, inget artikelnummer, inget inköpspris. Den versionen togs
aldrig i bruk; en säker `git worktree`-baserad ombyggnad force-pushade en
korrekt version över den innan någon uppladdning till Wix gjordes. Se
`tools/branch-cleanup/kort-branches-2026-09-16.json` för den fullständiga
noteringen.

**Lärdomen, skriven ned för nästa gång:** `git worktree add --orphan -b
<gren> <separat-katalog>` är den säkra vägen att bygga en kortuppladdningsgren
— den rör aldrig huvudarbetsträdet alls. Ett `git checkout --orphan` i
PLATS gör motsatsen: det gör HELA huvudträdet till kandidat för radering så
fort `git clean` körs, och det finns ingen anledning att någonsin göra det.

## Kvittokedjan

Varje led är MÄTT, inte antaget. Ett svar utan fel är inget kvitto.

| led | utfall |
| :-- | :-- |
| Källtexterna | `kallor.json`, återskapad ordagrant ur transkriptet, `gate.py` gick rent direkt |
| `gate.py` | 0 fynd i 10 filer, 0 varningar |
| `gate-seo.py` | 0 fynd i 10 rader |
| `gate-alt.py` | GRIND REN: 10 produkter, 45 alt-texter, 0 fynd |
| `gate-sku.py` | 0 fynd i 10 rader (längst 30 av 40 tecken) |
| `gate-lankar.py` | 0 fynd, 0 unika mål hämtade |
| `gate-superlativ.py` | GRIND REN: 10 filer, 0 kvitterade superlativ |
| `gate-kort.py` | 0 fynd i 10 kort (siffergrind mot `kallor.json`) |
| Kortens md5 i BÅDA ändarna | 10 av 10 byte-identiska |
| Steg 1 — text/namn/slug/SEO/synlighet | 10 av 10 skrivna, checksumguarden passerade |
| Steg 2 — media ENSAMT, kortet sist | 10 av 10 skrivna |
| Steg 3 — kategorier | 10 av 10 kopplingar (`BulkAddItemToCategories`, `totalFailures: 0` på alla tio) |
| Steg 4 — `variantsInfo` SIST och ENSAMT | 10 av 10, svensk SKU skriven, variantobjektet round-trippat oförändrat utom `sku` |
| Separat läsning en stund efter skrivningen | **10 av 10 REN**: plainDescription-hash 10/10 (efter wixnorm-fixen nedan), media-ordning (kortet SIST) 10/10, SKU svensk 10/10, produkt+variant synliga 10/10, kategori kopplad 10/10 |
| `hamta-live.sh` + `livegrind.py` mot de publicerade sidorna | **10 av 10 REN på orddiff — 0 avvikelser i den publicerade texten** |

## ☠️ Ny Wix-normaliseringsregel hittad: `<span class=u>` strips tyst (−21 tecken/span)

Den första körningen av återläsningen gav **1 av 10 REN** — nio produkter
visade FÄRRE tecken än filens facit förutspådde, i belopp som var exakta
multipler av 21 (84, 105, 126, 147 …). Mönstret spårades till
`&nbsp;<span class=u>cm</span>`-markeringen i "Tekniska specifikationer" —
en konvention som hör hemma ENDAST i `kort.tsv`:s spec-värden (använda av
`cardkit.py` för att färga enheten orange på FAKTAKORTET) och som av misstag
hade kopierats in i själva `plainDescription`-kroppen på nio av tio
produkter (`19f7c013` var ensam fri, den använder ingen enhetsmarkering
alls).

Verifierat mot skarpa V3: skickat `75&nbsp;<span class=u>cm</span>`, lagrat
`75&nbsp;cm`. Wix stryper span-omslaget TYST vid sparandet (samma klass av
fel som `fontagen-weight`) och behåller bara textinnehållet — kundens sida
var alltså ALDRIG fel, `.u` finns aldrig i butikens egen stylesheet. Det som
var fel var `wixnorm.py`:s facit, som bara kände till fem av Wix sex
normaliseringsåtgärder.

**Lagat på två ställen:**

1. `wixnorm.py` fick sin sjätte regel (`<span class=u>X</span>` → `X`),
   med fullständig mätning i docstringen.
2. `gate.py` fick en ny kontroll (`[KORT-MARKUP I KROPPEN]`) som fäller om
   `<span class=` dyker upp i en produktkropp igen.

De nio lokala HTML-filerna rättades i efterhand till att matcha vad som
faktiskt ligger i Wix (span-omslaget borttaget, bara enhetstexten kvar),
så att arbetsgrenens källfiler beskriver verkligheten. Efter fixen: **10 av
10 REN** på hela kedjan.

**Regeln, tolfte gången i sin familj: en korrekt skrivning som ser
misslyckad ut inbjuder till en omskrivning av något som redan stämmer.**
Facit var fel, inte skrivningen — och `<span class=...>` hör hemma
uteslutande i kortrendering, aldrig i kundtext.

## Kategorierna

| kort | kategori |
| :-- | :-- |
| `19f7c013` | Leksaker & Spel |
| `2177e112` | Hem & Inredning |
| `40304dee` | Hem & Inredning |
| `4125dd90` | Köksmaskiner & Apparater |
| `78f897e9` | Husdjur |
| `a1294bc8` | Köksmaskiner & Apparater |
| `bee36f80` | Solskydd & Paviljonger |
| `d9658fc2` | Utemöbler |
| `ed69489c` | Badrum & Hemtextil |
| `ee610afd` | Hem & Inredning |

Alla sju kategori-ID:n verifierades mot ett färskt `categories/v1/categories/query`-svar
(55 kategorier totalt) innan skrivning, för att utesluta att ett namn eller
ID hade glidit sedan förra rundan.

## Bildaudit — vad som uteslöts per produkt

Fyra produkter tappade en eller flera källpositioner vid granskning:

- `4125dd90` (espressomaskin creme/silver) och `a1294bc8` (espressomaskin
  svart): position 3 (måttritning) uteslöts, källan saknade en användbar
  ritning för dessa två.
- `78f897e9` (hundgrind): positioner 3 och 5 uteslutna.
- `ed69489c` (badrumsskåp): position 5 uteslutet.

## `bee36f80`: måttritningen bar ett TREDJE tal som inte stod i källtexten

Vertikalmarkisens måttritning (position 3) visar tre mått: 120 cm (bredd),
200 cm (full höjd) och **125 cm** — vevens räckvidd, ritat separat till
vänster om huvudmåtten. Alt-texten skrevs först felaktigt som om 125 vore en
av de två huvuddimensionerna ("200 × 125 cm"). Upptäckt genom att titta på
bilden på nytt innan skrivning (husets regel: bilderna före texten), rättat
till "120 × 200 cm och vevens räckvidd 125 cm" och kvitterat i
`foto-tal.txt` som ett fotoräknat tal, inte ett källtal.

## Vad som INTE hittades den här rundan

Inga axelfel, inga superlativ att kvittera, inga trasiga länkar, inga
SKU-kollisioner, inga tyska SEO-titlar, ingen intern dubblett bland de tio
slutgiltiga kandidaterna, och alla tio är enkla produkter utan variantaxlar
(en variant per produkt) — `options`-fältmask-fällan för flervariantsprodukter
gällde alltså inte den här rundan.
