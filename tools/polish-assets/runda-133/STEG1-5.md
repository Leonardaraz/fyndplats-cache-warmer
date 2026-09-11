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
