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

⚠️ **Cronen är avstängd sedan 2026-09-15**, och Leonard bestämde 2026-10-29 att
den ska förbli det. Se *AliExpress-synken är avstängd med flit* nedan.

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

### AliExpress-synken är avstängd med flit (2026-09-15, Leonard 2026-10-29)

Cronen `/api/cron/aliexpress-sync` togs bort ur vercel.json 2026-09-15 (#633).
Neons CU-timmar höll på att ta slut, och Leonard hade pausat AliExpress till
förmån för Aosom. Neon är ersatt av Wix sedan 2026-10-29, så det första skälet
finns inte längre. Leonard bestämde samma dag att synken ändå ska förbli
avstängd.

Mätt 2026-10-29:

| | |
|---|--:|
| AliExpress-mappningar | 912 |
| i synkens urval (inte avvisade) | 767 |
| publicerade | 749 |
| köpbara (i lager eller delvis) | 622 |
| ordrar sedan 2026-09-15 med en AliExpress-vara | 19 av 111 |
| AliExpress-rader i de ordrarna som skickats | 22 av 22 |

Ingenting kollar alltså om AliExpress-varorna finns kvar eller vad de kostar.
En vara som tagits ner hos AliExpress står kvar som köpbar, och felet syns
först när ordern ska läggas. Prishöjningar larmas inte. Bara synken skriver
sync-larm, så de öppna larmen i `/admin/sync-alerts` är från före 2026-09-15.

Det som fortfarande går: nyckeln förnyas av workflowen "Refresh AliExpress
tokens" (den 2026-10-29 giltig till 2026-11-25), och spårningen för
AliExpress-ordrar hämtas av workflowen "Poll AliExpress tracking" i GitHub
Actions, inte av Vercel.

Två saker hängde på cronen och har flyttat:

1. **Morgonmejlet läser vercel.json** (`arSchemalagd` i `lib/orders/guard.ts`).
   Utan cron-rad säger statusraden att synken är avstängd, utan ⛔. Står raden
   i vercel.json men synken har inte kört larmar mejlet som förut. Sedan
   2026-10-29 räknas dessutom varje ⛔ i ämnesraden: "⛔ SYNKEN HAR INTE KÖRT"
   stod i mejlet varje dag i sex veckor, under ämnesraden "✅ allt rullar".
2. **Loggstädningen har en egen cron**, `/api/cron/retention` kl 02:50 UTC
   (`lib/retention-korning.ts`). Den låg i synkens rutt och har inte körts
   sedan 2026-09-15. Den 2026-10-29 hade auditen 10 104 rader, varav 7 706
   äldre än 14 dygn, och synkloggen 8 954, alla äldre än sju. Första körningen
   raderar ungefär de raderna. En körning per dygn räcker med Wix Business
   Elite; med taket på 4 000 rader (2026-08-31) behövdes den varje timme.

Slå på synken igen: lägg tillbaka raden
`{ "path": "/api/cron/aliexpress-sync", "schedule": "0 */2 * * *" }` i
vercel.json. Inget annat behöver ändras, och morgonmejlet väntar sig då
körningar igen. Med standardvärdet 100 AliExpress-anrop per körning
(`SYNC_MAX_API_CALLS`) hinns urvalet med på ungefär 16 timmar.
