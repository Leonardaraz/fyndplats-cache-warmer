# Runda 107 — tvåplansstall med löpgård

Sju utkast ur samma familj som runda 106, valda för att de är den undergrupp
där golvytan räcker till en marsvinsGRUPP. Marsvin får inte hållas ensamma, så
en bur som rymmer exakt ett djur är ingen marsvinsbostad — det tar bort de
mindre stallen ur urvalet.

## Steg 1 — svepet

| | |
|---|---:|
| Produkter lästa | 5 580 |
| Sidor | 56 |
| `avhuggen` | `false` |
| Publicerade | 2 410 |
| Unika publicerade | 2 410 |
| …med läsbar måtttrippel | **1 902** |
| **Måttkrockar mot rundans sju** | **0** |

Kontrollmätningen är det som gör nollan värd något: två sidor som med säkerhet
är publicerade och bär sina mått — `27dc50ae` (110 × 50 × 86) och `f3fdcd4a`
(90 × 53 × 59) — hittas båda av svepet. Runda 106 lärde varför det steget
behövs: en trasig svepversion hittade 285 av 2 404 sidor och rapporterade
"noll krockar" med gott samvete.

Alla sju stod `visible:false`, `revision:1` — orörda av den andra sessionen.

## ☠️ Steg 2/5 — leverantören blandar INNER- och YTTERMÅTT mellan syskonsidor

`a75fcfde` och `c0770388` har exakt samma yttermått, 230 × 53 × 93,5. Första
läsningen gav dem olika golvyta (0,99 mot 0,86 m²) och därmed olika antal djur
(fem mot fyra marsvin) — **två svar på samma bur.**

Beviset att det ÄR samma bur står i deras egna spec-block:

| | `a75fcfde` | `c0770388` |
|---|---|---|
| Dörrar | 30 × 26 · 30 × 25 · 29 × 47,5 | **identiska** |
| Ramp | 61 × 14,8 | **identisk** |
| Huset | 74 × 45,5 × 50 | 74 × 45 × 49 **+ innermått 70 × 41 × 48** |
| Löpbox under huset | 74 × 45,5 × 35 | 70 × 41 × 32 |

`c0770388` anger huset BÅDE utvändigt och invändigt. Skillnaden mellan
syskonen är alltså inte konstruktionen utan vad som mäts. Grinden räknar på
**innermåttet** — det är den yta djuret faktiskt har — och då ger båda 0,86 m²
och fyra marsvin. Samma klass av fel som runda 106:s ytterhöjd: ett för
generöst mått släpper igenom en bur som inte klarar kravet.

### Verdikt: noll av sju räcker till någon kanin — inte ens en dvärgkanin

| id | pris | yttermått | golv | dvärgkanin | marsvin | degu |
|---|---:|---|---:|---|---:|---:|
| `a75fcfde` | 3 179 | 230 × 53 × 93,5 | 0,86 m² | **NEJ** | 4 | 2 |
| `c0770388` | 3 119 | 230 × 53 × 93,5 | 0,86 m² | **NEJ** | 4 | 2 |
| `2253c509` | 1 949 | 141 × 60 × 86 | 0,75 m² | **NEJ** | 4 | 4 |
| `2435c4d1` | 1 649 | 156 × 58 × 68 | 0,76 m² | **NEJ** | 4 | 1 |
| `dcdf889d` | 1 519 | 156 × 58 × 68 | 0,76 m² | **NEJ** | 4 | 1 |
| `525e6acf` | 1 669 | 123,5 × 62,6 × 92,5 | 0,61 m² | **NEJ** | 3 | 1 |
| `079f2901` | 1 649 | 123,5 × 62,6 × 92,5 | 0,61 m² | **NEJ** | 3 | 1 |

Det som fäller dem är inte ytan utan **kortaste sidan**. Dvärgkaninen kräver
50 cm; modell P:s boxar är 41 cm breda. Ytan räcker gott på fem av de sju.

Fem av sju heter ändå *Hasenstall*, *Kaninchenstall* eller
*Zwergkaninchenstall*, och `c0770388` skriver ut det:

> "Die großzügige Fläche von 1,2 m² bietet 2–4 kleinen Kaninchen bequem Platz"

Talet 1,2 m² är dessutom inte bottenytan — det är summan inklusive huset ovanpå.

## ✅ Steg 4 — bottenfrågan var ingen motsägelse

Syskonen i modell S sa emot varandra i texten: `525e6acf` skriver *"Grasiger
Boden mit bodenlosem Design"*, `079f2901` skriver *"Herausnehmbare Bodenwanne"*
med måttet 54 × 18,5. Samma mått i övrigt, så en av dem såg ut att ljuga.

