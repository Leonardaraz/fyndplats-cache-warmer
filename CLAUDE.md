# Fyndplats cache-warmer — projektanvisningar

## Så här jobbar vi: bunta ihop deploys

**En arbetsdag ska bli en eller två deploys, inte fem.** Samla dagens
ändringar på grenen och merga när de hänger ihop — merga inte varje fix för
sig så fort den är grön.

Samma regel står i butiksrepots `CLAUDE.md` (grenen `headless-site`). Den
finns på båda ställena med flit: repot bär två orelaterade historier med var
sin instruktionsfil, och en session som jobbar här läser aldrig den andra.

### Varför — mätt, inte antaget

Vercel-fakturan 2026-09-04, sju dagar in i cykeln, 11,84 av 20 dollars
inkluderad kredit förbrukad:

| Rad | Belopp | Andel |
| :-- | --: | --: |
| **Build CPU Minutes** | **$5,80** | **49 %** |
| Observability Events | $1,88 | 16 % |
| ISR Writes | $1,80 | 15 % |
| Fluid Provisioned Memory | $0,78 | 7 % |
| Fluid Active CPU | $0,51 | 4 % |

Byggen är halva notan. Veckan innehöll en dag med **fem merges** för arbete
som hade rymts i ett eller två byggen.

**Och en deploy kostar två gånger.** Butiken tömmer sin ISR-cache vid varje
deploy, så ~1 580 av 1 622 produktsidor blir kalla; första besökaren på varje
betalar 0,86–1,52 s i stället för 0,15. Timcronen värmer upp dem igen, men
det är ytterligare 1 622 renderingar. Färre deploys är alltså både billigare
OCH snabbare för kunden.

### Särskilt för import- och poleringspass

Ett pass som rör dussintals produkter ska bli **EN PR, mergad sällan** — inte
en PR per produkt.

- Öppna en gren för hela passet och lägg alla produkter där.
- Merga när passet är klart, inte efter varje produkt som blivit bra.
  En halvfärdig gren skadar ingen; den ligger bara och väntar.
- Går arbetet över flera dagar: låt grenen leva och merga när den är klar.
- Poleringen är sällan brådskande. Ingen kund väntar på en omskriven
  produkttitel — det är precis den sortens arbete som ska samlas ihop.

### Undantaget

En bugg som skadar kunder just nu får sin egen deploy direkt. Det är
kostnaden värd. Allt annat väntar in sina syskon.

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

## En tom cron-tugga ska vara TYST (2026-09-04)

`bulk-import-worker` går **varje minut, dygnet runt** — 1 440 körningar per
dygn, och nästan alla har ingenting att göra. Varje sådan skrev ändå en
`[bulk-import] trigger=cron path=…`-rad, och tillsammans med `health-check`
(var femte minut) stod de två för **~91 % av all loggvolym**.

Det är inte en kostnadsfråga utan en **läsbarhetsfråga**, och huset har redan
skrivit ned regeln två gånger: en logg som till nio tiondelar är brus är en
logg ingen läser — och då är även det äkta felet borta. Samma argument som mot
att varna vid 48 h på token-förnyelsen, och som mot ett rött synk-jobb vid varje
svep.

`runBulkImportWorker` returnerar nu tyst på en tom kö. Två saker att inte röra:

1. **Kollen ligger FÖRE routingbeslutet.** Båda vägarna (realtid och Batch API)
   läser samma kö ur samma store och gör exakt samma tidiga återvändning på en
   tom lista. Tystnad i bara den ena hade varit en tvilling som glider isär.
2. **Cadensen är oförändrad.** Att glesa ut cronen hade varit den uppenbara
   fixen och den fel: varje tick processar tio köposter, så fem minuter mellan
   ticksen gör ett hundraposters jobb fem gånger långsammare.

⚠️ **HALVERAT, INTE BORTA — och den första versionen av det här avsnittet
påstod fel.** Den skrev att fixen tar bort "en routing-rad i Vercel-loggen".
Det gör den inte: routing-raden är VERCELS egen, en per anrop, och den går
inte att tysta från applikationskod. Uppmätt i drift 2026-09-04, samma cron
före och efter deployen:

```
före  (dpl_8FCXMC…, 11:16–11:18)   GET /api/cron/bulk-import-worker 200
                                   [bulk-import] trigger=cron path=batch …
efter (dpl_3jhXDR…, 11:35–11:40)   GET /api/cron/bulk-import-worker 200
```

En tom tugga kostar alltså **en loggrad i stället för två**. Vår rad är borta;
Vercels står kvar och är 1 440 per dygn oavsett vad koden gör.

Vill man åt den återstående raden finns bara två spakar, och ingen av dem är
kod i det här repot: **glesa ut cronen** (avvisat ovan — det gör bulk-importer
flera gånger långsammare) eller **filtrera i Vercels observability/log drain**,
vilket är en inställning i dashboarden. Samma sak gäller `health-check`.

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

   ✅ **Lagat 2026-08-29.** `computeProfit` momsade av intäkten men drog
   `landedCostSek` rakt av, trots att fältet är lagrat INKLUSIVE moms —
   lönsamhetsöversikten underskattade vinsten med 25 % av inköpet. Bäddsoffan
   `efaa0c7b` rapporterades som **−112 kr och −4 % marginal** där verkligheten
   är **+475 kr och +16,8 %**. `SUPPLIER_VAT_RATE` och `netSupplierCost` bor nu
   i `lib/import/pricing.ts` och `lib/auction/seed.ts` ÄRVER dem, så de två
   vägarna inte kan bli oense igen. Testerna som kodade in felet är omskrivna.
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

### Sex egenskaper som inte ska tas bort

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
6. ☠️ **Facit för priset är BUTIKEN, inte mappningen** (`jamforelsePris`,
   sedan 2026-09-02). Mappningens `grossSek` är vad vi TROR att kunden ser;
   Wix är vad kunden faktiskt ser, och en trasig skrivning får de två att glida
   isär permanent — se avsnittet nedan. Butikens priser läses i bulk FÖRE
   loopen (`listV3ProductPrices`, 100 produkter per anrop) och samma
   massfel-spärr gäller som för feeden: färre än `MIN_WIX_PRODUKTER` (500)
   produkter är ett LÄSFEL och kastar, för en tom prislista hade sett ut som
   "alla priser har ändrats" och skrivit om hela katalogen.

Wix skrivs före mappningen, samma ordning och samma skäl som `price-repair`.
Alla tre kostnadsfälten skrivs — `grossSek`, `costUsd` och `landedCostSek` —
aldrig bara priset.

### ☠️ Lagerskrivningen sprang ihjäl sig mot Wix edge-spärr (2026-09-02)

Hittad genom att KÖRA synken skarpt, inte av ett larm. Torrkörningen kan inte
se det här — den skriver aldrig, så den vet inte vilka skrivningar som skulle
falla.

| försökta lagerskrivningar | fel |
|---:|---:|
| 40 | **0** |
| 1 150 | **521** |
| 2 095 | **1 190** |

Alla fel är `429` med en **HTML-kropp**, alltså Wix EDGE-spärr och inte
API-nivåns JSON-fel — samma tvåa som media-städningen redan mätt upp
(2026-08-28). Skillnaden mot media-städningen är att synken inte hade
NÅGONTING: ingen paus, inget återförsök. Den skrev ett `bulk-update-inventory`
per produkt så fort den kunde, och Wix kapade efter ~600.

Två lagningar, och den andra är den som biter:

1. **Återförsök med backoff** i `bulkUpdateInventoryQuantities` (1/3/8 s, följer
   `Retry-After`). Fångar API-nivåns 429, 5xx och nätverksfel. ☠️ `wixHeaders()`
   ligger UTANFÖR loopen — ett saknat token är inte övergående, och inuti
   try-blocket gjordes det om fyra gånger och rapporterades som "nätverksfel".
   Ett test fångade just det.
2. ☠️ **Pacing (`AOSOM_WRITE_DELAY_MS`, default 120 ms).** Det är den här som
   håller edge-spärren borta, för den går enligt husets egen mätning **inte att
   vänta ut** inom ruttens 300 sekunder. Samma medicin som
   `MEDIA_UPLOAD_DELAY_MS` och `FREIGHT_CALL_DELAY_MS`: den billigaste kuren mot
   en strypning som utlöses av tempo är att inte springa.

☠️ **Och felet var osynligt i audit-raden.** `misslyckade` stod inte i den, och
raden skrevs bara när något LYCKADES — så en körning som inte kunde skriva
någonting alls såg ut exakt som en körning där allt redan stämde. Rutten svarar
dessutom 200. Nionde gången samma lärdom: ett svar utan fel är inget kvitto.

**Verifierat i drift samma dag**, i den ordning som gör talen meningsfulla:

| körning | lager skrivna | priser | fel |
|---|---:|---:|---:|
| skarpt svep FÖRE pacing | 905 | 17 | **1 190** |
| skarpt svep EFTER pacing | 1 110 | 15 | **1** |
| torrkörning direkt efteråt | **1** | **0** | 0 |

Sista raden är kvittot: 4 514 mappningar granskade, och bara den enda produkt
som föll på en övergående 429 vill fortfarande skrivas. **Noll priser** vill
skrivas — mappningen och butiken är i fas över hela katalogen, vilket är exakt
vad `jamforelsePris` byggdes för.

⚠️ **En hypotes som mätningen slog ihjäl.** Innan felen var kända såg det ut som
att cronen svälter svansen: en torrkörning visade 2 095 väntande lagerskrivningar
och 100 % täthet i de sista varven, vilket pekade på att `limit` alltid förbrukas
i början av artikelnummer-ordningen. Så var det inte. Ryggsäcken var de
MISSLYCKADE skrivningarna — en produkt vars skrivning föll ser ut att "vilja
skrivas" vid varje ny granskning. Med skrivningarna lagade konvergerade katalogen
på fyra varv, och punkt 4 ovan står oemotsagd. Mät innan du bygger om.

⚠️ **Massfel fäller svepet, en enstaka miss varnar.** Både golv (10 st) och andel
(2 %) krävs, samma form som `MASSFEL_ANDEL`/`MASSFEL_GOLV` i migreringens
verdikt. Ett rött jobb vid varje svep — och en övergående 429 av tusen
skrivningar är att vänta — lär mottagaren att sluta läsa, och då är även det
äkta larmet borta. Missen är ändå aldrig tyst: grupperad på orsak i loggen, i
audit-raden och i svaret.

### ✅ Skrivningarna är batchade sedan 2026-09-04 — spärren är irrelevant, inte uthärdlig

Raden ovan stod länge som "kvar som strukturellt": `bulkUpdateInventoryQuantities`
är ett BULK-API som tar en array, men synken anropade den med EN produkt i taget.
Loopen går nu i **tuggor om 50 produkter** (`CHUNK_PRODUKTER`): en läsning och
en skrivning per tugga i stället för två anrop per produkt.

| | före | efter |
|---|---:|---:|
| Wix-anrop per svep (~4 500 mappningar) | ~1 800 | **~180** |
| Anrop i det uppmätta 429-fönstret | 2 095 → 1 190 fel | ryms med marginal |

☠️ **Hela ombyggnaden vilar på EN mätning: bulk-svaret bär radens id.** Uppmätt
mot skarpa Wix, båda utfallen:

```
fel:      {"itemMetadata":{"id":"2f3b…","originalIndex":0,"success":false,
           "error":{"code":"INVALID_REVISION","description":"Outdated revision…"}}}
framgång: {"itemMetadata":{"id":"2f3b…","originalIndex":0,"success":true}}
bulkActionMetadata: {totalSuccesses, totalFailures, undetailedFailures}
```

Attributionen behöver alltså inte lita på ORDNINGEN. Det är avgörande, för
*"Wix före mappningen"* är en garanti **per produkt**: hade svaret varit
aggregerat kunde en enda revisionskonflikt i ett anrop med femtio produkter
antingen ha fällt hela tuggan eller bokförts på fel produkt — tyst, samma klass
som `sku`-förväxlingen. Mätrutten är `/api/admin/wix-inventory-probe`
(workflow-lägena `api-matning` och `api-matning-skriv`); den skriver ingenting
utan `?write=1`, och det den då skriver är samma saldo tillbaka.

Uppmätt samtidigt, och därför inte gissat: `$in` på `productId` fungerar (fem id
gav fem poster mot ett för ett enskilt), läsningens sida är **100**, och
`bulk/inventory-items/update` svarar `200` med ett individuellt utfall per rad
på **20, 50 och 100 rader**. 101 är oprövat — därav `BATCH_LAGERRADER = 100`.

**Sex egenskaper som inte ska tas bort:**

1. ☠️ **En mappning skrivs bara för rader Wix uttryckligen bekräftat.**
   `tolkaBulkUtfall` har tre konservativa regler, alla åt samma håll: en
   SKICKAD rad Wix inte nämner är inte bevisat skriven; `undetailedFailures`
   gör HELA anropet oadresserbart; saknat id härleds ur `originalIndex` mot det
   vi faktiskt skickade. Hellre en skrivning för mycket nästa körning än en
   mappning som ljuger.
2. ☠️ **En produkt med FLERA lagerrader skrivs bara om ALLA går igenom.**
   Halvskrivet lager är svårare att upptäcka än orört.
