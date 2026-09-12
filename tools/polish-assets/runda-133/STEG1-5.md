# Runda 133 — klöstunnorna, Steg 1–5

Familjen är klösträd. Runda 25 tog de första åtta; sedan dess har andra rundor
och den andra sessionen fyllt på till **43 publicerade sidor**. Kvar ligger
**60 utkast**. Den här rundan tar den TUNNFORMADE grenen — Kratztonne,
Katzentonne, Katzenfass — och lämnar hybriderna (tunna + pelare + plattformar)
till nästa.

## Steg 1 — katalogsvep till uttömning

☠️ **Kvittot är `cursor === null`, inte radantalet.** Svepet gick **57 sidor /
5 649 produkter**, `avhuggen: false`. Av dem är **3 049 osynliga utkast**.

☠️ **Wix VÄGRAR `filter` och `sort` tillsammans med en markör.** Första
försöket skickade samma sökobjekt på varje sida och fick:

```
SE-1141  Invalid usage of cursor paging:
         Search, filter and aggregations cannot be specified together with cursor
```

Fortsättningssidan får alltså bära **bara markören** — urvalet ligger kvar i
den. Det är en ANNAN regel än uppgift #404 (som säger att `filter` och
`cursorPaging` måste ligga UNDER `search`); båda gäller samtidigt, och den
första sidan är den enda som får bära urvalet.

⚠️ **Familjen mättes med BÅDA formerna**, som runbokens regel kräver:
delsträngen `kratzbaum|katzenbaum|kletterbaum|kratztonne|katzenkratz` HITTAR,
och den svenska `klösträd|klöstunna|klättervägg` fångar de publicerade
grannarna. Utan den andra hade 43 publicerade sidor varit osynliga för
dubblettfrågan — uppgift #421:s fälla.

## ☠️ Steg 1 — dubblettgrinden på BYTES, och den hittade en LIVE dubblett

103 bilder laddades ner i original och md5-jämfördes (`bytegrind.py`).
**100 unika, 3 delade.** Fil-id jämfördes ALDRIG — uppgift #499: Wix
omimporterar varje bild, så två produkter med samma leverantörsbild får alltid
olika fil-id och en id-jämförelse kan därför aldrig hitta dubbletten.

| par | delade bilder | vad det är |
|---|--:|---|
| `a33447f9` · `d0b80807` · `e43b623c` | 1 var | leverantörsreklam, se nedan |
| **`81d059f0`** · **`c5e63205`** | **1** | ☠️ **båda PUBLICERADE** |

☠️ **`81d059f0` och `c5e63205` är samma produkt, och båda ligger ute.**
Hjältebilden är **byte-identisk** (md5 `cc37342d4c25`, 586 524 byte, position 1
på båda), och måtten stämmer: 37,5 × 70 mot 37,5 × 37,5 × 70. Sidorna heter
*"Klöstunna 70 cm med tre plan och två hålor"* och *"Kattträd med klöspelare i
sisal – tunnformad klösmöbel med 3 kojor"*.

⚠️ Och den andra sidans namn stämmer inte med fotot: bilden visar **två**
öppningar, inte tre kojor. Det är alltså en dubblett OCH ett felaktigt namn.
Lämnas till Leonards dubblettregel — ingen skrivning härifrån, eftersom båda
är publicerade och en pensionering av en säljande sida är hans beslut.

**Ingen av rundans tio är dubblett** — varken mot varandra eller mot de 43
publicerade. Noll delade bilder utöver reklamen.

## ☠️ Steg 4 — leverantörsreklam på bildposition 5

Den delade bilden på `a33447f9`, `d0b80807` och `e43b623c` är **ingen
produktbild alls**: PawHut-logotypen två gånger, tysk marknadsföringstext
(*"Ihre Welt, ihre Regeln. Hoch hinaus, tief schlafen."*) och en katt.
Uppgift #428:s klass, nu med tre nya förekomster. Den plockas bort från
rundans två (`a33447f9`, `e43b623c`); `d0b80807` ligger i nästa runda.

**Logotypkollen: ren.** Övre vänstra hörnet granskat på **alla 50 bilder** i
rundan — noll inbrända märken utanför de två reklambilderna. Det är runda 64:s
kontroll, och den ställs på varje bild, inte bara på hjälten.

