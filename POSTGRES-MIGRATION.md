# Flytta drift-datan ur Wix Data

Plan, skriven 2026-08-31 efter att Wix CMS slutat ta emot nya rader.

## Varför: taket är 4 000, vi ligger på 18 800

Wix-bannern är ordagrann: *"You've reached your 4,000 items limit across all
collections."* Taket är alltså **globalt över alla kollektioner**, inte per
kollektion — och det stoppar bara NYA rader. Befintliga ligger kvar, så
katalogen växte rakt förbi taket utan att något sa ifrån.

☠️ **Det förklarar varför städningen inte hjälpte.** 2026-08-30/31 raderades
~36 000 rader (55 000 → 18 800) och blockeringen släppte inte. Den *kunde* inte
släppa. **Delvis städning ger exakt noll** — antingen är man under 4 000 eller
så är man blockerad. Det var en falsifierad hypotes, inte otur.

Priset betalades i produktion: order 10024 var betald 09:27 och nådde aldrig
`/admin`, eftersom `createTaskIfAbsent` inte kunde skriva sin rad.

### Räkningen, och varför bara ETT alternativ går ihop

| åtgärd | rader kvar | under 4 000? |
|---|---:|---|
| Sänk bara mappningarna | 13 400 | ❌ 3,4× över |
| Radera alla loggar | 13 300 | ❌ |
| Loggar **och** mappningar | 7 900 | ❌ |
| **Flytta ut all drift-data** | **3 470** | ✅ |

Det finns alltså ingen delmängd som räcker. Antingen flyttas hela drift-datan
eller så är problemet kvar.

## Vad som flyttar, och vad som stannar

Uppmätt genom att söka igenom butiksgrenen efter kollektionsnamn: storefronten
läser bara TRE kollektioner direkt ur Wix Data. Allt annat läses enbart av vår
egen Next.js-backend, som kan prata med vilken databas som helst.

**Stannar** (butiken läser dem direkt — flyttas de måste butiken byggas om):

| kollektion | rader | läses av |
|---|---:|---|
| `FyndplatsImportedReviews` | 2 512 | `lib/reviews.ts` |
| `FyndplatsAuctions` | 797 | `lib/auction-sold.ts` |
| `FyndplatsRedirects` | 40 | `next.config.ts` |
| småposter (tasks, events, alerts, restock, m.fl.) | ~121 | backend |

**Flyttar** (15 353 rader, fem moduler):

| modul | kollektioner | rader |
|---|---|---:|
| `lib/store/wix-data.ts` | Mappings, Tasks, WebhookEvents, Audit, Tokens | 7 295 |
| `lib/sync/sync-log.ts` | SyncLog, SyncState, SyncAlerts | 4 678 |
| `lib/store/product-hashes.ts` | ProductHashes | 1 463 |
| `lib/store/import-costs.ts` | ImportCosts | 1 282 |
| `lib/llm/storage.ts` | LlmStats, VariantTranslations, ClaudeCache, AnthropicSpend | 681 |

⚠️ **Sexton andra filer anropar också Wix Data direkt** (auktioner,
recensioner, redirects, restock, watchlist, app-config, pricing-config …). De
rörs INTE. De äger små kollektioner, och tre av dem läses av butiken. Att dra in
dem hade tredubblat blast-radien utan att frigöra en enda rad som spelar roll.

## Varför det blir bättre, inte bara annorlunda

Det här är poängen med att göra jobbet nu i stället för att uppgradera planen.

1. **Synken slutar läsa 4 467 rader den kastar bort.** `listMappings()`
   sidhanterar hela tabellen över HTTP vid varje körning; AE-synken hoppar sedan
   över alla Aosom-rader och Aosom-synken över alla AE-rader. Med SQL blir det
   `listMappings({ supplier })` — en indexerad fråga. Det var precis den
   obegränsade fan-outen som sänkte synken i 57 timmar (2026-08-28).

2. **Dubbel-order-låset blir atomiskt på riktigt.** `claimTask` är idag en
   Wix-PATCH med filter; i Postgres är det
   `UPDATE … WHERE claim_token IS NULL AND aliexpress_order_id IS NULL RETURNING`
   — en sats, garanterad av databasen. Samma sak för `cancelTaskIfFree`. Det är
   koden som står mellan oss och att beställa en kundorder två gånger.

