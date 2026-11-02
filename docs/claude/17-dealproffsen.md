## Dealproffsen: vi jämför inte med dem (Leonard 2026-10-21)

Leonard 2026-10-21: *"vi ska inte jämföra med dom"*. Beslutet gäller överallt och ersätter
hans strategi från 2026-09-14 (jämföra alla priser mot dealproffsen.se, ligga 1–2 procent
under dem och göra reklam på det vi var billigast på).

1. **Polering:** kandidater väljs inte efter var vi är billigare än dealproffsen.
   Runbookens §1 har inte längre det kriteriet.
2. **Pris:** kundpriset är husets regel (1,20 × landad kostnad, `charm99`) och inget
   annat. Ingen prisändring motiveras med deras pris, och en prisändring kontrolleras
   inte mot det.
3. **Kör inte** workflowen "Pris — jamfor mot dealproffsen" i läget `jamfor` och inte
   "Pris — konkurrentregeln". Ingen rad får `prisgrupp` (lottningen `lage=lotta` körs
   aldrig). Utan grupp följer varje rad husets regel exakt, så synkens konkurrentregel
   är overksam, och det har den varit sedan den byggdes.
4. **Arkiv:** texterna om jämförelsen (matchningen, vägen in, de sju egenskaperna,
   gap-listan) och om konkurrentregeln är flyttade ordagrant till
   `docs/arkiv/dealproffsen-och-konkurrentregeln.md`. De är historik, inte instruktion.
5. **Koden finns kvar** tills Leonard beslutar om borttagning: `lib/pricing/dealproffsen*.ts`,
   `lib/pricing/konkurrentregel.ts`, `lib/pricing/konkurrentpris-plan.ts`,
   `app/api/admin/dealproffsen`, `app/api/admin/konkurrentpris` och workflowerna
   `dealproffsen.yml` och `konkurrentpris.yml`. Lägena `feed-info`, `ean-jakt` och
   `vara-sidor` i `dealproffsen.yml` är inga prisjämförelser och får användas.
6. **Det som står kvar nedan är inte en jämförelse:** att Aosoms artikelnummer aldrig får
   läcka (dealproffsen publicerar samma sträng som `sku`/`mpn`), att deras EAN inte
   används, white label-beslutet och Google Shopping-attributen.

*Lärdomarna nedan kom ur jämförelsen men gäller även utan den.*

### ☠️ Och den hittade ett tyst tak som redan var passerat (2026-09-14)

`listVisibleV3ProductIds` har ett sidtak. Det låg på **50 sidor = 5 000
produkter** mot en katalog på **~5 500**, alltså redan passerat — och
funktionen svarade med en TYST avkortad mängd. Inget fel, ingen räknare,
ingenting som skiljer "slut på produkter" från "slut på sidor".

☠️ **Riktningen är det som gör felet dyrt.** En produkt som saknas i mängden
behandlas som OSYNLIG, alltså ser en publicerad produkt ut som ett utkast.
Recensionssvepet hoppar då över den, och den arkiverade prisjämförelsen hade lagt den i
listan *"polera dessa först"* — alltså precis fel lista.

Samma klass som `Promise.allSettled` i `media.ts`, som `queryAll`:s eget tak
och som den obegränsade fan-outen: **en konstant som var rätt när den sattes
och blev fel när volymen växte under den.** Det finns ingen commit att skylla
på, och en `git bisect` hade inte hittat något.

Taket är nu 300 sidor och det **FÄLLER i stället för att kapa**, ordagrant som
`queryAll`: *"en avkortad lista är värre än ett fel."* Tre tester, verifierade
genom att återinföra kapningen — två faller, och bara de två.

⚠️ Hittad genom att läsa koden innan den togs i bruk, inte av ett larm. Den
hade inget larm att ge.

### ☠️ Familjer med många publicerade sidor ger krockar (2026-09-15)

Gap-listan rankade opolerade utkast efter kronor och pekade rakt fel första gången den
användes (listan är arkiverad). Det som gäller oberoende av den:

☠️ **Fåtöljfamiljen är MÄTTAD.** Femton fåtöljkandidater ställdes mot de 247 publicerade
sittmöblerna på måtttrippeln: 14 av 15 hade minst en krock (63 krockar totalt) och fyra
hade EXAKT samma mått som en publicerad sida. En av dem (`1bf87dc9`, 79 × 64 × 52)
matchar **fyra** publicerade färgsidor av samma stol. En nionde sida för samma fåtölj är
just den dubblett Google straffar, så familjer väljs efter luckan, inte efter högen.

⚠️ **Trädgård är fel SÄSONG** i mitten av september. En utegrupp som poleras då får sin
första besökare om sju månader.

☠️ **Och måttskärmen har en blind fläck som nästan kostade rundan.** Den
tyska källan skriver totalmåttet med axelbokstaven inne i talet:

```
Gesamtabmessungen: 218B x 79T x 91H cm     <- produktens mått
Paketmått: 92 × 43 × 70 cm                 <- kartongen
```

Ett mönster som kräver `\d+ x \d+ x \d+ cm` hittar bara den ANDRA raden.
Första soffsvepet gav därför "noll krockar" på ett facit som mätte kartongen.
Med produktens mått avlästa för hand föll `c6c880c3` direkt: 213 × 82 × 90 cm
chenille, 360 kg, identiska tal mot publicerade `f7e2b537`.

**Läs produktens mått ur källan, och låt mönstret ta axelbokstaven.**

☠️ **`products/search` avvisar filter + markör ihop** — `400 SE-1141`, samma
form som `inventory-items/query` (2026-09-13). Sida två skickas med BARA
markören. Tredje endpointen i familjen; `orders/search` tar fortfarande emot
båda, så formen är inte gemensam. Mät per endpoint.

#### ☠️ Och `filter` PÅ TOPPNIVÅN ÄR EN NO-OP — svaret är 200 och ofiltrerat (2026-09-16)