3. ☠️ **`limit` är EXAKT — tuggan kapas mot det som återstår**
   (`min(CHUNK, limit - skrivna)`). En tugga med N produkter kan aldrig ge fler
   än N skrivningar. Utan kapningen hade `limit: 1` skrivit hela första tuggan,
   och `limit` finns för att hålla rutten innanför sina 300 sekunder. Ett test
   på markören fångade just det.
4. ☠️ **`utanLagerrader` räknas, och de produkterna stämplas INTE.** Den gamla
   `setStock` svarade `if (poster.length === 0) return;` — inget fel, ingen
   räknare — och loopen bokförde ändå produkten som synkad, för alltid. Nionde
   gången samma klass: ett svar utan fel är inget kvitto.
5. **Torrkörningen LÄSER lagret.** Den ska säga sanningen om vad en skarp
   körning skulle göra, och `utanLagerrader` går inte att veta utan att titta.
   Läsningar ändrar ingenting.
6. **Pacingen ligger kvar** trots att anropen är ~40 i stället för ~2 000. Den
   kostar fem sekunder på ett helt svep, och den är billigare än att mäta upp
   var den nya gränsen går.

**Verifierat i drift 2026-09-04**, i den ordning som gör talen meningsfulla:

| körning | granskade | lager | priser | fel | varv | tid |
|---|---:|---:|---:|---:|---:|---:|
| torrkörning FÖRE | 4 542 | 676 (skulle) | 0 | 0 | 2 | 2:52 |
| skarpt lagersvep | 4 542 | **677** | — | **0** | 2 | 1:41 |
| torrkörning EFTER | 4 542 | **0** | **0** | **0** | **1** | 1:34 |

Sista raden är kvittot: efter ETT skarpt svep vill ingenting skrivas om. Jämför
med samma katalog 2026-09-02, före batchningen:

| | lager skrivna | fel |
|---|---:|---:|
| skarpt svep FÖRE pacing | 905 | **1 190** |
| skarpt svep EFTER pacing | 1 110 | 1 |
| **skarpt svep, batchat** | **677** | **0** |

`utanLagerrader` är **0** — varenda mappning har lagerrader i Wix, alltså finns
ingen föräldralös katalogdel som tyst bokfördes som synkad av den gamla vägen.

⚠️ **En ny mätning, ingen åtgärd: `lagerDrift`.** Läsningen ser numera butikens
FAKTISKA saldo, och räknar hur många produkter där det skiljer sig från det
mappningen tror att den skrev. Det är exakt samma frågeställning som
`jamforelsePris` byggdes för på PRISET — och där kostade förväxlingen en månad
och tjugo rader. Lagret triggas fortfarande på mappningens tal, alltså har det
samma teoretiska hål. Talet är medvetet bara **mätt**: att byta facit vore en
beteendeändring med hela katalogen som blast-radie, samma dag som loopen byggs
om. Mät först, som huset gjorde med priserna.

☠️ **Och mätningen är gjord: `lagerDrift` är 1 av 4 542** (2026-09-04, samma
tal i tre körningar i rad). Lagret har alltså INTE det hål priserna hade — där
var svaret tjugo rader. Att göra butiken till facit även för lagret är därmed
inte akut, och den enda drivande raden rättas av nästa körning som rör den.
Talet står i loggraden och i workflow-summeringen; går det upp är det ett
besked, inte brus.

### Så körs den för hand

Schemalagd i Vercel (`20 */6 * * *`), men workflowen **"Aosom — synka lager och
priser"** (`workflow_dispatch`, lägena `torr` · `skarp` · `lager`) kör den på
begäran — samma nyckel-lösa upplägg som importen och prisreparationen.

Den fanns inte fram till 2026-09-02, och det var en verklig lucka: `CRON_SECRET`
är märkt Sensitive i Vercel och går inte att läsa tillbaka ens för ägaren, så
att verifiera en ändring i synken krävde att man väntade på nästa schemalagda
körning och sedan gissade av en 200:a vad den gjort. Rutten loggar dessutom en
summeringsrad sedan samma dag — Vercel visade annars bara `GET … 200`.

Svepet loopar markören som importen gör, men sparar den INTE i grenen: synken
konvergerar utan sparad markör (punkt 4 ovan). `misslyckade > 0` fäller jobbet.

### `prisLast`: en rad där synken räknar om men INTE skriver (2026-09-05)

Synken tillämpar husets regel (`1,20 × landedCostSek`, charm99) på varje
Aosom-rad var sjätte timme. Det är rätt för sortimentet i stort — men en rad kan
ha ett pris som satts av något annat än kostnaden.

