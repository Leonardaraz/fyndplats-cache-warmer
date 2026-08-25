# Fyndplats cache-warmer — projektanvisningar

## Import-arbetsflöde & AI-kostnad (`AI_ENRICHMENT_ENABLED`)

Import-pipelinen (`lib/import/pipeline.ts → importProduct`) kan köras i två lägen.
Master-switchen är env-variabeln **`AI_ENRICHMENT_ENABLED`** (default `true`).

### Default-läge: RÅ import → polera via chatten (GRATIS)

Sätt `AI_ENRICHMENT_ENABLED=false` i Vercel (production). Då:

- Importen gör **inga dyra Claude-anrop** (ingen SEO-text, FAQ/flik-generering,
  kategorisering eller Sonnet-bildanalys). Undantag: **variantöversättningen** har
  en egen, billig AI-fallback — se nästa avsnitt (kan stängas av för hård $0).
- Produkten skapas ändå komplett i Wix från rå AliExpress-data: **rå titel/
  beskrivning**, svensk **variant-översättning** (statisk tabell + ev. cachad
  Haiku-fallback, via `variant-translations.ts` / `variant-ai-translate.ts`),
  **prissättning** + **lager** (deterministiskt), bilder, EU-lager-ribbon,
  spec-fliken från råa specs.
- Produkten blir **draft** (`visible:false`) och hamnar i **`/admin/queue`** med
  badgen **"✨ Behöver AI-polering"** (filter-chip finns).
- I kön finns knappen **"✨ Be Claude i chatten att polera"** → kopierar
  produkt-info + Wix-ID till urklipp. Klistra in i Cowork-chatten och säg
  *"polera denna"* så skriver Claude SEO/beskrivning/FAQ/kategori gratis i chatten
  istället för via betald API-pipeline.

### Variantöversättning: tabell → cache → Haiku → svenskhets-grind → färg-grind (egen switch `VARIANT_AI_TRANSLATION_ENABLED`)

Variantvärden (t.ex. "Warm White", "100 inch") översätts till svenska FRÅN START
vid import — viktigt, för i Wix V3 speglar `choice.name` den låsta `choice.key`:en,
så värden kan inte döpas om i efterhand. Fem lager (`lib/import/variant-ai-translate.ts`);
färg-grinden (5) körs sedan 2026-08-09 i BÅDA lägena — även hård-$0/sync-läget
(`colorGateFlags` i pipeline-else-grenen), eftersom den är deterministisk och gratis:

1. **Statisk tabell** (`variant-translations.ts`, $0): golden-testad, auktoritativ.
2. **AI-fallback** (Haiku, default PÅ): bara för värden tabellen missar, **ett**
   batchat anrop per produkt, **cachat per värde för alltid** (→ nära $0; samma
   råvärde översätts en gång, någonsin). Routas via `completeJsonRouted` → ärver
   daglig budgetcap + Gemini-fallback + `failOpen` (importen fälls aldrig).
   Eko-asymmetri: rent-ord-ekon misstros (flaggas + självläker); halvöversättningar
   som behåller engelska tokens flaggas.
3. **Olösta värden** (AI av/fail/kvarvarande engelska) → produkten flaggas
   `needsAiPolish` och hamnar i poleringskön i stället för att nå kunden halv-engelsk.
4. **Svenskhets-grinden** (slutsteg, AI-läget): de FAKTISKA skeppningsklara
   värdena/axelnamnen språkverifieras av Haiku ("är detta naturlig svenska?") —
   fångar kategoriskt det heuristiken missar (VERSAL-engelska som "STRIPED",
   exotiska AE-former). Cachat verdikt per slutvärde (30 d TTL, ≈$0), fail-open
   (transient fel cachas ALDRIG som "ok"), flaggade värden → samma poleringskö +
   kö-badge som listar dem ordagrant.
5. **Färg-grinden** (deterministisk, $0, `nonColorValuesOnColorAxis` i
   `color-match.ts`): svenskhets-grinden godkänner varje äkta svenskt ord — även
   när betydelsen är fel. En röd bil skeppades som färgen **"Nät"** (2026-08-08);
   ordet är invändningsfri svenska och passerade. Oöversatt spanska utan engelska
   tokens ("Naranja") blir dessutom aldrig AI-kandidat. Grinden tittar därför på de
   SLUTGILTIGA värdena per axel: på en axel vars värden i majoritet är färger
   (`isColorAxis`) flaggas det som varken är färg eller yta. Konservativ — rör inte
   axlar där AE lagt storlekar under "Color", och släpper språkneutrala mått/koder.

Switchen är **`VARIANT_AI_TRANSLATION_ENABLED`** (default `true`), FRIKOPPLAD från
`AI_ENRICHMENT_ENABLED` — variantöversättningen kör alltså även i rå-läget (billig +
cachad). Sätt `=false` för hård $0 på varianter (svansen lämnas då engelsk + flaggas
för polering). Explicit `flags.translateVariants` vinner över env. Beslutspunkt:
`variantAiTranslationEnabled(flags)`. Golden-testet i `variant-translations.test.ts`
låser kända/fäll-fixade översättningar i CI.

### Bulk-läge: AI-berikning PÅ (kostar Anthropic-credits)

När du vill köra en riktig AI-batch:

1. Sätt `AI_ENRICHMENT_ENABLED=true` i Vercel (eller ta bort variabeln — default är på).
2. Kör batch-/bulk-importen.
3. Sätt tillbaka `AI_ENRICHMENT_ENABLED=false` när batchen är klar.

Alternativt, utan att röra env: anropa pipelinen med `flags.enableAI: true` per
import (t.ex. en admin "kör AI-batch"-knapp). **Explicit `flags.enableAI` vinner
alltid över env-flaggan** — `true` tvingar PÅ trots env=false, `false` tvingar AV
trots env=true. Flaggan är default men inte hård (`aiEnrichmentEnabled()`).

### Var det gatas

`aiEnrichmentEnabled(flags)` i `lib/import/pipeline.ts` är enda beslutspunkten.
När AI är av: `runSeo/runImageAnalysis/runCategory/batched` blir alla `false`,
`importProduct` returnerar `needsAiPolish:true`, och `lib/bulk-import/worker.ts`
tvingar realtidsvägen (ingen Batch API-pre-generering som annars kostar).

## Aosom: andra leverantören, samma pipeline (`lib/aosom/`)

Sedan 2026-08-27 finns ett B2B-konto hos Aosom och en produktfeed
(`AOSOM_FEED_URL`, uppdateras 3 ggr/dygn).

☠️ **Feedens adress är en hemlighet och får aldrig hårdkodas.** Den kräver ingen
inloggning: en vanlig GET returnerar hela B2B-prislistan med kolumnen
`Wholesale Price` för 6 057 artiklar. Repot är PUBLIKT, så en inbakad adress är
detsamma som att publicera vad vi betalar för varje vara — för de svenska
återförsäljare vi konkurrerar med om exakt samma artikelnummer. Ett test i
`feed.test.ts` fäller om adressen dyker upp i källan igen.

`resolveAosomFeedUrl()` läser två källor i ordning: `AOSOM_FEED_URL` i miljön
(vinner alltid — för en engångskörning), sedan **Wix-raden `FyndplatsAppConfig`**,
som är det normala hemmet. Saknas båda kastar den.

Wix hellre än miljövariabel av två uppmätta skäl (2026-08-27). En miljövariabel
bakas in i deploymenten: den slår inte igenom förrän projektet byggts om, och en
omdeploy som inte blev av ser exakt likadan ut som en som blev det — det kostade
en runda här. Och märkt "Sensitive" går värdet inte att läsa tillbaka ens för
ägaren, så verifiering kräver att hemligheten först roteras. Wix-raden läses vid
varje anrop och går att läsa. Det spelar roll konkret: adressen **ska roteras**
hos Aosom eftersom den legat i en publik gren, och varje rotation hade annars
krävt variabel plus ombygge igen.

Kollektionen skapas med `scripts/ensure-app-config-collection.mjs`. Läsning och
skrivning i `lib/store/app-config.ts` — den KASTAR vid riktigt läsfel i stället
för att falla tillbaka tyst, till skillnad från `getPricingRules`: prissättningen
har vettiga defaults, en feed-adress har inga, och en Wix-nedgång får inte se ut
som "ingen adress konfigurerad". Sortimentet importeras som **osynliga
utkast** och poleras sedan i chatten — exakt samma arbetsflöde som rå-läget
ovan, bara med en annan leverantör i andra änden.

| | |
|---|---:|
| Rader i feeden | 6 057 |
| Går att frakta till Sverige | **5 566** |
| Bilder bakom dem | **50 018** |
| Där frakten kostar mer än varan | 1 175 (21 %) |

Sista talet i tabellen är arkitekturen: varje bild är ett eget Wix-anrop, så
hela svepet är timmar och en serverless-rutt har 300 sekunder.
`/api/cron/aosom-import` tar därför en tugga i taget, returnerar en **markör**
(`cursor` → `?after=`) och kan startas om hur många gånger som helst —
dubblettspärren på `supplierProductId` gör omkörning till en no-op.

### Vägen in

`feed.ts` (hämta + tolka) → `to-product.ts` (adapter) → `importProduct` →
`import-run.ts` (batch + markör) → `/api/cron/aosom-import`.

Adaptern bygger en `AliExpressProduct` av feed-raden. Poängen är att allt
nedströms redan finns: prissättning, marginalregler, bildhemtagning,
Wix-create, SKU:er, mappningsrad, utkastläge, poleringskö. Typnamnet är arv —
den beskriver "en leverantörsprodukt på väg in" och har inget AE-specifikt i sig.

Läget är **alltid `raw`**: noll Claude-anrop ($0) och `visible:false`
ovillkorligt. Torrkörning är default; utan `?dryRun=false` skrivs ingenting.
Rutten är **schemalagd sedan 2026-08-28** (`40 4 * * *`, 60 produkter per natt).

