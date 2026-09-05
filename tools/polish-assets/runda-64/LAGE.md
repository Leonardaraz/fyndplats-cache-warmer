# Runda 64 — fåtöljer (Relaxsessel)

## Steg 1: familjen och dubblettgrinden

Katalogen mätt 2026-09-05 med fullt svep (55 sidor, unika id = lästa rader):

| | |
|---|--:|
| Produkter totalt | 5 499 |
| Utkast | 3 634 |
| Publicerade | 1 865 |

Familjen `Relaxsessel / Sessel / Ohrensessel / Fernsehsessel / Liegesessel`:
**141 tyska utkast**. Efter att massage-, värme-, uppresnings- och elmodeller
undantagits (egna undergrupper med egna Steg 2-grindar) återstår **106**.

### ☠️ Ordgränsen dolde 32 av 38 publicerade fåtöljsidor

Första dubblettgrinden använde `\bf[aå]t[oö]lj` och gav **6 träffar**. Utan den
ledande ordgränsen ger samma svep **38**. Skälet är att `\b` kräver en ordgräns
FÖRE `f`, så varje sammansättning föll bort:

`sovfåtölj` · `bäddfåtölj` · `öronlappsfåtölj` · `snurrfåtölj` · `clubfåtölj` ·
`cocktailfåtölj` · `snäckfåtölj` · `golvfåtölj` · `sammetsfåtölj` ·
`konstläderfåtölj` · `uppresningsfåtölj` · `massagefåtölj`

— alltså precis de sidor grinden finns för att skydda. `tv-fåtölj` kom med, för
bindestrecket ÄR en ordgräns; det gjorde felet svårare att se, eftersom listan
såg ut att innehålla sammansättningar.

⚠️ Runda 57 lärde huset att en ordgräns BEHÖVS (`Polen` matchade i `kupolen`).
Den här rundan är samma regel åt andra hållet: **en ordgräns är rätt när ordet
är ett självständigt ord i löptexten, och fel när det är ett efterled i
sammansättningar.** Svenskan sätter huvudordet SIST — `öronlappsfåtölj` är en
fåtölj — så en produktkategorigrind ska ankra i slutet av ordet, inte i början.

### ☠️ Leverantörens ingress beskriver en ANNAN produkt

`98b88823` heter *"Sessel Wohnzimmer Loungesessel Relaxsessel mit Stahlbasis
Lesesessel"* men brödtexten börjar *"Wer hat gesagt, dass ein bequemer und
funktionaler **Drehhocker** nicht auch stylisch aussehen kann?"* — en snurrpall
utan rygg. Måtten bekräftar: 54 × 54 × 36 cm, 11 kg. **Utesluten ur familjen.**

### Valda åtta

Valda för att de saknar motsvarighet bland de 38 publicerade sidorna, mätt på
maxlast, egenvikt och pris — inte på namnet.

| id8 | vad | maxlast | vikt | pris |
|---|---|--:|--:|--:|
| `5e2dee74` | gungande + liggande, 155°, 190 cm utfälld | 150 kg | 42,6 kg | 4 549 |
| `90caeb9d` | djup sits, ramlös stomme | **250 kg** | 24 kg | 3 569 |
| `e76002c1` | liggfunktion med mugghållare, 185 cm | 150 kg | 49,8 kg | 4 479 |
| `17620f5b` | ottoman-set | 150 kg | 31,5 kg | 3 689 |
| `b09d20b7` | snurrfåtölj + höjdjusterbar pall, chenille | 120 kg | 21 kg | 3 969 |
| `b01d8af2` | fåtölj + fotpall, 2-delat set | 120 kg | 16 + 18,3 kg | 2 069 |
| `ca92e3ce` | skandi, sammetslook, massivt trä, 68 cm | 120 kg | 11,6 + 13 kg | 1 699 |
| `beacff5a` | vilstol, trä + svart, justerbart fotstöd | 120 kg | 10,3 kg | 1 169 |

### Medvetet BORTVALDA, och varför

| id8 | varför |
|---|---|
| `7eee41b6`, `f51834b8` | bäddfåtöljer — `667ca8f9`, `eb1e475e`, `f94a964c` är publicerade |
| `c0e67ea5`, `7b98c4c1` | öronlappsfåtöljer — `92a64ccd`, `a29af9b5`, `f77a6177` är publicerade |
| `a28ef0e6` | 10 kg + linnelook + 1 439 kr ligger för nära `1537fe0a` (10 kg, linnelook, 1 499 kr) — obevisat, alltså inte |
| `dbbe7253` | 150 kg + 11 kg + 1 359 kr ligger för nära samma `1537fe0a` (150 kg, 10 kg) |
| `98b88823` | är en snurrpall, se ovan |

⚠️ De fyra första är bortvalda som FAMILJ, inte som bevisade dubbletter. De kan
poleras i en egen runda när måtten jämförts mot de publicerade sidorna en och en.