Bilderna visar att **båda har rätt om var sin halva**: löpgården är bottenlös
och står på gräset, huset har en utdragbar bottenbricka. Att bara skriva det
ena hade blivit fel om den andra halvan — och texten hade sett verifierad ut,
eftersom den citerade leverantören ordagrant.

⚠️ **`079f2901`:s måttritning säger emot sin egen spec-text** (122 × 53 × 92 och
48,5 cm mot textens 123,5 × 62,6 × 92,5 och 54 cm). Syskonets ritning stämmer
mot spec-texten på varje tal, så det är ritningen som är fel. Texten gäller;
ritningens tal skrivs inte ut.

## ☠️ Steg 4 — tre bilder ska inte till kunden

| id | bild | varför |
|---|---:|---|
| `2253c509` | 4 | Fristående gånghage med bågtak som **inte ingår** |
| `dcdf889d` | 4 | **Samma foto**, samma problem |
| `525e6acf` | 4 | Tysk text i pixlarna + löfte om kanin, höns och anka |

De två första är samma bild på två olika produkter — och hagen i bilden är den
ORANGEA modellen, så den kan på sin höjd visa en av dem. Den tredje bär
*"GEEIGNET FÜR VERSCHIEDENE KLEINTIERE"* med ikonerna Kaninchen / Hühner /
Enten inbränt i pixlarna. Språket går inte att polera bort, och löftet är
dessutom fel: L80-grinden ger noll kaniner, och höns och ankor är en annan
storleksklass.

De tre produkterna får sitt eget Fyndplats-kort på platsen i stället.

## ☠️ Steg 7 — verdikten räknades, motiveringen skrevs för hand, och tre av fyra fick fel skäl

Texterna passerade grinden. Läsningen av dem gjorde det inte.

L80-grinden avgör OM en modell duger för en dvärgkanin. Motiveringen i
kundtexten skrev jag för hand — och tre av fyra modeller fick ett skäl som
motsäger sig själv i samma mening:

| modell | vad texten sa | vad som är sant |
|---|---|---|
| P `41 cm` | "måttet nås inte" | ✅ rätt — 41 < 50 |
| Q `54,5 cm` | "måttet nås inte" | ❌ 54,5 **är** över 50 |
| R `50 cm` | "måttet nås inte" | ❌ 50 **är** precis kravet |
| S `53 cm` | "måttet nås inte" | ❌ 53 **är** över 50 |

Slutsatsen var rätt i alla fyra fallen; det verkliga skälet för Q, R och S är
ett annat. Bara löpgården **på sidan** är hög nog för en kanin — den under
huset är 26,5 till 40 cm — och den ensam ger 0,32 till 0,40 m² mot kravets
0,5 m². Det är YTAN som fäller dem, inte bredden.

En kund som mäter efter hade läst "54,5 cm, alltså för smalt mot 50 cm" och
dragit slutsatsen att vi räknar fel.

**Både upplysningen och FAQ-svaret räknas nu ur samma funktion som domen**
(`kaninraden` och `kaninfaq` anropar `l80-grind.py`), med två grenar: klarar
ingen delyta bredd- och höjdkravet är det BREDDEN som fäller, klarar någon det
men ytan är för liten är det YTAN. Samma princip som prisgrinden i Steg 4 —
den som räknar domen ska räkna skälet.

☠️ **Talgrinden kunde inte se felet, och det är inte dess fel.** Den frågar
var ett tal KOMMER IFRÅN, inte om påståendet om talet är sant. "54,5" var
härlett ur spec-blocket och passerade — i en mening som sa motsatsen om det.
Det som fångade det var att läsa texten.

Samma läsning fångade två fel till, båda i den räknade versionen:

- `yta()` returnerar redan m². Ett `* 100` gav *"Kvar blir 37,6 m²"* — fysiskt
  orimligt, och ändå grönt i talgrinden, eftersom talet var korrekt HÄRLETT.
- `f"…för en kanin. Kvar blir {y:.2f}".replace(".", ",")` bytte också punkten
  som avslutade föregående mening: *"…för en kanin, Kvar blir 0,38"*.

Grinden fäller nu 14 mutationer, och alla sju texterna är gröna.

## Steg 7 skrivet — sju texter, sju kvitton

Fyra `ExecuteWixAPI`-anrop, vart och ett GET → PATCH → GET med längd- OCH
hash-jämförelse mot `facit.json`:

```
a75fcfde | LEN ok | HASH ok | namn ok | slug ok | titel ok | meta ok | utkast ok
c0770388 | LEN ok | HASH ok | namn ok | slug ok | titel ok | meta ok | utkast ok
2253c509 | LEN ok | HASH ok | namn ok | slug ok | titel ok | meta ok | utkast ok
2435c4d1 | LEN ok | HASH ok | namn ok | slug ok | titel ok | meta ok | utkast ok
dcdf889d | LEN ok | HASH ok | namn ok | slug ok | titel ok | meta ok | utkast ok
525e6acf | LEN ok | HASH ok | namn ok | slug ok | titel ok | meta ok | utkast ok
079f2901 | LEN ok | HASH ok | namn ok | slug ok | titel ok | meta ok | utkast ok
```

`utkast ok` är kolumnen som betyder något här: alla sju står kvar på
`visible: false` efter skrivningen. En `variantsInfo`-PATCH publicerar ett
utkast, och Steg 8 är just en sådan — därför läses fältet både före och efter.

Slugar: `smadjursstall-230-natur`, `-230-gra`, `-141-natur`, `-156-gra`,
`-156-natur`, `-123-natur`, `-123-gra`.

## Steg 8 — SKU:erna var TYSKA, och tre av dem dubbletter

Sju sidor, sju gamla SKU:er — men bara **fyra unika strängar**:

| gammal SKU | satt på |
|---|---|
| `FP-kleintierstall-mit` | `a75fcfde`, `2253c509` |
| `FP-hasenstall-2-etagen` | `c0770388`, `525e6acf`, `079f2901` |
| `FP-kaninchenstall-aus` | `2435c4d1` |
| `FP-kleintierstall` | `dcdf889d` |

Det är exakt defekten runbookens Steg 8 beskriver: syskon vars RÅA slugg börjar
likadant kapas till samma 24 tecken, och dedup-suffixet räknas bara inom EN
produkt. Två av strängarna satt alltså på flera produkter samtidigt.

De nya räknades ur husregeln — inte ur minnet — och sluggen bär redan det som
skiljer, så den mekaniska kapningen ger sju distinkta utan handpåläggning:

```
smadjursstall-230-natur (23)  ->  FP-smadjursstall-230-natur (26)
smadjursstall-230-gra   (21)  ->  FP-smadjursstall-230-gra   (24)
… sju av sju, alla ≤ 24 respektive ≤ 40 tecken
```

Kontrollerat mot HELA katalogen, inte bara batchen: 5 580 produkter lästa,
`avhuggen: false`, fjorton sluggar börjar på `smadjur` och sju av dem är
rundans egna. Ingen publicerad sida börjar på `smadjursstall-`.

Alla sju står kvar som `visible: false` efter PATCH:en, och varianten fick
`visible: true` explicit — produktens `false` speglas annars ned och varan går
inte att lägga i varukorgen.

## Steg 9 — galleriet: fyra bilder bort, sju egna kort in

Ordningen är runbookens: 1 hjälte, 2 verklighet, 3 vårt kort, sedan detaljer,
**måttritningen sist**. Den låg på plats 3 på alla sju.

☠️ **En fjärde bild togs bort, och den var inte planerad.** `079f2901`:s
måttritning säger emot sin egen produkt:

| | ritningen på `079f2901` | ritningen på syskonet `525e6acf` | spec-texten |
|---|---|---|---|
| bredd | **122 cm** | 123,5 cm | 123,5 cm |
| djup | **53 cm** | 61 cm kropp / 62,6 vid taket | 62,6 cm |
| höjd | **92 cm** | 92,5 cm | 92,5 cm |
| under huset | **48,5 cm** | 54,5 cm | 54,5 cm |

Djupet och löpgårdens bredd är dessutom OMKASTADE mellan de två ritningarna —
53 och 61 byter plats. Avgörandet står i leverantörens EGEN tyska titel för
just den artikeln: *"Hasenstall 2 Etagen Kaninchenstall aus Holz
**123,5x62,6x92,5 cm**"*. Texten gäller, ritningen är fel, och en kund som
mäter sin balkong mot 53 cm får en vara som är 62,6. Kortet bär måtten i
stället — sidan är den enda i rundan utan måttritning, med flit.

De tre andra borttagningarna står i Steg 4-avsnittet ovan och gjordes som
planerat.

### Korten

