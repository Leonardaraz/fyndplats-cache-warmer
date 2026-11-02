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

### Syskonimporten: en sidas familj, utan artikelnummer (2026-09-30)

Leonards fråga: varför är det orange reservtaket inte importerat? Det var det.
Nattens import tog det 2026-09-29 som ett osynligt utkast (`eabb104a`), och det
som saknades var sammanslagningen. Första svaret gissade att `skipFreightHeavy=1`
hade hoppat över raden, utan att någon sökt bland utkasten. **Sök bland utkasten
innan du förklarar varför en färg saknas.**

Verktyget behövs ändå. Nattens import hoppar över rader där frakten kostar mer än
varan (`skipFreightHeavy=1`), och ett lätt och billigt syskon faller ofta där. Att
hämta just en sådan rad krävde artikelnumret i en workflow-input, alltså i en
publik logg.

`/api/cron/aosom-import?syskonTill=<wix-id>` tar i stället en SIDA. Rutten läser
sidans artiklar, hittar feedens färg- och storlekssyskon med syskonsvepets
`jamfor` (`lib/aosom/syskon-import.ts`) och importerar dem som osynliga utkast,
även de frakttunga, eftersom en människa har valt familjen. Workflowen heter
**"Aosom — importera en sidas färg- och storlekssyskon"** (`plan` · `importera`).
Tre egenskaper som inte ska tas bort:

1. ☠️ **Samma vara som EN av sidans artiklar importeras aldrig**, även när den
   är ett färgsyskon till en annan. En sida i brunt och orange ska inte få en
   brun rad till som "ny färg". Två kandidater som är samma vara blir en, den
   med störst saldo. Ett test fällde den första versionen på just det.
2. ☠️ **Svaret bär aldrig artikelnumret.** Ett syskon beskrivs med feedens
   färg, måtten, saldot, status, wix-id och `nattensImportHoppar`, som svarar
   på frågan "varför är den inte importerad?".
3. **`syskonAnkare: 0` är inte "inga syskon".** Då fanns ingen av sidans
   artiklar i feeden (lågt saldo tas bort tillfälligt), och jobbet fäller.

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

### ☠️ Artikelnumret når aldrig en Actions-logg (2026-09-27)

Granskat lokalt, utan att ett enda nummer skrevs ut: **142 publika loggar** bar
Aosoms artikelnummer — 28 av 35 synkkörningar, alla 29 importkörningar, 42 av
53 feedsökningar och 43 av 57 ommappningar. **29 av feedsökningarna bar
dessutom inköpspriset bredvid numret.** Loggarna är raderade. Kanalerna var
fem, och alla är stängda:

| kanal | var | lagning |
|---|---|---|
| hårdkodade nummer i källan | importens `rökprov` | GitHub skriver ut källan i VARJE körning; `rökprov` tar nu `limit=3` |
| markören i varvsraden, summeringen, markörfilen och commitmeddelandet | import, bildfix | rutterna **förseglar** markören (`lib/aosom/markor.ts`, AES-256-GCM, nyckel ur `CRON_SECRET`) |
| `\(.sku)` i utskrifter | synkens prisvarningar och "exempel-artikelnummer", bildfixens fel | Wix-id i stället — `wixProductId` finns i synkens och bildfixens `errors`/`varningar` |
| inputen i env-blocket | synkens `sku`, importens `after`, ommappningens `sku`, feedsökningens `q` | eget steg **"Maskera"** före det steg som läser den |
| numret, Aosom-länken och priset som standard | feedsökningen | bara i kuvertet; `visa_pris` är borttagen |

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Maskeringen ligger i ett EGET steg.** Ett stegs env-block skrivs ut
   innan dess skript kör, så `::add-mask::` i samma steg kommer för sent.
   Värdet läses ur `$GITHUB_EVENT_PATH`, aldrig via `env:` eller `${{ }}`.
2. ☠️ **En förseglad markör som inte går att öppna är 400**, inte "börja om".
   En handskriven markör i klartext tas fortfarande emot.
3. **`redigera()` i workflowerna är sista skyddet, inte det första.** Fritext
   (felkroppar, produktnamn) har ingen form att lita på.
4. ☠️ **gatelibs `ARTNR` missar två former som finns i drift:** tre siffror–tre
   siffror utan svans, och siffra-bokstav-siffra. Den första går inte att
   skilja från ett intervall på formen, så den stängs av kanalreglerna ovan.

Grinden är `lib/workflows/artikelnummer-i-logg.test.ts` — tvilling till
`kostnad-i-logg.test.ts`. Den fäller på ett nummer i en workflow-källa, en
interpolation av ett artikelfält, en utskriven anrops-URL, en markör i ett
commitmeddelande och en artikel-input utan maskeringssteg. Verifierad genom att
återinföra varje gammalt fel: sju av sju fälls, var och en av exakt en regel.

⚠️ **Lagningen biter först när den ligger på `main`** — `workflow_dispatch`
kör `main` som default (se "En OMERGAD gren skyddar ingenting"). Git-historiken
bär fortfarande de gamla numren; den skrivs inte om utan Leonards uttryckliga ja.

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
