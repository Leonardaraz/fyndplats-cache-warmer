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

## Steg 7 och 8: skrivet, och SKU-krocken bekräftad en gång till

Åtta texter skrivna, alla fortfarande `visible: false`. Facit (längd + hash på
den synliga texten) gav **8 av 8 exakta** — den lagrade texten är bevisat samma
som den som passerade grindarna, inte en avskrift som kan ha drivit.

| id8 | tecken | hash | slug |
|---|--:|--:|---|
| `5e2dee74` | 2 668 | 997508164 | reclinerfatolj-gungande-chenille |
| `e76002c1` | 2 071 | 881295521 | tv-fatolj-mugghallare-135 |
| `17620f5b` | 2 137 | 240479501 | reclinerfatolj-fotpall-130-grader |
| `b09d20b7` | 2 164 | 97963060 | snurrfatolj-fotpall-hojdjusterbar |
| `b01d8af2` | 1 968 | 224037783 | sammetsfatolj-fotpall-33-cm-ben |
| `ca92e3ce` | 2 040 | 956607094 | fatolj-skandinavisk-stil-gummitra |
| `90caeb9d` | 2 162 | 537429801 | djup-fatolj-250-kg-manchesterlook |
| `beacff5a` | 1 693 | 401044344 | vilstol-bjork-femstegs-fotstod |

### ☠️ Två av åtta bar SAMMA SKU före rundan

De gamla SKU:erna lästes ut vid skrivningen, och de bekräftar husets öppna
punkt om att KROCKEN SKAPAS AV IMPORTEN:

| id8 | SKU före | SKU efter |
|---|---|---|
| `17620f5b` | **`FP-relaxsessel-mit-ottomane`** | `FP-reclinerfatolj-fotpall` |
| `b01d8af2` | **`FP-relaxsessel-mit-ottomane`** | `FP-sammetsfatolj-fotpall-33` |
| `e76002c1` | `FP-relaxsessel-mit-fu` | `FP-tv-fatolj-mugghallare` |
| `5e2dee74` | `FP-relaxsessel-drehbarer` | `FP-reclinerfatolj-gungande` |
| `b09d20b7` | `FP-sessel-mit-verstellbarem` | `FP-snurrfatolj-fotpall` |
| `ca92e3ce` | `FP-sessel-im-skandi-design` | `FP-fatolj-skandinavisk-stil` |
| `90caeb9d` | `FP-sessel-mit-tiefer` | `FP-djup-fatolj-250-kg` |
| `beacff5a` | `FP-relaxsessel-ruheliege` | `FP-vilstol-bjork-femstegs` |

Två olika produkter — en ottoman-recliner på 3 689 kr och ett sammetsset på
2 069 kr — delade artikelnumret i butiken. Det är inte poleringen som skapat
det: 24-teckenkapningen på den TYSKA sluggen ger samma sträng för varje
`Relaxsessel mit Ottomane…`, och familjen har fler av dem.

⚠️ `FP-relaxsessel-mit-fu` är samma regel som kapar mitt i `Fußstütze`. Regeln
bryter på hela ord i den latiniserade sluggen, och `fu` ÄR ett helt ord där —
`ß` och `ü` faller bort i sluggifieringen.

**Rundan lagade åtta av dem på köpet.** Men svepet i punkt #272 står kvar: den
här familjen har 106 utkast, och kapningen träffar dem alla lika.

## ☠️ Steg 4: leverantörens namn låg i PIXLARNA, inte i HTML:en

Fyrtio bilder granskade i två kontaktark. Fyra måste bort, och en av dem är en
ny felklass för huset.

| id8 | bild | vad |
|---|--:|---|
| `e76002c1` | 2 | ☠️ **`HOMCOM by Aosom` inbränt uppe till vänster** |
| `5e2dee74` | 4 | tysk text: *Gepolsterte Armlehnen · Breite und weiche Rückenlehne · Seitentaschen* |
| `beacff5a` | 4 | tysk text: *Abnehmbarer Bezug…* |
| `beacff5a` | 5 | tysk text: *Hochdichter Schaumstoff…* |

☠️ **Husets kontroll kan strukturellt inte se det här.** `CLAUDE.md` slår fast
att vi inte läcker leverantörsspår, mätt som *"noll träffar på `aliexpress`,
`alicdn`, `aosom` eller något husmärke i HTML:en"*. Den mätningen är riktig och
värdelös mot en logotyp: text i en bild finns inte i HTML:en. En `grep` över
källkoden svarar grönt medan kundens öga läser leverantörens namn.

Och det är BÅDA namnen på en gång — husmärket `HOMCOM` och leverantören
`Aosom`, i samma logotyp. Artikelnumret leder till dealproffsens sida; en
logotyp leder till leverantörens hela katalog.

⚠️ **Öppen fråga för Leonard: hur många av de 1 865 publicerade sidorna bär en
inbränd logotyp?** Den här rundan mätte 16 hörn och hittade en. Det är inget
underlag för en skattning, men det är tillräckligt för att frågan ska ställas.
Ett svep går att bygga — det är en bildmätning, inte en textmätning.

De tre tyska bilderna kostar ingenting att stryka: allt de påstår
(*stoppade armstöd · bred mjuk rygg · sidofickor · avtagbar tvättbar dyna ·
högdensitetsskum*) står redan i den svenska texten.