Rubriken per modell valdes mot hjältebilden i ett kontaktark, och **två fick
bytas efter granskningen** — se `kort.py`. Kort sagt: R:s ramp finns men syns
edge-on som en tunn stång, och S:s bottenlöshet är en FRÅNVARO, det svåraste
ett foto kan bevisa. Båda modellerna fick i stället en kortrad som bär sitt
eget löfte.

Fyllnaden är mätt, inte vald. Vid husets normala 0,90 sprängde **alla sju**
215 kB-taket:

| kort | vid 0,90 | över taket | landade på |
|---|---:|---:|---:|
| `dcdf889d` | 328 485 | +113 485 | 0,50 |
| `525e6acf` | 294 419 | +79 419 | 0,50 |
| `2253c509` | 291 743 | +76 743 | 0,50 |
| `2435c4d1` | 262 470 | +47 470 | 0,60 |
| `c0770388` | 249 311 | +34 311 | 0,70 |
| `a75fcfde` | 233 552 | +18 552 | 0,70 |
| `079f2901` | 224 475 | +9 475 | 0,70 |

Galvat nät i studioljus komprimeras inte, precis som runda 106 mätte.

⚠️ **`525e6acf` och `079f2901` gav IDENTISK filstorlek vid 0,90 och 0,80.**
Modell S är högre än panelen, så `bygg-panelfoton` går in i höjd-grenen och
fyllnaden biter först under 0,80. Ett sökspann som stannat vid 0,80 hade
rapporterat "fyllnaden hjälper inte".

### Alt-texterna fick sin första grind

`alt.py` kör rundans EGNA listor — samma `grindar`-listor som `grind.py`, inte
omskrivna. Den hittade två saker i sitt eget självtest:

1. ☠️ **`auslauf` saknades i den tyska listan.** `auslaufbox` fanns, och
   matchningen går på PREFIX — så det längre ordet fångar aldrig det kortare.
   Familjens vanligaste tyska ord. Nu i `TYSKA_HAR`, alltså i BÅDA grindarna.