Fallet som byggde låset: kontorsstolen `f13cd415` såldes som AliExpress-vara på
**1 299 kr**. Leonards regel 2026-09-05 (*"alla ska peka om mot Aosom DE oavsett
om de är billigare eller inte"*) mappade om den till `921-672V00BG`, och därmed
gäller Aosom-regeln på raden: nästa synk hade skrivit **1 099 kr**. Sänkningen
kom av att vi bytte LEVERANTÖR, inte av att marknaden rört sig — och kunderna
betalar redan 1 299.

Utan låset finns ingen väg dit. Skriver man priset för hand räknar nästa körning
fram regelpriset igen, ser en skillnad mot butiken och skriver tillbaka. Det ser
ut som om ändringen "inte tog".

`prisLast: true` på mappningsraden. Sätts via `/api/admin/prislas` och
workflowen **"Pris — lås eller lås upp ett pris"** (lägen `las` · `las-upp`) —
samma nyckel-lösa upplägg som resten, alltså körbar från en telefon.

Fem egenskaper som inte ska tas bort:

1. ☠️ **Låset rör BARA priset.** Lagret synkas som vanligt. Att sluta spegla
   saldot hade betytt att vi säljer något vi inte har, och det är ett kundfel
   medan ett oförändrat pris inte är det.
2. ☠️ **Grinden ligger FÖRE uträkningen.** En rad vi ändå inte tänker skriva ska
   inte kunna hamna i `varningar` för ett hopp som aldrig skulle blivit av. Ett
   falsklarm som alltid fyrar lär mottagaren att sluta läsa — samma argument som
   mot att varna vid 48 h på token-förnyelsen.
3. ⚠️ **Låsta rader RÄKNAS, de hoppas inte tyst över.** `prisLasta` står i
   loggraden, audit-raden, svaret och workflow-summeringen. Ett låst pris slutar
   följa kostnaden: stiger Aosoms frakt äts marginalen tyst, så ett lås som
   ingen ser är ett lås som glöms bort. Lås upp när skälet är borta.
4. ☠️ **Rutten skapar ALDRIG en rad** (404 på saknad mappning) och **läser
   tillbaka efter skrivningen** (500 om värdet inte sitter). Nionde gången samma
   lärdom: ett svar utan fel är inget kvitto.
5. ☠️ **`last` har ingen default** — ett utelämnat fält avvisas med 400. Samma
   fälla som GitHubs tomma workflow-input, som publicerade utkast i tolv timmar;
   låset finns just för att någon medvetet sagt att priset ska stå still, och
   att tyst tolka tystnad som "lås upp" är fel riktning att fela åt.

☠️ **Vid låsning stäms böckerna av mot butiken.** Mappningens `grossSek` är vad
vi TROR att kunden ser; Wix är vad kunden faktiskt ser. Synken håller normalt de
två i fas — och i exakt den sekund låset sätts slutar den göra det, så en
skillnad som finns då blir PERMANENT. Samma förväxling som `jamforelsePris`
byggdes för, i ett nytt hörn.

Konkret på kontorsstolen: ommappningen till Aosom rör aldrig priset (Leonards
beslut), så mappningen bar kvar AliExpress-tidens **879 kr** medan butiken tog
**1 299**. Med ett lås ovanpå det hade lönsamhetsöversikten
(`lib/analytics/profit.ts`) och marginalbanden för alltid räknat 879 mot en
landad kostnad på 900,21 — alltså rapporterat en vara som säljs **med förlust**
när den ger 30 % marginal. Det är en BOKFÖRINGSRÄTTELSE: kundens pris rörs inte,
och `landedCostSek`/`costUsd` rörs inte heller.

Fyra egenskaper i avstämningen:

- **Bara vid LÅSNING.** Vid upplåsning tar synken över och rättar raden själv.
- ☠️ **Tvetydigt butikspris skriver ingenting.** `tolkaProduktPris` svarar `null`
  när varianterna har olika pris; att då falla tillbaka på mappningen hade varit
  exakt buggen `utanWixPris` finns för att undvika.
- ☠️ **En fallen Wix-läsning stoppar inte låset — men syns.** Låset är den
  brådskande halvan; skälet går ut i svaret, audit-raden och workflow-loggen, så
  en utebliven avstämning aldrig kan se ut som en gjord.
- **Alla varianter rättas.** Priset är entydigt i butiken, alltså gäller det var
  och en.

⚠️ **Poleringens prisgrind känner till låset.** Utan det hade den fällt varje
låst Aosom-rad med *"PRISGRINDEN FALLER — kostnaden har ändrats och priset i Wix
är gammalt"*. Rätt RÅD (rör inte priset), fel SKÄL: priset är inte gammalt, det
är valt — och ett rött jobb på ett medvetet beslut är samma falsklarm som
`regelGäller` byggdes för att ta bort. `prisgrind` bär därför `prisLast`, och
workflowen svarar `LÅST PRIS` och går grön. Resten av poleringen (text, bilder,
SKU) är opåverkad.

Verifierat i drift 2026-09-05, samma dag: torrkörning över hela katalogen gav
`4 548 granskade, 1 prislåsta`, och kontorsstolen finns varken bland de
planerade prisskrivningarna eller bland varningarna.

Tjugotre tester, verifierade genom att återinföra buggarna en i taget: synk-
grinden borta fäller fyra, defaulten tillbaka fäller två, 404-grinden borta
fäller ett, återläsningen borta ett, en gissande avstämning ett, en tyst fallen
Wix-läsning ett och en avstämning vid upplåsning ett — rätt test för rätt bugg.

### ☠️ Prissynken skrev aldrig ett enda pris till Wix (2026-08-29)

Hittad under den FÖRSTA poleringen, inte av ett larm: bäddsoffan `efaa0c7b` hade
`grossSek: 3529` i mappningen och **4 539 kr i Wix**. Produkten stod på
`revision: 1` — aldrig rörd sedan importen — medan nattens körning rapporterade
"2 priser uppdaterade" och hade skrivit mappningen 06:24.

Orsaken är en förväxling av två helt olika nycklar som båda heter `sku`:

```ts
.map((m) => ({ m, sku: (m.supplierProductId ?? "").slice("aosom:".length) }))  // "839-835V01CG"
setStock: async (wixProductId, _sku, antal) => { … }        // IGNORERAR den → fungerade
setPrice: async (wixProductId, sku, …) => updateV3VariantPrices(…, [{ sku }])  // fel nyckel
```

Loopens `sku` är **feedens artikelnummer**. Wix-variantens SKU är
`FP-schlafsofa-2er-sofa-mit`. De kan aldrig matcha, så `updateV3VariantPrices`
hittade ingen variant — och den **kastar inte** i det läget, den hoppar över
PATCH:en och returnerar `{updated: 0, missing}`. Anroparen slängde returvärdet.
Synken räknade därför upp `prisUppdaterade` och skrev mappningen med det nya
priset medan kunden fortsatte se det gamla.

Tre saker gjorde felet osynligt, och alla tre är lagade:

1. **Returvärdet lästes inte.** `setPrice` kastar nu när `updated === 0`, så en
   omatchad skrivning blir `misslyckade` i stället för `prisUppdaterade` — och
   mappningen skrivs inte, så böckerna slutar glida från butiken.
2. **`setStock` maskerade felet.** Den tog samma argument och ignorerade det.
   Lagret fungerade, alltså såg synken frisk ut.
3. ☠️ **Testfixturen satte `variants[0].sku = sku`** — samma sträng i båda
   rollerna. Inget test kunde se skillnad på rätt och fel nyckel. Fixturen ger nu
   `FP-<sku>` + `wixVariantId`, och ett regressionstest låser att prisskrivningen
   får WIX-variantens identitet. Verifierat genom att återinföra buggen: testet
   fäller, och bara det.

⚠️ **Följden för befintlig data:** varje Aosom-produkt vars kostnad ändrats sedan
importen har rätt `landedCostSek` i mappningen och fel pris i Wix. Auktionens
golvbud och lönsamhetsöversikten läser mappningen, butiken läser Wix — de har
alltså varit oense.

☠️ **Och driften läkte INTE av sig själv** — förrän jämförelsen lades om
2026-09-02. Skrivningen biter sedan 2026-08-29, men det räckte inte, och skälet
var samma förväxling en gång till: synken jämförde det nyräknade priset mot
**mappningens** `grossSek`, inte mot Wix.

```ts
const gammalt = variant.grossSek;          // mappningen, inte butiken
…
} else if (pris !== gammalt) { nyttPris = pris; }
```

Den trasiga skrivningen hann uppdatera mappningen. Nästa körning räknade därför
fram samma tal som redan stod där, såg ingen skillnad, och hoppade över
produkten — för alltid. Uppmätt 2026-08-29 efter skrivfixen: bäddsoffan
`efaa0c7b` stod kvar på **4 539 kr i Wix, `revision: 1`** (orörd sedan importen)
med `grossSek: 3529` i mappningen, och körningen 12:20 samma dag rörde den inte.

✅ **Lagat 2026-09-02.** `jamforelsePris` gör butiken till facit: priserna läses i
bulk före loopen och jämförelsen går mot Wix. Driften läker därmed av sig själv,
och de tjugo raderna nedan rättas på köpet — ingen engångsavstämning behövs.

Tre egenskaper i den fixen som inte ska tas bort:

1. ☠️ **Okänt butikspris skriver INGET pris** (`"saknas"` / `"flera"`). En
   produkt som inte kom med i prislistan, eller vars varianter har olika pris,
   har inget entydigt facit — och att då falla tillbaka på mappningen hade
   återinfört exakt buggen för just de rader där den är svårast att upptäcka.
   De räknas i `utanWixPris` i stället för att gissas. Lagret berörs inte:
   det uppslaget går på produkt-id.
2. ☠️ **Taket (`MAX_PRISANDRING_PCT`) räknas mot butikens pris.** Räknat mot
   mappningen hade en rad som redan drivit isär sett ut som en liten ändring och
   sluppit förbi spärren — spärren ska mäta hoppet kunden faktiskt utsätts för.
3. **`MIN_WIX_PRODUKTER = 500` spärrar**, av samma skäl som `MIN_FEED_RADER`:
   en halvläst prislista ser ut som "alla priser har ändrats", och en körning som
   tror det skriver om hela katalogen.

   ☠️ **Men den FÄLLER INTE körningen, till skillnad från `MIN_FEED_RADER`** —
   och skillnaden är vad felet kostar. En trasig feed nollar lagersaldon över
   hela katalogen; där är avbrott enda säkra svaret. En oläsbar prislista kan
   ingenting förstöra (`jamforelsePris` svarar `"saknas"`, och då skrivs inget
   pris). Att ändå avbryta hade stoppat LAGERSYNKEN i sex timmar för ett fel i
   prisdelen — och att sälja något vi inte har är ett kundfel, medan ett orättat
   pris på ett osynligt utkast inte är det. Lagret synkas alltså vidare, men
   körningen får inte se frisk ut: felet bärs i `prislistaFel` → svaret,
   loggraden, audit-raden, och fäller workflow-jobbet.
4. **Bulkläsningen har backoff.** 54 sidor i följd ligger mitt i det spann där
   media-städningen mätte upp att Wix svarar 429 (~40–50 sidor i rad). Utan
   återförsök vore hela prissynken en tärningskastning varje körning. Stegen är
   `importMediaByUrl`:s (1/3/8 s) plus 60 ms mellan sidor — den billigaste
   medicinen mot en strypning som utlöses av tempo är att inte springa.

Verifierat genom att återinföra `const gammalt = variant.grossSek` — tre tester
faller, och bara de tre.

### Auditen: driften är 20 rader, inte 1 611 (2026-08-29)

Raden ovan uppskattade skadan ur ett stickprov på sex. Det höll inte som mått —
hela katalogen är nu jämförd rad för rad, mappningens `grossSek` mot Wix faktiska
pris, och två oberoende mätningar ger samma tal:

| | |
|---|---:|
| Aosom-mappningar | 4 445 |
| Stämmer exakt mot Wix | **4 425** |
| **Drivit isär** | **20** |
| Summan av `prisUppdaterade` i audit-loggens fem körningar | **20** (11+4+1+2+2) |

Att de två talen möts är kvittot: varje drivande rad räknas exakt en gång, för
nästa körning ser mappningens nya tal och hoppar över den.

☠️ **Alla 20 är `visible:false`** — opolerade utkast som svarar 404 och inte ligger
i sitemapen. **Ingen kund har sett ett fel pris**, och auktionen kan inte gå på en
opublicerad produkt. Ingen av de tre där Wix ligger LÄGRE än mappningen säljs under
inköp (tunnast är `ad390a36` på 10,9 % mot husets 17 %). De övriga sjutton är för
DYRA i butiken — det kostar sålda varor, inte pengar.

**Skadan är alltså inte akut. Fällan är publiceringen:** poleringen säger uttryckligen
"rör inte priset", så den som polerar en av de tjugo publicerar det gamla priset utan
att märka något.

**Skrivfixen biter.** Kontrollerat mot skarpa Wix på alla 4 445 mappningar: varenda
en bär både `wixVariantId` och ett Wix-`sku` (`FP-…`), och noll rader bär feedens
artikelnummer i variantens `sku`-fält. Reproducerad matchning på 25 produkter: 25
skulle skriva, noll skulle falla.

⚠️ **Kostnadsargumentet mot att jämföra med Wix var fel**, och det var det som höll
de tjugo kvar. Raden påstod att en sådan jämförelse kostar "ett Wix-anrop per granskad
produkt". Det gör den inte: `POST /stores/v3/products/query` ger **100 produkter med
pris per anrop** — hela katalogen på 5 397 produkter är 54 anrop, ett par sekunder av
ruttens 240. `limit`-resonemanget i punkt 4 föll alltså INTE, och jämförelsen är
byggd sedan 2026-09-02 (`listV3ProductPrices` → `jamforelsePris`). De tjugo rättas
av nästa körning, utan engångsavstämning — en sådan hade dessutom bara skrivit
priset EN gång och lämnat orsaken kvar.

☠️ **Priset per variant kommer med i standardprojektionen — begär inte `fields`.**
Uppmätt mot skarpa V3 2026-09-02: `actualPriceRange.minValue/maxValue` och
`variantSummary.variantCount` ligger i svaret utan att efterfrågas.

☠️ **Och frågan ställs UTAN synlighetsvillkor, med flit.** Alla tjugo är
`visible:false` — en fråga som tyst filtrerat bort utkast hade gett en fix som
aldrig når det den skulle laga. Mätt samma dag: utkastet `3a6988b8` returneras
med `visible:false` och pris ifyllt av en fråga som inte nämner synlighet alls.
V3 lägger alltså inte på något implicit `visible:true`. Lägg inte till ett. Det är motsatsen
till `getProductMedia`, som MÅSTE begära `MEDIA_ITEMS_INFO` för att få sina bilder —
och den asymmetrin är just varför båda är mätta i stället för antagna.

**Regeln, sjunde gången: ett svar utan fel är inget kvitto.** Och de två nya:
**två fält som heter `sku` men betyder olika saker ska inte ha samma typ** — och
**ett stickprov är ingen skadeuppskattning.** Sex rader sa "litet"; hela katalogen
sa "tjugo, och inga av dem syns". Det är skillnaden mellan en oro och ett beslut.

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

#### ☠️ VARIANTEN HAR ETT EGET `visible` — och 31 sidor gick inte att köpa (2026-09-06)

Regeln ovan gäller PRODUKTEN. Varje variant i `variantsInfo.variants[]` bär ett
eget `visible`, och en variantsInfo-PATCH som inte bär det nollställer det. Samma
fälla, en nivå ner — och den här riktningen är dyrare, för den syns inte i något
utkast: produkten ligger kvar publicerad.

Uppmätt på hela den publicerade katalogen (2 032 produkter, fyra slices, 100 %
täckning): **31 sidor var publicerade men oköpbara.** Noll delvis dolda.

```
produkt   visible: true            → sidan ligger ute, i sitemapen, indexerad
variant   visible: false           → butiken visar "Slutsåld"
Wix-lager quantity: 197, IN_STOCK  → varan finns
```

Butiken behandlar en produkt utan en enda synlig variant som slutsåld: sidan
renderade *"Varan är tillfälligt slut hos oss"* och JSON-LD `OutOfStock` medan
lagret var fullt. Alla 31 var fåtöljer och madrasser ur poleringsrundor.

⚠️ **Och det är INTE repots kod som tappar fältet — båda skrivarna är
kontrollerade och gör rätt.** `createProduct` sätter `visible: v.visible ?? true`,
och `updateV3VariantPrices` muterar varianterna från sin EGEN GET, så fältet
följer med. Defekten sitter i poleringens SKU-steg, som skrivs **för hand från
chatten**: mappningsradens SKU går via `/api/admin/mapping`, men Wix-variantens
SKU har ingen egen rutt, så den PATCHas med ett handbyggt variantobjekt. Utelämnar
man `visible` där defaultar Wix det till `false`.

☠️ **Regeln för den som skriver `variantsInfo` för hand: bygg aldrig
variantobjektet från grunden.** Läs produkten, ta variantobjektet som det står
och ändra bara fältet du menar — precis som `updateV3VariantPrices` gör. Ett
handbyggt objekt tappar tyst varje fält du inte råkade tänka på, och `visible`
är det dyraste av dem.

☠️ **Och produktens `inventory.availabilityStatus` sa `IN_STOCK` hela tiden.**
Wix egen produktnivå vet ingenting om det här; frågar man den ser katalogen
frisk ut. Det enda som avslöjar det är `variantsInfo.variants[].visible` —
och det fältet finns **inte i sökprojektionen**, så en katalogskanning kräver
en GET per produkt. 2 032 GETs ryms inte i ExecuteWixAPI:s 60 sekunder; kör i
slices om ~500.

⚠️ **Två mätfällor på vägen dit, båda värda att komma ihåg.** Butikens ISR gör
att en enstaka hämtning kan servera en gammal rendering — måttet blev
trovärdigt först när `age` var 11 sekunder och sidan FORTFARANDE sa
`OutOfStock`. Och `brodtext`-svepet strippar taggar, så texten "Slutsåld" syns
även när den ligger i dold markup; det som faktiskt skiljer är JSON-LD:ns
`availability`.

Lagningen är att skriva tillbaka `visible: true` på varianten med produktens
`visible` medskickad explicit. Verifierat per rad: 0 → 1 synlig variant,
produktens synlighet oförändrad, **pris och SKU orörda på alla 31**.

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

### Äkta dubbletter mappas om till Aosom (Leonards regel 2026-09-03)

Hittas en äkta dubblett under poleringen — samma fysiska vara som både en
AE-inköpt sida och en feed-importerad — ska sidan vi BEHÅLLER peka om till
Aosoms artikelnummer, och den andra pensioneras. `lib/aosom/remap.ts` +
`/api/admin/aosom-remap`, workflowen **"Dubbletter — mappa om en produkt till
Aosom"** (lägen `plan` · `byt`).

Ommappningen skriver `supplier`, `supplierProductId`, `sourceUrl`,
`aosomFreightShare` och variantens `costUsd`/`landedCostSek` — **aldrig priset**.
Det är Leonards beslut, och en ommappning som tyst räknade om kundpriset hade
dessutom gjort planen omöjlig att granska: nu står den nya marginalen i planen
och prisändringen blir ett eget beslut.

Sex hinder, och de ska inte tas bort:

1. ☠️ **`MIN_REMAP_MARGIN_PCT = 5`.** Aosoms SE-frakt är per kolli och viktstyrd
   — median 40 % av inköpet, och på 1 283 rader kostar frakten mer än varan. En
   vara som gick ihop mot AE:s levererade EU-lagerpris kan alltså gå med förlust
   hos Aosom vid oförändrat kundpris. Samma tal som `MIN_FAILOVER_MARGIN_PCT`
   och av samma skäl, men egen konstant: talet är en delad avvägning, inte en
   delad sanning.
2. ☠️ **En flervariantssida vägras.** En Aosom-rad ÄR en artikel; alla varianter
   hade pekat på samma nummer och kunden som väljer den andra färgen får fel
   vara hem. Sådana sidor kräver en SKU per variant — ett annat jobb.
3. ☠️ **Ett artikelnummer som redan sitter på en annan produkt vägras** — annars
   skapar ommappningen exakt den dubblett den finns för att ta bort.
4. **Rader som inte går att skicka till Sverige vägras** (`isShippableToSe`).
5. **Torrkörning är default**, och det finns **ingen kör-allt-flagga**. Paret
   (wix-id, artikelnummer) är en människas bedömning; listan ÄR kvitteringen.
6. ☠️ **Raden slås ihop, ersätts inte** — och allt som beskrev den gamla
   AE-listningen nollas (`shipsFromCountries`, `hasEuWarehouse`, `supplierName`,
   fraktbarhetsverdikten, `reviewsCheckedAt`). En rad byggd från grunden tappar
   `draftStatus` och försvinner ur `/admin/queue` helt.

Rutten **läser tillbaka raden efter skrivningen** och svarar 500 om den inte bär
det nya artikelnumret. Åttonde gången huset lär sig samma sak: ett svar utan fel
är inget kvitto.

AE-synkens tillstånd (`listingStatus`, strike-räknarna) bor i synkens eget state
per Wix-produkt och överlever bytet. Det är ofarligt just för att spärren är en
TYP: `supplier: "aosom"` gör `isAliExpressMapping` falsk, AE-synken hoppar över
raden och läser aldrig tillståndet igen. Aosom-synken äger raden från nästa varv.

Dubbletten **raderas inte** — den får `draftStatus: "rejected"` och
`needsAiPolish: false`. Ett osynligt utkast kostar ingenting medan det ligger,
och en radering går inte att ångra om matchningen visar sig vara fel.

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

#### ☠️ Städningen raderade kundernas recensionsbilder (2026-09-04)

Leonards rapport: *"mina produkt recensioner hade bilder förut men inte längre"*.
Uppmätt direkt: **68 av 68 recensionsbilder över fyra produkter svarar 403** —
alla raderade. Datan är intakt, adresserna står kvar i recensionsraderna; det är
filerna som är borta.

Mekanismen är städningens egen referenslista. `listaAnvanda` går igenom
`stores/v3/products/search` och samlar **bara produktmedia** — men en
recensionsbild sitter inte på en produkt, den sitter på en RECENSIONSRAD. Och
eftersom vår kod importerade den från `aliexpress-media.com` bär den en
`sourceUrl` och passerar därmed "vår kod skapade den"-filtret. Föräldralös
enligt planen, `permanent: true`, varje natt sedan cronen schemalades.

Samma dygn, samma orsak, annan skada: fyra **bloggomslag** dog likadant. De
plockas ur produktbilder (`blog-image-picker.mjs`) och bor i markdown i
butiksrepot — ännu mer osynliga för listan. De är självhostade i `/public` nu.

**Fixen är att referenslistan bär recensionsbilderna** (`listaRecensionsbilder`
i deps, både `imageUrl` och `imageUrls`). Två saker att inte röra:

1. ☠️ **Depen är OBLIGATORISK, inte valfri.** En valfri dep kan glömmas av
   nästa anropare, och då börjar raderingen om. Testhjälparen fick följa med
   i stället för att typen mjukades upp.
2. ☠️ **Ett LÄSFEL mot recensionslagret FÄLLER körningen.** Fortsätter den med
   tom lista ser varenda recensionsbild föräldralös ut och raderas permanent —
   exakt skadan fixen finns för. Samma form som `MIN_FEED_RADER`: när ett
   läsfel och ett tomt svar ser likadana ut, och det ena utfallet är
   oåterkalleligt, är avbrott enda säkra svaret. En katalog som HAR noll
   recensionsbilder går däremot igenom — det är felet vi vägrar tolka, inte
   tomheten.

**Regeln, tredje gången huset skriver ned den:** en referenslista är klar först
när ALLA läsare finns med i den. Migreringen lärde sig det om läsare som blev
TOMMA (`/api/tracking-events`) och om en SKRIVARE i ett annat repo
(`/api/omdome`). Det här är samma sak en tredje gång, och den dyraste: en
läsare som bor i en annan tabell syns inte i koden intill, och priset var
kundernas egna foton.

⚠️ **Bilderna är inte återställda av fixen.** Den stoppar blödningen. Källan
finns hos AliExpress — recensionerna går att hämta om (`fetchAeReviews`, $0) —
men `repairImages` letar bara efter rader som FORTFARANDE bär en
leverantörs-URL, och de här bär en död wixstatic-adress. Återställning är ett
eget jobb.

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
spec-VÄRDE. Etiketterna är svenska från start — `buildSpecifications` i
`to-product.ts` sätter **exakt fem**: `Mått`, `Färg`, `Material`, `Vikt`,
`Paketmått` — eftersom feedens `Specification`-fält är tomt i 5 550 av 5 566
rader och underlaget kommer från de strukturerade kolumnerna i stället.

☠️ **`Artikelnummer` är INTE en av dem, och får aldrig läggas till.** Den här
raden räknade tidigare upp en sjätte etikett som koden aldrig har skrivit, och
det stod kvar i månader. Uppmätt 2026-09-03 på live-sajten: **fyra publicerade
produktsidor bär Aosoms artikelnummer i spec-tabellen** — `Artikelnummer:
844-657V90MX`, `845-823V00GN`, och en som döpt om etiketten till
`Modellreferens: 830-701V02WT`. Importen kan inte ha skrivit dem: `to-product.ts`
sätter fem etiketter och `to-product.test.ts` fäller om numret dyker upp. De är
alltså skrivna vid **poleringen**, av någon som läste den här listan.

Numret är det farligaste vi har att läcka. Det står i Aosoms egen produkt-URL,
och dealproffsen.se publicerar samma sträng som `sku` och `mpn` i sin JSON-LD —
en googling ställer vår sida bredvid deras med vårt inköpspris härlett intill.
Det hör hemma på `supplierProductId` i mappningen och ingen annanstans. Byt inte
heller namn på det: `Modellreferens`, `Artikelnr` och `Referens` läcker exakt
lika mycket.

Platshållaren `[BRAND NAME]`, som står kvar i 4 975 rader, stryks redan vid
importen; den är ett mekaniskt fel med ett mekaniskt svar och får inte lämnas
åt poleringen.

`aosomFreightShare` på mappningen (0–1) säger hur mycket av inköpet som är
frakt. Över 0,5 betyder att frakten kostar mer än varan — polera dem sist, eller
kör svepet med `?skipFreightHeavy=1` och ta dem för sig.

#### ☠️ Skriv texten i en FIL först — mätt 9 fel mot 0 (2026-09-04)

Batch 64 skrev åtta produkttexter på två sätt, och skillnaden är inte en
smaksak utan ett tal:

| hur texten skrevs | produkter | fel som nådde Wix |
|---|---:|---:|
| Inline i API-anropet | 5 | **9** |
| Fil först, sedan grep-grind, sedan anrop | 3 | **0** |

Felen var svenska stavfel (`dögnsvarv`, `engangsjobb`, `ihopsattningen`,
`för hard underlag`) plus ETT husregelbrott: *"Leverantören anger 25–35
minuter"* — mot kunden är **vi** leverantören. Alla nio skrevs av samma modell
i samma session; det som skilde var om texten passerade en fil.

Skälet är mekaniskt. En sträng som skrivs direkt i ett JSON-anrop kan inte
läsas av en grind innan den lämnar chatten, och API-svaret ekar tillbaka exakt
det man skrev — det ser rätt ut för att det ÄR det man skrev. En fil går att
`grep`:a, och grinden tog noll sekunder.

☠️ **Och rätta per ORD, inte per förekomst.** `dögnsvarv` hittades tre gånger i
tre separata rundor — i namnet, sedan i en produkts brödtext, sedan i syskonets
— för att varje fynd lagades där det syntes i stället för att sökas i hela
batchen. Tre skrivningar och två extra läsningar för ett ord. Hittar du ett
stavfel: sök det i ALLA batchens texter innan du skriver något.

⚠️ Poleringstexten går inte att verifiera ur PATCH-svaret. `plainDescription`
ekas tillbaka ordagrant, så en felstavning bekräftas som "sparad". Det som
faktiskt fångar den är en grind före skrivningen — eller ögon efter, på en
återläsning. Nionde gången samma familj: **ett svar utan fel är inget kvitto.**

#### ☠️ Filgrinden täcker bara halva vägen — grinda den PUBLICERADE texten

Raden ovan sa "ögon efter". Ögon räcker inte: batch 65:s två fel stod kvar i
tre rundor, och det ena återinförde jag identiskt i mitt eget rättningsförsök.
Grinden är byggd sedan 2026-09-04 och heter **`tools/polish-gates/livegrind.py`**.

Den hämtar de publicerade sidorna och gör tre saker:

1. **Orddiff mot källfilen.** Det är den som biter. Vilket transkriberingsfel
   som helst blir en rad — inte bara de mönster någon råkat tänka på.
2. **Homoglyfsvep** på live-texten (kyrilliskt/grekiskt).
3. **Sid- och alt-svep**: husmärke, artikelnummer, fraktland, tyska rester.

☠️ **ALT-TEXTERNA MÅSTE SVEPAS SEPARAT.** Ett sidsvep som strippar taggar ser
inte in i `alt=""` — och det är precis där de tyska resterna sitter kvar efter
en polering som bara rört beskrivningen. Batch 66 lämnade åtta produkter med
`alt="Kaninchenstall aus Holz Hasenstall mit Rädern Klappdach…"` efter en
felfri textpolering. Beskrivningen var ren; bilderna skrek tyska.

⚠️ **Butiken skriver om markupen med flit** — beskrivningen delas i flikar
(`pdp-flikar` / `details` / `summary`) vid `<h2>Tekniska specifikationer</h2>`.
En exakt sträng­jämförelse mot källfilen faller därför alltid. Jämför BRÖDTEXT.

⚠️ **Vänta ut butikens ISR-cache.** Sidorna är prerenderade
(`x-nextjs-stale-time: 300`). En hämtning direkt efter skrivningen serverar den
GAMLA sidan, och den ser ut precis som en fungerande ny — samma fälla som
recensionsverifieringen gick i. Första träffen efter fönstret triggar en
bakgrundsrendering; NÄSTA hämtning får den färska sidan. `?cb=` hjälper inte.

Verifierad genom att återinföra batch 65:s exakta fel — ett kyrilliskt `т`
(U+0442) i "granträ" — i en av åtta hämtade sidor: grinden fäller på rätt
produkt, och bara den, med både orddiffen och homoglyfsvepet.

**Regeln: en grind på det du SKICKAR är inte en grind på det som LIGGER UTE.**

#### ☠️ Och en TREDJE blind fläck: `<title>` och metabeskrivningen (2026-09-06)

Poleringen skriver `name` och beskrivningen. Den rör **aldrig `seoData`** —
och det är `seoData` som blir sidans `<title>` och `<meta name="description">`,
alltså precis det Google VISAR i sökresultatet. Aosom-importen sätter dem från
den tyska feeden, och ingenting har någonsin skrivit över dem.

Uppmätt på runda F1:s åtta klösträd, samtliga med **orddiff 0** mot källfilen:

```
<title>Kratzbaum Deckenhoch, 228-260 cm Höhenverstellbarer Katzenbaum</title>
<meta name="description" content="Verwandeln Sie Ihr Zuhause in ein Paradies…">
```

Brödtexten var alltså invändningsfri svenska medan sökresultatet var tyskt.
Över hela katalogen: **49 av 2 032 publicerade sidor** bär tysk SEO-titel
(1 443 har svensk titel med `| Fyndplats`, 540 en autohärledd utan suffix).
Talet är ett GOLV — klassificeraren kräver ett tyskt funktionsord.

☠️ **Båda de gamla svepen missade det, av olika skäl.** Metabeskrivningen ligger
i ett ATTRIBUT, och sidsvepet strippar taggar — samma blinda fläck som
alt-texterna hade. `<title>` syns visserligen i sidsvepet, men det som fällde
var artikelnummer-mönstret som råkade träffa `228-260`; runda D1:s
*"Schlafsessel, Gästebett, verstellbare Rückenlehne"* hade gått rakt igenom.
**Grinden fångade rätt fel av fel skäl, och bara på tre av åtta sidor.**

Grindarna är därför två nu, och den andra är den som biter:

- `gate-seo.py` i rundans katalog — filgrind på `seo.tsv` med siffergrind mot
  produktens egen källtext, längdtak (60/160) och krav på `| Fyndplats`.
- `livegrind.py` har ett **SEO-svep** som läser `<title>`, `description`,
  `og:title` och `og:description` ur den publicerade sidan och jämför dem
  EXAKT mot `seo.tsv` när filen finns. En mekanisk jämförelse behöver inte veta
  vilket språk felet är på — mönstergrindar gör det.

☠️ **Formen är TVÅ taggar, inte fem.** Uppmätt på runda A och C2: med bara
`title` + `meta description` i `seoData.tags` härleder butiken `og:title`,
`og:description` OCH `twitter:title` ur dem. Importens fem taggar bär tyska
og-värden som ska BORT, inte skrivas om. Rensa även
`seoData.settings.keywords` — importen lägger ett tyskt huvudnyckelord där med
`origin: "USER"`.

#### ☠️ Flera produkter kan dela EN SKU — kolla varje batch

Importen härleder variant-SKU:n ur den tyska titelns första ord, så produkter
vars titlar börjar likadant får samma sträng. Batch 66 hittade sex produkter på
två SKU:er: fyra kaninhus på `FP-kaninchenstall-aus-holz` och två hundkojor på
`FP-hundehutte-aus`. Det är inte unikt för den batchen — läs `las`-svaren mot
varandra innan du stämplar, och ge varje produkt en egen svensk SKU på BÅDA
sidorna (Wix-variantens `sku` och mappningsradens).

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

### `charm99` är PÅSLAGEN sedan 2026-09-03

Leonards önskemål 2026-09-03: 99 är den proffsigaste ändelsen, 89 och 09 ser ut
som räknerester. Strategin `charm99` (i `roundPrice`) höjer 89 → 99 och **sänker
09 → 99**. Ungefär vinstneutral — lika många rader upp som ner, 10 kr åt vardera
hållet.

☠️ **Den är den enda strategin utöver `charm90` som får runda NEDÅT**, och
`charm9`:s kommentar ("aldrig nedåt → marginalen skyddas") var inte en vana:
`applyOverrideBounds` räknar fram Custom-tierns **golv** genom att köra
`roundPrice` på det lägsta acceptabla priset, så en nedrundning kunde lägga
golvet under sin egen minimivinst — tyst, eftersom siffran fortfarande ser ut
som ett giltigt pris. Spärren sitter i `applyOverrideBounds`, inte i
`roundPrice`, och ett test fäller om den tas bort.

**Aktiverad genom `rounding: "charm99"` i `FyndplatsPricingConfig`** — inte via
`PRICE_ROUNDING`, av samma skäl som feed-adressen: en miljövariabel slår inte
igenom förrän projektet byggts om.

☠️ **ORDNINGEN VAR INTE VALFRI, och den gäller vid varje framtida strategibyte.**
Sätts konfigen INNAN koden ligger ute känner produktionens `roundPrice` inte igen
namnet, faller igenom alla grenar och returnerar priset **oavrundat** — och
Aosom-synken skriver örespriser över hela katalogen inom sex timmar. Kod först,
verifiera att deployen är `READY`, sedan konfig. (Valideringen ovan fångar det
numera, men bara när den nya koden faktiskt kör.)

Verifierat i drift direkt efter växlingen på vattenfontänen `dd7052d3`:
`landedCostSek 499.91` → 599,89 → charm9 ger 609 → **charm99 ger 599**, och
raden skrev ut `avrundning charm99`. Att talet är ett HELTAL på 99 är kvittot
att den nya koden kör — den gamla hade svarat `599.89`.
Aosom-synken räknar om priset ur kostnaden var 6:e timme, så ~20 % av
Aosom-halvan flyttar sig 10 kr inom ett dygn. AliExpress-halvan står kvar tills
någon kör prisreparationen.

☠️ **Strateginamnet valideras numera i BÅDA dörrarna, och det var ett verkligt
hål.** Ett okänt namn föll rakt igenom till `roundPrice`, som inte känner igen
det och därför returnerar priset **oavrundat** — alltså `none`. Uppmätt:
`roundPrice(541.85, "charm99 ")` = `541.85`. Ett efterföljande blanksteg i
configraden hade tyst stängt av charm-prissättningen för hela katalogen och
börjat skriva örespriser till kund, utan ett enda fel någonstans. Hålet fanns
i `mergePricingRules` (`stored.rounding ?? base`) OCH i `lib/config.ts`
(`process.env.PRICE_ROUNDING as …`) — och eftersom fallbacken går genom den
andra hade en spärr i bara den första varit meningslös. Listan och typen
härleds nu ur samma array (`ROUNDING_STRATEGIES`), så de kan inte glida isär,
och ett test läser källkoden och fäller om `as`-casten kommer tillbaka.

⚠️ **Sekvensera aktiveringen.** Poleringens prisgrind fäller bara på
Aosom-rader (`regelGäller: supplier === "aosom"`), och den räknar ur samma
`roundPrice`. I fönstret mellan att configen ändras och att synken hunnit
skriva om priserna förväntar grinden 599 medan Wix säger 609 — så var femte
Aosom-produkt ger `PRISGRINDEN FALLER — RÖR INTE PRISET` i upp till ett dygn.
Det är inget fel i grinden; den gör precis sitt jobb. Men polera inte
Aosom-produkter i det fönstret — vänta tills synken konvergerat, annars lär
man sig att ignorera larmet. AE-rader berörs inte (de blir `EJ AVGÖRBAR`).

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

Momsfällan i `computeProfit` är **lagad 2026-08-29** (se avsnittet ovan):
kostnaden momsas nu av på samma sätt som intäkten, och definitionen delas med
auktionens golvbud i stället för att dupliceras.

Kvar är DATA-sidan av samma fälla: **AliExpress-köp på Business Purpose**
faktureras netto men sparas i `landedCostSek`, som läses som brutto. För dem är
det lagrade talet alltså 20 % för lågt, och nu när `computeProfit` dessutom
delar med 1,25 blir felet synligt åt andra hållet — vinsten ser för hög ut.
Aosom-raderna bruttas upp korrekt vid import (`1287a0a`); AE-raderna gör det
inte, och det går inte att laga i kod utan att veta vilka köp som gjordes på
Business Purpose.

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

## ☠️ Orderpipelinen hade EN väg in, och inget nät under (2026-08-31)

`/admin` läser **bara `store.listTasks()`** — den tittar aldrig på Wix-ordrar.
Enda vägen dit är webhooken `/api/wix-order`. Går den skrivningen fel är ordern
borta för oss medan kunden har betalat, och Wix ger upp efter ett fåtal retries.

Det inträffade. Order 10024, betald 09:27, syntes aldrig i admin. Webhooken kom
fram tre gånger och svarade 500 varje gång:

```
WDE0195: Items limit exceeded. Delete some items and try again.
```

Wix Datas **radtak** var nått. Tre saker gjorde det värre än en tappad order:

1. **Taket stoppar bara NYA rader.** Uppmätt: en `save` mot en befintlig rad
   svarar `"action":"UPDATED"` och går igenom; en ny rad avvisas. Lagersynken
   uppdaterar befintliga mappningar och såg därför fullt frisk ut hela tiden.
2. **Det hade pågått i ett dygn.** Nyaste audit-raden var 2026-08-30 12:25 —
   `aliexpress-sync` hade fällts på `WDE0195` vid varje körning sedan dess (11
   gånger på ett dygn, mätt i Vercel-loggen). Ingen märkte det, eftersom felet
   bara syns som en 500 i en cron ingen läser.
3. **Vakten SÅG det men gjorde ingenting.** `buildGuardFindings.missingTasks`
   räknar precis "betald order utan task" — men rapporterade dem bara i
   morgonmejlet, en gång per dygn. Ordern hade nått Leonard 19 timmar senare.

### `/api/cron/order-backfill` är nätet (`lib/orders/backfill.ts`)

Kör varje timme. Läser Wix-ordrar, jämför mot tasks, skapar det som saknas via
**samma `deriveTasks` som webhooken** — ingen egen tolkning av orderformen, av
samma skäl som `SHIP_AXIS_RE` och `EU_TULL_CODES` ska ha en enda definition.
Urvalet importerar `ACTIONABLE_PAYMENT` och `TASK_GRACE_MS` från vakten, så
återhämtningen och larmet aldrig kan bli oense om vad "tappad order" betyder.

Fyra egenskaper som inte ska tas bort:

1. **Skarp som default**, tvärtemot husets övriga cron-rutter. De andra SKRIVER
   något nytt till kunden och ska be om lov; den här ÅTERSTÄLLER en order kunden
   redan betalat för, och att avstå är det farliga utfallet.
2. ☠️ **Ordens FAKTISKA ålder bärs vidare.** `deriveTasks` stämplar `createdAt`
   med NU — rätt i webhooken, fel här: en order från i förrgår hade fått åldern
   noll och vaktens påminnelser hade börjat om från början. Ett test låser det,
   verifierat genom att återinföra buggen.
3. **Respiten gäller.** En order yngre än `TASK_GRACE_MS` rörs inte — vi ska
   inte tävla med webhooken om en färsk order.
4. **Ett fel fäller inte resten.** Nästa order kan vara den som går att rädda.

Rutten är idempotent (`createTaskIfAbsent` skriver aldrig över) så den är gratis
att köra ofta och ofarlig att köra om.

### Larmet går via mejl, för det är den enda kanal som fungerar

Nätet ovan gick i väggen på exakt samma sak som webhooken: `createTaskIfAbsent`
kastade `WDE0195`, felet fångades per order, lades i `errors` — och rutten
svarade 200. Ett nät som kan misslyckas tyst är inget nät.

☠️ **När task-skrivningen faller är varje annan kanal blockerad av samma vägg.**
Audit-raden är också en ny rad. Vaktens fynd hamnar i morgonmejlet först nästa
dygn (19 timmar för 10024). Admin-listan läser bara tasks, och det är tasken som
saknas. Nästa körnings andra försök faller likadant. Resend rör inte Wix, och är
därför enda vägen ut ur en full databas.

`buildStuckOrdersEmail` bär därför allt som behövs för att expediera ordern för
hand — ordernummer, kund, artikel med SKU och antal, orsaken ordagrant. Mejlet
upprepas varje timme så länge ordern sitter fast; en betald order som inte kan
expedieras SKA tjata, och tjatet upphör av sig självt när skrivningen går
igenom. **Bara raderna som inte hann skrivas listas** — annars beställer man om
en rad som redan ligger i `/admin` och kunden får två paket.

### En manuellt lagd AliExpress-order är osynlig tills numret kopplas (2026-09-01)

Order 10025: lagd för hand i AliExpress konsumentkassa (kampanj/kupong
billigare än DS-API:t), skickad från Polen kl 15:53 — och tasken stod kvar på
`pending` i sexton timmar medan kunden väntade på sitt mejl. Motorn kan inte
hämta spårning för en order den inte vet finns, och vakten säger inget om
`pending` förrän efter 24 timmar. Mätt:

```
poll-tracking:  {"checked":0,"shipped":0,"stillWaiting":0,"heldForReview":0,"errors":[]}
order-guard:    missingTasks:0  placeOrderReminders:0
Wix 10025:      NOT_FULFILLED
```

Tasken fanns, ingen task var `ordered`. Kopplingen fanns bara som knapp bakom
admin-inloggningen. Logiken bor nu i `lib/orders/link-ae-order.ts` och nås från
två håll: samma knapp i `/admin`, och `POST /api/admin/link-ae-order` med
`CRON_SECRET` → workflowen **"Order — koppla manuell AliExpress-order"** tar
butikens ordernummer + AE:s "Ref. Number" (inte spårningsnumret) och går att
köra från en telefon. Efter kopplingen är ordern exakt lika automatisk som en
API-order: kopplingen 21:55 → poll-tracking 21:58 `shipped:1` → Wix-fulfillment
→ butikens "Ditt paket är skickat!" med Resend-id 21:58:07.

Två egenskaper som inte ska tas bort:

1. **Flera kopplingsbara rader på samma order → vägra och lista dem.** Att
   gissa hade kopplat fel AE-order till fel rad, och poll-tracking hade sedan
   skeppat fel artikel med rätt spårningsnummer.
2. ☠️ **Skrivningen läses tillbaka.** `updateTask` är en tyst no-op på en saknad
   rad i alla tre backends. Ett test simulerar en backend vars `updateTask` inte
   gör något: rutten svarar fel, och ingen audit-rad skrivs.

### Aosom-ordern har ingen automatik alls — den läggs OCH skeppas för hand

AliExpress sköter sig självt: `place-order` lägger ordern, `poll-tracking` hämtar
spårningen var 15:e minut, Wix-fulfillment skapas, kunden får sitt mejl. Aosom har
inget API — `place-order.ts` **vägrar** en Aosom-mappning med flit
(`isAliExpressMapping`) och ordern läggs på `aosom.de/bulkordering` eller i deras
kassa.

Det lämnade en tyst lucka i motorn: ingenting kunde få veta att ordern var lagd, och
när Aosom skickar paketet fanns ingen väg alls att få ut spårningen till kunden.
Uppmätt på order 10026 (2026-09-02, Vinsetto-kontorsstolen `921-471LG`): betald
14:57, lagd för hand samma kväll, och tasken hade blivit liggande som `pending`
medan vakten påminde om en order som redan var gjord.

`lib/orders/manual-fulfillment.ts` stänger båda halvorna, nåbar via
`/api/admin/manual-fulfillment` och workflowen **"Order — beställd eller skickad
för hand"**:

| läge | vad som händer |
|---|---|
| `bestalld` | tasken blir `ordered` — vakten slutar påminna, 5-dygnsklockan mot "beställd men inget spår" startar |
| `skickad` | Wix-fulfillment med spårningsnumret → butikens "Ditt paket är skickat!" + 17TRACK, tasken blir `shipped` |

Fem egenskaper som inte ska tas bort:

1. ☠️ **Referensen sparas i `supplierOrderRef`, ALDRIG i `aliexpressOrderId`.** Samma
   fel som `AliExpressProductId`-typen infördes för att göra omöjligt: AE-fältet läses
   som ett AE-id av poll-tracking, av cancel-task (som larmar om manuell
   AE-avbeställning) och av claim/cancel-CAS:en i alla tre backends.
2. ☠️ **F19-backstoppen gäller även den manuella vägen.** `poll-tracking` vägrar
   auto-skeppa en task flaggad `cancelMidOrder`/`refundFlagged`/`orderUncertain`; en
   manuell rutt som hoppar över samma grind vore hålet i nätet. Skeppningen är den
   oåterkalleliga handlingen — kundmejlet går inte att ta tillbaka.
3. ☠️ **En redan skeppad rad skeppas aldrig om.** En andra fulfillment är ett andra
   "ditt paket är skickat" till samma kund.
4. **Wix skrivs före tasken**, samma ordning och samma skäl som `price-repair`. Går
   bara den ena igenom har kunden fått sitt mejl medan böckerna släpar — det billiga
   felet. Omvänt hade tasken stått som `shipped` utan att någon fulfillment fanns.
5. **Flera rader på ordern → vägra och lista dem.** Regeln bor i
   `lib/orders/valj-task.ts` och delas med AE-kopplingen; att gissa hade skeppat fel
   artikel med rätt spårningsnummer.

`pending → shipped` går i ETT steg, men via statusmaskinen: har vi ett spårningsnummer
ÄR ordern lagd, och att vägra på en bokföringsteknikalitet medan paketet är i transit
är fel sorts fel.

⚠️ **Leveransnotisen ("levererat") bor i butiksrepot, grenen `headless-site`,**
och hade en egen lucka: 17TRACK registrerar bara nummer vars fraktbolag den
känner igen. Både 10023 och 10025 loggade *"carrier odetekterad, inget
format-mönster matchar — ingen push för detta paket"* — ingen push, aldrig ett
"levererat"-mejl. Sedan 2026-09-01 pollar butiken AliExpress-källan (vår
`/api/tracking-events`) varannan timme (`/api/cron/ae-delivery-poll`) och mejlar
genom samma sändare och samma dedup som pushen. Se `SMS-FORWARDING.md` på den
grenen. **Vår rutt är alltså en leveransberoende sedan dess** — går den sönder
uteblir inte bara spårningssidan utan också leveransmejlen för de paket 17TRACK
inte ser.

### ☠️ Ett fullt CMS gör importen till en dubblettfabrik

Ordningen i `lib/aosom/import-run.ts` är påtvingad: mappningen behöver
produktens Wix-id, så produkten skapas först. Faller mappningsskrivningen
däremellan är produkten **föräldralös** — den finns i butiken men syns inte för
lagersynken, prissynken, prisreparationen, bildreparationen eller
lönsamhetsöversikten, som alla itererar mappningar.

Värre: dubblettspärren nycklar på `supplierProductId` i MAPPNINGEN. Utan rad ser
nästa körning artikeln som ny och skapar en **ANDRA** produkt för samma vara —
precis den interna dubbletten som straffas. Och markören flyttas ändå (en trasig
rad får inte stoppa svepet), så ingen körning återkommer till den av sig själv.

Uppmätt 2026-08-31: nattens körning 04:40 skapade `3e6f2d24-e045-44ad-aed9-067030b01f46`
(ett tyskt utkast, `visible:false`) och föll sedan på postgränsen. Noll
mappningsrader pekar på den.

Luckan går inte att stänga genom att byta ordning. Det som går är att vägra
tappa bort den: `summary.orphans` namnger sku + wixProductId, och en
konsolrad skrivs (konsolen kräver ingen databas). `?sku=` kör om riktat när
orsaken är åtgärdad. **En automatisk radering av produkten är medvetet INTE
byggd** — det är en destruktiv åtgärd på något en människa ska titta på först.

⚠️ **Taket löstes senare — och den här radens förklaring var fel.** Den påstod
att "radantalet i Wix Data inte är det som binder", eftersom 18 091 raderade
audit-rader (22 977 → 4 886, verifierat) inte släppte blockeringen. Radantalet
ÄR det som binder. Taket är bara **globalt över alla kollektioner** och ligger på
**4 000**, så de ~18 800 rader som återstod var fortfarande 4,7× över. Städningen
var alltså inte otillräcklig av otur — ingen delmängd kunde räcka. Se nästa
avsnitt.

**Regeln: en pipeline med exakt en väg in behöver ett nät under sig.** Och den
gamla, åttonde gången: ett fel som bara syns som en 500 i en cron ingen läser
är ett fel ingen upptäcker.

## ☠️ Drift-datan bor i Postgres sedan 2026-08-31 — inte i Wix Data

Wix CMS slutade ta emot nya rader: *"You've reached your 4,000 items limit
across all collections."* Taket är **globalt över alla kollektioner** och stoppar
bara NYA rader — befintliga uppdateras som vanligt. Därför såg allt friskt ut
utåt medan order 10024 (betald 09:27) aldrig nådde `/admin`.

☠️ **Delvis städning ger exakt noll.** ~36 000 raderade rader (55 000 → 18 800)
flyttade inte blockeringen en millimeter, och kunde inte göra det: antingen är
man under 4 000 eller så är man blockerad. Ingen delmängd räcker — bara att
flytta ut hela drift-datan (18 800 → ~3 470) gör det.

Hela planen, mätningarna och auditen står i **`POSTGRES-MIGRATION.md`**.

### Var datan bor nu

| | |
|---|---|
| Backend-väljare | `STORE_BACKEND` — `memory` \| `wix-data` \| `postgres` |
| Produktion | **`postgres`** (växlad 2026-08-31) |
| Databas | Neon serverless Postgres, `DATABASE_URL` |
| Flyttade rader | **15 311** (11 tabeller, fem moduler) |
| Kvar i Wix Data | recensioner, auktioner, redirects + småposter |

De tre kollektioner butiken läser **direkt** ur Wix Data stannar där —
`FyndplatsImportedReviews`, `FyndplatsAuctions`, `FyndplatsRedirects`. Flyttas de
måste butiksrepot byggas om, och de frigör inte de rader som binder.

### Fem egenskaper som inte ska tas bort

1. ☠️ **`STORE_BACKEND` har exakt EN läsare** (`lib/store/backend.ts`). Ett
   källkodstest i `backend.test.ts` grep:ar efter `process.env.STORE_BACKEND`
   utanför den filen och fäller. Skälet är husets vanligaste bugg: tvillingar
   glider isär (`SHIP_AXIS_RE`, `EU_TULL_CODES`, `mapWithConcurrency`). En
   backend-väljare läst på sex ställen hade betytt sex olika svar på frågan
   "vilken databas skriver vi till?".
2. ☠️ **Kopieringen vägrar köra när backend redan är `postgres`.**
   `/api/admin/copy-to-postgres` svarar **409** i skarpt läge. Utan grinden hade
   en omkörning skrivit tillbaka Wix gamla rader över levande data — rutten
   läser från Wix och skriver till Postgres, och efter växlingen är Wix den
   föråldrade sidan. `?verify=1` går alltid igenom; den skriver ingenting.
3. ☠️ **Verifieringen jämför KANONISKT, inte ordagrant.** JSONB bevarar inte
   nyckelordning, så en rå `JSON.stringify`-jämförelse flaggade 10/10
   `.variants` och 10/10 `.shippingAddress` medan varje platt fält stämde.
   `lib/migration/kanonisk.ts` sorterar nycklar rekursivt — men behåller
   **array-ordningen**, som är betydelsebärande (varianter, bilder).
4. ☠️ **Ingen unik nyckel på `supplier_product_id`.** Ett första utkast hade
   det, och den skarpa kopieringen avvisade fyra legitima rader: katalogen
   stödjer medvetet dubbletter (`allowDuplicate: true`, båda spärrarna
   fail-open). **En databas som vägrar det applikationen medvetet stödjer är
   fel, hur tilltalande invarianten än ser ut.**
5. ☠️ **`queryAll` KASTAR i stället för att tyst kapa.** Den returnerade
   tidigare de första N raderna utan att säga något; efter `MAX_QUERY_ALL_ROWS`
   (10 000) kastar den. En halv katalog som ser komplett ut är samma klass av
   fel som `Promise.allSettled` i `media.ts` — och den här gången hade det
   betytt en kopia som saknade rader med grönt kvitto.

### Kopiering och verifiering körs från GitHub Actions

Workflowen **"Migrering — kopiera drift-datan till Postgres"**
(`copy-to-postgres.yml`), tre lägen: `torr` · `kopiera` · `verifiera`. Samma
nyckel-lösa upplägg som prisreparationen — produktionen har Wix-nycklarna och
`DATABASE_URL`, Actions har `CRON_SECRET`. Torrkörning är default; utan
`dryRun=false` skrivs ingenting. Rutten är markörbaserad (`cursor` → `?after=`)
av samma skäl som Aosom-svepet: en serverless-rutt har 300 sekunder.

Verifieringen är **asymmetrisk**: fler rader i Postgres än i Wix är OK (nya
skrivningar landar bara i Postgres nu, och Wix gallrar `sync_log`), färre fäller.
Den läser dessutom bara tabeller som står i kopielistan — därför finns
`tabeller.test.ts`, som läser källkoden i alla fem ägande moduler och fäller om
någon nämner en kollektion listan inte täcker. Det testet hittade
`FyndplatsAliExpressTokens`, som annars lämnats kvar med grönt kvitto.

Resultatet vid växlingen: **15 310 lästa / 15 310 skrivna**, alla radantal
stämmer, **noll fältavvikelser**.

### ☠️ Verifieringen fällde en halvtimme efter växlingen — och hade rätt fel

Körningen 22:06 gav rött på tre "avvikelser". Alla tre var frisk drift, och två
av dem är precis det kvitto migrationen behövde:

| tabell | vid växlingen | 22:06 | vad som hände |
|---|---:|---:|---|
| `sync_alerts` | 18 | **32** | synken skriver larm igen — samma skrivningar föll på `WDE0195` kl 04:00 |
| `audit` | 1 796 | 1 790 | synkens egen städning tog 7 rader äldre än 14 dygn |
| `sync_state` | — | 1 fält | `currentCostUsd` uppdaterad av 22:01-körningen |

Produkten i fältavvikelsen är `2861bf83-2976-45e1-a51e-75f4bf880be2` — **samma
rad som kl 04:00 loggade `Wix Data save FyndplatsAliExpressSyncAlerts (429):
WDE0195`.** Den fick sitt larm skrivet den här gången.

Felet låg i verifieringens premiss, inte i datan. Den frågar "speglar kopian
källan?" — en fråga som slutade vara meningsfull i samma sekund som produktionen
började skriva till Postgres. Wix är sedan dess **fruset** (taket blockerar nya
rader, och ingen kod skriver dit), så varje korrekt skrivning får sidorna att
glida isär. En verifiering som lyser rött varje gång driften är frisk lär man
sig att ignorera — samma argument som mot att varna vid 48 h på
token-förnyelsen.

Regeln bor nu i **`lib/migration/verdikt.ts`** och känner till båda lägena:

- **Före växlingen:** strikt. En enda saknad rad är dataförlust och fäller.
- **Efter växlingen:** bara **MASSFEL** fäller (`MASSFEL_ANDEL` 10 % **och**
  `MASSFEL_GOLV` 25 rader — båda krävs, så `webhook_events` med 16 rader inte
  fäller på en enda). Allt annat rapporteras som `drift`.

Båda trösklarna krävs med flit: andelen ensam fäller små tabeller på brus,
golvet ensamt låter en liten tabell tömmas till hälften. Samma spärr-form som
`MIN_FEED_RADER` och halvbildsspärren i media-cleanup — **skydda mot att allt
rasar, inte mot att en rad rör sig.** Elva tester låser talen, verifierade genom
att återinföra buggen: tre faller, och bara de tre.

### Wix-raderna är raderade sedan 2026-09-01 — taket är frigjort

Steg 6 är genomfört: **15 310 granskade, 15 310 raderade, noll fel**, alla
tretton kollektioner klara. Talet är exakt det kopieringen skrev vid växlingen.

Föregicks av ett dygns drift på Postgres med noll `error`-rader i Vercel (mot 12
dygnet före), samtliga cron-rutter körda och tre riktiga ordrar genom webhooken.

☠️ **Torrkörningen stoppade första försöket, och hade rätt.** 71 av 95
audit-rader och 50 av 100 sync_log-rader saknades i kopian — medan radantalen
såg friska ut (`sync_log` hade till och med ÖVERSKOTT). Orsaken var inte en
trasig kopia: synken städar de två tabellerna ur POSTGRES, Wix städas inte
längre av någon, så raderna var utgångna med flit. `beslutaSida` känner nu
skillnaden — en saknad rad får raderas bara om den är äldre än tabellens
retention-fönster, och talen ärvs från `lib/retention.ts`.

**Taket är mätt frigjort, inte uträknat.** Recensionskön kördes direkt efteråt
och skrev `2 köade` — två nya rader i `FyndplatsImportedReviews`, exakt den
skrivning som fallit på `WDE0195` tolv timmar tidigare.

**Marginalen mot taket, mätt 2026-09-01 22:05:** `FyndplatsImportedReviews`
2 514 + `FyndplatsAuctions` 797 + `FyndplatsRedirects` 40 + tre enradskollektioner
≈ **3 355 av 4 000**. Recensionerna är den enda som växer — 10 nya rader på sju
dygn — så ~650 rader räcker länge i normal drift. ☠️ **Men en bulk-backfill av
recensioner (`review-backfill`, `aosom-reviews`) kan äta marginalen på en
körning**, och då stoppas även auktioner och redirects. Räkna före en sådan.

☠️ **Vägen tillbaka är därmed stängd.** Fram till raderingen var rollback en
env-variabel; nu finns drift-datan bara i Postgres, och Neons
point-in-time-återställning är det som gäller. Raderingsrutten
(`/api/admin/radera-wix`) ligger kvar med sina spärrar men har inget kvar att
göra — en omkörning är en no-op.

### ☠️ Raderingen bröt SEO-poleringen — på fem ställen, inte ett

Poleringen körs av Claude i chatten och läste mappningsraden **direkt ur Wix
Data**. Steg 6 tömde den kollektionen, och därmed gick fem beröringspunkter
sönder samtidigt: Steg 3 (facit för pris, lager, EU-ribbon), Steg 4
(prisgrinden), Steg 6/11 (variantfacit), Steg 10 (kategoriförslag) och Steg 13
(stämpeln).

☠️ **Skrivningen var farligast, och den syntes inte.** Steg 13 gjorde
`POST /data/v2/items/save` med HELA raden. Mot en tömd kollektion **skapar** det
en ny rad: anropet rapporterar framgång, ingenting läser raden, produkten kommer
tillbaka i poleringskön för alltid och SKU-skrivningen tappas. En annan session
föreslog att "polera vidare utan prisgrinden" — det hade gått rakt in i den här
fällan, eftersom felet ligger i slutsteget och inte i grinden.

`/api/admin/mapping` ersätter båda vägarna (`lib/polish/mapping-access.ts`,
workflowen **"Polering — läs och stämpla mappningsraden"**). Fyra egenskaper som
inte ska tas bort:

1. ☠️ **Skrivningen är en ALLOWLIST, inte en helradsskrivning.** Poleringen äger
   tre fält: `needsAiPolish`, `draftStatus` och `variants[].sku`. Allt annat
   avvisas med 400 — det ignoreras inte tyst, för ett tyst ignorerat fält är
   exakt hur "svaret sa OK men inget hände" uppstår. Kostnads-, pris- och
   leverantörsfält går inte att röra härifrån.
2. ☠️ **Den skapar ALDRIG en rad.** Saknas mappningen svarar den 404. Det är
   hela skälet till att rutten finns: produkten är då föräldralös och ska
   granskas av en människa, inte poleras.
3. ☠️ **SKU matchas på `wixVariantId`, aldrig på position.** Två fält heter
   `sku` och betyder olika saker; den förväxlingen gjorde att prissynken skrev
   till ingenting i en månad. Positionsmatchning hade återinfört den.
4. **Prisgrinden räknas i rutten, inte i chatten**, ur samma `roundPrice` som
   prissättningen använder — så grinden kan inte drifta från regeln. Saknas
   underlaget svarar den `null` i stället för att gissa, och workflowen
   avslutar med `exit 1` på både `stammer: false` och `EJ AVGORBAR`.

#### ☠️ Grinden säger numera VARFÖR den faller — `slutsald` (2026-09-06)

Cordfåtöljen `1877cf83` fälldes med *"kostnaden har ändrats sedan importen och
priset i Wix är gammalt"*. Talen sa något annat:

```
landedCostSek 2404,4
forvantat     2899      ← 1,20 × 2404,4 = 2885,28 → charm99
faktiskt      2889      ← samma tal      → charm9
```

Båda härleds ur SAMMA kostnad. Kostnaden hade inte rört sig — det var
avrundningsstrategin som byttes 2026-09-03. Raden hade **saldo 0** och hade
fallit ur feeden, och då räknas priset aldrig om:

```ts
// lib/aosom/sync.ts, planeraProdukt
if (!row || opts.skipPrices || !variant) return plan;
```

`nyttSaldo` blir dessutom `null` när saldot redan är noll, så ingen skrivning
sker och `aosomSyncedAt` fryser (här: åtta dygn). **Prisgrinden kunde alltså
aldrig bli grön på den raden, hur länge man än väntade** — och felmeddelandet
skickade felsökningen åt fel håll.

`Prisgrind.slutsald` är tredje fältet i samma familj som `regelGäller` och
`prisLast`: grinden faller, men skälet är ett annat och ska sägas rakt ut.
Fyra egenskaper som inte ska tas bort:

1. ☠️ **Grenen ligger FÖRE `regelGäller`.** Annars vinner "kostnaden har
   ändrats" över det sanna skälet, vilket är hela buggen.
2. ☠️ **Bara ett uttryckligt `0` räknas.** `aosomSyncedQty` är optional och
   saknas på en rad som aldrig synkats; `undefined` är ingen bevisning om
   saldot, precis som en saknad hyllstatus blir `unknown` och aldrig
   `offline`. Ett `!qty` hade fällt varje nyimporterad produkt.
3. ⚠️ **Ett korrekt pris på en slutsåld rad fäller INTE jobbet** — bara en
   varning. En rad som försvinner ur feeden är enligt Aosoms egen guide ett
   lagerbesked, inte en utgången artikel, och sidan ska ligga kvar. Ett rött
   jobb på det hade varit samma falsklarm som `regelGäller` byggdes för.
4. ⚠️ **Fältet skiljer inte "borta ur feeden" från "finns kvar men slutsåld".**
   Båda ger saldo 0 och båda fryser stämpeln, och mappningsraden bär inget
   belägg för vilket det är. Meddelandet påstår därför bara det som går att
   veta. En grind som påstår mer än den vet är precis felet den ersätter.

⚠️ **Och saldot borde kollas FÖRE poleringen, inte fångas av en bieffekt.**
Prisgrinden hittade `1877cf83` av en slump — ingenting i arbetsgången frågar
"går varan att köpa?" innan en text skrivs. En sida för en vara ingen kan köpa
är slöseri i båda ändar, och kollen kostar ett Wix-anrop för en hel runda.

Fyra tester, verifierade genom att återinföra buggarna: `!qty` i stället för
`=== 0` fäller ett, en hårdkodad `false` fäller tre.

### ☠️ Och två fällor till i samma block (2026-09-02)

Hittade när ett e-postbrus skulle förklaras. Poleringsworkflowen mejlade
"Run failed" i tolv timmar; loggen sa två rader tidigare `OK: <id> uppdaterad`.

1. ☠️ **`jq` tillåter inte åäö i naken fältåtkomst.** `.okändaVariantIds` är
   ett SYNTAXFEL (`unexpected INVALID_CHARACTER`), inte ett tomt svar —
   grammatiken tillåter bara `[A-Za-z_][A-Za-z0-9_]*` efter punkten. Raden låg
   EFTER skrivningen, så varje stämpling gjorde sitt jobb och dog sedan på
   rapporteringen. Sexton lyckade körningar rapporterades som misslyckade.
   Övriga svenska fältnamn i filen var korrekt citerade, så det gick inte att
   se genom att läsa: nitton rader rätt och två fel ser likadana ut. Grinden är
   `lib/workflows/jq-syntax.test.ts`, som läser alla workflow-filer. Statisk
   kontroll och inte `jq -n` — en grind som hoppas över när binären saknas är
   ingen grind. **Rapportering efter en skrivning får dessutom aldrig fälla
   jobbet**; den är `|| true` nu.

2. ☠️ **GitHub ersätter ett TOMT workflow-input med dess `default`.**
   `needs_ai_polish` och `draft_status` hade defaulterna `false` och
   `published` medan beskrivningen sa "tomt = rör inte" — det läget gick alltså
   inte att uppnå, och en stämpling som bara ville skriva SKU:er PUBLICERADE
   produkten. Uppmätt: skickade `""` för båda, loggen visade `NEEDS_POLISH:
   false` / `DRAFT_STATUS: published`. Defaulterna är tomma nu. Med 2 700
   opolerade tyska utkast i katalogen är det den farligaste riktningen att fela
   åt — samma klass som `variantsInfo`-PATCHen som publicerade ett utkast.

**Och en tredje, som följde av att den andra undersöktes:** ett okänt
`wixVariantId` skrev raden först och lät verifieringen fälla på det omatchade
id:t → 500 "läste inte tillbaka som förväntat". Meddelandet ljög (de andra
fälten HADE skrivits, produkten kunde vara publicerad) och patchen lämnades
halvt applicerad. Rutten avvisar nu okända id FÖRE skrivningen med **422** som
namnger både de okända id:na och radens riktiga, och skriver ingenting alls.

**Regeln: ett falsklarm som alltid fyrar är lika illa som ett fel ingen ser.**
Båda slutar med att mottagaren slutar läsa — och då är även det äkta larmet
borta.

Fjorton tester, verifierade genom att återinföra alla tre farliga misstagen
(tyst ignorerade fält, positionsmatchad SKU, gissande prisgrind): rätt test
faller för rätt bugg.

**Regeln: en migrering är inte klar när datan flyttat — den är klar när alla
läsare följt med.** Kodauditen hittade inga trasiga läsare eftersom poleringen
inte är kod; den är en runbook som en människa och en modell följer.

### Så såg resonemanget ut innan raderingen

Växlingen är gjord, men de gamla raderna är inte raderade. De är
återställningen: går något fel byts `STORE_BACKEND` tillbaka till `wix-data` och
driften står på fötter igen på en minut. **Det är först raderingen som frigör
4 000-taket**, och den ska göras med Leonards uttryckliga ja efter minst ett
dygns stabil drift — inte samma kväll som växlingen.

Kvittot att skrivvägen fungerar mättes direkt, inte antogs:
`/api/cron/order-backfill` loggade **`1 av 1 saknade tasks skapade, 0 fel
(räddade: 10024)`** 21:25 samma kväll. Ordern som legat oskrivbar sedan morgonen
fick sin task, och `tasks` gick från 12 rader i Wix till 13 i Postgres.

### ☠️ Och den bröt kundens spårningssida — en läsare auditen inte kunde se

`/api/tracking-events` slår upp AliExpress-ordern från ett spårningsnummer, och
gjorde det genom att fråga **Wix Data direkt** med en egen fetch-hjälpare mot
`FyndplatsTasks` i stället för att gå via storen. Steg 6 tömde kollektionen, och
rutten svarade från den sekunden **404 "Okänt spårningsnummer" för varje kund**.
Uppmätt i drift 2026-09-01 kl 20:35 på en riktig kunds nummer.

☠️ **Kodauditen efter raderingen missade den, och det är hela lärdomen.** Den
letade efter LÄSARE SOM GÅR SÖNDER. Den här gick inte sönder — den blev **tom**.
Ett tomt svar från rätt API mot rätt kollektion ser i källkoden exakt likadant ut
som ett friskt anrop, och i loggen är det en 404 som ser ut som ett okänt
spårningsnummer. Samma familj som "ett svar utan fel är inget kvitto", men värre:
här fanns inte ens ett fel att ignorera.

Skadan är större än den ser ut, eftersom butiken anropar rutten **FÖRST**:
17TRACK klarar inte alla EU-fraktkedjor, medan AliExpress alltid känner sin egen
order. Mätt samma kväll på två skarpa ordrar:

| order | fraktväg | butikens 17TRACK-källa |
|---|---|---|
| 10024 | Seller Shipping ES Local → PostNord | 2 händelser, senast samma kväll |
| 10023 | AliExpress Standard shipping-Poland | **noll händelser, 36 h efter avsändning** |

Det är precis 10023 rutten finns för — och det är precis den kunden som fick
"inga spårningshändelser ännu" i stället för AE:s egna.

Lagat genom att flytta uppslaget in i storen: `getTaskByTrackingNumber` finns i
alla tre backends, med uttrycksindex i Postgres. Två egenskaper som inte ska tas
bort:

1. ☠️ **`store-access-audit.test.ts` är grinden, inte ögon.** Den läser
   källkoden i hela repot och fäller om en fil utanför de sex ägande modulerna
   nämner både ett Wix Data-anrop och en flyttad kollektion. Verifierad genom att
   återinföra buggen: testet fäller, och bara det. Den hittade dessutom
   `lib/llm/storage.ts` direkt — den var redan backend-växlad, alltså frisk, men
   det var en genomgång som tog sekunder i stället för en kväll.
2. **Uppslaget är versalokänsligt, och indexet är på samma uttryck.** Rutten
   versaliserar kundens inmatning; en task som bär numret gemener hade annars gett
   exakt samma tysta 404 en gång till.

⚠️ **Vad som INTE är vårt att laga.** Kundmejlen — "Ditt paket är på väg" och
"Ditt paket är framme" — ligger i **butiksrepot**, inte här. `www.fyndplats.se`
pekar på Vercel, så Velo-koden i `wix-velo/` är arv: dess `_functions/track` är
oåtkomlig på domänen, och `TrackingEvents` i Wix har **noll rader** (raderingen
rörde den aldrig — den står inte i någon kopielista). Butiken har tagit över hela
kedjan och den lever: `/_functions/track_webhook` svarar
`configured:true, resendConfigured:true`, tog emot 17TRACK-pushar 07:46 och 19:53
den 2026-09-01, och `/api/track` returnerar svenska händelser. Mejl skickas via
Resend därifrån — leta i butiksrepot, inte i det här.

**Regeln, som nu gäller två gånger:** en migrering är klar först när alla läsare
följt med — och en läsare som blir TOM syns varken i en kodaudit eller i en
felräknare. Det som hittar den är ett källkodstest.

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

### Recensionerna är UTE ur Wix — hela migreringen klar (2026-09-04)

**Taket är recensionerna.** Efter att drift-datan flyttade 2026-08-31 ligger Wix
på ~3 355 av 4 000 rader, och `FyndplatsImportedReviews` är **2 514 av dem** —
75 % av allt som är kvar. Aosoms egna produktrecensioner är uppmätta till
~9 500 texter (`/api/cron/aosom-reviews`) och får aldrig plats så länge raderna
bor där. Recensionerna är inte offret för taket, de ÄR det.

⚠️ **Översättningen är däremot INTE flaskhalsen**, tvärtemot vad man kunde tro:
2 421 av 2 514 recensioner är redan publikt synliga, och översättningskön är
**7 rader**. Chattflödet via `review-translate.yml` fungerar och är mätt.

| steg | vad | frigör taket? |
|---|---|:---:|
| 1 | `reviews`-tabell + `PostgresReviewStore` + spec i `ATT_KOPIERA` | nej |
| 2 | kopiera 2 514 rader, verifiera kanoniskt | nej |
| 3 | `REVIEWS_BACKEND=postgres` | nej |
| 4 | butiken läser via API, inte Wix Data direkt | nej |
| 5 | radera Wix-raderna | **ja** |

**Alla fem är gjorda.** Steg 5 kördes 2026-09-04: **2 514 granskade, 2 514
raderade, noll fel** — exakt det tal torrkörningen granskat per nyckel minuten
innan.

Kvittot efteråt, mätt och inte uträknat: `/api/review-aggregates` ger
oförändrat **512 produkter / 2 421 synliga omdömen**, den dynamiska
`/api/reviews/<id>` svarar med 42 omdömen på katalogens mest recenserade
produkt, och produktsidan renderar sina tre omdömen med snitt 4,7.
`betyg-diff` svarar **EJ TILLÄMPLIG (`kallanTomd`)** i stället för att bli rött
— tömd-källa-läget byggdes två dygn tidigare för precis den här dagen.

⚠️ **Marginalen mot taket är HÄRLEDD, inte färskmätt.** Wix hade ~3 355 rader
2026-09-01, varav 2 514 recensioner; efter raderingen är ~841 kvar. Bara
recensionsdelen av det talet är mätt idag. Aosoms ~9 500 recensionstexter
belastar dessutom inte längre taket alls — de skrivs till Postgres.

☠️ **Vägen tillbaka är stängd.** Recensionerna finns bara i Postgres, och Neons
point-in-time-återställning är det som gäller.

**Steg 2 är gjort och mätt:** 2 514 lästa, 2 514 skrivna, noll fel, och
verifieringen ger `reviews wix=2514 pg=2514 avvikande=0`.

**Steg 4 är gjort och mätt i drift.** Butiken läser inte längre Wix Data för
recensioner: produktsidan går mot `/api/reviews/<productId>` och listningarnas
kort mot `/api/review-aggregates`. Kvitto på en skarp, OCACHAD rendering
(`?cb=`, `x-vercel-cache: MISS`) samma dag:

| | |
|---|---:|
| produkter med betyg i aggregatet | 512 |
| summa synliga omdömen | **2 421** |
| kort med stjärnor på `/alla-produkter` | 69 |
| produktsidan | 3 omdömen, snitt 4,7 |

Talet 2 421 är exakt det som mättes oberoende mot Wix (2 421 av 2 514 synliga),
alltså räknar de två vägarna samma sak.

⚠️ **Verifiera ALLTID med cache-bust.** ISR-cachen ligger en timme, så en vanlig
hämtning direkt efter deployen serverar den GAMLA sidan — och den ser ut precis
som en fungerande ny. Första mätningen efter merge "visade" att härkomsten inte
renderades; den läste cachad HTML från förra bygget.
`/api/admin/revalidate?tag=reviews` tömmer alla produktsidor på en gång (kräver
`ADMIN_SECRET`), annars löser timmen det av sig själv.

☠️ **`REVIEWS_BACKEND` är FRIKOPPLAD från `STORE_BACKEND`, och default är
`wix-data`.** Ett första utkast lät `getReviewStore()` läsa `STORE_BACKEND` —
produktionen står på postgres, så lagret hade bytts i samma sekund koden
deployades, in i en TOM tabell: `/admin/reviews` hade slutat se de 2 514
raderna, nya recensioner skrivits dit ingen läser, och butiken fortsatt läsa
Wix. Ingenting hade kastat. Samma familj som `/api/tracking-events`
2026-09-01 — en läsare som blir TOM syns varken i en kodaudit eller i en
felräknare.

☠️ **Affärslogiken DELAS mellan lagren** (`normaliseraFörSkrivning`):
statusfallbacken (`pending`, aldrig `approved`) och hemflytten av kundbilder är
regler om RECENSIONER, inte om databasen. En tvilling hade betytt att en
publicerad recension pekar på leverantörens CDN i det ena lagret men inte i det
andra, beroende på vilken env-variabel som råkade vara satt.

**Härkomsten BÄRS av varje rad, men VISAS inte** (rättat 2026-09-03). Den
renderades en kort stund: upplysningsstycket ovanför listan och etiketten
"Importerat omdöme" per rad. **Leonard tog bort båda samma dag** (#596 i
butiksrepot) — ingen informationstext om var omdömena kommer ifrån. Det är hans
beslut som butiksägare, och den här raden påstod motsatsen i ett dygn.

Vad som står kvar, och som är den gräns som gäller:

☠️ **"✓ Verifierat köp" får ALDRIG sättas på en importerad rad.** I den här
koden betyder etiketten ett köp i VÅR butik, verifierat med token per order.
Fotnoten under listan ("skrivna av verifierade köpare") står kvar med flit —
den säger verifierade KÖPARE av varan, inte kunder hos oss.

☠️ **Okänt ursprung blir ALDRIG "vår kund".** Alla rader före 2026-08-17 saknar
fältet och är AE-importer; en fallback på `customer` hade varit överträdelsen
själv. Testerna i `lib/review-source.ts` låser den riktningen, och de gäller
oförändrat — det är bara PRESENTATIONEN som togs bort, inte klassificeringen.

⚠️ Bakgrunden till varför etiketterna byggdes står kvar här för den som tar upp
frågan igen: artikel 7.6 UCPD kräver upplysning om huruvida vi säkerställer att
omdömena kommer från konsumenter som faktiskt använt varan, och bilaga I §23b
förbjuder att presentera andras omdömen som egna kunders. Bedömningen av om
fotnoten ensam räcker är Leonards.

### ☠️ Och en SKRIVARE som skulle blivit föräldralös (2026-09-02)

Hittad genom att leta efter kvarvarande Wix-läsare inför steg 3 — och det var
inte en läsare. Butikens **`/api/omdome`**, dit kunden skriver sitt eget omdöme
efter ett verifierat köp, gjorde `POST /data/v2/items/save` RAKT mot
`FyndplatsImportedReviews`.

Det var rätt så länge recensionerna bodde där. Efter växlingen läser allt ur
Postgres — och kundens omdöme hade fortsatt hamna i Wix, där ingenting läser.
Raden hade aldrig synts i `/admin/reviews`, aldrig kunnat godkännas, aldrig
renderats. Wix svarar 200, så varken kunden, loggen eller en felräknare hade
märkt något.

Spegelbilden av `/api/tracking-events`: där blev en LÄSARE tom, här försvinner
en SKRIVNING. Och dyrare, för kundomdömena är de enda **förstahands**omdömena —
de som bär "✓ Verifierat köp" och som ensamma någonsin får bli
`aggregateRating` mot Google.

☠️ **Kodauditen kunde inte se den.** `store-access-audit.test.ts` läser DET HÄR
repot; skrivaren bor i butiksrepot. Grinden finns därför nu på båda sidor
(`lib/review-store-access.test.ts` på `headless-site`), verifierad genom att
återinföra buggen — den fäller och namnger filen.

Butiken postar nu till **`/api/reviews/customer`** med `REVIEW_INGEST_SECRET`
som Bearer-token. Tre egenskaper som inte ska tas bort:

1. ☠️ **Valideringen ligger kvar i butiken.** Den äger `REVIEW_TOKEN_SECRET`,
   verifierar tokenets signatur, kontrollerar att produkten ingick i ordern och
   att bildadresserna pekar på vår egen Wix Media. Att flytta hit hade betytt
   tvillingar av `verifyReviewToken`, `validateCustomerReview` och
   `buildCustomerReviewRow`. Rutten är tunn: hemligheten är förtroendegränsen.
2. ☠️ **`status` och `source` TVINGAS i rutten**, de läses aldrig ur kroppen.
   En anropare som kunde sätta `approved` hade lagt text direkt på
   produktsidan förbi modereringen, och `source` styr både etiketten och
   UCPD-upplysningen.
3. ☠️ **Fail-closed i båda ändar.** Saknas hemligheten svarar motorn 503 och
   butiken 503 — aldrig 200. Att svara kunden "tack!" på ett omdöme som aldrig
   lagrades är det enda utfall som är sämre än ett fel.

⚠️ **`REVIEW_INGEST_SECRET` måste stå i BÅDA Vercel-projekten med samma värde,
och vara satt innan `REVIEWS_BACKEND` växlas.**

### ☠️ Auditen före raderingen: tre scripts, och grinden var blind för dem

Auditen inför steg 5 hittade **ingen** kvarvarande läsare i `lib/` eller `app/`.
Den hittade tre i `scripts/`, och skälet stod i grinden själv:
`store-access-audit.test.ts` filtrerade bort hela `scripts/`.

- **`katalogkoll.mjs`** läste recensionerna direkt ur Wix. Med kollektionen tömd
  hade **varje** publicerad sida sett ut att sakna recensioner, och `--apply`
  hade köat en AE-hämtning för hela katalogen på ett falskt underlag — ~950 i
  rapporten där sanningen är ~440. Läser nu aggregatet, och **kastar** hellre än
  tolkar ett svar utan `betyg`-fält som noll.
- **`backfill-product-hashes.ts`** och **`backfill-suppliers.mjs`** läste
  `FyndplatsMappings`, tom sedan 2026-09-01. Hash-backfillen rapporterade
  "0 mappningar med AE-id" och hashade varje produkt utan sitt AliExpress-id —
  dubblett-detektorn tappade sin exakta matchning, tyst, i tre dygn.

**Regeln: ett script är inte mindre farligt än en rutt — det är farligare, för
det körs av en människa som tror på siffran den skriver ut.** Undantaget är
borta ur grinden.

### Den spärr som faktiskt skyddade raderingen

Recensionerna har **inget retention-fönster**, så `beslutaSida` kan aldrig
skriva av en saknad rad som "utgången": en enda Wix-rad som inte fanns i
Postgres hade avbrutit hela sidan. Torrkörningen granskade alla 2 514 utan att
avbryta — per-nyckel-bevis, inte en radräkning. Ett test låser riktningen.

### Historik: så såg ordningen ut

1. **Steg 3 — `REVIEWS_BACKEND=postgres` i Vercel.** Butiken läser via API:t
   oavsett vilket lager som svarar, så växlingen är osynlig för kunden. Först
   när den är gjord OCH verifierad släpps `FyndplatsImportedReviews` ur
   `ALDRIG_RADERA` och steg 5 blir möjligt. Spärren står kvar tills dess med
   flit: den är det som hindrar en radering av rader som fortfarande är facit.

   ☠️ **Kör `betyg-diff` FÖRE växlingen** (workflowen "Migrering — kopiera
   drift-datan till Postgres", fjärde läget → `/api/admin/review-backend-diff`).
   Det verifierade radantalet räcker INTE som kvitto här: aggregatet filtrerar
   på `status` och `rating` och grupperar per produkt, så en status av fel typ
   eller ett `rating` som blivit sträng i JSONB passerar en radräkning och
   fäller stjärnorna på varenda produktkort. Rutten instantierar BÅDA lagren
   direkt — aldrig via `getReviewStore()`, som bara returnerar det env pekar på
   och därmed hade jämfört ett lager med sig självt.

   **Körd och grön 2026-09-02**, före växlingen: `wix 512 produkter, 2 421
   synliga omdömen` mot `postgres 512 produkter, 2 421 synliga omdömen`, noll
   avvikande. Samma tal som butiken renderar. Växlingen är därmed mätt ofarlig
   i stället för antagen — kör läget en gång till EFTER den, då ska talen vara
   oförändrade.

   ☠️ **Svaret bär `aktivtLager` — vilket lager som FAKTISKT servar.** Efter
   växlingen ger `/api/review-aggregates` exakt samma tal ur båda lagren; det
   är hela poängen med att migrera bakom ett interface, och samtidigt skälet
   till att växlingen annars är omöjlig att verifiera utifrån. Utan fältet vore
   "steg 3 är gjort" ett antagande om att en deploy plockat upp en variabel.
   ⚠️ En env-variabel binds vid DEPLOY, inte när den sparas — en satt variabel
   utan efterföljande deploy ändrar ingenting, och `betyg-diff` såg exakt
   likadan ut i båda lägena innan fältet fanns.

   Två spärrar i den som inte ska tas bort: ett **golv på 100 produkter per
   sida**, för två tomma aggregat är per definition identiska och en fallen
   läsning hade annars rapporterats som "noll avvikelser, växla på"; och ett
   eget **tömd-källa-läge** (`kallanTomd`) för tiden efter steg 5, eftersom en
   jämförelse mot en raderad källa annars hade gjort jobbet rött vid varje
   körning för alltid. Snittet jämförs med 0,1 i tolerans (Postgres avrundar i
   SQL, Wix i JavaScript), antalet exakt.

## Mediainventering: "utan katalogreferens" är inte "oanvänd"

Mediabiblioteket på headless-sajten hade **30 231 bilder** 2026-08-27, mot 1 696
produkter. Frågan "vilka används inte?" går inte att besvara från chatten — ett
filobjekt är ~1,3 kB, så en full listning är ~39 MB. Den körs därför där
nycklarna finns: GitHub Actions-workflowen **"Bilder — inventera
mediabiblioteket"** → `/api/cron/media-audit`, rapporten hamnar i
`tools/media-audit/scan-latest.json`.

**Rutten kan inte skriva och kan inte radera.** Det är inte försiktighet på
måfå: Wix Media har inget API som svarar på VAR en fil används (kontrollerat
2026-08-27). Vi kan bara räkna vad katalogen pekar på — produkternas galleri,
`media.main`, `linkedMedia` och kategoribilderna. Utanför mätningen ligger
sidor, banners, logotyper, bloggen, Wix-appar och CMS-kollektionerna (bland
annat recensionsbilderna, som dessutom bor på ett **annat site-id**:
`WIX_SITE_ID`, inte butikens `HEADLESS_WIX_SITE_ID`).

Därför heter fältet `utanKatalogreferens`. Listan är ett underlag för en
människa, aldrig en dödslista — samma hållning som prisreparationens
"det finns ingen kör-allt-flagga".

Tre egenskaper som inte ska tas bort:

- **Katalogen läses FÖRE filerna.** Katalogen är den lilla sidan och den som
  gör listan meningsfull. Tar tidsbudgeten slut mitt i filerna får man en
  delrapport med korrekta referenser; tvärtom hade gett en lista där varje
  oläst produkts bilder ser föräldralösa ut.
- **`fullstandig: false` diskvalificerar listan för radering.** Den är sann
  bara när både filerna, katalogen OCH kategorierna gick klart.
- **Dolda kategorier räknas med.** En dold kategori kan publiceras igen, och
  dess bild ska inte hinna raderas under tiden.

Rapporten räknar också **byte-identiska dubbletter** (samma `hash`) och deras
kostnad — bara kopiorna, inte originalet. Dubbletter kostar plats även när de
används, och en stor post är importvägen: filer vars `displayName` är ett annat
Wix-media-id är omimporter av bilder som redan låg i biblioteket.

Övriga LLM-/kostnads-env-variabler dokumenteras i **`LLM-CONFIG.md`**.