## Steg 2 och 5: sex fynd i de åtta valda

### ☠️ Artikelnumret står i LEVERANTÖRENS EGEN BRÖDTEXT

`b09d20b7` har raden `✔ Artikelnummer: 83F-028V00GY` mitt i den tyska
beskrivningen — inte i spec-tabellen, utan bland säljpunkterna.

Det förklarar husets öppna fråga från 2026-09-03: fyra publicerade sidor bär
Aosoms artikelnummer i spec-tabellen, och `to-product.ts` kan inte ha skrivit
dem (den sätter fem etiketter, och `to-product.test.ts` fäller om numret dyker
upp). Slutsatsen då var att någon lagt till det vid poleringen efter att ha
läst etikettlistan. **Den här raden visar en enklare väg in: numret följde med
när den tyska texten översattes.** En polerare som arbetar stycke för stycke
ser en rad som ser ut som vilken specifikation som helst.

⚠️ Grinden mot det finns redan (`lint.py` fäller på artikelnummermönstret),
men den letar i VÅR text. Den här upptäckten säger att mönstret ska sökas i
KÄLLAN också, innan man börjar skriva — annars är det lätt att råka bära över.

### ☠️ Spec-kolumnen förvandlade ett TRÄSLAG till gummi

`ca92e3ce`: brödtexten säger `Gummiholz` — gummiträ, ett hårt lövträ som
möbelindustrin använder. Spec-tabellen säger `Material: Gummi`.

Feedens kolumn har kapat sammansättningen och gjort trä till gummi. Skrivs
tabellen av rakt blir det ett materialpåstående som är falskt. Samma klass som
huset redan mätt (spec-tabellen är feedens KOLUMNER, inte den tyska texten),
men den här gången ändrar kapningen betydelsen i stället för att bara utelämna.

### ☠️ Två produkter beskrivs som en ANNAN möbel i sin egen text

| id8 | titeln säger | brödtexten säger |
|---|---|---|
| `beacff5a` | Relaxsessel, Ruheliege med femstegs fotstöd | **`Esszimmerstuhl`** — matstol, två gånger |
| `98b88823` *(bortvald)* | Loungesessel Relaxsessel | **`Drehhocker`** — snurrpall |

`beacff5a` är en verklig vilstol; `Esszimmerstuhl` är en klistrad rest från en
annan produkts text. `98b88823` är däremot HELT fel produkt och är bortvald.

### ☠️ `beacff5a` påstår bomull i ingressen och polyester i specen

*"die sanfte Umarmung des natürlichen Baumwollbezugs"* mot
`Material: Polyester, Birkenholz, Schaumstoff`. Bomull kan alltså inte sägas.

### ☠️ Egenvikten motsäger sig på två av åtta

| id8 | brödtext | spec-tabell |
|---|--:|--:|
| `b01d8af2` | `Artikelgewicht: 16 kg` | **18,3 kg** |
| `ca92e3ce` | `Artikelgewicht: 11,6 kg` | **13 kg** |

Sannolikt vara mot fraktvikt, men det är en gissning — så vikten skrivs inte ut
för de två. `b09d20b7` (21 kg) och `beacff5a` (10,3 kg) har bara ett tal var.

### ☠️ `b09d20b7` kallar sig öronlappsfåtölj med 43 cm rygg

En av säljpunkterna säger `Ohrensessel mit Hocker`. Ryggen är `71B x 43H x 16T`
— fyrtiotre centimeter hög, alltså en låg loungefåtölj utan öronlappar. Det är
sökordsfyllning i källan, och ordet får inte följa med: butiken har tre riktiga
öronlappsfåtöljer publicerade (`f77a6177`, `92a64ccd`, `a29af9b5`) och en fjärde
med fel form skadar dem alla.

⚠️ Samma produkt: fotpallen är `40–47 cm` hög medan sitsen är `50 cm`. Pallen
når alltså aldrig upp i sitshöjd, i något läge. Det ska stå som det är.

### ☠️ `e76002c1` säljs som gungstol för barn OCH varnar för att gunga

Ingressen: *"als sanfter Schaukelstuhl für die Kinder"*. Sista raden i tekniska
data: *"Hinweis: Bitte nicht schaukeln, während Sie sich zurücklehnen"*.

Varningen är den som ska bära. Barnstycket skrivs inte över: en 49,8 kg tung
reclinerfåtölj med 150 kg bärighet marknadsförs inte som barnmöbel.

### ⚠️ `17620f5b` har TVÅ maxlaster, och en rygg som motsäger sig

`150kg (Sitz), 50kg (Fußhocker)` — båda måste stå. En ensam "150 kg" vore fel
om någon sätter sig på pallen. Ryggen anges dessutom som `85L` i måttlistan och
`Rückenhöhe: 83cm` två rader ned.