**Måttritningarna: rena.** Alla tio lästes i full upplösning, inte på ett
kontaktark — uppgift #401:s lärdom är att en glimt ställer fel fråga. De bär
bara siffror och `cm`, inget tyskt ord. Varje tal stämmer mot tyskans
`Technische Daten`.

## ☠️ Steg 5 — identiska mått OCH identisk vikt bevisar INTE färgsyskon

Uppgift #420 slår fast att identiska mått + identisk vikt betyder färgsyskon.
**Den här rundan mätte ett motexempel.**

`e7a9abb7` och `f2e06b7a` delar allt som brukar räcka:

| | `e7a9abb7` | `f2e06b7a` |
|---|---|---|
| Gesamtmaße | 40 × 40 × 74 | 40 × 40 × 74 |
| Vikt | 12,3 kg | 12,3 kg |
| Paketmått | 43 × 43 × 77 | 43 × 43 × 77 |
| Tyska texten | ordagrant samma punktlista | ordagrant samma punktlista |
| Farbe | Grau+Weiß | Beige+Weiß |
| **öppningar på FOTOT** | **TRE** | **TVÅ** |

Räknat på bild 1 OCH bild 2, alltså från två olika vinklar, på båda. Det är
inte en skymd öppning — den finns inte. Båda kallas "Drei Ebenen" av
leverantören, vilket går ihop om man räknar den öppna toppen som ett plan, men
**antalet ingångar skiljer** och det är vad kunden ser.

**Följden: de får INTE korslänkas som färgvarianter.** Ett "finns även i beige"
hade varit ett påstående om samma modell, och det är falskt. Varje sida
beskriver sin egen bild.

### Resten av grupperna, avgjorda på bild + mått + tysk text tillsammans

| grupp | produkter | vad bilden visar | korslänk |
|---|---|---|---|
| A sjögräs | `b6bf627f` 49 cm · `a33447f9` 79 cm | flätad sjögräsbotten, 2 resp 3 hålor | storlekssyskon |
| B öppen topp | `e7a9abb7` · `f2e06b7a` | 3 resp **2** ingångar | ☠️ **ingen** |
| C Ø38 × 70 | `bd0d7f9e` grå · `d9310184` ljusbrun · `efa9c03e` mörkgrå kant | 3 runda hålor på alla tre | färgsyskon (trio) |
| D Ø35 × 60 | `e43b623c` | 2 hålor, maxlast **10 kg** | ensam |
| E Ø38 × 96 | `d85ade1b` cremevit · `ec29ad45` grå | 3 kattformade hålor, mustips, tvättbar bädd | färgsyskon |

☠️ **Grupp C kallas "Hellgrau" av leverantören på TVÅ av tre.** `bd0d7f9e` har
grå kanter, `efa9c03e` mörkgrå/koksgrå kanter — samma ord, synligt olika varor.
De svenska namnen måste bära kantfärgen, annars går sidorna inte att skilja åt.

### Motsägelser i källan

| id | motsägelse | avgjord av |
|---|---|---|
| `a33447f9` | intron säger *"zwei Höhlenbereiche"*, punktlistan *"Drei"* | bilden + namnet: **tre** |
| `a33447f9` | tyskan `Khaki+Kaffee`, svenska spec-raden `Khaki+Braun` | bilden |
| `d9310184` | tyskan säger `Braun`; fotot är ljusbrunt/taupe med gräddvit kant | bilden |
| `f2e06b7a` | svenska spec-raden `Beige` tappar vitt som tyskan har | bilden |
| `bd0d7f9e` | svenska spec-raden `Grå`, tyskan `Hellgrau` | bilden |
| `d85ade1b` | svenska spec-raden `Cremeweiß` — **oöversatt tyska** | tyskan |

☠️ **Spec-tabellens `Material` är en FÖRKORTNING, inte en översättning.**
Fyra av tio säger bara `Polyester` där tyskan listar spånskiva, plysch, sisal
och sjögräs. De andra sex säger `Sisal, Spanplatte` — **`Spanplatte` är tyska**.
Materialraden måste alltså skrivas om från tyskans lista, inte ärvas.