3. **Retention blir en `DELETE WHERE at < …`.** Inga asynkrona Wix-jobb, inget
   jobId att gissa på, ingen risk att loggvolym blir en tillgänglighetsfråga
   igen. Fönstren i `lib/retention.ts` behålls som de är.

4. **Den föräldralösa produkten går att förebygga.** Importen måste skapa
   Wix-produkten först (mappningen behöver dess id), och faller skrivningen
   däremellan är produkten borttappad — det hände 04:40 den 31:e
   (`3e6f2d24-e045-44ad-aed9-067030b01f46`). Med en egen databas kan importen
   skriva en avsiktsrad FÖRE Wix-anropet och fylla i `wix_product_id` efteråt.
   Då finns raden alltid, och dubblettspärren ser artikeln som tagen.

5. **Kvotvakt med förvarning.** En liten koll som räknar Wix-raderna och mejlar
   när de passerar 3 200 av 4 000. ☠️ Hela den här incidenten var osynlig tills
   en kund hörde av sig; ett tak man kan gå in i utan förvarning ska inte finnas
   kvar efter att vi rört systemet.

## Databas

**Neon Postgres** (`@neondatabase/serverless`), samma val Vercel själva
förvalt.

- HTTP-drivrutin byggd för serverless — ingen poolare, inga hängande sockets i
  en lambda som fryses mitt i.
- 15 400 rader är ~15 MB. Gratisnivån är 0,5 GB.
- Vi behöver frågor, filter, index och villkorade uppdateringar. Redis/KV har
  fel form för `listMappings({ supplier })`; en nyckel-värde-butik hade bara
  flyttat samma sidhantering någon annanstans.

Ingen ORM. Rå SQL i fem moduler är mindre kod än ett schemaverktyg, och
TypeScript-typerna finns redan i `lib/store/index.ts`.

## Schema

Mönstret genomgående: **riktiga kolumner för det vi frågar på, JSONB för
svansen.** `ProductMappingRecord` har 30 fält varav sju används i filter — att
göra alla 30 till kolumner vore trettio migrationer att hålla i synk med en typ
som redan är sanningen.

```sql
create table mappings (
  wix_product_id       text primary key,
  supplier_product_id  text not null,
  supplier             text,
  draft_status         text,
  needs_ai_polish      boolean,
  priority             text,
  reviews_checked_at   timestamptz,
  data                 jsonb not null,      -- resten av posten
  updated_at           timestamptz not null default now()
);
create unique index on mappings (supplier_product_id);   -- dubblettspärren
create index on mappings (supplier);                     -- filtrerad listning

create table tasks (
  task_id              text primary key,     -- `${orderId}:${lineItemId}`
  order_id             text not null,
  status               text not null,
  claim_token          text,                 -- CAS-låset
  aliexpress_order_id  text,
  data                 jsonb not null,
  created_at           timestamptz not null
);
create index on tasks (order_id);
create index on tasks (status);
```

Plus `webhook_events`, `audit`, `aliexpress_tokens`, `sync_log`, `sync_state`,
`sync_alerts`, `product_hashes`, `import_costs` efter samma mönster.

De fyra LLM-kollektionerna blir **en** tabell:

```sql
create table llm_kv (
  collection text, key text, data jsonb not null, at timestamptz,
  primary key (collection, key)
);
```

## Genomförande

Sex steg. Ordningen är inte förhandlingsbar — se rollback.

0. ☠️ **Avlasta `STORE_BACKEND` FÖRST.** Se fynd A nedan — utan det här steget
   stänger själva växlingen av budgettaket, variantcachen och bulk-importen,
   tyst. Det är en förutsättning, inte en förbättring.

1. **Bygg backenden.** `lib/store/postgres.ts` implementerar `Store` (19
   metoder), plus Postgres-vägar i de fyra sidomodulerna. Ett tredje `case` i
   `lib/store/factory.ts`. **Ingen av de 44 filer som läser mappningar ändras** —
   de anropar `getStore()`.

