# Runda 97 — Steg 1 och 2

## Familjevalet är MÄTT, inte gissat

Hela katalogen svept i två etapper (`avhuggen: false` på båda halvorna):
**5 527 produkter — 3 299 utkast, 2 228 publicerade.**

| familj | utkast | publicerade | krockrisk |
|---|--:|--:|---|
| växthus | 103 | 27 | hög |
| sittbänk | 68 | 100 | **högst** |
| badrumsskåp | 68 | 51 | hög (annan sessions område) |
| soptunna | 46 | 26 | medel |
| hundvagn | 42 | 16 | medel (#329, #314) |
| **foderstation** | **26** | **0** | **ingen** |

Foderstationerna är den enda familjen med **noll publicerade sidor**. Det gör
Steg 1:s sökordskrock trivial och — viktigare efter runda 96 — omöjliggör att
ett redan publicerat färgsyskon räknas fel, eftersom det inte finns något.

⚠️ Badrumsskåpen valdes BORT trots 68 utkast: 51 publicerade badrumssidor är
katalogens tätaste kategori, och mönstret (`badrumsspegel-led-*` × 9,
`spegelskap-*` × 7) ser ut som en annan sessions pågående arbete. #302 kostade
en halv runda när den andra sessionen publicerade sex sidor mitt i.

## ☠️ Steg 1-fynd: tretton av 26 utkast är MÄTTVILLINGAR

⚠️ **FÖRSTA MÄTNINGEN VAR FEL, OCH FELET STOD REDAN I RUNBOOKEN.** Regexen
plockade det första `NN × NN × NN cm` i texten — och det är **Paketmått**,
inte `Gesamtabmessungen`, eftersom produktmåttet skrivs med bokstäver emellan
(`60L x 30B x 35,5H cm`) och inte matchade. Exakt #266 från runda 59: *vikt
och paketmått BEVISAR inte två produkter*. Lärdomen fanns; jag gick i fällan
ändå.

☠️ **Och paketmåttet fel åt BÅDA hållen.** Det grupperade ihop produkter som
råkar dela kartong — och det MISSADE en tvilling som packats annorlunda:

| id | produktmått | paketmått |
|---|---|---|
| `79ccfef4` | **60 × 30 × 35,5** | 70 × 36 × 17 |
| `9cfc2f50` | **60 × 30 × 35,5** | 70,5 × 38 × 15,5 |

`79ccfef4` låg i rundans första sexa just för att paketet skilde. Ett paketmått
är alltså varken tillräckligt eller nödvändigt — det är fel storhet.

Om på produktmåtten (`Gesamtabmessungen`):

| mått | utkast |
|---|---|
| 60 × 30 × 36 cm | `8c1d08c5` `3710a0c3` `5eb270ed` `31d6a3df` |
| 60 × 30 × 35,5 cm | `9cfc2f50` `18b9ec99` `f8594223` `79ccfef4` |
| 60 × 30 × 41 cm | `a8e376e7` `5d7aab1b` `edd89684` |
| 35 × 18,5 × 30,5 cm | `ec859f4e` `c164e459` |

⚠️ **Fotavtrycket 60 × 30 delas av fjorton av 26 utkast.** Det som skiljer
modellerna är HÖJDEN (34 · 35,5 · 36 · 41 · 42 · 46 cm), skåpsvolymen och
skålarna — inte planmåttet. En måttjämförelse i den här familjen måste därför
läsa alla tre talen; två räcker inte.

☠️ **Om de är färgsyskon eller äkta dubbletter går INTE att avgöra härifrån.**
Det avgörs på artikelnumrets bas (runda 61:s regel), och numret bor i
mappningsraden — som sedan Postgres-flytten bara går att läsa via workflowen
`polish-mapping.yml` i läge `las`. Filnamnen dög inte: de bär den tyska
sluggen, inte artikelnumret (#340 gäller alltså inte den här familjen).

**Rundan tar därför bara utkast som INTE ligger i något kluster.** Klustren är
ett eget jobb med tolv `las`-körningar, inte en gissning mitt i en runda.

## De sex

| id8 | produktmått (cm) | skålhöjd | skål | förvaring | vikt |
|---|---|---|--:|---|--:|
| `e8102582` | 40,5 × 22 × 39 | 11–33 steglöst | 900 ml | — | 1,8 kg |
| `1fc55b3d` | 48 × 26 × 36,5 | 13 / 19,5 / 25,5 / 31,5 | 1,2 L | — | 2,8 kg |
| `2e2b2366` | 54 × 31,5 × 47 | 16,9 / 29,7 / 42,5 | 2 L | skåp | 7 kg |
| `868cc038` | 60 × 30 × 34 | fast | 2 L | 55 × 25,5 × 21 cm | 9,8 kg |
| `7628983b` | 60 × 30 × 42 | fast | 2 L | 30 L | 14,5 kg |
| `75556831` | 61 × 35,5 × 82 | låg låda | 1,5 L | 50 L skåp + öppet fack | 22,1 kg |

Ingen av de sex delar produktmått med någon annan i familjen. `79ccfef4` och
`143bef7b` ströks ur urvalet efter omräkningen: den första är tvilling till ett
kluster på tre, den andra sparas till nästa runda.

## ☠️ Steg 2-grinden: hälsopåståendet om upphöjda skålar är FEL ÅT ANDRA HÅLLET

Kategorins standardmarknadsföring är att en upphöjd skål är nyttigare — bättre
matsmältning, skonar nacke och leder, minskar risken för magomvridning. Det
sista är inte bara ogrundat, det är **motsagt av den största studien som
finns**.

Glickman m.fl. (JAVMA 2000, Purdue) följde drygt 1 600 stora och jättestora
hundar: att äta ur en **upphöjd** skål var förknippat med **förhöjd** risk för
magomvridning (GDV). Ungefär **20 % av fallen hos stora raser och 52 % hos
jätteraser** tillskrevs den upphöjda skålen. En senare studie (Pipan m.fl.
2012) fann ingen signifikant effekt — alltså är läget i bästa fall
**motstridigt**, aldrig ett säljargument.

**Regeln för rundan, utan undantag:**

- ❌ Inget om magomvridning, uppblåsthet, matsmältning, nacke, leder, artros,
  höftled eller "veterinärrekommenderad".
- ❌ Inget "bättre för hunden", "hälsosammare hållning", "avlastar".
- ✅ Praktiska skäl går bra och är sanna: skålarna står stadigt, maten hamnar
  inte på golvet, rostfria skålar går i diskmaskin, förvaringen tar ingen
  extra golvyta, höjden gör det bekvämare att ställa fram och plocka undan.

⚠️ Det gäller även indirekt formulering. "Många väljer en upphöjd skål för att
den är skonsammare" är samma påstående med en tvättsvamp framför.

Lintregeln blir en ordlista, inte en bedömning — se `lint.py`.


## Steg 5 — fem fynd i underlaget, alla mätta

### ☠️ 1. Hälsopåståendet står i FEM av sex, ordagrant

| id | tysk formulering |
|---|---|
| `e8102582` | *"schont Nacken und Rücken"* |
| `1fc55b3d` | *"unterstützt eine natürliche Körperhaltung"*, *"verringert die Belastung des Nackens"*, *"für eine bessere Verdauung"* |
| `2e2b2366` | *"verringert die Belastung für Nacken, Rücken und Gelenke"* |
| `868cc038` | *"reduziert die Belastung von Nacken, Rücken und Gelenken"* |
| `7628983b` | *"um ihren Nacken und Rücken zu schützen"* |
| `75556831` | — (möbeln säljs på ordning, inte på hälsa) |

Ingen av dem får följa med över. Se Steg 2-grinden ovan.

### ☠️ 2. Spec-radens MATERIAL är fel på fyra av sex

Importens strukturerade `Material:`-kolumn säger ett material; brödtexten
säger konstruktionen. De går isär:

| id | brödtexten | spec-raden | vad kunden skulle läsa |
|---|---|---|---|
| `1fc55b3d` | Stahl, Edelstahl, Mehrschichtenplatte | **Edelstahl** | helt i rostfritt |
| `2e2b2366` | MDF, Edelstahl | **Edelstahl** | helt i rostfritt |
| `868cc038` | Edelstahl, MDF | **Edelstahl** | helt i rostfritt |
| `7628983b` | Stahl, MDF | **Legierter Stahl** | helt i stål |

☠️ Ett MDF-skåp sålt som "rostfritt stål" är ett materialpåstående som är
FALSKT, inte bara slarvigt — samma klass som #259 (*MDF är inte massivt trä*).
Den svenska spec-tabellen ska ange **båda**: stomme och skålar var för sig.

### ☠️ 3. `2e2b2366` säljs i tre färger samtidigt

`Farbe: Kaffee` i tekniska data, `Färg: Grön, Braun, Beige` i spec-raden. En
enproduktssida med EN variant kan inte vara tre färger. Avgörs på bilden i
Steg 4 — och tills dess skrivs ingen färg.

### ⚠️ 4. `1fc55b3d` har två färgangivelser

`Farbe: Schwarz+Braun` mot `Färg: Braun`. Sannolikt brun skiva på svart
stativ; bekräftas mot bilden.

### ☠️ 5. `75556831` är INTE en upphöjd matstation

Namnet och kategorin lockar till "upphöjd", men texten säger
*"Eine untere Schublade mit zwei Futterschüsseln"* — skålarna sitter i en
**låda nedtill**, och de 82 cm är skåpets höjd, inte skålens. Att sälja den
som upphöjd vore fel produkt i rubriken. Den är ett **förvaringsskåp för
husdjurstillbehör med matplats**, och ska heta det.