☠️ **`Vikt` i spec-tabellen är FRAKTVIKTEN** (uppgift #488). Ingen av de tio
har ett `Gewicht` i tyskan att ställa mot den, så varans egen vikt är **inte
känd** för någon av dem — den får därför inte påstås.

### Vad som INTE får påstås

- **Maxlast finns bara på fyra**: `b6bf627f` 20 kg, `a33447f9` 20 kg,
  `e43b623c` 10 kg, `d85ade1b`/`ec29ad45` 20 kg. `e7a9abb7`, `f2e06b7a`,
  `bd0d7f9e`, `d9310184` och `efa9c03e` anger **ingen** — och då skrivs ingen.
- **Kattens vikt är leverantörens rekommendation, inte en gräns**: under 5 kg
  (A, C, D), under 4,5 kg (B), rekommenderat 6 kg (E).
- **Ingen CE-märkning.** Kattmöbler omfattas inte, och ett sådant påstående
  vore ogrundat oavsett hur självklart det låter.
- **Inget leveranslöfte** (uppgift #423) och **inget artikelnummer** — varken
  som spec-etikett eller i texten (uppgift #414).

## Steg 2 — laglighetsgrinden

Klöstunnor är kattmöbler, inte djurbostäder: **SJVFS 2019:15 L80 gäller inte**
(det är förvaring av djur som regleras, och en klöstunna är en möbel katten går
in i och ut ur fritt). Rundorna 25 och 49 gjorde samma avgränsning.

Kvar att vakta, och allt är uppfyllt i källan:

1. **Stabilitet.** Fem av tio är 70 cm eller högre, `d85ade1b`/`ec29ad45` är
   96 cm. Ingen har tippskydd eller väggfäste, och ingen påstår sig ha det.
   Texten får inte kalla dem "stabila" utöver vad maxlasten visar.
2. **Ingen montering.** Sex av tio säger uttryckligen *"Keine Montage
   erforderlich"* / *"Kommt vollständig montiert an"*. Det är ett
   säljargument som stämmer och får skrivas.
3. **Lösa smådelar.** `d85ade1b`/`ec29ad45` har tre hängande mustips.
   De är leksaker för katt, inte barnleksaker — ingen EN 71-hänvisning.

## Steg 6–7 — texterna skrivna och grindade

Steg 6 är en no-op (Aosom-rader är enkelvariant utan optioner).

**Grinden: 67 egna självtestfall + 56 delade, tio produkter, noll fel.**

Texten skrevs i en FIL och grindades före varje skrivning — CLAUDE.md:s
mätning är 9 fel inline mot 0 genom fil plus grind. Grinden fällde SEX äkta
fel i första utkastet, och ögonen ett sjunde:

| fynd | vad det var |
|---|---|
| `b6bf627f` bar *"tre hålor"* | syskonets antal i den EGNA zonen — rundans huvudregel, åt fel håll |
| `e7a9abb7` bar *"de rymligaste i rundan"* | intern jargong i kundtext (uppgift #318) |
| `d85ade1b`, `ec29ad45` bar *"den högsta i rundan"* | samma, två gånger till |
| `4,5` stod lösryckt i två texter | kattvikten fanns inte i spec-tabellen → ohärlett tal |
| `d85ade1b`, `ec29ad45` saknade maxlasten i namnet | 20 kg stod i metan men inte i namnet |
| ☠️ **"den smalaste öppningen i vårt sortiment"** | **omätt superlativ — hittat med ÖGON, inte av grinden** |

☠️ **Det sjunde är det intressanta: superlativet bytte ADRESS och slapp förbi.**
Batchsuperlativgrinden fäller *"i rundan"*, *"av de tio"*, *"i uppsättningen"*.
Formuleringen pekade i stället på BUTIKEN — *"i vårt sortiment"*, *"den
smalaste öppningen vi har"* — och gick rakt igenom. Det är samma fel med
värre underlag: rundans tio går att räkna på en minut, de **43 publicerade
klösträden har ingen mätt**. Mönstret täcker nu `sortiment`, `katalog`,
`hos oss`, `vi har` och `butik`, och sex nya självtestfall låser båda
adresserna. Steg 12 är alltså inte en formalitet — den hittade det enda fel
som ingen kod såg.

### ☠️ Och grinden hade ett FALSKLARM som var farligare än ett missat fel

Syskonfärgsgrinden fällde `bd0d7f9e` och `efa9c03e` för att de skrev ordet
**ljusgrå** — sin EGEN grundfärg. Grupp C är tre tunnor som alla är ljusgrå
eller ljusbruna i botten och skiljs åt av KANTFÄRGEN; grinden jämförde
syskonets FÖRSTA ord och träffade därför den gemensamma grundfärgen.

Två korrekta sidor av tre fälldes. Det är precis det huset skrivit ned som
det dyraste felet: *ett falsklarm som alltid fyrar är lika illa som ett fel
ingen ser* — båda slutar med att mottagaren slutar läsa. Grinden jämför nu
bara de ord som SKILJER syskonens färger åt, och tre självtestfall låser
det åt båda hållen: den egna grundfärgen släpps, syskonets särskiljande ord
fälls fortfarande.

### Namn, slug och SKU

Alla tio namn ligger under 80 tecken (50–66). Sluggarna är valda så att det
som skiljer syskonen åt ryms FÖRE `sku_bas`-kapningen — uppgift #489 gav
runda 129 fyra sidor som delade SKU. Kontrollerat mot hela katalogen:
**5 649 produkter, noll slugkrockar**, och noll krockar de tio emellan.

⚠️ **SKU-halvan är INTE bevisad här.** `products/search` returnerar aldrig
`variantsInfo`, så en katalogsvepning kan inte se andras variant-SKU:er.
Den kontrollen hör hemma i Steg 8, mot skarpa läsningar — det var så runda
132 hittade sex live-krockar.

## Steg 7 skrivet — 10 av 10 byte-exakta mot facit

Alla tio bär nu svenskt namn, svensk slug, svensk `seoData` och den polerade
brödtexten. `visible: false` på alla tio — publiceringen är Steg 13.

| | |
|---|---:|
| skrivna produkter | 10 |
| byte-exakta mot `facit.json` | **10** |
| avvikelser | **0** |
| `https:/`-hrefar (rundans 132-fälla) | **0** |
| sidor med svenskt `settings.keywords` | 10 |

☠️ **Kvittot går mot FACIT, inte mot min egen avskrift** (uppgift #485).
`facit.json` byggdes ur `texter.py` INNAN något skrevs; nyttolasten
klistrades in i API-anropet därifrån. Hade jag klistrat fel hade
jämförelsen fallit — och det är hela poängen med att frysa facit först.

Jämförelsen är en FNV-1a-hash över den normaliserade texten, räknad på
båda sidor: i Python över `wixnorm.normalisera(bygg(pid))` och i JS inne i
Wix-sandlådan över det sparade `plainDescription`. Då behöver de 34 000
tecknen aldrig resa hem för att bevisa sin egen identitet.

⚠️ **Och metoden bevisade sig på mig själv.** Första jämförelsen gav ETT
fel: `ec29ad45 LÄNGD 4233642417 != facit 3882`. Talet är hashen, inte
längden — jag hade klistrat fnv-värdet i längdfältet när jag skrev av
live-avläsningen för hand. Wix-innehållet var korrekt hela tiden (dess FNV
stämde). Felet satt i AVSKRIFTEN, alltså precis där uppgift #485 säger att
det sitter. En jämförelse som inte hade räknat längden separat hade aldrig
sett det — och en som bara läst hashen hade sagt grönt.

☠️ **`seoData.settings.keywords` skrevs i Steg 7, inte i Steg 13.** Importen
lämnar leverantörens TYSKA rubrik där, och Steg 7 rörde tidigare bara
`seoData.tags`. Runda 132 fick städa det i Steg 13; här är det gjort direkt,
och återläsningen visar svenskt huvudord på alla tio.

⚠️ **PATCH-svaret bär inget `plainDescription`** utan `?fields=` — det kom
tillbaka som `langd: 0` på de två första skrivningarna. Det är uppgift #457
och #425, inte ett fel. Kvittot togs därför på en EGEN återläsning med
`?fields=PLAIN_DESCRIPTION`, aldrig på skrivsvaret.

## ☠️ Steg 8a — en SKU-skrivning kan inte vara smal, och det är farligt

Alla tio bär nu sin härledda svenska variant-SKU, skriven mot `wixVariantId`.
**Sex av tio delade SKU med ett syskon** innan — och krockarna kom från
IMPORTEN, inte från poleringen (uppgift #272):

| delad SKU | produkter |
|---|---|
| `FP-kratztonne-fur-katzen` | `e7a9abb7` + `f2e06b7a` |
| `FP-kratztonne-mit-3-ebenen` | `bd0d7f9e` + `efa9c03e` |
| `FP-katzenkratzfass-96-cm-4` | `d85ade1b` + `ec29ad45` |

☠️ **Wix VÄGRAR en variantsInfo-PATCH som bara bär `sku`:**

```
400 REQUIRED_FIELD
product.variantsInfo.variants[0].price must not be empty
```

**Priset måste alltså följa med i varje SKU-skrivning.** Det gör Steg 8 till
runbokens farligaste steg på en regel som säger *rör aldrig priset*: en enda
felskriven siffra ändrar vad kunden betalar.

**Motmedlet: eka priset, skriv aldrig av det.** Skrivningen tar
`gammalVariant.price` rakt ur den GET som ändå görs för revisionen, och
jämför `pris_fore === pris_efter` per produkt i samma anrop.
**Tio av tio orörda** — 849, 1529, 1169, 1159, 999, 1029, 1059, 939, 1359, 1459.

### ☠️ Och uppgift #501 var för snäll — den är RÄTTAD här

Runda 132 skrev "skicka inte `media` i en variantsInfo-PATCH". Mätningen här
säger något värre:

| | före Steg 8a | efter |
|---|--:|--:|
| varianter med eget `media` | **9 av 10** | **0 av 10** |

Skrivningen skickade `sku`, `price`, `choices` och `visible` — **uttryckligen
inget `media`**. Varianterna tappade det ändå. Alltså: **varje**
variantsInfo-PATCH nollar variantens bild, oavsett om media skickas med eller
utelämnas. Det finns ingen väg att skriva en variant-SKU utan att förlora den.

Skadan i rundan är noll — alla tio är enkelvariant utan optioner, butiken
renderar `media.main`, och den är intakt (10/10 huvudbild, 10/10 fem
galleribilder). **På en flervariantsida med optioner är den inte noll**, och
det är vad som ska mätas härnäst.

## Steg 9 — tio kort byggda

`kort.py` är en DATAFIL: tio `KORT` (kicker + rubrik) och tio `RADER`.
Reglerna — värdehärledningen, måttradskravet, dubblettspärren, takgränsen och
kopian till spårade `kort/` — bor i `kortrunda`/`kortbygge`.

**Grinden 10 av 10 grön**, och den fällde två saker på vägen:

1. ☠️ **Homoglyfgrinden tog mittpunkten `·`** i alla tio kickers. Ett tecken
   som ser ut som ett skiljetecken men inte står i husets tillåtna uppsättning.
   Ersatt med komma.
2. ☠️ **Sex av tio sprängde 215 kB-taket vid q=85** — och det är SISALEN som
   gör det. En tätt lindad sisalyta är högfrekvent brus, precis det jpeg inte
   packar. Regeln är att FOTOT mjukas upp, aldrig kortet: kvaliteten får inte
   under 85. Med `MJUKA` satt efter hur mycket varje kort låg över
   (+1 480 till +23 050 byte) ligger alla tio nu på 198–215 kB.

⚠️ **Rubriken är vald mot bild 1 med ögon och kontrollerad på kontaktarket.**
Rundans egen fälla är grupp C: tre tunnor som bara skiljs åt av KANTFÄRGEN, så
varje rubrik namnger just kanten — *"Tre runda hålor med grå kanter"*,
*"Gräddvita kanter mot ljusbrun sisal"*, *"Mörkgrå kanter, topp och sockel"*.

**Korten pushas FÖRE uppladdningen.** `kort/` är den spårade platsen, och Wix
hämtar filerna från `raw.githubusercontent.com` — ligger de inte i grenen
svarar adressen 404 och Wix kvitterar ändå `success: true, PENDING`
(runda 106, sex kort).

## ☠️ Steg 9 VÄLTE Steg 5: f2e06b7a har TRE ingångar, inte två

Uppgift #504 påstod att rundan hade mätt ett motexempel till #420 — två
produkter med identiska mått, identisk vikt, identiskt paketmått och ordagrant
samma tyska punktlista, men **olika antal ingångar**, alltså inte färgsyskon.

**Premissen var fel.** Bildgranskningen inför Steg 9 läste måttritningen
(bild 3) i full upplösning, och där ligger `f2e06b7a`:s öppningar i samma
spiral som syskonets: **övre vänster, mitten höger, nedre vänster.** Tre.

☠️ **Mekanismen är den som Steg 5 uttryckligen trodde sig ha uteslutit.**
Anteckningen löd: *"Räknat på bild 1 OCH bild 2, alltså från två olika vinklar,
på båda. Det är inte en skymd öppning — den finns inte."* Så här ser de två
bilderna faktiskt ut:

| bild | öppningar som SYNS | vilka |
|---|--:|---|
| 1 (hjälte) | 2 | översta + nedersta |
| 2 (miljö) | 2 | översta + **mittersta** |
| 3 (måttritning) | **3** | alla |

Två i båda — men **inte samma två**. Unionen är tre. Tunnan är rund och
öppningarna sitter i spiral, så varje vridning döljer exakt en.

**Regeln: två vinklar bevisar ingenting om man inte visar att det är SAMMA
föremål man räknar i båda.** Räkna per höjdläge, inte per bild. En rund vara
med spiralställda hål kräver den vy som visar hela varvet — måttritningen —
eller en explicit union över vinklarna.

### Följderna, alla åtgärdade i samma pass

| vad | före | efter |
|---|---|---|
| `matt.TUNNOR["f2e06b7a"]["ingangar"]` | 2 | **3** |
| `matt.FARGSYSKON` | grupp B utanför | **`("e7a9abb7", "f2e06b7a")`** |
| Korslänkarna | "beige modell med två ingångar" | "samma tunna i beige" |
| `texter.FARGRAD` | ingen rad för de två | **rad åt båda håll** |
| `grind.sjalvtest` | låste `== 2` | låser `== 3` + färgsyskonet |
| Uppgift #504 | motexempel till #420 | **struken — #420 står** |

☠️ **Självtestet LÅSTE FEL FACIT, och det är den dyraste raden här.** `grind.py`
bar `prov("facit: f2e06b7a har två", …== 2)` och var grön i hela rundan. Ett
självtest bevisar att koden gör det datan säger — **aldrig att datan är sann.**
Det som fällde felet var ögon på en bild, i Steg 9, tre steg efter Steg 5.

### Två fel till på samma produkt, samma granskning

☠️ **Ingången är FYRKANTIG, inte rund.** Måttritningen sätter `18 cm` på BÅDA
ledder på både `e7a9abb7` och `f2e06b7a`, och fotot visar fyrkanter med rundade
hörn. Rundans text sa `Ø18 cm` på båda. Åtta av tio tunnor HAR runda hålor, så
`Ø` var rätt vana och fel på just det par där skillnaden syns. Nu står
`18 × 18 cm`, och självtestet fäller om `Ø` kommer tillbaka på de två.

☠️ **Sisalen på `f2e06b7a` är den BEIGE, inte den gräddvita.** Texten sa
*"Gräddvit sisalpanel längs sidan att klösa på"*. Pixlarna säger tvärtom: den
breda gräddvita banden är slätt plysch, och de smalare beige banden är vävd
sisal. Det är en funktionell lögn — kunden köper en klösyta och pekas mot den
yta som INTE går att klösa på. Syskonet `e7a9abb7` hade rätt hela tiden
(mörkgrå plysch, ljusgrå sisal), vilket är just varför felet var osynligt: den
ena av två parallella texter stämde.

### Skrivningen

Båda texterna skrevs om och kvitterades byte-exakt mot `facit.json`:

```
e7a9abb7  rev 4  synlig false  3425 tecken  fnv 313894149  = facit
f2e06b7a  rev 4  synlig false  3597 tecken  fnv  69437125  = facit
```

Korten byggdes om. ⚠️ **`f2e06b7a`:s kortrubrik fick INTE bli "Tre ingångar"**,
fast det nu är facit: hjälten visar bara två av dem. Kortet är ett bildlöfte, så
rubriken blev `Gräddvit plyschpanel mot beige sisal` — det hjälten faktiskt bär
— och talet står i RADEN, som är rätt plats för ett tal.

## ✅ Steg 9b och Steg 10 — kvitto

**Korten:** tio uppladdade, `10 av 10 READY och attribuerade på innehåll`
(`kortkvitto.py`, md5 mot den lokala filen — inte mot ordningen i anropet).
De två ombyggda laddades upp igen efter rättningen och kvitterades på nytt.

**Galleriet och de 58 alt-texterna**, ett PATCH per produkt, alla verifierade
med en separat `?fields=MEDIA_ITEMS_INFO`-läsning mot lokalt facit:

| | |
|---|---:|
| produkter | 10 |
| bildposter skrivna | **58** |
| `ordning_ok` | 10 av 10 |
| `alla_har_alt` | 10 av 10 |
| `huvudbild` kvar | 10 av 10 |
| alt-FNV mot facit | **10 av 10 exakta** |
| fortfarande `visible: false` | 10 av 10 |

Ordningen är runbokens: hjälte, verklighetsbild, eget kort, detaljer,
måttritning sist. Måttritningen låg på plats 3 i rå-importen på **alla tio** —
samma mönster som uppgift #371 mätte på runda 104.

☠️ **PawHut-reklamen är BORTA från båda.** `a33447f9` och `e43b623c` bar den på
bildposition 5: två logotyper, tysk marknadsföringstext och en katt, ingen
produktbild alls (uppgift #428). De har fem bilder nu, de andra åtta har sex.
⚠️ Filerna har OLIKA id på de två sidorna fast det är samma bild — uppgift #499
igen: Wix omimporterar varje bild, så id bevisar ingenting.

### ☠️ Alt-texten var ogrindad — nu finns `alttexter.py`

Runbokens Steg 9 säger det rakt ut: steg-grinden läser `html`, `namn`, `titel`
och `meta`, och alt-texten finns i ingen av dem. `alttexter.granska` kör därför
**rundans egna mönster, importerade ur `grind`** — inte omskrivna varianter:
`FORBJUDET`, `NEGERBART`, `PER_PRODUKT`, typgrinden, ingångsantalet,
syskonfärgerna, plus husets homoglyf-, jargong- och artikelnummergrindar.

Tolv mutationstester, och **ett av dem föll inte där det skulle**:

☠️ **`\bleksak\w*` är blind för `musleksak`.** I sammansättningen är `s` och
`l` båda ordtecken, så `\b` matchar aldrig. Exakt samma mina som `\btr[äa]d`
i den här rundan och `\bramp` i runda 131 och 132 — tredje gången, och den
enda som hittades av ett test i stället för av en publicerad sida. Mönstret är
bart nu.

### Steg 10 — samma löv som familjens publicerade syskon

Id:n lästa ur trädet, aldrig ur minnet: **Husdjur**
(`a2b4369f-…`) + **Lek & Tillbehör för husdjur** (`ea1313f5-…`). Tre av fyra
publicerade klöstunnor ligger redan i båda.

☠️ **Uppgift #357 bekräftad en gång till: återläsningen ljög NEGATIVT.**
`bulk/categories/add-item` svarade `totalSuccesses: 2, totalFailures: 0` på
alla tio, och produktprojektionen svarade i samma andetag `1 kategori`. Hade
domen fallit där hade rundan skrivit om tio korrekta kategorier. Sekunder
senare, och läst genom `list-categories-for-items` (kategoritjänsten själv,
inte produktprojektionen), säger **båda källorna 3 av 3 på alla tio**.

**Regeln: en kategoriskrivning ska verifieras mot kategoritjänsten, och först
efter en paus.** Produktprojektionen är ett eftersläpande derivat.

⚠️ **Ett fynd utanför rundan, inte åtgärdat:** `c5e63205` — den ena halvan av
uppgift #503:s live-dubblett — ligger i Husdjur men **saknar lövet**. De tre
andra publicerade har det. Lämnad orörd med flit: sidan kan komma att
pensioneras när Leonard avgör #503, och då vore ändringen bortkastad.

## ✅ Runda 133 KLAR — tio klöstunnor LIVE, 10 av 10 gröna

| steg | vad | kvitto |
|---|---|---|
| 7 | tio kundtexter | byte-exakta mot `facit.json` |
| 8a | variant-SKU i Wix | 10/10, pris orört |
| 8b | mappningsraden | tio `stampla`-körningar, **10 av 10 `success`** |
| 9 | kort + galleri + 58 alt-texter | 10/10 exakta mot lokalt facit |
| 10 | Husdjur + Lek & Tillbehör | 3 av 3 kategorier på alla tio |
| 13 | publicering | produkt OCH variant `visible: true` |
| 14 | live-grinden | **10 sidor, 0 fel**, alla `HIT` |

Publiceringen kvitterades per produkt: `sku_orort`, `pris_orort`,
`galleri_orort` och `huvudbild` sanna på alla tio. Galleriet överlevde
variantsInfo-PATCHen — 6 bilder på åtta av dem, 5 på de två som tappade
PawHut-reklamen.

### ☠️ Steg 14 fällde två KORREKTA sidor — för deras egen syskonrad

Första live-körningen gav `10 sidor, 2 fel`:

```
b6bf627f  INGÅNGAR: fel antal (tre) — facit är två:
          'Samma serie finns även som 79 cm hög med tre hålor'
a33447f9  INGÅNGAR: fel antal (två) — facit är tre:
          'Samma serie finns även som 49 cm hög med två hålor'
```

Båda strängarna är ordagrant produktens EGEN `texter.FARGRAD`-rad, och båda är
sanna: de beskriver STORLEKSSYSKONET. Sidorna hade rätt; grinden läste ett
påstående om en annan vara som om det gällde den här.

☠️ **Orsaken är att de två lägena stryker på olika sätt.** Offline faller
färgraden bort med hela korslänksblocket (`utan_korslankar` skär på
RUBRIKNIVÅ). Live gör den inte det: `egna_meningar` stryker grannmeningar på
SLUG och NAMN, och *"Samma serie finns även som 79 cm hög med tre hålor"* bär
varken — den nämner en storlek, inte ett syskon vid namn. Grinden var alltså
grön offline och röd live på exakt samma text.

Tredje gången samma klass (uppgift #384, #437): **en grinds egen strykning kan
se ut som ett fynd på sidan.** `utan_fargrad` stryker nu raden i BÅDA lägena —
en KÄND EGEN sträng ur `texter.FARGRAD`, aldrig en heuristik, och i båda lägena
så de inte kan glida isär (uppgift #491). Offline är den redan borta, alltså en
no-op där.

Fyra självtester låser den, och ett av dem är det som gör strykningen ofarlig:
*"ett ÄKTA felantal överlever strykningen"* — `"Tunnan har tre hålor."` står
kvar och fälls fortfarande. En strykning som döljer det den skulle vakta vore
värre än falsklarmet.

Efter lagningen: `grind.sjalvtest(): 76 fall, 0 fel`,
`alttexter.sjalvtest(): 12 fall, 0 fel`, och de två sidorna `HIT 0 fel`.

### Rundans fyra fynd som överlever den

1. ☠️ **#504 STRUKEN.** `f2e06b7a` har tre ingångar, inte två — måttritningen
   visar hela varvet. De ÄR färgsyskon, och #420 står oemotsagd.
2. ☠️ **Två vinklar bevisar ingenting om det inte är SAMMA två.** Bild 1 och
   bild 2 visade två öppningar var, men olika två. Räkna per höjdläge.
3. ☠️ **`\bleksak\w*` var blind för `musleksak`** — hittad av ett
   mutationstest som INTE föll, inte av en publicerad sida.
4. ☠️ **En kategoriskrivning verifieras mot kategoritjänsten, inte mot
   produktprojektionen** — och först efter en paus (uppgift #357).

⚠️ **Kvar till Leonard:** uppgift #503, live-dubbletten `81d059f0` /
`c5e63205`. Och `c5e63205` saknar dessutom kattlövet, orörd med flit i väntan
på det beslutet.