2. **Testa mot samma svit.** `wix-data.test.ts` beskriver redan förväntat
   beteende; kör den mot Postgres-implementationen. CAS-metoderna får egna
   samtidighetstester (två parallella `claimTask` → exakt en vinnare).

3. **Kopiera.** `scripts/copy-to-postgres.ts` läser ur Wix (läsning fungerar,
   det är bara skrivning som blockeras) och upsertar. Idempotent OCH
   **återupptagbar med markör** — se fynd C. Den får INTE använda `queryAll`
   (fynd B). Rapporterar antal per tabell.

4. **Verifiera.** Radantal per tabell mot Wix, plus fält-för-fält-jämförelse på
   ett stickprov. ☠️ Antalet räcker inte som kvitto — det är sjunde gången i
   det här projektet ett svar utan fel visat sig vara tomt.

5. **Växla.** `STORE_BACKEND=postgres` i Vercel, omdeploy. Kör
   kopieringsskriptet en gång till i "fyll-bara-luckor"-läge för rader som
   ändrats under fönstret; det skriver aldrig över nyare Postgres-data.
   Följ en hel cron-cykel: synk, aosom-sync, order-backfill.

6. **Radera i Wix — SIST.** Först när steg 5 stått en dygnscykel. Det är den
   här raderingen som frigör kvoten.

### ☠️ Ordningen mellan sista kopieringen och växlingen

Kopieringen är en upsert **från Wix till Postgres**. Det är rätt så länge Wix är
sanningen. I samma sekund som `STORE_BACKEND=postgres` slår igenom vänder
riktningen: produktionen skriver till Postgres, Wix fryser — och en körning
härifrån hade då **tyst rullat tillbaka levande data till gårdagens värden**,
med ett svar som ser identiskt lyckat ut ("15 310 skrivna").

Rutten vägrar därför skarp kopiering när `STORE_BACKEND=postgres`. Torrkörning
och verifiering är fortfarande tillåtna — de läser bara, och att kunna jämföra
kopian mot källan EFTER växlingen är precis vad man vill kunna göra under det
dygn Wix-raderna ligger kvar som väg tillbaka.

**Kör därför sista kopieringen strax FÖRE växlingen.** Fönstret däremellan är
låg risk och självläkande: nya ordrar kan ändå inte skrivas till Wix (taket
blockerar just inserts), och det som hinner ändras — synk-state, loggrader,
mappningarnas saldon — skrivs om av nästa synk-körning.

### Rollback

`STORE_BACKEND=wix-data` och omdeploy. Wix-raderna finns kvar ända till steg 6,
så vägen tillbaka är en env-variabel — det är exakt därför raderingen ligger
sist och inte först.

## Vad som INTE ska göras

- ☠️ **Radera inte i Wix före växlingen.** Det är den enda oåterkalleliga
  åtgärden i hela planen och den enda som inte går att ångra med en env-variabel.
- ☠️ **Packa inte flera poster i en JSON-blob för att spara rader.** Synken
  skriver åtta parallellt (`mapWithConcurrency`); samtidig läs-ändra-skriv på en
  delad blob tappar uppdateringar tyst. Det hade bytt ett synligt tak mot en
  osynlig datakorruption.
- ☠️ **Lägg inte fälten på Wix-produkten i stället.** Butikens produkter har en
  egen kvot (bevisat 2026-08-31: produkten skapades medan CMS-raden avvisades),
  men en `variantsInfo`-PATCH **publicerar ett utkast** — och 4 000 opolerade
  tyska utkast får inte hamna på sajten för att vi ville spara rader.
- **Flytta inte recensioner och auktioner i den här omgången.** De läses av
  butiken direkt och kräver att storefronten byggs om. De ryms under taket som
  det är.

## Efteråt

3 470 av 4 000 är 530 raders marginal, och recensionerna växer. Kvotvakten i
punkt 5 ovan är därför inte en trevlighet utan det som gör att nästa gång blir
en varning i stället för en tappad order. Behövs mer utrymme är nästa steg att
låta butiken läsa recensioner via vårt API i stället för direkt ur Wix Data —
då ryms allt med marginal för lång tid framåt.

---

