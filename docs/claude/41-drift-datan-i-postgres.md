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
