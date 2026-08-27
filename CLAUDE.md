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
(`AOSOM_FEED_URL`, uppdateras 3 ggr/dygn). Sortimentet importeras som **osynliga
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
Rutten är **inte schemalagd** — en cron som fyller poleringskön snabbare än
någon hinner skriva om texterna ger bara en växande hög tyska utkast.

### Fyra saker som inte ska tas bort

1. **`supplier: "aosom"` på mappningen.** Lagersynken, prisbevakningen,
   prisreparationen, fraktkontrollen och recensionshämtningen slår alla upp
   `supplierProductId` mot AliExpress API. Ett Aosom-artikelnummer skickat dit
   är 5 566 omöjliga uppslag per körning som äter `maxApiCalls` och tränger
   undan de produkter som faktiskt behöver synkas. Spärren är
   `isAliExpressMapping` i `lib/store/supplier.ts` — en grep hittar alla
   ställen som bryr sig. Fältet faller tillbaka på `aosom:`-prefixet i id:t, så
   en rad som tappat fältet klassas ändå rätt.
2. **Frakten ligger i inköpspriset.** Det är hela skillnaden mot AliExpress, där
   EU-lagerpriset är levererat. Aosoms SE-frakt är **per kolli** och skalar med
   vikten (16 € under två kilo, över 100 € över fyrtio). Adaptern räknar
   `costUsd = (grossist + SE-frakt) × eurToSek / usdToSek` så att
   `landedCostSek` blir rätt — fältet som både lönsamhetsöversikten och
   auktionens golvbud läser. Håller man frakten utanför blir varje marginal fel
   åt samma håll och auktionen kan sälja under inköp.
3. **En rad = en produkt.** `Psin` ser ut som en föräldranyckel men grupperar
   *relaterade varor*: de tretton raderna under `24G58OVN9S001` är tretton olika
   valphagar med olika antal paneler och priser från 55 till 119 €. Grupperar
   man på den blir varianter av produkter som inte är utbytbara.
4. **Markören flyttas även vid fel.** Annars fastnar hela svepet på en trasig
   rad: nästa körning börjar om på samma produkt, misslyckas igen, och katalogen
   står stilla. Felet står i svarets `errors` och körs om riktat med `?sku=`.

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