# Audit av planen ovan (2026-08-31)

Planen granskad mot koden innan något byggs. Fyra fynd, två blockerande.

## ☠️ A. `STORE_BACKEND=postgres` stänger av tre saker TYST — blockerande

`lib/store/factory.ts` **kastar** på okänt värde, vilket är rätt. Tre andra
moduler gör det inte — de jämför mot `"wix-data"` och faller tillbaka till
minnet när värdet är något annat:

| modul | rad | vad som händer vid `postgres` |
|---|---|---|
| `lib/llm/storage.ts` | `useWixBackend()` | allt LLM-lager blir in-memory |
| `lib/watchlist/store.ts` | ternär | `MemoryWatchlistStore` |
| `lib/bulk-import/store.ts` | ternär | `MemoryBulkImportStore` |

Den värsta är den första, och den är inte uppenbar: **den dagliga
budgettaket bor i `FyndplatsAnthropicSpend`.** In-memory får varje lambda sin
EGEN räknare, så taket slutar i praktiken att gälla — och variantöversättningens
cache töms, så samma råvärde betalas om vid varje import. Ingen av dem loggar
något. Bulk-importen är nästan lika illa: jobbet skrivs i en lambda och
worker-cronen läser i en annan, så det försvinner varje minut.

**Åtgärd (steg 0):** en enda `storeBackend()`-hjälpare som alla läser, som
kastar på okända värden. Modulerna som STANNAR på Wix (watchlist, bulk-import)
ska inte fråga efter `STORE_BACKEND` alls utan efter om Wix är konfigurerat —
de har inget med valet av drift-databas att göra.

## ☠️ B. `queryAll` avkortade tyst vid 10 000 rader — LAGAT

Inte ett planfel utan en bugg planen råkade gå förbi, och den var redan live:

```ts
// safety-tak: 100 sidor … "långt över nuvarande skala"
for (let offset = 0; offset <= 10_000; offset += pageSize) { … }
```

Kommentaren skrevs när katalogen var ~900 mappningar. Idag är den **5 470 —
55 % av taket** — och Aosom-feeden har 5 566 artiklar kvar. Vid 10 000 hade
`listMappings()` returnerat de första 10 000 och synken slutat se resten **utan
felmeddelande**: produkterna hade bara tystnat.

Samma klass som retention-konstanterna och den obegränsade fan-outen — en
konstant som var rätt när den sattes och blev fel när volymen växte under den.
Taket kastar nu i stället, med två tester som låser det (verifierat genom att
återinföra avkortningen).

**Följd för planen:** kopieringsskriptet får inte använda `queryAll`. Ett
skript som tyst kopierar 10 000 av 15 353 rader och rapporterar "klart" är
precis den tysta halvmigrering som inte får hända.

## C. Kopieringen är ~154 sidor i rad — måste vara återupptagbar

15 353 rader / 100 per sida. Wix har strypt oss vid ~40–50 sidor i rad
tidigare (mediabiblioteket, 2026-08-28). Det var en annan API-familj, så det är
inte samma tak — men mönstret i det här repot är entydigt: **allt som sveper
ska bära en markör.** Skriptet ska följa svepets vanliga form (markör i svaret,
backoff på 429, återupptagbart), inte köras som en lång loop och hoppas.

## D. Antagandet som bär hela räkningen — nu bevisat

Planen förutsätter att butikens **produkter** inte räknas mot samma 4 000. Det
var obevisat och hade fällt hela kalkylen om det var fel.

Det är nu mätt, av haveriet självt: 2026-08-31 kl 04:40:39 **skapades** Wix-
produkten `3e6f2d24…` samtidigt som mappningsraden avvisades med `WDE0195`.
Delade de kvot hade båda fallit. De föll inte lika — alltså är kvoterna skilda.

## Två kontroller som gick rent

- **Inget som migrerar läser Wix interna fält** (`_id`, `_createdDate`,
  `_updatedDate`, `_owner`). De tre träffarna i koden är Wix *Orders* och
  redirects — båda stannar i Wix.
- **Butiken läser ingen kollektion enbart via env-variabel.** Alla tre
  träffarna på `WIX_DATA_COL_*` i butiksgrenen pekar på
  `FyndplatsImportedReviews`, som stannar.