2. **Sju närbilder saknade sökordet.** Texterna skrevs om ("Närbild på stallets
   takkant…"), regeln mjukades inte upp.

Kvittot är en EGEN GET per produkt — PATCH-svaret bär inte `media.itemsInfo`
— och den jämför antal, FILORDNING och varje alt-text:

```
a75fcfde | 6 bilder ok | ordning ok | alt ok | utkast ok
c0770388 | 6 bilder ok | ordning ok | alt ok | utkast ok
2253c509 | 5 bilder ok | ordning ok | alt ok | utkast ok
2435c4d1 | 6 bilder ok | ordning ok | alt ok | utkast ok
dcdf889d | 5 bilder ok | ordning ok | alt ok | utkast ok
525e6acf | 5 bilder ok | ordning ok | alt ok | utkast ok
079f2901 | 5 bilder ok | ordning ok | alt ok | utkast ok
```

☠️ **Omflyttningen uttrycks i ORIGINALPOSITIONER, så den kontrollerar sin egen
premiss.** Skriptet skickar med de fem filnamn Steg 4 hämtade och avbryter
produkten om Wix galleri ser annorlunda ut. Utan den kontrollen hade en
ändring gjord av den andra sessionen tyst satt fel alt-text på fel bild.

Korten är dessutom md5-jämförda mot sina egna filer efter uppladdningen — sju
av sju identiska — så attributionen vilar inte på ordningen i
`UploadImageToWixSite`-svaret.

⚠️ **Leverantörens miljöbild visar kaniner på fem av de sju sidorna**, som i
runda 106. Bilderna ligger kvar och alt-texterna nämner dem inte; frågan om de
ska bort är Leonards och ligger i uppgift #382 för hela familjen, inte bara
runda 106. Sekvenseringen är hans: polera färdigt först.

## Steg 10 + 13 — kategori, prisgrind, stämpel, publicering

Kategori: **Husdjur → Burar, Kläder & Tillbehör**, förälder + löv, `lyckade 2 / 2`
på alla sju. Alla sju låg innan bara i den appstyrda `All Products`.

Prisgrinden (`las`) — sju av sju `stammer true`, priserna exakt rundans tabell:

| id | landedCostSek | förväntat | faktiskt | fraktandel |
|---|---:|---:|---:|---:|
| `a75fcfde` | 2 641,49 | 3 179 | 3 179 | 0,303 |
| `c0770388` | 2 593,29 | 3 119 | 3 119 | 0,309 |
| `2253c509` | 1 617,84 | 1 949 | 1 949 | 0,268 |
| `2435c4d1` | 1 367,42 | 1 649 | 1 649 | 0,317 |
| `dcdf889d` | 1 265,77 | 1 519 | 1 519 | 0,343 |
| `525e6acf` | 1 382,64 | 1 669 | 1 669 | 0,314 |
| `079f2901` | 1 372,35 | 1 649 | 1 649 | 0,316 |

Ingen ligger över 0,5 i fraktandel, så ingen behövde skjutas till sist.

☠️ **Mappningens SKU bar samma tyska sträng som Wix.** Läsningen visade
`"sku": "FP-kleintierstall-mit"` på `a75fcfde` — Steg 8 hoppas alltså över på
BÅDA sidorna samtidigt, precis som runbooken varnar. Stämplingen skrev därför
`variantSkus` tillsammans med flaggorna: `needsAiPolish, draftStatus,
variantSkus` på alla sju.

Publiceringen, med en EGEN GET som kvitto:

```
a75fcfde | LIVE | variant synlig | sku ok | 6 bilder | alla har url | alla har alt | sökord svenska
c0770388 | LIVE | variant synlig | sku ok | 6 bilder | alla har url | alla har alt | sökord svenska
2253c509 | LIVE | variant synlig | sku ok | 5 bilder | alla har url | alla har alt | sökord svenska
2435c4d1 | LIVE | variant synlig | sku ok | 6 bilder | alla har url | alla har alt | sökord svenska
dcdf889d | LIVE | variant synlig | sku ok | 5 bilder | alla har url | alla har alt | sökord svenska
525e6acf | LIVE | variant synlig | sku ok | 5 bilder | alla har url | alla har alt | sökord svenska
079f2901 | LIVE | variant synlig | sku ok | 5 bilder | alla har url | alla har alt | sökord svenska
```

## Steg 14 — live-grinden, och tre lärdomar om grindar

**7 av 7 sidor gröna.** Men den behövde tre omgångar, och alla tre är värda att
skriva ned — ingen av dem var ett fel på sidorna.

### 1. ☠️ Det "tomma FAQ-svaret" var grindens eget artefakt

Första körningen rapporterade

```
KANINLÖFTE: …"name":"Går det att hålla kanin i stallet?","acceptedAnswer":{"@type":"Answer","text":""}…
```

och det såg ut som ett verkligt fynd: ett FAQPage-JSON-LD där frågan står men
svaret är tomt, på just den fråga sidan finns för att besvara. **Det var fel.**
Grinden hade själv strukit svarstexten ur sin arbetskopia innan den skrev ut
sammanhanget — `"text":""` är vad som blev kvar EFTER strykningen. Kontrollmätt
mot skarpa sidan: alla sju svaren är ifyllda, ordagrant.

**Läs meddelandet, och kontrollera påståendet innan du bokför ett fynd.** Det
här hade blivit en uppgift om en bugg i butiksrepot som inte finns.

### 2. FAQ-frågans rubrik måste också vara sanktionerad, inte bara svaret

`grind.py` stryker hela nej-svarsparet; live-grinden ströks bara svaret. En
fråga som nämner kanin är ingen utfästelse — svaret är "Nej." Frågan HÄRLEDS nu
ur texten (den `<strong>…?</strong>` som står närmast före svaret) i stället för
att skrivas om i grinden.

### 3. ☠️ Butikens "liknande produkter"-rad finns i TVÅ serialiseringar

Efter fix 2 föll de två 230-sidorna fortfarande, på butikens egen
rekommendationsrad — den länkar till `kaninhus-utomhus-122-cm-rastgard` och
`kaninbur-inomhus-…`, alltså riktiga kaninbostäder. Det är inget påstående om
DEN HÄR varan, och rekommendationen är dessutom rimlig.

Första strykningen tog `<a class="prod">…</a>` och **såg ut att bita**. Den
gjorde det inte: raden ligger också i Next.js **Flight-nyttolast**
(`["$","$L40","kaninhus-…",{"className":"prod",…`), som inte är HTML alls.

Grinden stryker därför andra produkters **identiteter** — sluggen och namnet —
som är samma literal i båda formerna.

☠️ **Och den fick en kontrollmätning på strykningen själv:** sidans EGNA
alt-texter måste finnas kvar efteråt. Hela poängen med grinden är att den läser
dem (runda 106:s lärdom), och en strykning som råkat svälja galleriet hade gjort
"noll fel" lika meningslöst som en tom hämtning.

⚠️ **En observation, inte ett fel:** rekommendationsraden på de två 230-sidorna
leder till två publicerade kaninbostäder. Om de i sin tur klarar L80 är uppgift
#379:s fråga, inte den här rundans.