⚠️ `beacff5a` går därmed från fem bilder till tre, och `e76002c1` förlorar sin
delningsbild (position 2). Det är rätt pris.

## ☠️ Steg 4: feedens färgkolumn ljuger — fotot är facit

`e76002c1` står som `Farbe: Braun` i den tyska specen. Fotot är **grått**:
uppmätt RGB `156,151,141`, `162,159,149` och `150,149,140` på rygg, sits och
armstöd. Det är en varmgrå ton, inte brun i någon mening.

Texten säger `gråbeige` nu. Grinden `FARG` i `lint.py` låser färgorden per
produkt till det som är AVLÄST UR FOTOT, och två mutationer bevisar att den
fäller när feedens `brun` återinförs.

Samma familj som huset redan mätt på ett scramblat färgfält — men den här
gången ÄR färgen entydig i bilden, så produkten är publicerbar; det är bara
kolumnen som är fel.

## Steg 9: verifierat i en separat läsning

| | |
|---|--:|
| Texter som stämmer mot facit | **8 av 8** |
| Produkter med rätt antal bilder | **8 av 8** |
| Bilder totalt efter gallring | 36 |
| **Tomma alt-texter** | **0** |

Alla åtta är fortfarande `visible: false`.

## Steg 10, 13 och 14 — klar

### ☠️ Kategoriträdet har ingen möbelgren

54 kategorier lästa. Under **Hem & Inredning** finns Förvaring & Organisering,
Kalas & Fest, Verktyg & Hemmafix, Dekoration & Prydnad, Hushållsapparater,
Badrum & Hemtextil och Belysning. **Ingen möbelkategori alls** — inga
"Möbler", inget "Vardagsrum", inga "Fåtöljer & Stolar".

De redan publicerade fåtöljerna lästes för att inte gissa: `990b4da7`,
`9e924d08` och `62161510` sitter alla i **All Products + Hem & Inredning**.
Rundans åtta kopplades likadant. (`62161510` bär dessutom *Dekoration &
Prydnad*, vilket är fel för en fåtölj med fotpall — noterat, inte rättat.)

⚠️ **Öppen fråga för Leonard.** Katalogen har vid det här laget publicerade
bokhyllor, skoskåp, köksskåp, gungstolar, hallmöbler, bänkar, matgrupper,
skrivbord och fyrtiotalet fåtöljer — alla i en kategori som heter "Hem &
Inredning" tillsammans med lampor och handdukar. Att skapa en möbelgren är en
strukturändring i butiken och därmed ditt beslut, inte poleringens.

### ☠️ Ett bulk-svar MED fel är inte heller en dom

Kopplingen svarade `totalSuccesses: 1, totalFailures: 1` på **alla åtta**. Det
såg ut som ett halvt misslyckande. Återläsningen visar att båda kategorierna
sitter på alla åtta: **All Products fanns redan** från importen, så den andra
skrivningen avvisades som dubblett.

Huset har regeln *"ett svar utan fel är inget kvitto"*. Det här är spegelbilden:
**ett svar MED fel är inte heller ett besked.** Enda kvittot är återläsningen.

### Steg 14: live-grinden ren på alla åtta

| id8 | slug | kod | cache | bilder | text | mot facit |
|---|---|---|---|---|--:|---|
| `5e2dee74` | reclinerfatolj-gungande-chenille | 200 | HIT | 4/4 | 2 668 | **lika** |
| `e76002c1` | tv-fatolj-mugghallare-135 | 200 | HIT | 4/4 | 2 075 | **lika** |
| `17620f5b` | reclinerfatolj-fotpall-130-grader | 200 | HIT | 5/5 | 2 137 | **lika** |
| `b09d20b7` | snurrfatolj-fotpall-hojdjusterbar | 200 | HIT | 5/5 | 2 164 | **lika** |
| `b01d8af2` | sammetsfatolj-fotpall-33-cm-ben | 200 | HIT | 5/5 | 1 968 | **lika** |
| `ca92e3ce` | fatolj-skandinavisk-stil-gummitra | 200 | HIT | 5/5 | 2 040 | **lika** |
| `90caeb9d` | djup-fatolj-250-kg-manchesterlook | 200 | HIT | 5/5 | 2 162 | **lika** |
| `beacff5a` | vilstol-bjork-femstegs-fotstod | 200 | HIT | 3/3 | 1 693 | **lika** |

`lika` betyder samma längd OCH samma hash som `facit.json`. Texten kunden ser är
alltså byte för byte den text grindarna godkände — varje lint-regel håller på
live-sidan per konstruktion, inte per uppräkning.

⚠️ **Bildnämnaren var missvisande i första körningen.** Den läste `bilder.json`,
som håller alla fem ursprungliga id, så gallringen såg ut som ett fel (`4/5`).
Nämnaren är nu det vi FAKTISKT lämnade kvar, och grinden vändes samtidigt om:
varje kvarvarande bild MÅSTE synas, och varje BORTTAGEN får inte ha kommit
tillbaka. Båda gröna.

### Åtta stämplingar, gröna

Workflow-körning 1086–1093, alla `success`. Rutten läser tillbaka raden och
verifierar skrivningen — det är husets enda dokumenterade undantag från
"ett grönt jobb är inget kvitto".