## Storleken, mätt i stället för gissad

En Aosom-mappning är ~900 byte som JSON; AE-rader med många varianter är
större. 15 353 rader landar i storleksordningen **10–30 MB**. Vilken
gratisnivå Neon än har just nu är marginalen flera tiopotenser — det är inte en
risk, och planen ska inte luta sig mot ett prisblad jag citerat ur minnet.

## Acceptanstest som saknades

Migreringen är klar när **order 10024 har en task och syns i `/admin`** utan
att någon rört den för hand. Det är hela anledningen till att arbetet finns,
och det ska stå som ett kvitto i slutet, inte antas.

## Steg 6: radera Wix-raderna (2026-09-01)

Det som faktiskt frigör 4 000-taket. Kopieringen gjorde datan säker, växlingen
gjorde Postgres till sanningen — men Wix-raderna låg kvar och band kvoten, så
varje NY rad i en Wix-kollektion avvisades fortfarande.

Föregicks av ett dygns drift på Postgres, mätt och inte antagen:

| | |
|---|---:|
| `error`-rader i Vercel på 20 h | **0** (mot 12 dygnet före) |
| `aliexpress-sync` | 10 körningar (varannan timme) |
| `order-backfill` | 20 |
| `auction-tick` | 24 |
| `aosom-sync` | 4 |
| Riktiga ordrar genom webhooken | **3** |

Dagliga rutter som alla kom igenom: `order-guard`, `review-queue`, `watchlist`,
`supplier-watch`, `aosom-import`, `aosom-media-cleanup`, `prune-customizations`.

### `/api/admin/radera-wix` — fem spärrar

☠️ **Det här är migrationens enda oåterkalleliga operation.** Wix egen
dokumentation är entydig: *"Once an item has been removed from a collection, it
can't be restored."* Kopieringen gick att köra om, växlingen är en env-variabel,
verifieringen skriver ingenting. Den här raderar rader som efteråt bara finns i
Postgres.

1. ☠️ **Varje rad slås upp i Postgres innan den raderas.** Inte radantal, inte
   ett stickprov — varje id. Saknas ett enda avbryts HELA sidan och ingenting
   raderas ur den. Verifieringens tio rader per tabell duger för att upptäcka en
   trasig kopia, inte för att auktorisera en radering av 15 000 rader.
2. ☠️ **Spärrlistan `ALDRIG_RADERA` är egen, inte härledd ur `ATT_KOPIERA`.** De
   tre kollektioner butiken läser direkt (recensioner, auktioner, redirects)
   plus tokenraden, app-configen och prisreglerna. Att bara lita på "vi loopar
   över kopielistan" hade betytt att en framtida rad där tyst vidgar
   blast-radien. Två lås, och det andra måste öppnas medvetet.
3. ☠️ **Radering på explicit id-lista, aldrig på filter och aldrig truncate.**
   Ett filter som matchar bredare än avsett är det fel som inte går att ta
   tillbaka.
4. ☠️ **Skarpt läge läser alltid från offset 0.** Radering KRYMPER kollektionen,
   så en offset-markör hoppar över precis så många rader som nyss raderades —
   media-cleanups fälla. Nästa sida flyttar sig till offset 0 av sig själv.
   Torrläget stegar däremot framåt, eftersom ingenting krymper där.
5. ☠️ **Spegelbilden av kopieringens 409.** Kopieringen vägrar köra EFTER
   växlingen; raderingen vägrar köra FÖRE den. Raderas källan medan
   produktionen läser den är det inte en migrering, det är en utplåning.

Två snurr-spärrar utöver det: en rad utan `_id` går inte att radera på id och
hade kommit tillbaka först i varje varv, och ett varv som raderar noll rader ur
en icke-tom sida avbryter i stället för att snurra tyst tills tidsbudgeten är
slut.

Tio tester låser spärrlistan och sidbeslutet (`lib/migration/radera-wix.test.ts`).

Körs från workflowen **"Migrering — radera drift-datan ur Wix Data"**
(`radera-wix.yml`), lägen `torr` · `radera`. Torrkörning är default.