Den låg medvetet oschemalagd fram till dess, med motiveringen att en cron som
fyller poleringskön snabbare än någon hinner skriva om texterna bara ger en
växande hög tyska utkast. **Leonard överröstade det uttryckligen** ("Om nya
produkter kommer ska de automatiskt importeras så sköter jag poleringen") — det
är hans kö att tömma, och ett osynligt utkast kostar ingenting medan det väntar.
Dubblettspärren gör cronen till en no-op när feeden inte har något nytt: den går
gratis förbi allt som redan har en mappning och importerar bara det som saknas.

### Så körs den: GitHub Actions, inte en terminal

Workflowen **"Aosom — importera sortimentet som osynliga utkast"** (`workflow_dispatch`,
tre lägen: `torr` · `rökprov` · `svep`). Samma nyckel-lösa upplägg som
prisreparationen: produktionen har Wix-nycklarna, Actions har `CRON_SECRET`, och
de möts i workflowen. Ingen hemlighet passerar chatten eller en terminal — och
därför går hela jobbet att starta från en telefon.

Det löste ett verkligt problem: `CRON_SECRET` är märkt Sensitive i Vercel och går
inte att läsa tillbaka ens för ägaren, så rutten var i praktiken oanropbar för
den som inte redan hade värdet.

Svepet **sparar markören i grenen efter varje varv** (`tools/aosom/sweep-state.json`),
inte i slutet. Dör jobbet mitt i fortsätter nästa körning där den slutade i
stället för att börja om. Jobbet stannar själv efter fem timmar — under GitHubs
sextimmarstak, med marginal nog att hinna committa markören.

`tools/aosom/sweep.sh` finns kvar för den som hellre kör från en terminal och
har `CRON_SECRET` för handen.

### Fyra saker som inte ska tas bort

1. **`supplier: "aosom"` på mappningen.** Lagersynken, prisbevakningen,
   prisreparationen, fraktkontrollen och recensionshämtningen slår alla upp
   `supplierProductId` mot AliExpress API. Ett Aosom-artikelnummer skickat dit
   är 5 566 omöjliga uppslag per körning som äter `maxApiCalls` och tränger
   undan de produkter som faktiskt behöver synkas. Spärren är
   `isAliExpressMapping` i `lib/store/supplier.ts` — en grep hittar alla
   ställen som bryr sig. Fältet faller tillbaka på `aosom:`-prefixet i id:t, så
   en rad som tappat fältet klassas ändå rätt.

   ☠️ **Spärren är sedan 2026-08-28 en TYP, inte en vana** (`AliExpressProductId`
   i `lib/aliexpress/product-id.ts`). `getProduct`, `getInventory`,
   `queryFreightToCountry` och `debugRawProductGet` tar inte längre en `string`,
   och den enda vägen från en mappningsrad heter `aliExpressIdOf(mapping)` —
   den returnerar `null` för Aosom. Typen är erased vid körning: id:t ÄR
   strängen, så loggning, jämförelser och Map-nycklar är oförändrade.

   Skälet står i mätningen. `/api/aliexpress/sync-all` hade tappat spärren och
   gjorde **4 432 omöjliga uppslag per körning**; rutten NOLLAR dessutom lagret
   vid `offline`, så en felklassad rad kunde tömma en Aosom-produkt. När typen
   infördes föll **två vägar till** ut som kompileringsfel, båda oupptäckta:
   variantreparationen i `/admin/mappings` (en Aosom-rad hade legat kvar i
   `broken` körning efter körning) och två order-åtgärder i `/admin`
   (prisavstämningen och fraktdiagnosen på en kundorder — en kund kan lika gärna
   ha köpt en Aosom-vara).

   Det är hela argumentet: **en spärr man måste komma ihåg glöms bort.** Sju
   vägar, sex rätt, och de tre felen syntes aldrig i något svar. För id som
   kommer från AliExpress själv (en klistrad URL, en sökträff, tilläggets
   skrapade sida) finns `aliExpressIdFromListing` — använd den ALDRIG på
   `mapping.supplierProductId`.
2. **Frakten ligger i inköpspriset, och momsen bruttas på.** Det är hela
   skillnaden mot AliExpress, där EU-lagerpriset är levererat. Aosoms SE-frakt är
   **per kolli** och skalar med vikten (16 € under två kilo, över 100 € över
   fyrtio). Adaptern räknar
   `costUsd = (grossist + SE-frakt) × eurToSek × 1,25 / usdToSek`.

   ☠️ **Uppbruttningen är inte kosmetisk.** `landedCostSek` lagras enligt husets
   konvention INKLUSIVE moms — auktionens golvbud delar med 1,25 innan det
   räknar (`lib/auction/seed.ts#netSupplierCost`), eftersom momsen aldrig är en
   verklig kostnad för ett momsregistrerat företag. Aosoms B2B-fakturor är
   NETTO (omvänd skattskyldighet); sparas beloppet rakt av hamnar ett nettotal i
   ett fält som läses som brutto, golvbudet blir 20 % för lågt och auktionen kan
   sälja UNDER inköp. Samma fälla gäller AliExpress-köp gjorda på Business
   Purpose, som också faktureras netto.

   ⚠️ `computeProfit` i `lib/import/pricing.ts` drar INTE av momsen ur kostnaden
   och är därmed oense med `netSupplierCost`. Lönsamhetsöversikten läser den
   vägen (`lib/analytics/profit.ts`) och underskattar därför vinsten med 25 % av
   inköpet — uppmätt 2026-08-27: rapporterar 0,3 % marginal där verkligheten är
   19,4 %.
3. **En rad = en produkt.** `Psin` ser ut som en föräldranyckel men grupperar
   *relaterade varor*: de tretton raderna under `24G58OVN9S001` är tretton olika
   valphagar med olika antal paneler och priser från 55 till 119 €. Grupperar
   man på den blir varianter av produkter som inte är utbytbara.
4. **Markören flyttas även vid fel.** Annars fastnar hela svepet på en trasig
   rad: nästa körning börjar om på samma produkt, misslyckas igen, och katalogen
   står stilla. Felet står i svarets `errors` och körs om riktat med `?sku=`.

## Aosom-synken: ett anrop ger hela sanningen (`lib/aosom/sync.ts`)

Lager och pris speglas av `/api/cron/aosom-sync`, schemalagd `20 */6 * * *`.

Den är byggd tvärtemot AliExpress-synken, och skälet är strukturellt. AE måste
ringa DS-API:t **en gång per produkt**, lever under `maxApiCalls` och roterar
därför genom katalogen — ett varv tar ~20 timmar, och därav hela strike-mekaniken.
Aosom är **ett enda HTTP-anrop** som ger alla 6 057 rader med saldo och pris.
Ingen budget, ingen rotation, inga strikes: varje körning ser allt samtidigt.

Det gör problemet mindre men flyttar risken. När en körning kan röra hela
sortimentet är en trasig feed farligare än en trasig produkt — därför ligger
spärrarna mot MASSFEL, inte mot enskilda fel.

### Fem egenskaper som inte ska tas bort

1. ☠️ **`MIN_FEED_RADER` kastar.** Ger feeden färre än 2 000 rader avbryts
   körningen. En halvhämtad CSV får aldrig tolkas som att lagret tagit slut —
   det är skillnaden mot AE, där ett fel bara kan nolla en produkt.
2. ☠️ **En rad som försvinner är INTE utgången.** Aosoms B2B-guide, ordagrant:
   *"Items with low stock may be temporarily removed to avoid overselling."*
   Raden är ett lagerbesked. Rätt svar är att nolla saldot och låta sidan ligga
   kvar; nästa körning där raden är tillbaka återställer saldot av sig själv.
3. **`LAGER_BUFFERT = 3`.** Feeden uppdateras tre gånger per dygn, så mellan två
   synkar är siffran gammal. Säger Aosom "3 kvar" och vi visar 3 säljer vi den
   fjärde. Aosom flaggar dessutom själva 276 rader med "Low Stock Alert".
4. **`limit` tar av SKRIVNINGAR, inte av granskningar.** Det är vad som gör att
   cronen konvergerar utan sparad markör: en redan synkad produkt kostar noll
   Wix-anrop, så nästa körning går gratis förbi den och skriver de nästa 400.
   Efter några varv skriver varje körning noll.
5. **`MAX_PRISANDRING_PCT = 40`.** Prissynken är tvåvägs och helautomatisk
   (Leonards beslut 2026-08-28: "synka oavsett om det går upp eller ner"), men
   en frakt som råkat bli 0 eller ett grossistpris med fel decimal får inte nå
   kund. Över taket skrivs ingenting och raden hamnar i `varningar`.

Wix skrivs före mappningen, samma ordning och samma skäl som `price-repair`.
Alla tre kostnadsfälten skrivs — `grossSek`, `costUsd` och `landedCostSek` —
aldrig bara priset.

### ☠️ En `variantsInfo`-PATCH PUBLICERAR ett utkast

Uppmätt mot skarpa V3 2026-08-28 på ett osynligt Aosom-utkast: en PATCH med
`fieldMask: ["variantsInfo"]` och **oförändrat pris** tog produkten från
`visible:false` till `visible:true`. Fältmasken skyddar alltså inte synligheten —
Wix behandlar en variantskrivning som en publicering.

Konsekvensen var inte teoretisk. `updateV3VariantPrices` skickade inte med
`visible`, och `price-repair` filtrerar inte på synlighet. Med 2 700+ opolerade
tyska utkast i katalogen hade en enda prisreparation kunnat lägga ut dem på
sajten. Funktionen skickar nu alltid tillbaka `visible` oförändrad; saknas
fältet i svaret utelämnas det hellre än gissas. Fem tester i `v3-prices.test.ts`
låser det.

### Aosom beställs i klump, inte via API (`lib/aosom/bulk-order.ts`)

☠️ **`place-order.ts` är HELT AliExpress och vägrar numera allt annat.** Den
hämtar produkten ur DS-API:t, matchar varianten mot en AE-SKU och lägger ordern
via `aliexpress.ds.order.create`. En Aosom-mappning bär "845-030CG" i exakt
samma fält, så utan grinden hade artikelnumret skickats rakt in i AE:s API — ett
uppslag som aldrig kan träffa, med ett felmeddelande som pekar åt fel håll.
Grinden är `isAliExpressMapping` i `placeOrderForTask`, och meddelandet pekar på
bulkordern så den som ser felet i `/admin` inte börjar leta i AE-loggarna. En rad
UTAN `supplier`-fält räknas fortfarande som AliExpress — annars hade hela den
befintliga katalogen slutat gå att beställa.

Aosoms egen väg kräver inget API. `/api/admin/aosom-order` bygger filen som
`aosom.de/bulkordering` tar emot: **varje rad är en order** — en kundadress med
upp till tjugo artikelnummer. Utan `?format=csv` svarar rutten med planen, så
man ser vad som kommer med innan något laddas upp.

Gränserna är **Aosoms, inte våra** (guiden, avsnitt 5), och en batch som spränger
någon av dem avvisas först efter uppladdningen — därför delas ordrarna i förväg:

| | |
|---|---:|
| Ordrar per omgång | 100 |
| Artikelnummer per rad | 20 |
| Olika artikelnummer per batch | 200 |
| Enheter per batch | 1 000 |

Två egenskaper som inte ska tas bort:

1. ☠️ **En order delas ALDRIG mellan två batchar.** Raden ÄR ordern, med en
   adress och en betalning. Splittad blir det två leveranser, två fraktavgifter
   och en kund som får halva sin beställning. En order som ensam spränger ett tak
   flaggas som `omojlig` och lämnas till en människa.
2. **En kunds rader slås ihop till EN rad.** Kön är radbaserad
   (`taskId` = `${orderId}:${lineItemId}`), Aosoms fil är orderbaserad. Tre rader
   hade blivit tre leveranser med varsin fraktavgift — och frakten är redan den
   dyraste delen av en Aosom-order.

⚠️ **Adresskolumnernas rubriker är inte verifierade.** Guiden anger bara att
kolumn A är artikelnumren och kolumn B antalen; adressfälten beskrivs som "one
customer address" utan namn. Ladda ner deras formulär en gång och rätta
`CSV_KOLUMNER` — datan i raderna är rätt oavsett.

### Resten av vad guiden säger

- **API-integration erbjuds** "after a few months of successful collaboration".
  Fråga Henrik Leseberg när ni har historik.
- **Hämtning på lager** (`Pick Up` i kassan, Neu Wulmstorf och Schwanewede, egna
  fraktkontakter) — det är draget mot fraktproblemet: bort från 84 € per kolli
  till Sverige. Pallutbyte kostar 30 € i adminavgift utan egna pallar.
- Alla ordrar är **förskottsbetalda**, plock 1–4 arbetsdagar. Kan en vara inte
  levereras kommer besked per mejl och pengarna tillbaka — men då har vi redan
  tagit betalt av kunden.

### Vad spärren INTE ser

Dubblettspärren nyckar på `supplierProductId` och fångar varje omkörning. Den
fångar **inte** de ~586 produkter vi redan säljer som är Aosom-varor inköpta via
AliExpress — de bär ett AE-listnings-id och ser för spärren ut som något helt
annat. Att para ihop dem kräver mått, produkttyp och bildjämförelse (så gjordes
de 33 i leverantörsjämförelsen 2026-08-27); en automatisk gissning skulle slå
ihop varor som inte är samma. De dubbletterna hanteras i poleringen, där en
människa ändå läser varje produkt.

### Kan Google se att det är dubbletter? (Leonards fråga 2026-08-27)

Två skilda problem, med olika svar.

**Utkast är osynliga — mätt, inte antaget.** En produkt med `visible:false`
svarar **404** på sin produkt-URL och ligger inte i sitemapen (1 064 `loc` mot
946 synliga produkter). 5 566 tyska utkast kan alltså inte indexeras. Hela
risken ligger i publiceringsögonblicket, inte i importen.

**Vi läcker inga leverantörsspår.** Kontrollmätt på en publicerad sida:
noll träffar på `aliexpress`, `alicdn`, `aosom` eller något husmärke i HTML:en;
alla 230 bilder på `static.wixstatic.com`; JSON-LD:ns `sku` är Wix eget UUID;
inget `mpn`, inget `gtin`. Feedens `EAN`-kolumn är dessutom tom i 100 % av
raderna, så det finns ingen produktidentifierare att joina på. Husmärkena
(HOMCOM, Outsunny, PawHut, Aiyaplay) stryks vid poleringen — bara 6 av 952
produkter bär dem, och alla sex är opolerade utkast.

**Det Google DÄREMOT ser är bilderna.** Att flytta hem dem till wixstatic byter
adress, inte innehåll. Google Images matchar på bildinnehåll, och Aosoms foton
är byte-identiska hos varenda återförsäljare som kör samma feed. Skyddet är
inte hemflytten — det är egna kort och egen text.

**Den farliga dubbletten är intern.** `FyndplatsMappings` har **595 av 1 004
rader** från "byaosom ES (EU) Store" — 59 % av katalogen är redan Aosom-varor,
köpta via AliExpress. Feed-importen kan inte se dem (de bär AE-listnings-id) och
skapar därför en ANDRA sida för samma fysiska produkt. Två egna URL:er med samma
foton är den dubblett Google faktiskt straffar. Fångas i poleringen, inte av
spärren.

### Bilderna: bara position 1, 2, 3, 8 och 9 hämtas hem

**46 % av feedens bilder bär TYSK TEXT INBRÄND i pixlarna** ("HOCHWERTIGES
MATERIAL", "Empfohlenes Alter: 3-8 Jahre"). Den går inte att polera bort och kan
inte visas för en svensk kund. Mätt 2026-08-27 på 30 produkter — tio ur vardera
tredjedel av feeden — och 269 handgranskade bilder:

| pos | rena | vad det är |
|---|---:|---|
| 1 | **30/30** | huvudbild, vit botten |
| 2 | **30/30** | livsstilsbild |
| 3 | 23/30 | måttritning; oftast bara siffror, ibland tysk rubrik |
| 4–6 | 4/90 | tyska funktionsgrafiker |
| 7 | 6/30 | oftast tysk |
| 8 | 24/30 | detaljfoto: material, gångjärn, tyg |
| 9 | 27/29 | detaljfoto |

`RENA_BILDPOSITIONER = [1,2,3,8,9]` i `to-product.ts` räddar **134 av 144 rena
bilder (93 %)** och släpper in 15 tyska (10 % av det som behålls). Att också ta
7 hade gett 97 % rena men 22 % skräp; att kapa vid 3 hade gett bara 58 %.

Mönstret är **oberoende av var i feeden produkten ligger** (49/46/45 % tyska i
början, mitten, slutet) — regeln behöver inte justeras per sortimentsdel.
Poleringen granskar **3, 8 och 9**; position 1 och 2 kan hoppas över helt, och
det är de två som blir huvudbild och delningsbild. `?bilder=alla` tar hem allt.

Sidoeffekt: importen går från 50 018 till ~27 800 bilder — nästan en halvering
av det som är hela svepets flaskhals.

### Bildimporten tystnade — 397 av 675 produkter fick noll bilder

Första skarpa svepet (2026-08-27) importerade 675 produkter. **397 fick NOLL
bilder** och 87 fick färre än fem, medan körningen rapporterade `failed: 0` hela
tiden: produkten skapades ju, det var bara bilderna som föll bort.

Två tysta fel i `lib/wix/media.ts` samverkade:

1. `importMediaUrls` körde `Promise.allSettled` och **filtrerade bort allt som
   rejectade**. Ingen logg, ingen räknare, inget returvärde som skvallrade —
   kommentaren påstod "med varning i konsolen", och det fanns ingen sådan.
2. `importMediaByUrl` hade **inget återförsök alls**. Wix svarar 429 vid för hög
   takt, och fem bilder parallellt per produkt × 129 produkter per varv är ~2,7
   uppladdningar i sekunden. Därför blev det värre över tid: de sist importerade
   fick noll.

Lagat: uppladdningarna går **en i taget** med paus (`MEDIA_UPLOAD_DELAY_MS`,
default 150 ms), återförsök med backoff på 429/5xx/nätverksfel (1 s, 3 s, 8 s,
följer `Retry-After`), och varje miss rapporteras via `onMiss` →
`ImportResult.missadeBilder`. En trasig adress (404) ger däremot upp direkt —
den blir inte bra av att frågas igen.

Samma klass av bugg som recensionsbilderna hade (2026-08-22). Regeln bakom båda:
**en misslyckad uppladdning som ingen kan upptäcka är värre än en som kastar.**

☠️ **`getProductMedia` MÅSTE begära `fields=MEDIA_ITEMS_INFO`.** Utan det
returnerar V3 en produkt med `media.main` ifylld men `media.itemsInfo.items`
TOM — inte ett fel, bara en tystare projektion. Uppmätt 2026-08-27 på en produkt
med fem bilder: 0 utan fältet, 5 med. Två saker gick sönder på det, båda tyst:
bildreparationens torrkörning såg alla 744 Aosom-produkter som bildlösa, och
knappen **"ta bort bild" i `/admin/queue`** filtrerade en tom lista, såg ingen
skillnad och anropade därför aldrig Wix — den hade aldrig gjort något. Ett test
i `client-media.test.ts` fäller om fältet försvinner igen.

`/api/cron/aosom-image-repair` städar upp efteråt (`lib/aosom/image-repair.ts`,
workflow-lägena `bildfix-torr` och `bildfix`). Den **läser tillbaka och räknar** efter
varje skrivning — se nästa avsnitt för varför. Den laddar om ALLA fem bilderna på
en produkt som har för få — en wixstatic-adress avslöjar inte vilken källbild den
kom från, så det går inte att veta vilka som saknas. Två spärrar:

- Skriver **aldrig en tommare lista** än den som redan ligger där. Går
  uppladdningen dåligt igen lämnas produkten orörd till nästa runda i stället för
  att göras sämre.
- Bara `media`, via `setProductMedia` med `fieldMask: ["media"]`. Synlighet,
  varianter, priser och texter är orörda — ett utkast kan inte råka publiceras.

### Reparationen rapporterade 524 av 524 lagade. 214 produkter saknade ändå bilder

Första skarpa bildfixen (2026-08-27, 12 varv) sa **524 trasiga, 524 lagade, noll
missar**. Mätt i Wix efteråt: **214 av 750 Aosom-utkast hade fortfarande färre än
fem bilder**, 207 av dem exakt fyra.

Stickprov visar samma sak varje gång: **fem filer ligger uppladdade och `READY` i
Media Manager, och noll av dem sitter på produkten.** Produkten bär kvar sina
gamla fyra bilder och sin gamla revision. Mönstret är jämnt över hela körningen
(22:01 → 22:38), så det är ingen degradering över tid.

Fyra förklaringar är **uteslutna med mätning**, inte med resonemang:

| hypotes | motbevis |
|---|---|
| Fel kroppsform i `setProductMedia` | Manuell PATCH med exakt samma kropp tog en produkt 4 → 5 |
| Föråldrad revision | Wix svarar **409 `INVALID_REVISION`** och funktionen kastar |
| Dubbletter i källan | De fem källbilderna har fem olika md5 |
| För få bilder i feeden | Feeden ger fem rena positioner på 6 014 av 6 057 rader |

Mekanismen är alltså **fortfarande oförklarad**. Det som däremot är lagat är att
felet var osynligt: `runImageRepair` läser nu tillbaka produkten efter varje
skrivning och räknar `reparerade` först när antalet bilder FAKTISKT steg. Tar
skrivningen inte blir det `misslyckade` + en rad i `errors` med artikelnumret.
Workflowen läste heller aldrig `misslyckade` — den gör det nu, och skriver ut
`errors` per varv.

☠️ **Ett svar utan fel är inget kvitto.** Tredje gången samma klass av bugg biter
här: recensionsbilderna (2026-08-22), `Promise.allSettled` i `media.ts`
(2026-08-27), och nu en skrivning som svarar OK utan att göra något. Regeln är
densamma varje gång — **räkna efter, lita inte på svaret.**

### ☠️ Wix importerade om VARJE bild — halva lagringen var kopior (2026-08-28)

Det här förklarar två problem som såg orelaterade ut: att lagringen tog slut,
och att bildfixen kunde rapportera fem lyckade uppladdningar på en produkt som
sedan hade fyra bilder.

V3:s dokumentation om produktmedia är entydig. Ett media-item tar ANTINGEN
`id` (en fil som redan ligger i Media Manager) ELLER `url` — och `url` betyder
ordagrant *"an external media URL"*. Vi skickade wixstatic-adresser, alltså
bilder som redan låg i Media Manager, och **Wix importerade om varenda en till
en ny fil**.

Uppmätt på 1 200 filer: **591 av 595 wixstatic-filer var kopior av bilder vi
själva laddat upp**, spårbara via sin `sourceUrl`. Media Manager hade **58 160
filer** där hälften räckt.

Omimporten är dessutom ASYNKRON. Det är mekanismen bakom "524 lagade, 214
saknade ändå bilder": produkten bar aldrig våra filer, den bar Wix kopior — och
när en kopia inte hunnit bli klar visade produkten fyra av fem. Den var alltså
aldrig oförklarad, bara felsökt på fel lager.

`importMediaByUrl` returnerade `id` hela tiden. Ingen använde det.

Lagat i `lib/wix/client.ts` (`createProduct` + `setProductMedia`), `pipeline.ts`
och `image-repair.ts`: id:t följer med hela vägen, och `url` skickas bara när
adressen faktiskt är extern. `media.main` skickas inte längre alls — den är
read-only i V3 och gav en extra omimport av huvudbilden. Tre tester i
`client-media.test.ts` låser det.

☠️ Regeln: **skicka aldrig en wixstatic-adress till Wix som om den vore extern.**

### Städningen av det som blev kvar

#### Bildfixen lämnade dessutom sina egna kopior

Fjärde bildfix-körningen dog mitt i: **Wix-lagringen tog slut.**

Orsaken står i `image-repair.ts` egen designkommentar. Den laddar upp ALLA fem
bilderna på nytt för varje produkt den lagar och ersätter medialistan — och de
gamla filerna blir kvar. Kommentaren sa att det "kostar några hundra extra
uppladdningar totalt"; den skrevs när katalogen var 744 produkter och EN körning
var planerad. Verkligheten blev fyra körningar mot en katalog som växte till
2 712 produkter, och varje lagad produkt lämnar fem filer à drygt en megabyte.

`/api/cron/aosom-media-cleanup` (`lib/aosom/media-cleanup.ts`, schemalagd
`50 3 * * *`) raderar Aosom-bilder som ingen produkt använder. Tre egenskaper som
inte ska tas bort:

1. ☠️ **Massfel-spärren kastar.** Är referenslistan mindre än en halv bild per
   läst produkt är det ett LÄSFEL, inte en tom katalog — och en körning hade
   raderat hela butikens bildbank permanent. Samma tanke som `MIN_FEED_RADER`.
2. **Bara filer VÅR kod skapat**, avgjort på `sourceUrl` — inte på namnet.
   `addedBy` duger inte: vår API-nyckel agerar som sajtägaren, så en bild Leonard
   dragit in i editorn ser identisk ut. Men en importerad fil bär adressen den
   hämtades från (leverantörernas CDN), och Wix egna kopior bär en
   wixstatic-adress som pekar tillbaka på en av våra. **En handuppladdad bild har
   ingen `sourceUrl` alls** och kan därför aldrig komma i fråga — det är skyddet
   för logotyper, banners och kategoribilder, som inte syns i något API vi kan
   lista och därför måste undantas på egenskap i stället för på uppräkning.
   Referenslistan byggs ur HELA katalogen, inte bara Aosom-delen.
3. **`permanent: true`.** Papperskorgen räknas fortfarande mot lagringen, så en
   vanlig radering frigör ingenting alls.

Städningen är avsiktligt en SEPARAT körning och inte inbakad i reparationen: en
radering inne i reparationen hade skett innan skrivningen verifierats, och en
produkt vars nya bilder inte fastnade hade då förlorat även de gamla.

#### Bara det som saknas laddas om (byggt 2026-08-28)

Reparationen laddade tidigare om alla fem bilderna per produkt, eftersom en
wixstatic-adress inte avslöjar vilken källbild den kom från. Det var orsaken
till hela incidenten ovan. Kopplingen finns nu i stället för att gissas, från
två håll:

- **`aosomBildFiler` på mappningen** — källbild → Wix-fil-id, sparat efter varje
  VERIFIERAD skrivning. Sparas det före, eller efter en skrivning som inte tog,
  pekar det på filer som inte sitter på produkten.
- **Wix egen `sourceUrl`** (`getMediaSourceUrls`, `POST /files/get-files`) för
  allt som importerades innan fältet fanns. Ett anrop per produkt, och bara en
  gång. ☠️ Den följer ETT hopp extra: en fil Wix omimporterat bär vår fils
  wixstatic-adress, inte leverantörens — och de produkter som ska lagas
  importerades medan omimport-buggen levde, så många pekar just på kopior.

Med kopplingen känd behålls det som redan sitter rätt **vid sitt id** och bara
luckorna fylls. Då uppstår inga föräldralösa alls.

☠️ **Går kopplingen inte att härleda laddas allt om, som förr.** Det är med
flit: vet vi inte vad produkten har kan en påfyllning ge samma bild två gånger
på en kundsida, och en dubblett är värre än en extra uppladdning. `fullOmladdning`
i svaret räknar dem, och talet ska sjunka mot noll.

#### ☠️ Två skilda 429:or — och den ena går inte att vänta ut

Städningen föll två gånger på rad innan den fungerade, på två olika strypningar
som ser likadana ut i ett felmeddelande men inte är samma sak:

| | svarar | vad som hjälper |
|---|---|---|
| **API-strypningen** | JSON-fel efter ~40–50 sidor i rad | backoff (2 s, 10 s, 30 s), `Retry-After` |
| **Edge-strypningen** | en **HTML-sida** efter ~150 sidor | ingenting inom ruttens 300 s |

Den andra är strukturell: **58 160 filer går inte att lista i ETT anrop**, hur
tålmodigt det än görs. Listningen är därför FÖNSTRAD — 60 sidor per körning,
markör i svaret (`cursor` → `?after=`). Samma mönster som svepet och bildfixen,
och av samma skäl.

☠️ **`paging.limit` takas på 100, vad än dokumentationen påstår.** Både Search
Files och Query File Descriptors står som "up to 200 files" i dev.wix.com.
Uppmätt mot skarpa API:t 2026-08-28 svarar BÅDA `400 INVALID_ARGUMENT:
'paging.limit' must be less than or equal to 100`. En körning med 200 föll
direkt på första sidan.

Två designval bakom det som inte ska tas bort:

1. **Referenslistan läses om för VARJE fönster.** Den är ~37 sidor mot en annan
   API-familj och alltså billig. Att bära den mellan körningar hade betytt att
   en produkt som fått nya bilder sedan förra varvet såg ut att sakna dem — och
   fel åt det hållet raderar bilder som ANVÄNDS.
2. **Nattcronen kör medvetet utan markör.** Listningen sorteras nyast först, så
   ett fönster från början är exakt det som hunnit bli föräldralöst sedan i går.
   Den historiska ryggsäcken tas med workflow-läget `bildstadning`, som loopar
   markören genom hela beståndet.

⚠️ **`limit` byter täckning mot djup, och det är inte uppenbart.** Markören är
en OFFSET. Raderar ett fönster N filer krymper listan med N, men markören pekar
fortfarande på "offset 6 000" — så nästa fönster hoppar över exakt N filer:

| `limit` | hoppas över per pass | täckning |
|---:|---:|---|
| 4 000 | ~40 000 | liten del av listan |
| 1 000 | ~10 000 | nästan hela |
| 0 (torrläge) | 0 | hela |

Det förklarar både varför torrpassen träffar exakt 58 160 och varför skarpa pass
gav avtagande utfall (20 625 → 6 200 → 3 949 → 2 342 den 2026-08-28). **Kör ett
stort tak först för att få undan massan, sedan ett litet för att sopa svansen.**

Raderingen är också tidsbudgeterad (listningen får 70 %, raderingen resten).
Utan det kunde en stor `limit` dra förbi `maxDuration` och dödas mitt i skopan:
filerna ÄR raderade men inget svar kommer tillbaka, och nästa körning vet inte
vad som hände.

⚠️ Mät inte beståndet genom en MCP-loop — den slår i taket långt innan den är
klar. Det var så de första 429:orna upptäcktes.

#### ☠️ Ett fel som slukas av en kommandosubstitution finns inte

Den första torrkörningen föll med `exit 1` och **noll rader om varför**, medan
rutten hela tiden svarade 500 med ett tydligt meddelande. `anropa` i workflowen
skrev sina `::error::`-rader till **stdout**, och anroparen gör
`svar=$(anropa ...)` — kommandosubstitutionen slukade dem.

Felen går till stderr nu. Fjärde gången huset lär sig samma sak: recensions-
bilderna (2026-08-22), `Promise.allSettled` i `media.ts` (2026-08-27), en
skrivning som svarade OK utan att göra något (2026-08-27), och nu det här.
**Ett misslyckande som ingen kan se är värre än ett som skriker.**

### Att polera en Aosom-produkt

Allt utom siffrorna är **tyskt**: titel, beskrivning, säljpunkter och varje
spec-VÄRDE. Etiketterna är svenska från start (`Mått`, `Färg`, `Material`,
`Vikt`, `Paketmått`, `Artikelnummer`) eftersom feedens `Specification`-fält är
tomt i 5 550 av 5 566 rader — underlaget kommer från de strukturerade
kolumnerna i stället. Platshållaren `[BRAND NAME]`, som står kvar i 4 975 rader,
stryks redan vid importen; den är ett mekaniskt fel med ett mekaniskt svar och
får inte lämnas åt poleringen.

`aosomFreightShare` på mappningen (0–1) säger hur mycket av inköpet som är
frakt. Över 0,5 betyder att frakten kostar mer än varan — polera dem sist, eller
kör svepet med `?skipFreightHeavy=1` och ta dem för sig.

## Prissättningen är marknadskalibrerad, inte påhittad (`FyndplatsPricingConfig`)

Regeln är **`pris = 1,20 × landedCostSek`**, uppåt till närmaste 9 (`charm9`).
Ingen fast del, ingen trappa, inga kategorimultiplikatorer. Satt 2026-08-27.

```
defaultMultiplier 1.20   fixedSurchargeSek 0   categoryMultipliers {}
tiersEnabled false       rounding charm9
```

Marginalen blir **17 % överallt** — p10, median och p90 är alla 17 % över hela
sortimentet, så ingen vara kan råka hamna på 4 %. Ändringen gäller bara nya
importer; befintliga priser står kvar tills någon räknar om dem.

### Var talet kommer ifrån

Inte från en marginalambition — från mätning. **dealproffsen.se publicerar
Aosoms artikelnummer som `sku`/`mpn` i sin JSON-LD**, så exakt matchning är
mekanisk. Slagning på 70 spridda artiklar gav **55 exakta träffar**
(`https://www.dealproffsen.se/sok?controller=search&s=<SKU>` — WebFetch får 403,
curl med vanlig browser-UA fungerar).

| multiplikator | billigast på | marginal | vinst där vi vinner |
|---|---:|---:|---:|
| 1,18 | 39/55 | 15 % | 9 903 kr |
| **1,20** | **39/55** | **17 %** | **10 943 kr** |
| 1,25 | 30/55 | 20 % | 11 337 kr |
| 1,28 + 60 *(gammalt)* | 18/55 | 25 % | 9 962 kr |

1,25 tjänar mest på pappret men tappar en tredjedel av försprånget så fort
marknaden ligger 5 % under mätningen — och den gör den, eftersom underlaget
oftast är EN återförsäljare. 1,20 håller (30/55 vid −5 %, mot 1,25:s 21/55).

### Tre fällor som redan kostat

1. **Den fasta delen drog åt fel håll.** "Lite mer på billiga saker" känns rätt
   och är fel: konkurrentens påslag på vår kostnad är **1,12× på den billigaste
   tredjedelen** mot 1,33× på resten. Det finns minst utrymme just där `+60`
   lade mest. Varje rad i sveptestet med fast del är sämre än samma
   multiplikator utan.
2. **Varje fallande trappa inverterar priset vid gränsen** (799 kr kostnad →
   1 139 kr pris, 801 kr → 1 089 kr). Bygg ingen trappa. `tiers` ligger kvar i
   konfigen men avstängd.
3. **Kategorimultiplikatorer upphäver regeln tyst.** `Husdjur: 2,5` hade satt
   60 % marginal på PawHut-sortimentet — en stor del av Aosom. Rensade.

### Referenspriser är fiktion — båda hållen

Aosoms egen `Normal Price` är uppblåst: RRP 443,90 € på 845-030CG där idealo
listar samma artikel för 189,50 € (2,3×). Ett marknadsankare byggt på den
siffran prissätter efter fantasi — avblåst.

Dealproffsens listpris likaså: **55 av 55 produkter står som "Kampanj"** med
median 24 % rabatt. En kampanj som alltid pågår är inget pris. Kampanjpriset ÄR
priset, och det är det som ska jämföras mot.

### Varför vi förlorar på billiga varor — och vad som faktiskt löser det

Konkurrenten är inte billig. Deras påslag på **själva varan** är 1,96× i median
— ett vanligt butikspåslag. Skillnaden är **vår frakt**: Aosom fakturerar per
paket och viktstyrt, vilket blir en platt tull på 240–290 kr per vara i spannet
2–10 kg. På en vara som kostar 400 kr är det +65 %; på en som kostar 3 000 kr
är det +9 %.

| vår fraktandel av inköpet | deras pris ÷ vår kostnad | deras pris ÷ bara varan |
|---|---:|---:|
| under 25 % | 1,32 | 1,75 |
| 25–40 % | 1,28 | 1,92 |
| över 40 % | **1,13** | **2,07** |

Deras kostnad rör sig inte alls med vår frakt: de har **lager i Sverige**
("Dealproffsen AB är ett svenskt företag med lager i Sverige", varje vara
"Lagervara", 1–2 dagars leverans) och tar hem på pall.

Gränsen går vid ungefär **900 kr i inköp**: under den är vi billigast i 29–50 %
av fallen, över den i 92–100 %.

**Räknat med frakten satt till 30 kr per vara i stället för per paket blir vi
billigast på 55 av 55.** Det största draget i hela Aosom-affären är alltså inte
prisregeln utan att förhandla samlad frakt. Tills dess är urvalet skyddet:
`?skipFreightHeavy=1` på svepet.

### B2B-kontot är en rabatt på varan och ett straff på frakten (mätt 2026-08-27)

Leonard lade samma bod (`845-030CG`) i kassan på aosom.de två gånger, utloggad och
inloggad på B2B-kontot. Utloggad: 207,80 €. Inloggad: 210,39 €. **Kontot gjorde
varan dyrare.**

Feed-raden förklarar varför, och fraktsiffran står ordagrant i kassan:

```
Wholesale Price          123.01 EUR
SE Ship Fee               84.02 EUR   ← exakt talet i B2B-kassan
Shipping Cost Germany     39.38 EUR
Weight (incl. Package)    50.00 kg
Package                        2
```

Det avgörande talet är inte 84 utan **39,38**. Samma order, samma konto, till en
TYSK adress kostar frakten 39,38 € — medan en utloggad konsument betalar 7,90 €
på exakt den rutten. **B2B-frakten är 5× konsumentfrakten inom Tyskland.** Det
handlar alltså inte om avståndet till Sverige: Aosom subventionerar konsument-
frakten (den ligger inbakad i 199,90 €) och fakturerar B2B den råa fraktsedeln.

Netto mot netto — B2B-fakturan är netto, konsumentpriset innehåller 19 % MwSt:

| | vara | frakt | **netto** |
|---|---:|---:|---:|
| Konsument → DE | 167,98 | 6,64 | **174,62 €** |
| B2B → DE | 126,37 | 39,38 | **165,75 €** |
| B2B → SE | 126,37 | 84,02 | **210,39 €** |

Rabatten på själva varan är verklig (−25 %) och räcker så länge paketet stannar i
Tyskland. Till Sverige blir kontot **20 % dyrare än att vara privatperson**. De
207,80 € såg jämna ut bara för att konsumentpriset bär tysk moms vi aldrig får
tillbaka — kassan underdriver problemet.

Och det gäller sortimentet, inte bara den boden. Över feedens 6 056 rader med
både SE- och DE-frakt:

| | SE | DE |
|---|---:|---:|
| Medianfrakt | 26,40 € | 8,59 € |
| Frakt ÷ inköp (median) | **40 %** | **18 %** |
| Rader där frakten kostar mer än varan | **1 283** | **9** |

SE-frakten är **3,07× DE-frakten** (median per rad). "Frakten kostar mer än
varan" är i praktiken uteslutande ett Sverigeleverans-problem.

Vad det är värt, kört mot de 55 dealproffsen-matchningarna vid oförändrad
prisregel och oförändrad 17 % marginal:

| frakt | billigast på |
|---|---:|
| SE-frakt (som idag) | 39/55 |
| **DE-frakt** | **54/55** |
| 30 kr/vara | 55/55 |

De 30 kronorna ovan är ett räkneexempel. **39,38 € är ett pris Aosom redan tar**,
och det ensamt tar oss från 39 till 54 av 55 utan att röra marginalen. Draget är
samlad frakt eller en tysk leveranspunkt vi vidarebefordrar från — inte en ny
prisregel.

☠️ **Köp inte som privatperson som kringgång.** Ingen B2B-faktura, tysk moms som
inte är avdragsgill i Sverige (bara sökbar via Skatteverket, långsamt), ingen
omvänd skattskyldighet — och det skalar inte till 5 566 artiklar.

### Vad som INTE är fixat

`computeProfit` i `lib/import/pricing.ts` drar inte av momsen ur kostnaden och
är oense med `lib/auction/seed.ts#netSupplierCost`. Lönsamhetsöversikten
underskattar därför vinsten med 25 % av inköpet. Samma fälla finns olagad för
AliExpress-köp på Business Purpose, som faktureras netto men sparas i
`landedCostSek` som läses som brutto (lagat för Aosom i `1287a0a`).

## Dubblett-spärr vid import

**Båda** importvägarna vägrar nu importera en AliExpress-listning som redan finns,
med `supplierProductId` som nyckel:

- Bulk/CSV: `lib/bulk-import/worker.ts → scrapeAndDedupe` — hoppar över raden.
- Extension: `app/api/import/route.ts` — svarar **409** med den befintliga
  produktens `wixProductId`. Skicka `allowDuplicate: true` för att medvetet
  importera ändå (t.ex. när produkten raderats men mappningsraden blivit kvar).

Båda är **fail-open**: ett trasigt mappnings-uppslag blockerar aldrig en i övrigt
giltig import. `/api/check-duplicate` (pHash + titel, `lib/import/duplicate-check.ts`)
finns kvar som en *rådgivande* varning i tillägget och fångar dessutom det spärren
inte kan se: samma fysiska produkt såld under en **annan** listning. Den varningen
går att klicka förbi — så den ersätter inte spärren, den kompletterar den.

## Varianter får inte dela inköpspris utan täckning

Tilläggets DOM-fallback sätter sidans **synliga** pris på alla varianter när den
inte kommer åt per-SKU-datan. Leonards rapport 2026-08-20: ett 4-pack och ett
6-pack båda 589 kr, två spegelstorlekar båda 1279 kr — den dyra varianten såldes
till den billigas pris. Tre lager täcker det nu, och de gör olika saker:

1. **Spärren** (`lib/import/price-trust.ts`, i pipelinen). Flaggar **precis** när
   båda gäller: fler än en variant delar exakt samma inköpspris **och** vi saknar
   per-SKU-data bakom dem. Produkten hålls som utkast med `priceUnverified` +
   badge i `/admin/queue`. Att alla varianter kostar lika mycket är i sig
   fullkomligt normalt (färgvarianter gör nästan alltid det) — det är *obekräftat*
   delat pris som är defekten. Spärren gissar aldrig fram ett pris.
2. **DS-räddningen i tillägget** (`extension/background.js → dsRescueVariants`,
   0.1.41). Utlöses på `dom-`-varianter i både agent- och bulkvägen. `idx-`
   räknas **medvetet inte** — de bär redan korrekta per-variant-priser, bara
   id:t saknades. Räddningen tömmer `swatchImages`; den bygger dem **inte** om
   (DS:s `imageUrl` är per SKU, inte per värde). Servern äger ombyggnaden.
3. **Efterhands-reparationen** (`lib/import/price-repair.ts` +
   `/api/cron/price-repair`) för produkter som redan ligger felprissatta.

### Så körs reparationen

GitHub Actions-workflowen **"Priser — rätta varianter som delar inköpspris"**,
samma nyckel-lösa upplägg som recensionsöversättningen (produktionen har
Wix-nycklarna, Actions har `CRON_SECRET`).

| Läge | Vad som händer |
|---|---|
| `scan` | Torrkörning. Skriver ingenting. Planen läggs i `tools/price-repair/scan-latest.json` |
| `apply` | Skriver — **bara** för de `wixProductIds` du räknar upp |

Det finns **ingen "kör allt"-flagga** i apply-läget. Listan med id:n är
kvitteringen på att en människa läst planen; ett pris som når kund ska ha
passerat ögon. Kopiera fältet `wixProductIds` ur scan-svaret.

**Tre fält skrivs per rättad variant, aldrig bara det första:** `grossSek` (Wix),
`costUsd` och `landedCostSek` (mappningen). Det sista är lätt att glömma och
värst att missa — lönsamhetsöversikten och **auktionens golvbud**
(`lib/auction/seed.ts → netSupplierCost`) läser båda det fältet, så rättas bara
priset ser marginalen fantastisk ut och auktionen kan sälja under inköp.

Fyra egenskaper som inte ska tas bort:

- **Oförändrat inköpspris → varianten rörs inte alls.** Blast-radien blir exakt
  defekten, och det är också vad som gör en bred kandidatsökning ofarlig: säger
  DS att priserna verkligen är lika blir planen tom.
- **Bara matchning på skuId.** Värdesignatur-matchning (`mapping-repair.ts`) är
  en gissning, och en felgissning här skriver ett pris till kund. Syntetiska id
  rapporteras omatchade — kör mappnings-reparationen i `/admin/mappings` först.
- **Marginalgolv + tak på prisändring** blockerar HELA produkten, aldrig bara en
  variant. Ett halvrättat pris är svårare att upptäcka än ett helt orört.
- **Wix skrivs före mappningen.** Går bara den ena igenom står kunden inför rätt
  pris medan bokföringen är gammal (nästa körning rättar det). Omvänd ordning
  hade gjort mappningen "rättad" medan kunden köper till fel pris — och då
  hittar ingen felet igen.

Rutten varnar också när prisreglerna hunnit ändras sedan importen: de rättade
varianterna får dagens påslag medan de orörda behåller sitt. Vill du ha ett
enhetligt påslag är omimport rätt väg, inte reparationen.

## Lagerlandet är en del av SKU:n — och lagret tar slut per land

AliExpress bakar in lagerlandet i själva SKU:n: "rosa garderob från Tyskland"
och "…från Spanien" är olika SKU:er med **olika saldo och olika pris**. Vid
import sparas EN av dem (`collapseShipFromAxis`, `lib/import/ship-axis.ts` —
lagret är aldrig ett kundval). Synken speglade sedan just den SKU:ns saldo till
Wix, så när vårt lager tog slut blev varan slutsåld i butiken trots att
säljaren hade dussintals kvar i ett annat EU-land (Leonards rapport 2026-08-20).

`lib/sync/warehouse-failover.ts` (steg 3.6 i `checkOne`) **pekar om mappningen**
till ett syskonlager i stället. Att bara visa syskonets saldo hade varit fel —
kundordern läggs på den sparade SKU:n, så en uppblåst siffra hade bara flyttat
felet till kassan. Körs före lagerskrivningen, så bytet slår igenom i samma
körning.

### Två landslistor, och de svarar på olika frågor

Det här är den vanligaste förväxlingen i kodbasen, och den kostade pengar tyst:

| Funktion | Frågan den svarar på | GB/NO |
|---|---|---|
| `isEuCountry` | "kommer paketet fram snabbt?" | **ingår** |
| `isEuCustomsUnion` | "kan vi köpa in därifrån utan tull?" | **ingår inte** |

**Regeln:** allt som **väljer ett lager att köpa från** använder
`isEuCustomsUnion` (`EU_CUSTOMS_UNION` i `lib/aliexpress/eu-countries.ts`). Allt
som beskriver **leveranstid för kunden** — EU-lager-ribbonen, discover-filtret,
`warehouseClass`, badgarna i tillägget — använder `isEuCountry`.

Leonard fångade förväxlingen 2026-08-21 på SucceBuy-klädstället
(1005005972133031): tilläggets "EU-först" bockade i GB-rader åt honom, och
`pickWarehouse` rankade dem lika bra som spanska. Storbritannien lämnade
tullunionen — tulldeklaration och importmoms, kostnader som aldrig syns i
marginalen. Lagerbytet vid slutsålt filtrerade redan rätt; det var **importen**
som valde fel. Nu läser alla tre lagervalen samma lista:
`ship-axis.ts → pickWarehouse`, `mapping-repair.ts → pickPreferred` /
`sortByWarehousePreference`, och `warehouse-failover.ts`.

Tillägget bär en egen kopia (`EU_TULL_CODES` i `extension/eu-countries.js` —
browser-global kan inte importera TS). Ett test i
`lib/aliexpress/eu-countries.test.ts` fäller om de glider isär, samma lärdom som
`SHIP_AXIS_RE`, som drev isär två gånger på två veckor.

I popupen **döljs** rader utanför tullunionen helt — men bara när det finns ett
alternativ inom den. Utan den brasklappen hade varenda Kina-produkt blivit
oimporterbar. Dolda rader bockas alltid av samtidigt: en dold rad som ändå följer
med i importen vore värre än en rad för mycket.

Tre spärrar, och de ska inte tas bort:

1. **Bara EU:s tullunion.** Ett USA-lager kan ha 500 i saldo, men mot en svensk
   kund betyder det tull och veckor i transit. Se tabellen ovan — `isEuCountry`
   duger inte här.
2. **Bara med känt pris.** Priset skiljer mellan lagren ($113,74 från USA mot
   $119,99 inom EU i Leonards fall). Utan det nya priset står `landedCostSek`
   kvar på det gamla och då ljuger både lönsamhetsöversikten och auktionens
   golvpris (`lib/auction/seed.ts` räknar sitt lägsta bud ur det fältet).
   Bytet räknar om `costUsd` + `landedCostSek` proportionellt.
3. **Bara om marginalen håller** (`MIN_FAILOVER_MARGIN_PCT`, netto mot netto).
   Att sälja med förlust är ett sämre utfall än att vara slutsåld en vecka.
   Avstådda byten loggas — de är ett beslut för en människa.

Besläktad, men med annan utlösare: `lib/sync/shippability.ts` byter lager när
frakt-API:t svarar NEJ för vår SKU. Den här byter när lagret är TOMT. Båda
använder `warehouseAlternativeSkuIds` och sätter `previousSupplierVariantId` +
`shipFromSwitchedAt`.

**Inte byggt:** fallback vid själva orderläggningen. AE:s felkod för slut i
lager finns inte dokumenterad någonstans i repot, och att gissa på en
sträng-matchning i `place-order.ts` riskerar dubbelbeställning. Synk-bytet
täcker det normala fallet; kvar är kapplöpningen där lagret tömts mellan
synk och order.

## En död listning FELAR INTE — den svarar 200 med fruset lager

Hela synkens borttagnings-klassificering byggde på att en försvunnen listning
får `getProduct` att **kasta** ("not found", "product offline", kod 7001xxx).
Det stämmer inte alltid. Tar säljaren ner varan svarar `aliexpress.ds.product.get`
ofta **200 OK med full kropp** och SKU-rader vars saldo står kvar **fruset på
sista kända värdet** — medan konsumentsidan säger *"Sorry, this item is no
longer available!"*.

För anroparen var det svaret omöjligt att skilja från en levande produkt. Det
föll igenom till gren 3 i `decideSyncOutcome` ("Listningen är aktiv") och synken
**skrev tillbaka lagret varje körning**. Leonards rapport 2026-08-24: Homcom-
borden (Aosom ES) hade lagersaldo hos oss och såldes, men gick inte att beställa
hos AE. Vi upptäckte det bara för att en kund gjorde det.

Beskedet fanns i basinfon hela tiden — ingen läste det:

| Fält i `ae_item_base_info_dto` | AE:s egen beskrivning |
|---|---|
| `product_status_type` | hyllstatus, `onSelling` = ligger uppe |
| `ws_display` | "reasons for removal of goods", t.ex. `expire_offline` |
| `ws_offline_date` | "the date the product was removed from the shelf", `0` = uppe |

`classifyListingAvailability` (`lib/aliexpress/client.ts`) tolkar dem till
`on_selling` / `offline` / `unknown`, och synken kastar `ListingOfflineError`
som går in i **samma** `removedStreak`-mekanik som ett kastat "not found".

Fyra egenskaper som inte ska tas bort:

- **`onSelling` vinner över ett satt `ws_offline_date`.** Fältet är ett datum
  för *en* nedtagning, inte nödvändigtvis den nuvarande — en gammal nedtagning
  på en återupplagd vara får aldrig nolla ett levande lager.
- **Saknad status → `unknown`, aldrig `offline`.** Tomt fält är ingen bevisning,
  och domen nollar lager. `unknown` beter sig exakt som före fältet fanns.
- **Egen felklass, inte en matchbar text.** Samma lärdom som
  `isDeliveryMethodMissing`: en klassificering som hänger på ordval går sönder
  tyst när någon skriver om meddelandet.
- **Två strikes, och sidan avpubliceras inte.** Ärver `REMOVED_STRIKES_REQUIRED`
  och SEO-beslutet från 2026-08-09 — lagret nollas, sidan ligger kvar, och en
  senare `onSelling`-läsning återställer produkten av sig själv.

### Var hyllstatusen gatas (audit 2026-08-24)

Detektionen i synken var bara ett av hålen. Samma verdikt läses nu i varje väg
där en död listning annars kunde nå kunden:

| Väg | Fil | Vad som händer vid `offline` |
|---|---|---|
| Dagliga synken | `sync/aliexpress-sync.ts` | `ListingOfflineError` → `removedStreak` → lagret nollas |
| Andra synkvägen | `api/aliexpress/sync-all` | lagret nollas direkt (rutten har inget strike-state) |
| Extension-import | `api/import` | 422 `listing_offline`, efter dubblettspärren |
| Bulk-/CSV-import | `import/from-url.ts` | kastar → raden failar synligt i bulk-kön |
| Discover-import | `admin/discover/actions.ts` | vägrar (går förbi /api/import:s guards) |
| Säljarbevakningen | `discover/supplier-watch.ts` | `listing_offline`-reject före enqueue |
| Alternativ-förslag | `aliexpress/alternatives.ts` | sållas bort före cache OCH vid cache-läsning |
| Leverantörsbyte | `admin/actions.ts` | vägrar — annars beställs ordern mot en död listning |
| Tilläggets produktdata | `api/aliexpress/product` | `inStock: false` |

`getInventory` returnerar sedan dess ett **objekt** med `listingAvailability`,
inte en naken array. Formen är vald med flit: funktionen anropade `getProduct`
och projicerade bort statusen, så varje konsument var blind *by construction*.
Nu är det ett typfel att glömma den, inte en tyst regression.

Genomgående regel: bara ett **uttryckligt** `"offline"` fäller. `"unknown"`
beter sig exakt som före fältet fanns.

### ☠️ Token-förnyelsen hoppade över i 30 dygn och lät token dö (2026-08-29)

Hittad direkt efter att fan-out-fixen ovan gjort synken körbar igen: den kom
igång, och fick **99 fel av 106 försök**, alla
`IllegalAccessToken — The specified access token is invalid or expired`.

Tokenraden berättade allt: `updatedAt 2026-07-30`, `expiresAt 2026-08-29T02:37`.
Den hade alltså inte förnyats på **30 dygn**, och dog i natt.

Felet är en storleksordning, inte en bugg i logiken:

| | |
|---|---|
| Workflowen kör | **var 12:e timme** |
| Rutten hoppade över om det fanns mer än | **2 timmar** kvar |

En körning måste alltså råka landa i de SISTA två timmarna för att förnya något
alls — chansen är 2/12. Fyra gånger av fem hinner token dö emellan. Så gick det
till: körningen 21:53 såg 4,7 h kvar och hoppade över, token dog 02:37, nästa
körning låg 09:53.

☠️ **Och workflowen rapporterade `success` hela vägen.** Den kollar bara
HTTP-statusen, och ett "hoppade över" ÄR 200. Sjätte gången samma lärdom.

Kommentaren vid konstanten påstod dessutom att access_token lever "~48h". Mätt:
**30 dygn**. Livstiden spelar dock ingen roll för buggen — schemat gör det.

**Regeln: skip-fönstret måste rymma minst två schemalagda körningar.** Det är
nu `24 h` mot ett 12-timmarsschema. Ändras schemat måste talet följa med.

⚠️ **Priset var högre än en utebliven synk.** Eftersom `refreshAndPersist`
ROTERAR refresh-token vid varje förnyelse höll 30 dygn utan en enda förnyelse
även *refresh*-token att åldras ut:

```
IllegalRefreshToken: The specified refresh token is invalid or expired
```

Den läker INTE av sig själv. Enda vägen tillbaka är ny OAuth för hand:
öppna **`/api/aliexpress/auth`** i en webbläsare, godkänn hos AliExpress, klart
(callbacken sparar de nya tokens). Rutten kräver ingen hemlighet.

Morgonmejlet larmar sedan dess på utgången token, och varnar när mindre än
ETT schemaintervall (12 h) återstår — då har den automatiska förnyelsen redan
haft minst ett försök och missat, alltså är något verkligt fel. Ett tidigare
utkast varnade vid 48 h; det hade gett en varningsrad varje månad i det
NORMALA förloppet, strax innan token förnyade sig själv, och en varning man
lär sig ignorera är värre än ingen alls.

Invarianten är dessutom testad mot verkligheten: `route.test.ts` läser
cron-raden ur `refresh-tokens.yml` och fäller om tröskeln inte rymmer två
körningar. Ändras schemat fäller testet i stället för produktionen.

### Vid felsökning: kolla i den här ordningen

1. **`SYNC_DRY_RUN`.** Default är `"true"` — allt som INTE är strängen `"false"`
   betyder att cronen läser, loggar och mejlar men **aldrig skriver till Wix**.
   Fraktbarhetskontrollen (steg 3.5) hoppas då över helt. Ett tyst dry-run ger
   exakt samma symtom över hela katalogen.
2. **Råsvaret för produkten:** `/api/admin/freight-check?...&raw=1`
   (`debugRawProductGet`). Läs `product_status_type` + per-SKU-lagret. Där ser
   du om AE kastar eller svarar 200 med fruset saldo.
3. **Tidsfönstret.** Även när allt fungerar är kedjan långsam med flit: sync var
   4:e timme, två strikes i rad innan lagret nollas, och fraktbarhetsnejet
   kräver två bekräftelser med ett dygns spridning (`NEGATIVE_MIN_SPAN_MS`).

### Strikes räknas per NÅDD produkt — inte per körning

Det här är den lätta missläsningen, och den kostade tre dygn per död listning.
`REMOVED_STRIKES_REQUIRED = 2` ser ut att betyda "två körningar", alltså åtta
timmar. Men `removedStreak` ökar bara när produkten faktiskt **nås** i loopen,
och sorteringen (äldsta `lastCheckedAt` först) lade en just nådd produkt **sist
i kön**. Två strikes låg därför en hel ROTATION isär:

| Väg | Reaches | Verklig tid |
|---|---|---|
| Bestseller / nyss köpt (`priority=high`) | 2 | ~8 h |
| Normal produkt, DS säger `offline` | 2 | ~72 h |
| Normal produkt, döden syns som oklassat fel | 6 | 9–17 dygn |

> En tidigare version av det här stycket påstod "ett dygn … är förväntat".
> Det gällde bara `priority=high`. Rättat 2026-08-24.

`orderForRotation` (`aliexpress-sync.ts`) ger därför produkter med **öppen
strike-serie** förtur i nästa körning, med tak `OPEN_STREAK_PRIORITY_CAP = 30`
så en masshändelse inte svälter rotationen. `errorStreak` ger medvetet INTE
förtur — den stiger för hela katalogen samtidigt vid AE-driftstörning.

**Cronen går varannan timme sedan 2026-08-25** (`0 */2 * * *`). Tillsammans med
förturen ovan ligger två strikes nu ~2 h isär i stället för en hel rotation, och
tiden till FÖRSTA observationen halveras (~20 h i stället för ~40 vid 980
mappningar).

Priset är att bevisen ligger tätare: en AE-driftstörning som varar över två
timmar kan nu hinna ge två strikes där den förut gav en. Utfallet är dock
begränsat och självläkande — lagret nollas, sidan ligger kvar publicerad,
produkten syns i `/admin/sync-alerts`, och en senare `onSelling`-läsning
återställer den. Avvägningen är medveten: att vara oköpbar några timmar är ett
billigare fel än att sälja något som inte går att beställa.

### Ett tyst dry-run är det farligaste läget

`SYNC_DRY_RUN` är default `"true"`, och i dry-run **fryses strike-fälten**
(`removedStreak`, `zeroStreak`, `errorStreak`). En permanent torrkörande cron
kan alltså aldrig nå strike 2 — ens i principen. Morgonmejlet kunde inte se
det (rollupen läste aldrig `dryRun`, digesten filtrerar bort `dry_run`-rader),
så resultatet blev "✅ allt rullar" medan butiken var oskyddad. Rollupen räknar
nu torrkörningar och statusraden säger det rakt ut.

**Fortfarande inte byggt:**

- **Tillgänglighetskoll vid orderläggningen.** `place-order.ts` hämtar produkten
  för prisvakten och fraktvalet men tittar varken på lager eller hyllstatus.
  Kapplöpningen mellan synk och order är öppen. Medvetet nedprioriterad
  2026-08-24: målet är att felet aldrig ska nå kassan.
- **Synk-livlighet i `health-check`.** Den pingar bara Wix Stores och märker
  aldrig att synken slutat köra. Övervägt 2026-08-24 men utelämnat: routen har
  EN `consecutiveFails`-räknare och EN larm-strypning, så en Wix-utage och en
  stannad synk hade delat tillstånd och larm. Kräver egen state-nyckel.
  Morgonmejlet larmar däremot sedan 2026-08-28 (se nästa avsnitt) — det är
  billigare och räckte för att fånga fallet.

### ☠️ Synken låg nere i 57 timmar och ingenting sa till (2026-08-28)

Hittad i en audit, inte av ett larm. Sista lyckade körningen var
**2026-08-26 kl 10:03**; därefter svarade `/api/cron/aliexpress-sync` **500 vid
varje körning** — 28 körningar i rad. Lager och priser för hela AE-katalogen
stod stilla, och slutsålda eller nedtagna produkter förblev köpbara.

Orsaken var en **obegränsad fan-out** i `runDailySync`: synk-tillståndet lästes
med `Promise.all(mappings.map(...))`, alltså EN Wix-läsning per produkt, alla
avfyrade i samma ögonblick. Det höll på 980 produkter och slutade hålla utan att
någon rörde koden — och Aosom-importen tog sedan talet till **5 423 samtidiga
anrop**.

☠️ **Bomben exploderade när katalogen växte, inte när koden ändrades.** Sista
commiten före haveriet låg ett dygn tidigare, och samma kod gick igenom fyra
lyckade körningar samma morgon. Det finns ingen commit att skylla på, och en
`git bisect` hade inte hittat något.

Det var dessutom **osynligt i alla tre spåren**, vilket är det som gjorde 57
timmar möjliga:

| spår | vad det visade |
|---|---|
| Vercel-loggen | `GET /api/cron/aliexpress-sync 500` — **noll** loggrader |
| `FyndplatsAudit` | ingen `aliexpress-sync-fatal`-rad alls |
| Morgonmejlet | *"Synken: 0 körningar, 0 produkter kollade"* i grå statusremsa |

Fatal-raden saknades för att lambdan **dog** av fan-outen — ruttens `catch`
hann aldrig köra. Ett `try/catch` skyddar bara mot fel som kastas, inte mot en
process som tar slut.

Två lagningar, och båda behövs:

1. **`mapWithConcurrency`** (`lib/concurrency.ts`, default 8, env
   `SYNC_STATE_READ_CONCURRENCY`). Rader loopen ändå hoppar över kostar
   dessutom ingen läsning alls — Aosom-raderna var 4 419 av 5 423, alltså
   merparten av fan-outen. Hjälparen låg tidigare som en privat kopia i
   `eu-discover.ts`; den är flyttad hit i stället för klonad, av samma skäl som
   `SHIP_AXIS_RE` och `EU_TULL_CODES` — tvillingar glider isär.
2. **Noll körningar får en egen larmrad i morgonmejlet** (`guard.ts`), före
   torrkörningsraden: har den inte kört spelar skrivläget ingen roll. Tre
   tester låser det.

☠️ Regeln, femte gången: **ett misslyckande som ingen kan se är värre än ett
som skriker.** Och den nya, som är dyrare: **en obegränsad fan-out skalar med
katalogen — den är en tidsinställd bomb, inte en bugg.** Leta efter
`Promise.all` över något som växer.

## Recensioner: hämtas server-side från AliExpress, översätts i chatten

Recensionskedjan (filtrering → `FyndplatsImportedReviews` → moderering i
`/admin/reviews` → produktsidans "Kundrecensioner") har funnits sedan 2026-07-08 men stod **tom på
876 produkter** fram till 2026-08-16. Orsaken var inmatningen, inte kedjan:

- Enda vägen in var tilläggets DOM-skrapa (`extension/content.js → scrapeReviews`),
  och AE **lazy-laddar** recensionssektionen — klickar man importera högst upp på
  sidan har den oftast inte renderats, så skrapan returnerade `[]`.
- **Bulk-/CSV-importen rör aldrig recensioner** (`lib/bulk-import/worker.ts` har
  ingen webbläsare). Katalogens senaste ~800 produkter kom in den vägen.

`lib/aliexpress/reviews.ts` hämtar dem nu i stället från AE:s feedback-endpoint
(ren JSON, inget tillägg, $0). Två äkthetsspärrar sitter i mappningen och ska inte
tas bort: recensioner som AE själv markerar som **AI-genererade** (`aigc`) och
sådana som inte är publicerade hos AE (`status !== "1"`) släpps aldrig igenom.
Anonyma konton ("AliExpress Shopper") får inget namn vidare — annars blir varenda
rad "A.S." och sidan ser förfalskad ut.

### Vad som faktiskt gallrar — mätt 2026-08-25

Den vanliga gissningen är att stjärnfiltret stryper hämtningen. Det gör det inte.
Mätt över nio verkliga AE-listningar (204 råa recensioner):

| Regel | Kvar | Kostnad |
|---|---|---|
| `minRating: 3` | 199/204 | **2 %** — nästan allt hos AE är redan 3+ |
| `minLength: 50` | 126/204 | **38 %** |
| spam + dubblett + utlandsleverans | 116/204 | 5 % |
| `DEFAULT_MAX_PER_PRODUCT: 8` | 55/116 | **53 % av det godkända** |

Samtidigt visade **432 av 908 publicerade produktsidor noll recensioner**. Bristen
är alltså BREDD (produkter utan någon recension), inte DJUP (fler per produkt) —
att höja taket från 8 hjälper bara de ~40 produkter som redan har flest.

Två ändringar följde, båda riktade mot bredden:

- **`AE_REVIEW_DEFAULT_PAGES` 2 → 4.** Två sidor är 40 råa; loopen tog slut mitt i
  högen på listningar med fler. Självbegränsande: `fetchAeReviews` bryter på
  `hasNext`, så en tunn listning kostar fortfarande ett anrop.
- **Räddningssvepet (`REVIEW_RESCUE_MIN_LENGTH = 25`).** Gav 50-teckengolvet
  INGENTING görs urvalet om med 25. Golvet sänks aldrig när något klarade 50 — en
  kort äkta recension slår ingen recension, men bara när alternativet verkligen är
  ingen. Ett `minLength` som anroparen satt själv rivs inte (det är ett beslut, och
  överdraget finns för att svepa upp det ett gammalt filter slängde).

Räddningssvepet går INTE förbi någon annan spärr: betyg, spam, dubbletter och
utlandsleverans gäller oförändrat i båda svepen.

Kvar som medvetet orört: taket på 8 i backfillen. Fler hämtade recensioner blir
inte fler synliga — de blir en längre `pending`-kö att skriva om för hand.

### Så körs den

| Vad | Anrop |
|---|---|
| En produkt | `POST /api/reviews/import` med `{ wixProductId }` — utan `reviews` hämtar rutten själv |
| Hela katalogen | `GET /api/cron/review-backfill` |

`review-backfill` är **torrkörning som default** — utan `?dryRun=false` skrivs
ingenting, du får bara siffrorna. Parametrar: `limit` (produkter per körning,
default 25), `maxPerProduct` (default 8), `includeExisting`, `onlyPublished`,
`ignoreCheckedAt`.

Rutten är **inte schemalagd**. Den var det en kort stund 2026-08-16, men Leonard
valde bort maskinöversättning helt ("skit i deep l") — texterna skrivs i stället
om av Claude i chatten, gratis, och sparas via `/admin/reviews`. En
översättnings-cron i bakgrunden hade motverkat det beslutet. Vill du tillbaka
till schemalagd hämtning: lägg in cron-raden igen — hämtningen i sig är gratis.

Backfillen stannar dessutom själv efter **240 s** (`timeBudgetMs`, mot ruttens
`maxDuration` 300 s). Varje recension kan dra upp till tre mediaimporter med
retry, så en körning hann annars dödas mitt i en produkt.

Körningen **konvergerar**. Varje produkt AE svarat på stämplas med
`reviewsCheckedAt` i mappningen — även när AE inte hade några recensioner. Utan
den stämpeln skulle de ~40 % recensionslösa produkterna hämtas om vid varje
körning i all evighet. Produkter som redan har recensioner hoppas över helt, och
en **strypt** hämtning stämplas aldrig (då hade rate-limiting dolt produkten i en
månad). Omkontroll efter `REVIEW_RECHECK_DAYS` (30) — nya recensioner dyker upp
hos AE över tid.

### Bilderna flyttas hem — men vid olika tillfällen i de två vägarna

Kundbilder får aldrig ligga kvar på leverantörens domän när de visas för kund.
Hemflytten sker i `lib/wix/media-import.ts`, men **de två inmatningsvägarna gör
det vid olika tillfällen**, och den skillnaden har lurat mer än en läsare:

| Väg | Bilden flyttas hem |
|---|---|
| Kön (`review-queue` → `queueReviewsForProduct`) | **Vid publicering** — raden sparas `pending` med AE-adressen kvar |
| Direktimport (`/api/reviews/import` → `importReviewsForProduct`) | **Direkt vid skrivning** |

En `pending`-rad som pekar på `aliexpress-media.com` är alltså **normalt**, inte
ett fel. Att flytta hem bilder för rader som kanske aldrig godkänns vore slöseri
med både anrop och medialagring. Grinden sitter i `lib/store/reviews.ts`:
`isVisibleStatus(status) ? await withOwnImage(review) : review`.

Mätt 2026-08-22: 203 synliga recensioner med bild, **alla** på vår egen domän;
31 rader med AE-adress, **noll** av dem synliga. Kontrollera alltid `status`
innan du drar slutsatsen att mediaimporten är trasig — annars felsöker du
designen.

**Misslyckas uppladdningen behålls källadressen** (2026-08-22). Direktimporten
slängde tidigare bilden tyst: ingen logg, `hasImage:false`, och källadressen
sparades ingenstans — felet gick varken att upptäcka eller reparera, eftersom
`repairImages` bara letar efter rader som FORTFARANDE bär en leverantörs-URL.
Nu räknas missarna i svarets `bildmissar` och lagas av nästa repairImages-körning.

### Betygen skickas INTE till Google

Butiken (`headless-site`) har `PRODUCT_REVIEW_SCHEMA`, **default av**. Recensions-
texten visas för kunden, men `aggregateRating`/`Review` läggs inte i produktsidans
JSON-LD medan omdömena är AliExpress-köpares. Googles riktlinjer för review
snippets vill ha betyg från sajtens egna användare. Sätt `=on` först när datan är
förstahands (Trustpilot Product Reviews / egna kundrecensioner). Se
`lib/review-schema.ts` i butiksrepot.

### Översättningen görs i chatten — DeepL är borttaget (2026-08-19)

Kedjan har **ingen översättningstjänst** längre. `lib/translate/` finns inte;
`DEEPL_API_KEY` och `DEEPL_MONTHLY_BUDGET` läses inte av någon kod och kan tas
bort ur Vercel. Wix-kollektionen `FyndplatsTranslationUsage` skapas inte längre
av `scripts/ensure-reviews-collection.mjs` och kan raderas i Wix.

Det var redan så det fungerade i praktiken — cronen var avstängd sedan
2026-08-16 — men koden bar kvar API-nyckel, månadsbudget, ett användningslager
och en **tyst fallback som sparade originaltexten** när budgeten tog slut.

Följdändringen är den viktiga: importerade recensioner **auto-godkänns inte
längre**. De sparas som `status: "pending"` med källtexten i både `textOriginal`
och `textSwedish`, och blir svenska när någon skriver om dem i `/admin/reviews`
(`editReviewText` sätter `edited` → först då syns de publikt). Samma regel som
för butikens egna kundomdömen. Alternativet — direktpublicering utan
översättare — är exakt vad den gamla budget-fallbacken gjorde: engelska omdömen
på en svensk produktsida.

Kostnaden är därmed **noll**, i både credits och tecken. Kvar som mått är
`chars` per produkt i backfill-svaret: hur mycket text som väntar på att skrivas
om, inte vad något kostar. Mätt 2026-08-16 på 40 slumpade publicerade produkter
(692 publicerade mappningar av 876): träffkvot 60 %, ~240 tecken/produkt vid
tak 8 — alltså ~166k tecken för hela butiken. Cirka 40 % av produkterna får inga
recensioner alls, mest nya Aosom-EU-listningar som inte hunnit få några hos AE.

Övriga LLM-/kostnads-env-variabler dokumenteras i **`LLM-CONFIG.md`**.
