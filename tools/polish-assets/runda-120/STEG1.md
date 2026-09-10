# Runda 120 Steg 1 — barbordsseten

## Katalogsvepet

Kört i tre etapper till **`cursor === null`**. Kvittot är markören, inte
radantalet (uppgift #404, och odlingslådornas avhuggna svep 2026-09-02).

| | |
|---|--:|
| sidor | **57** |
| utkast | **3 124** |
| publicerade | **2 499** |
| katalogen | **5 623** |

⚠️ **Markören måste skickas tillbaka HEL.** Etapp 2 föll först på
`SE-1142 The cursor … is invalid` — jag hade trunkerat markören till 24 tecken
i min egen felsökningsutskrift och sedan skickat tillbaka den stympade. Ett
svep som avbryts på en stympad markör ser i loggen ut som ett svep som tog
slut; skillnaden är att `avhuggen` säger `true`.

## Familjen: 47 utkast + 20 publicerade

Svept på BÅDE tyska och svenska ord (`barhocker|barstuhl|barstol|barpall|
tresenhocker|thekenhocker`) — uppgift #421 mätte att ett svep på leverantörens
tyska ord tappar de redan polerade syskonen. Här var det avgörande: alla tjugo
publicerade heter `Barstolar …` och hade fallit utanför ett rent tyskt svep.

| | utkast | publicerade |
|---|--:|--:|
| barstolar ensamma (`Barhocker`) | 34 | **20** |
| **barbord MED sittplatser** (`Bartisch-Set`) | **13** | **0** |

☠️ **Barstolshalvan går inte att polera nu.** Tjugo publicerade sidor heter
alla `Barstolar 2-pack …`, och trettiofyra nya sidor på samma huvudord hade
kannibaliserat varenda en. Barborden har ett eget sökord (`barbord med stolar`,
`barset`) och noll publicerade konkurrenter.

## Dubblettgrinden mellan UTKASTEN

Kördes på fyra tal per rad — yttermått, sitthöjd, paketmått och vikt —
eftersom tvillingarna oftare sitter i utkastshögen än mot en publicerad sida.

**Ett par slog ut identiskt på varenda tal:**

| | `c88b5bbb` | `63a37524` |
|---|---|---|
| bord | 100 × 60 × 88 | **100 × 60 × 88** |
| pall | 32 × 32 × 57 | **32 × 32 × 57** |
| paketmått | 113 × 69 × 17,5 cm | **113 × 69 × 17,5 cm** |
| vikt | 26,1 kg | **26,1 kg** |
| pris | 1 559 kr | 1 599 kr |

### ✅ Men bilderna FRIADE dem — det är ett färgsyskon

`c88b5bbb` har **ljus ekskiva**, `63a37524` **mörk rustikbrun**. Identiskt
chassi, identiska mått, identisk vikt, olika träfärg. Uppgift #420 ordagrant:
*identiska mått + identisk vikt = FÄRGSYSKON, inte dubblett.*

⚠️ **Det är den ovanliga riktningen.** Runbookens regel — *"en måttmatchning
är ett SÅLL, inte en dom, avgör med BILDERNA"* — har i tidigare rundor nästan
alltid FÄLLT en produkt som såg unik ut. Här FRIADE den två som såg identiska
ut. Grinden är alltså inte en dubblettdetektor med bilder som formalitet; den
är ett såll där bilderna avgör åt båda hållen.

Båda poleras, som färgsyskon med korslänk till varandra — samma behandling som
runda 91 gav modell E:s fyra färger. Prisskillnaden på 40 kr är Leonards.

## De tretton, mätta och grupperade

**Tre delar — bord + två sittplatser (åtta):**

| id | pris | bord | sittplats | yta |
|---|--:|---|---|---|
| `441d2209` | 1 139 | 80 × 50 × 87 | fyrkantiga pallar | grå stenlook |
| `26d15aa5` | 1 219 | 105 × 40 × 90 | runda pallar Ø30 | rustikbrun |
| `394de213` | 1 259 | 80 × 50 × 90 + hylla | runda pallar Ø30 | vit ram |
| `f4ed1264` | 1 269 | 100 × 40 × 90 | runda pallar Ø41 | vit marmorlook |
| `3b38e191` | 1 349 | 89 × 45 × 87 | **stolar med ryggstöd** | ljus träskiva |
| `51c43e67` | 1 369 | 100 × 40 × 90,5 | **stoppade pallar med rygg** | grå stenlook |
| `c3bda64a` | 1 779 | 100 × 60 × 95 **+ två hyllplan** | fyrkantiga pallar | svart + ljus |
| `a0c8f793` | 2 829 | 116 × 70 × 89,5 **klaffskiva, skåp** | runda pallar Ø35 | ljust trä + svart |

**Fem eller sex delar — bord + fyra sittplatser (fem):**

| id | pris | bord | sittplats | yta |
|---|--:|---|---|---|
| `bc2157d2` | 1 439 | **TVÅ bord**, 80 och 100 × 40 × 90 | fyra pallar Ø29,5 | grå stenlook |
| `c88b5bbb` | 1 559 | 100 × 60 × 88 | fyra pallar 32 × 32 | **ljus ek** |
| `63a37524` | 1 599 | 100 × 60 × 88 | fyra pallar 32 × 32 | **rustikbrun** |
| `35e9609f` | 1 659 | 110 × 50 × 89,5 | fyra pallar Ø30 | rustikbrun |
| `2b03b3e4` | 3 769 | 120 × 60 × 91, A-ben | **fyra stoppade stolar** | trä + grått tyg |

Alla tretton är **i lager** och bär fem bilder var.

## Redan hittat inför Steg 4

☠️ **`c3bda64a`s måttritning bär ENGELSK text i pixlarna** — `374 lbs (170 kg)`
och `308 lbs (140 kg)`. Samma klass som uppgift #408, och den syns inte i något
`grep`: det är pixlar, inte markup. Ritningen är i övrigt språkneutral, så den
går sannolikt att beskära eller tvätta i stället för att kastas.

-----

# Steg 2 — säkerhetsgrinden

Ingen stoppklass i familjen: inga elektriska delar, ingen barnnorm, inga
kemikalier. Rundans säkerhetssiffra är i stället **maxlasten på bordsskivan**,
och den spretar så mycket att den inte kan skrivas som en gemensam mening:

| set | bordslast | sitslast |
|---|--:|--:|
| `441d2209` | **20 kg** | 120 kg |
| `c88b5bbb` | 25 kg | 100 kg |
| `63a37524` | 25 kg | 100 kg |
| `51c43e67` | 50 kg | 130 kg |
| `f4ed1264` | 60 kg | 120 kg |
| `3b38e191` | 60 kg | 100 kg |
| `394de213` | 70 kg | 100 kg |
| `c3bda64a` | **170 kg** | 140 kg |

⚠️ **Tabellen är GENERERAD ur `matt.py`, inte skriven för hand** — och det är
inte pedanteri: första versionen av den här raden var handskriven och gav
`3b38e191` **80 kg** där filen säger 60, och `120 kg` på sitsen där filen säger
100. Två fel i en tabell med sexton tal. En logg som avviker från talkällan är
en andra sanning, och det är precis den sortens andra sanning som `c3bda64a`s
vikt kom ifrån. `python3 matt.py --lasttabell` skriver ut den.

☠️ **20 kg är två matkassar.** Det är den uppgift kunden märker först av alla
och det som gör hela batchen till ett Steg 2-ärende: åtta bord som SER likadana
ut bär mellan 20 och 170 kg. Skrivs som ett **positivt villkor med egen
rubrik** enligt runbooken, aldrig som ett varningsblock.

**Tre set valdes bort ur batchen just för att de saknar lastuppgift helt**
(`26d15aa5`, `35e9609f`, `a0c8f793` — och `2b03b3e4`, `bc2157d2`). Ett set utan
lastsiffra får inte poleras i en runda där lasten är huvudargumentet;
`matt.kontroll()` regel 1 fäller om ett sådant smyger in.

-----

# Steg 3 — måtten, och den grind som hittade ett kopierat tal

`matt.py` är rundans enda talkälla. Åtta produkter, sju kontrollregler,
**8 muterade fall och 0 som släpptes igenom.**

## ☠️ EN läsning ser alltid frisk ut — den andra är grinden

`c3bda64a` stod i `matt.py` med **29,4 kg**. Det är EXAKT vikten på
`bc2157d2` — ett set som inte ens ligger i batchen. `produkter.json`, skrivet
i Steg 1 ur katalogsvepet, hade läst **20 kg** ur produktens egen rad.

| | Steg 1 (katalogsvepet) | Steg 3 (spec-blocken) | dom |
|---|---|---|---|
| sju av åtta rader | vikt + paket | **exakt samma** | ✅ |
| `c3bda64a` | 20 kg | **29,4 kg** | ☠️ |

Det som gör fyndet farligt är att **ingen av de två läsningarna såg fel ut för
sig.** 29,4 är ett rimligt tal för ett stort barbord; det finns inget i raden
som skaver. Felet syns bara när två oberoende läsningar av samma
leverantörsrad ställs bredvid varandra — och det är precis vad regel 7 nu gör
automatiskt:

```
7. TVÅ OBEROENDE LÄSNINGAR AV SAMMA LEVERANTÖRSRAD MÅSTE STÄMMA.
   Ett fält där de två inte möts är None tills det gått att läsa om —
   aldrig det tal som råkade skrivas sist.
```

⚠️ **Skiljedomen gick inte att hämta.** Wix svarar `403` på både
`products/search` och `GET /products/{id}` i skrivande stund (samma 403 som
uppgift #342 noterade som borta sedan runda 95). `c3bda64a`s **vikt och
paketmått är därför `None`** och nämns inte i någon text. Talen fylls i när
API:t svarar igen — de är trevliga att ha, inte nödvändiga.

☠️ **Regeln, generaliserad: en enda läsning av en leverantörsrad är ett
antagande.** Samma familj som husets *"ett svar utan fel är inget kvitto"*,
fast på inläsningssidan i stället för skrivsidan.

-----

# Steg 4 — bilderna

Fyrtio bilder granskade i två pass: en **räknekarta** (alla fem positionerna,
350 px) och ett **hörnsvep** (övre vänstra 45 × 30 % av varje bild), eftersom
de två frågorna är olika. Uppgift #401 ordagrant: en bild som granskas med fel
fråga går fri.

☠️ **Ingen av de fyrtio bär TYSK text.** Familjen är därmed ett undantag från
Aosom-mönstret på 46 % — men undantaget är MÄTT, inte antaget.

## Tre bilder åtgärdas

| bild | fynd | åtgärd |
|---|---|---|
| `441d2209` b4 | **TVÅ bord och TRE pallar** — setet är ett bord och två pallar | **UT ur galleriet** |
| `c3bda64a` b2 | **`HOMCOM`-logotyp inbränd uppe till vänster** | beskuren |
| `c3bda64a` b3 | **`374 lbs (170 kg)` / `308 lbs (140 kg)` — engelska** | badgarna övermålade |

### ☠️ `441d2209` b4 säljer ett set vi inte skickar

Bilden är leverantörens marknadsföring av en STÖRRE uppställning: två bord
ställda i rad och tre pallar. Kunden som köper får **ett** bord och **två**
pallar. Det är inte en smaksak om texten är korrekt — bilden är det första
kunden ser, och den lovar 50 % mer möbel än paketet innehåller.

Räknekartan är den enda grind som fångar det: hörnsvepet hade svarat grönt
(ingen text, ingen logotyp), och en textgrind kan inte se en pall.

### ✅ Logotypen och den engelska texten TVÄTTAS, de kastas inte

Runbooken: *"En engelsk eller tysk infografik kastas inte, den byggs om"* — och
för `c3bda64a` är båda bilderna för värdefulla att slänga. b2 är familjens enda
riktiga miljöbild av just det setet; b3 är måttritningen.

- **b2** beskärs till `(150, 150) – (1000, 1000)`, 850 × 850 kvadratiskt.
  Logotypen ligger inom `x < 150, y < 135`; vänstra pallens ben börjar vid
  `x = 195`, så **ingenting av varan kapas** — regeln *"kapa aldrig bort delar
  av produkten"* är mätt, inte hoppats på.
- **b3**: de två badgarna ligger på PLAN bakgrund, och lådorna är uppmätta till
  **noll mörka pixlar** — alltså inget produktglas, ingen måttlinje.
  ☠️ Bakgrunden är en LODRÄT GRADIENT (203,191,175 upptill → 182,169,153
  nedtill), så en platt rektangel hade lämnat en söm. Varje rad fylls i stället
  med sin egen bakgrundsfärg hämtad ur en ren kolumn på samma höjd.
  **Alla tio måttetiketter överlever** — 95, 33,5, 39,5, 29, 60, 100, 32, 32,
  68 och 14,5 cm.

Trohetsarket (original mot polerad, **samma skala**) lästes före uppladdning,
enligt runbookens obligatoriska grind.

⚠️ **Talen 170 kg och 140 kg finns kvar** — de flyttas från pixlarna till
spec-tabellen, där de går att läsa på svenska. Ritningen motsäger alltså inte
texten; den tiger om lasten.

## Positioner som redan var rena

`441d2209` b3, `51c43e67` b3 och `63a37524` b3 bär lastbadgar med **bara
siffror** (`20 kg`, `50 kg`, `25 kg`, `120 kg`, `130 kg`, `100 kg`) — språk-
neutrala och därmed oproblematiska. Det är skillnaden mot `c3bda64a`s `lbs`.

-----

# Steg 5 — leverantörens motsägelser

1. ☠️ **`3b38e191` säljs som `Geeignet für den Außen- oder Innenbereich`** medan
   materialraden säger **MDF och metall**. MDF sväller av fukt; ett barbord i
   MDF är en inomhusmöbel. Utomhuspåståendet skrivs INTE vidare.
2. ☠️ **Färgsyskonen är inte materialsyskon.** `c88b5bbb` anges som
   **`Spanplatte`** och `63a37524` som **`MDF`**, med i övrigt identiskt
   chassi, identiska mått, identisk vikt och identiskt paketmått. Frestelsen
   att kopiera texten mellan dem är precis vad `matt.kontroll()` regel 4
   omöjliggör: den FÄLLER om de två materialsträngarna blir lika.
3. ⚠️ **`c3bda64a`s viktuppgift** — se Steg 3. Overifierad, utelämnas.

-----

# Steg 6-7 — texterna och textgrinden

Åtta texter, **0 fel**. Grinden har 37 självtestfall och 9 fältfall, alla
utlösta. Fyra fynd på vägen dit, och tre av dem är GRINDFEL, inte textfel.

## ☠️ `runda` är ett vanligt svenskt ADJEKTIV

Jargonggrinden ärvdes som `\brundan?\b` och fällde **två korrekta sidor**:
`394de213` och `f4ed1264` säljer **runda pallar**. Grinden byggdes för att
fånga "den här rundan" — husets interna ord för ett poleringspass, som stod i
publicerad kundtext tre rundor i rad (uppgift #318) — och den fångade i stället
formen på en möbeldel.

Jargongen har exakt två former och båda går att söka precist:

```
(re.compile(r"\brundan\b|\brunda\s+\d+", re.I), "INTERN JARGONG")
```

Samma regel som mot `ing[åa]r` inuti **"kopplingar"** (runda 116): ett
falsklarm som fyrar på korrekt text lär mottagaren att sluta läsa, och då är
även det äkta larmet borta.

## ☠️ Korslänksgrinden var INTE negationsmedveten

Två sidor föll på sina egna korrekta länktexter:

| sida | länktext | grindens dom |
|---|---|---|
| `394de213` | "samma bredd **utan hylla**, i grått" | KORSLÄNK påstår FÖRVARING |
| `3b38e191` | "pallar **utan rygg**" | KORSLÄNK påstår RYGGSTÖD |

Brödtexten har gått genom `loftestraff` sedan runda 117 — den ursäktar en
träff som är negerad i sin egen mening. **Länkmeningarna gick genom en naken
`search`.** Samma familj som runda 114:s falska godkännande, fast åt andra
hållet: där ursäktade en negation ett löfte som borde fällts, här fällde en
negation ett korrekt nekande.

## ☠️ `höj- och sänkbar` kunde aldrig utlösa sin egen grind

Mönstret var `höj\w*\s*(och|-)?\s*sänkbar\w*` — det tillåter bindestreck
ELLER "och", inte båda. Den vanligaste svenska formen bär BÅDA
(`höj- och sänkbara`), så grinden var stum mot precis det den fanns för.
Hittat av självtestet, inte av ögat.

⚠️ Det är runbookens byggartest-lärdom en gång till: **en grind som inte går
att utlösa ser riktig ut i källkoden och tiger för alltid.**

## ⚠️ En PRISJÄMFÖRELSE i en korslänk

`3b38e191`s länk till `441d2209` löd *"samma prisklass med pallar utan rygg"*.
Leonards regel är att poleringen aldrig rör priset — och **en jämförelse ÄR att
röra det**: priserna synkas var sjätte timme, så meningen kan bli osann utan
att någon skriver om sidan. Omskriven till *"barbord med pallar i stället för
stolar"*, som beskriver varan i stället för hyllan den står på.

Ingen grind fångade den. Den hittades av att jag läste länktexterna medan jag
lagade de två negationsfallen ovan.

## Rundans egna grindar

| grind | ägare | varför |
|---|--:|---|
| **UTOMHUSBRUK** | **0 av 8** | ☠️ leverantören säljer `3b38e191` som *"Geeignet für den Außen- oder Innenbereich"* — på en skiva i MDF |
| **HJUL** | **0 av 8** | familjen före den här (runda 117–119) hade hjul på varenda produkt |
| **HÖJDJUSTERING** | **0 av 8** | barstolar är ofta höj- och sänkbara; inget av seten är det |
| **MASSIVT TRÄ** | **0 av 8** | varje materialrad säger `Spanplatte` eller `MDF` — träet är ett TRYCK |
| RYGGSTÖD | 2 av 8 | `3b38e191`, `51c43e67` |
| FÖRVARING | 2 av 8 | `394de213`, `c3bda64a` |
| STOPPAD SITS | 1 av 8 | `51c43e67` |
| MARMOROPTIK | 1 av 8 | `f4ed1264` |
| FOTSTÖD | 1 av 8 | `c3bda64a` |
| SÄKERHETSSIFFRAN | 8 av 8 | fäller om rubriken, bordslasten ELLER sitslasten saknas |

☠️ **Fyra av grindarna har NOLL ägare, och de är skrivna med tom mängd i
stället för att utelämnas.** En grind som finns men aldrig ägs går att läsa i
källkoden; en som saknas är osynlig. `FAR_SAGA_UTOMHUS = set()` är rundans
viktigaste rad — den står emot en text leverantören själv skriver.

## Steg 4:s prisgrind: 8 av 8 `stämmer: true`

Kört via workflowen `polish-mapping.yml` i läget `las`, runs 2400–2407.
Lagersaldon 5 till 197, fraktandel 0,356–0,459 — alla under 0,5, så ingen
behöver skjutas till sist.

☠️ **TRE av åtta bär EXAKT samma rå-SKU**: `FP-bartisch-set-bartisch` på
`441d2209`, `394de213` och `3b38e191`. Det är uppgift #272 mätt en gång till,
med ett större tal: SKU-krocken skapas av IMPORTEN, som bygger strängen ur de
första orden i den tyska titeln. Steg 8 skriver om dem till de polerade
sluggarna och löser krocken på köpet.