Raden ovan gäller när filtret ligger rätt. Ligger det fel finns inget fel att
läsa. `filter` hör **inuti `search`**, exakt som `cursorPaging` (#191); på
kroppens toppnivå kastas det bort tyst.

Uppmätt mot skarpa V3, åt båda hållen — det är det enda som skiljer en levande
grind från en död:

| filtrets plats | synliga | osynliga |
|---|---:|---:|
| kroppens **toppnivå**, `visible: true` | 6 | **94** |
| inuti `search`, `visible: true` | **100** | 0 |
| inuti `search`, `visible: false` | 0 | **100** |
| inuti `search` + markör | **400 SE-1141** | — |

☠️ **Följden är att ett FLERSIDIGT filtrerat svep inte går att göra.** Rätt
plats ger 400 på markören; fel plats ger en markör som fungerar och ett filter
som inte finns. Enda korrekta vägen är att **svepa OFILTRERAT och filtrera i
koden** — samma hållning som husets egen regel om att hämta en avgränsad mängd
och filtrera i kod när ett filter inte stöds.

⚠️ **Och felet är osynligt utom i ETT tal.** Dubblettskärmen i runda N7 läste
**5 748** rader och kallade dem publicerade; katalogen har ~2 800 publicerade
sidor. Ingenting annat i svaret skilde sig från en korrekt filtrerad körning.
Hade katalogen råkat vara dubbelt så stor hade talet sett rimligt ut.

**Regeln, och den är husets vanligaste i ny form: en kontroll som inte KAN
fälla räknas ändå som gjord.** Ett filter som tyst ignoreras är samma klass som
SKU-kollen som itererade en tom lista — skillnaden är att det här svarar 200
med hundra rader i stället för noll, vilket är svårare att misstänka.

##### ☠️ Och `fields` är TVÄRTOM: den MÅSTE skickas om med markören (2026-09-16)

Samma endpoint, samma kroppsform, motsatt regel — och båda felen är tysta åt
var sitt håll. `filter` avvisas med `400 SE-1141` om det skickas om; `fields`
svarar 200 och lämnar fältet FRÅNVARANDE om det INTE skickas om.

Uppmätt på `products/search`, samma markör:

| sida två skickad med | `plainDescription` |
|---|---:|
| bara markören | **0 av 100** |
| markören + `fields` på toppnivån | **100 av 100** |

⚠️ **Följden var ett svep som undermätte med två tiopotenser.** Dubblettskärmen
i runda N9 skickade `fields` bara på första sidan och rapporterade **6 av 2 844
publicerade sidor med måtttrippel**. Med `fields` på varje sida blev talet
**2 221 av 2 844**, 4 135 unika tripplar. Sidräkningen, radantalet och
fördelningen publicerade/utkast var IDENTISKA i båda körningarna — det enda som
skilde var innehållet i ett fält som ingen räknare tittade på.

☠️ **Och det är den farliga formen av tomhet: en dubblettskärm som bara har
sex rader att jämföra hittar noll krockar och ser ut att ha gjort sitt jobb.**
Samma klass som SKU-kollen som itererade en tom lista, men svårare att
misstänka, för svepet levererar rätt antal PRODUKTER — bara inte deras text.

**Regeln: ett svep som bygger ett facit ur ett fält måste räkna hur många rader
som FAKTISKT bar fältet.** `publUtanText` står i svaret sedan dess. Ett nollat
fält är inte samma sak som ett tomt facit, och bara räknaren skiljer dem åt.

### ⚠️ Deras EAN är äkta — men den är INTE vår att publicera (2026-09-14)

Leonards fråga: *"tror du inte dealproffset har hittat på en egen ean då?"*
Rätt fråga att ställa — en falsk GTIN i Google Merchant Center kopplar vår
produkt till fel vara eller får den avvisad, vilket är sämre än ingen GTIN alls.

Mätt på 187 av deras produkter med läsbar kod, fyra oberoende tester:

| test | utfall | varför det avgör något |
|---|---|---|
| Kontrollsiffra | **187 av 187 giltiga** | Slumpade nummer klarar den i ~1 av 10 |
| GS1-landsprefix | **186 av 187 tyska** (425…) | De är ett SVENSKT bolag; svenska koder är 730–739, och ett tyskt prefix går inte att få som svenskt företag |
| Antal företagsprefix | **fyra** (4250871, 4251774, 4255633, 4255826) | Den som hittar på köper ETT prefix; fyra tyska block är vad en tillverkare samlar på sig över år |
| Interna koder (20–29) | **noll** | Det spannet finns just för egna butikskoder — de använder det inte |

☠️ **Det femte testet är det som faktiskt utesluter påhitt.** Genererar man
koder allteftersom man lägger in produkter följer koden ens EGEN
produktnumrering nästan perfekt. Uppmätt rangkorrelation mot deras interna
produkt-id på de tre största blocken: **−0,51 · +0,36 · +0,07** — alltså brus.
De har inte numrerat själva.

⚠️ **Men att koden är ÄKTA är inte samma sak som att den är rätt kopplad, och
inte samma sak som att den är vår att använda.** Verifieringen mot GS1:s egen
databas kom inte i mål: både Google och GEPIR kräver JavaScript, och att rendera
dem hade krävt att proxyns TLS-kontroll stängdes av. Det gjordes INTE.

**Slutsatsen som gäller:** antingen fick de filen av Aosom eller skannade de
kartongen — båda är tillverkarens kod, och det enda felläget som skadar oss
(påhitt) är mätt osannolikt. **Använd dem ändå inte i Merchant Center.** Vi kan
inte stämma av dem mot Aosom, `identifier_exists: no` fungerar, och en GTIN
hämtad från en konkurrents sajt är fel källa för ett fält som ska vara sant.
Frågan till Aosom står kvar som rätt väg — EAN-kolumnen finns i feeden, den är
bara tom.

⚠️ Koden plockas ur deras produktlänk och räknas i `medEan`, men den **används
inte till någonting** — matchningen går på artikelnumret. Den är ett gratis
sidoresultat, inte ett beroende.

### ✅ Aosom svarade: leveransen är WHITE LABEL — vi är varumärkesägaren (2026-09-15)

Henrik Leseberg, ordagrant ur svaret:

> *"As our products are supplied on a white-label basis, we do not provide or
> transfer our own EAN/GTIN codes to customers. Therefore, the EAN column in
> the product feed cannot be populated … The codes printed on some cartons are
> batch-specific logistics barcodes. They may vary between different batches of
> the same SKU and should not be used as product EANs … Most of our white-label
> customers adapt the product descriptions to their own listings and assign
> their own EAN codes. This is also the intended arrangement on our side."*

**Tre saker är därmed avgjorda och behöver inte utredas igen:**

1. ☠️ **EAN-kolumnen kommer ALDRIG att fyllas.** Frågan är ställd och besvarad.
   Sluta mäta feeden efter EAN.
2. ☠️ **Kartongernas streckkoder är LOGISTIKKODER, inte produkt-EAN.** De
   varierar mellan batcher av samma artikel. Att skanna en kartong och lägga
   koden i Merchant Center hade gett en kod som pekar på fel sak — och den
   idén stod som ett öppet uppslag i avsnittet ovan. Den är nu stängd.
3. ✅ **Vi är varumärkesägaren.** Det är precis undantaget i Googles egen text:
   *"Use your store name … if you manufacture the product or if your product is
   a private-label product."*

⚠️ **RÄTTELSE:** en timme före det här svaret stod rådet *"Aldrig
`brand: Fyndplats`"* i den här filen. Det var rätt slutsats av det som då var
mätt — att varorna är HOMCOM/Outsunny — och fel så fort leverantören säger
white label. Rådet gäller inte längre.

**GS1:s regel, hämtad samma dag:** *"The Brand Owner, the organisation that
owns the specifications of the trade item regardless of where and by whom it is
manufactured, is normally responsible for the allocation of the GTIN"*, och för
Own Brand Label: *"Products with an agreement between the Original Manufacturer
and the party identified on the label as the Brand Owner … have the Brand Owner
taking responsibility for GTIN assignment."*

✅ **LEONARD AVGJORDE BÅDA FRÅGORNA 2026-09-15, och de ska inte ställas igen:**

1. **Skriftligt medgivande behövs inte — det står redan i Henriks mejl.** Han
   skriver *"Most of our white-label customers … assign their own EAN codes.
   This is also the intended arrangement on our side"* och ber oss uttryckligen
   bekräfta *"that you will … use your own EAN codes"*. Att fråga om lov en
   gång till hade visat att vi inte läst svaret.
2. **Varorna skickas i ORIGINALFÖRPACKNING, och vårt märke trycks aldrig på
   produkten.** Leonard: *"vårt märke har aldrig varit tryckt på någon
   produkt"*. White label betyder här att vi äger listningen och texten — inte
   att kartongen är omärkt.

⚠️ Punkt #195 (två gamingstolar med VINSETTO tryckt på produkten) står kvar som
en egen observation om de två artiklarna. Den gäller LEVERANTÖRENS märke, inte
vårt, och den ändrar inte upplägget ovan.

☠️ **AVTALET ÄR DET SOM BÄR, inte vår egen tolkning.** Samma GS1-sida säger
också: *"downstream parties, such as distributors, wholesalers, importers and
merchants, should not assign a different GTIN to a trade item that already has
a GTIN, provided that the trade item is not changed."* Vi går alltså in genom
Own-Brand-Label-undantaget, och då måste överenskommelsen finnas i skrift.
**Henriks mejl ÄR den skriften** — spara det.

⚠️ **Och en mätning som talar EMOT att varorna saknar GTIN:** dealproffsen
publicerar en `gtin13` med prefixet 425 för en av artiklarna, och koderna är
mätt äkta (187/187 giltig kontrollsiffra, 186/187 TYSKT GS1-prefix 425x — en
svensk återförsäljare kan inte få ett sådant). Någon tysk part har alltså
registrerat koder för de här artiklarna. Henriks *"we do not provide or
transfer **our own** EAN/GTIN codes"* läser rimligast som "vi har dem men delar
dem inte" — inte som "de finns inte".

☠️ **DÄRFÖR ÄR DEN HÄR FRÅGAN INTE TEKNISK UTAN AVTALSMÄSSIG.** Håller
white-label-upplägget är egna GTIN rätt väg; håller det inte är det en
ommärkning av någon annans vara. Skriftligt besked från Aosom är skillnaden.

✅ **Om det håller löser det HELA sekretessproblemet:** egen GTIN + `brand:
Fyndplats` gör att `mpn` inte längre krävs, och då behöver Aosoms artikelnummer
aldrig lämna `supplierProductId`. Kollisionen i avsnittet nedan upphör.

⚠️ **Kostnaden för GS1-medlemskap är INTE mätt** — deras sida blockerade
hämtningen. Den siffran måste hämtas innan beslutet tas.

### ☠️ Google Shopping: `brand` och `mpn` krockar med två husregler (2026-09-15)

Hämtat ur Googles egen spec samma dag, inte ur minnet. Tre rader avgör:

| attribut | Googles ord |
|---|---|
| `brand` | **Required** "for all new products, except movies, books, and musical recordings" |
| `brand` | *"Only provide a brand if you're sure it's correct. When in doubt don't provide a brand (for example, don't guess or make up a value)."* |
| `brand` | *"Use your store name … if you manufacture the product or if your product is a private-label product."* |
| `mpn` | **"Required for all products without a manufacturer-assigned GTIN"** |
| `mpn` | *"Use the MPN assigned by the manufacturer. Unless you're the manufacturer, don't use a value that you've created."* |
| `identifier_exists` | `no` bara när man är *"certain that your product doesn't have any assigned unique product identifiers"* — annars *"will receive a warning"* |

**Vad vi har, mätt:**

- ☠️ **`brand` finns inte ens som fält i Wix V3 hos oss.** 0 av 100 i sökningen,
  och den fulla GET:en — som mycket riktigt bär `plainDescription` och
  `variantsInfo` — saknar det också. Det är alltså inte en projektionsfälla.
- **GTIN: ingen.** Aosoms kolumn är tom på 6 095 rader, manualerna bar noll.
- **MPN: vi HAR den.** Det är Aosoms artikelnummer på `supplierProductId` —
  exakt den sträng husregeln säger aldrig får nå kund.

☠️ **DÄRFÖR FINNS INGET ALTERNATIV SOM ÄR BÅDE SPEC-ENLIGT OCH HEMLIGT.**
Googles krav på `mpn` när GTIN saknas är precis det fält vi skyddar. Att
utelämna det ger en varning; att fylla i det publicerar numret. Det är ett
affärsbeslut, inte ett tekniskt, och det hör till Leonard.

⚠️ **Och "Fyndplats" som `brand` är INTE utvägen.** Googles formulering
tillåter butiksnamnet bara för egen tillverkning eller eget private label.
Våra varor är HOMCOM/Outsunny/PawHut. Att skriva vårt namn vore att gissa
fram ett värde, vilket samma stycke uttryckligen förbjuder.

#### Vad konkurrenten faktiskt gör — mätt, inte antaget

| | dealproffsen |
|---|---|
| husmärke på produktsidan | **noll träffar** på alla tio märken |
| `manufacturer_name` i deras sök-API | **tomt på 200 av 200** |
| JSON-LD `brand` | **`"Dealproffsen.se"`** — deras eget butiksnamn |
| JSON-LD `mpn` / `sku` | **Aosoms artikelnummer** |
| JSON-LD `gtin13` | **ifylld** |

De gör alltså tre saker: stryker husmärket (som vi), sätter sitt EGET namn
som `brand` (vilket Googles ord inte tillåter för en återförsäljare), och
publicerar artikelnumret och EAN (vilket vi inte gör).

⚠️ **Mätningen gäller deras SAJT, inte deras Merchant Center-feed.** Vi kan
inte se deras feed. Att de gör det i JSON-LD är ett starkt indicium om vad de
skickar till Google, inte ett bevis.

☠️ **Följden för sekretessen:** för varje produkt dealproffsen också säljer är
artikelnumret **redan publikt hos dem**. Vår tystnad skyddar därför inte
numret i sig — den skyddar kopplingen från VÅR sida till numret. Det är en
mindre sak än husregeln antar, och det är värt att veta innan beslutet tas.

### `feed-info`: vad finns EGENTLIGEN i Aosoms feed

Huset har i månader sagt att "feedens EAN-kolumn är tom i 100 % av raderna", på
en mätning från 27 augusti. ☠️ **Men `AosomRow` har inget EAN-fält alls** —
`parseAosomFeed` plockar bara kolumner den känner till vid namn, så även om
Aosom fyllt i kolumnen igår hade vi inte sett det. Vi har aldrig tittat.

`?lage=feed-info` läser rubrikraden och räknar hur full varje kolumn är.
Skillnaden mellan "kolumnen finns men är tom" och "kolumnen finns inte" avgör
vad vi gör härnäst, så de hålls isär.

☠️ **Priskolumnernas VÄRDEN lämnar aldrig servern.** `Wholesale Price` är vårt
inköpspris på 6 057 artiklar och svaret går till en publik logg. Kolumnen
RÄKNAS — vi vill veta att den finns och är ifylld — men aldrig vad som står i
den. Ett test låser det.

☠️ **Och det gällde inte bara priset — jag missade artikelnumret (2026-09-14).**
Första versionen redigerade bara PRIS-kolumner. SKU-kolumnens exempelvärde är
ett Aosom-artikelnummer, och det skrevs därför till en PUBLIK
Actions-summering i den allra första körningen. Numret är exakt den sträng
dealproffsen publicerar som `sku`/`mpn`. Loggarna för den körningen är
raderade, och redigeringen täcker nu identifierarkolumner också.

⚠️ **Ryggtäckningen är på FORMEN, inte bara på namnet.** Döper Aosom om
kolumnen imorgon glider namnlistan, och **en spärr man måste komma ihåg glöms
bort** — samma argument som gjorde `AliExpressProductId` till en typ.
`serUtSomArtikelnummer` fäller på mönstret `DDD-DDDLL` (D = siffra, L = bokstav) oavsett vad kolumnen
heter. Två tester, ett för namnet och ett för formen.

**Utfallet av första körningen:** feeden har **6 085 rader**, EAN-kolumnen
FINNS — och är **ifylld på 0 av dem**. Den gamla anteckningens "tom i 100 %"
stämde alltså, men var fram till nu ett antagande om en kolumn vår parser
aldrig läst. Nu är det mätt, och skillnaden spelar roll: en kolumn som finns
men är tom är ett mejl till Aosom, en kolumn som saknas är en annan källa.

#### ☠️ EAN finns INTE i feeden, och inte i manualerna heller (2026-09-15)

Leonards fråga: *"är du säker på att ean koden är tom i filen vi får och vi inte
får den på något sätt?"* Rätt fråga — svaret vilade på EN loggrad
(`EAN-kolumn: true, ifylld pa 0 av 6095 rader`), och den raden bygger på
`harEanKolumn`, som bara letar efter de namn någon redan tänkt på
(`ean`/`ean13`/`gtin`/`barcode`) och dessutom tar den FÖRSTA träffen
(`findIndex`). Heter kolumnen något annat ser den ingenting.

Hela kolumnlistan fanns i svaret men skrevs bara till `GITHUB_STEP_SUMMARY`,
som inte går att läsa tillbaka programmatiskt. Den går till stdout nu — **namn
och ifyllnadsgrad, aldrig exempelvärdet**, eftersom redigeringen bygger på en
namnlista plus en formkoll och en kolumn som heter något oförutsett (`Net`,
`B2B`) annars hade visat sitt värde.

**Feeden har 71 kolumner och 6 095 rader.** `EAN` ligger som **kolumn TVÅ**,
heter exakt det, och är ifylld på **0**. Det finns ingen `GTIN`, ingen
`Barcode`, ingen `UPC`, ingen `MPN` — koden kan alltså inte gömma sig under ett
annat namn. `Sin` (6 095) och `Psin` (4 521) är Aosoms egna interna nycklar,
inte streckkoder; `Psin` grupperar dessutom *relaterade* varor, se ovan.

⚠️ **Två andra kolumner ingen läst, och de är inte samma sak.**
`Specification` och `Package list` är ifyllda på **18 rader** vardera — det
bekräftar den gamla anteckningens "tomt i 5 550 av 5 566". Men `pdf` är ifylld
på **5 917 (97 %)**, och den är produktmanualen.

##### Manualerna prövades — och bar ingen kod

En manual trycker nästan alltid streckkoden, så det var den enda vägen kvar
utan att fråga Aosom. `?lage=ean-jakt` (`lib/aosom/ean-jakt.ts`,
workflow-läget `ean-jakt`) öppnar manualerna och söker GTIN-13 i texten.
Uppmätt 2026-09-15 på **22 manualer spridda över hela feeden**:

| | |
|---|---:|
| manualer hämtade | 22 |
| för stora för att läsa (>20 MB) | 3 |
| oläsliga | 0 |
| trettonsiffringar hittade | 19 |
| **varav giltig GTIN-13** | **0** |
| **varav tyskt GS1-prefix** | **0** |

☠️ **BRUSSPÄRREN ÄR DET SOM GÖR SVARET LÄSBART.** En slumpmässig
trettonsiffring klarar GS1:s kontrollsiffra i **ett fall av tio**, och en PDF
är full av tal — mått, artikelnummer, datum, koordinater. Det FÖRSTA
stickprovet (9 manualer) gav "2 giltiga", och utan spärren hade den raden
rapporterats som två funna EAN. Den var brus: 2 av 39 är **5 %**, alltså under
slumpen, och noll hade tyskt prefix trots att Aosom är en tysk leverantör vars
koder mätbart ligger på 425x. Tre spärrar krävs och alla tre behövs: talet får
inte sitta i en längre siffersekvens, råtalet rapporteras bredvid så kvoten
avslöjar brus, och prefixet skiljer signal från tillfällighet.

⚠️ **Det som INTE är uteslutet:** en streckkod tryckt som BILD. Svepet läser
text. En EAN-13 ritas normalt med siffrorna under strecken, men i en manual
ligger de ofta i samma bild. Slutsatsen som gäller är alltså *"koden finns inte
som text i manualen"*, inte *"det finns ingen streckkod i manualen"*.

☠️ **Och stickprovet SPRIDS över feeden, inte de första N raderna.** Feeden är
sorterad på artikelnummer, så de första raderna är EN produktfamilj — samma
lärdom som bildmätningen 2026-08-27, som tog "tio ur vardera tredjedel" just
för att kunna säga något om sortimentet. Ett test låser ordningen.

☠️ **Rutten dog först på MINNET, och den döden gick inte via try/catch.**
Första versionen packade upp VARJE ström i PDF:en — inklusive bilderna, som
expanderar tiotals gånger — och samlade alla texter i en array innan den sökte.
Vercel svarade `instance was killed because it ran out of available memory`,
rutten gav 500 utan ett ord om varför, och mitt `catch` såg ingenting. Exakt
samma familj som den obegränsade fan-outen i `runDailySync`. Tre tak:
`MAX_STROM_BYTE` (2 MB komprimerat — det är det som skiljer TEXT från BILD),
`maxOutputLength` (8 MB uppackat, kastar i stället för att svälla) och
`MAX_PDF_BYTE` (20 MB på nedladdningen). Sökningen är dessutom löpande, ingen
text ligger kvar. Hoppade strömmar RÄKNAS (`forStora`) — de tigs inte ihjäl.

**Vägarna till EAN, uttömmande och mätta:**

| väg | utfall |
|---|---|
| Feedens `EAN`-kolumn | **tom**, 0 av 6 095 |
| Någon annan feedkolumn | finns inte — 71 kolumner genomgångna |
| Produktmanualerna (`pdf`) | **0 av 22** bär en kod som text |
| aosom.de konsumentsajt | **403** på allt, även startsidan (Akamai) |
| dealproffsen.se | har koder, mätt äkta — men se avsnittet ovan |
| B2B-portalen inloggad | **oprövad** — bara Leonard kommer in |
| Fråga Aosom | den rena vägen, och nu den enda kvar |

⚠️ Tills dess: **`identifier_exists: no` i Merchant Center.** Det fungerar för
varor utan tillverkarkod, och en GTIN hämtad från en konkurrents sajt är fel
källa för ett fält som ska vara sant.

#### ☠️ Energimärkningen finns inte heller i manualerna (2026-09-30)

Leonards fråga: fyra publicerade torktumlare saknar energimärkning, "kolla
produkt pdf om du kan hitta där". Workflowen **"Aosom — sök energimärkning i
produktmanualer"** (`/api/admin/aosom-manual` → `lib/aosom/manual.ts`) slår upp
sidans manualer i feeden, läser PDF:erna med text, OCR och QR-avläsning, och
slår upp en EPREL-kod i EU:s publika databas.

Uppmätt på alla sidor i fem manualer, som hör till tre av de publicerade
torktumlarna och till de tre utkasten (utkasten delar en manual): **ingen
energietikett, inget produktblad, ingen energiklass och ingen QR-kod alls.** Två av manualerna säger att
ECO-programmet är det energietiketten avser, alltså finns en etikett, men den
står inte i manualen. EPREL:s sökning kräver en API-nyckel (403), så varan går
inte att hitta där på märket. Kvar är att fråga Aosom om EPREL-numren. Den
fjärde publicerade torktumlaren är en AliExpress-sida och har ingen manual i
feeden.

☠️ **Manualens adress bär artikelnumret.** Den maskeras innan något skrivs ut,
varje PDF-rad går genom `redigera`, och manualerna heter A, B, C i loggen, i
stället för en hash eller en storlek i byte som hade gått att matcha mot
Aosoms filer. Inget laddas upp som artefakt.

⚠️ **Och feed-adressen lämnar aldrig servern heller.** Samma nyckel-lösa
upplägg som resten: produktionen har adressen, Actions har `CRON_SECRET`, de
möts i workflowen (**"Pris — jamfor mot dealproffsen"**, där bara lägena `feed-info`, `ean-jakt`
och `vara-sidor` används; `jamfor` körs inte, se *Dealproffsen: vi jämför inte med dem*). Rutten svarar på "vad finns i feeden" utan att någon behöver se
var den ligger.

#### Manualen hämtas krypterad (2026-10-14)

En företagskunds inköpsorder krävde manualer och instruktioner på svenska, och
Aosoms manual finns bara som länk i feeden. Workflowen **"Aosom — hämta
produktmanualen krypterat"** tar en sidas Wix-id och en engångsnyckel
(`kuvert`), slår upp manualerna via `/api/admin/aosom-manual`, laddar ner
PDF:erna och sparar dem som artefakt, krypterade mot nyckeln. Artefakten
raderas efter en dag.

☠️ **Krypteringen är det enda undantaget från "inget laddas upp som
artefakt".** Manualen bär artikelnumret i adressen och ofta på sidorna, och
artefakter på ett publikt repo går att hämta. Adressen maskeras och skrivs
aldrig ut, filerna heter `manual-1.pdf` och så vidare, och faller ett
krypteringssteg sparas ingenting.
