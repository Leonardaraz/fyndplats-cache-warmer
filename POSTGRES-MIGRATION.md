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

1. **Bygg backenden.** `lib/store/postgres.ts` implementerar `Store` (19
   metoder), plus Postgres-vägar i de fyra sidomodulerna. Ett tredje `case` i
   `lib/store/factory.ts`. **Ingen av de 44 filer som läser mappningar ändras** —
   de anropar `getStore()`.

2. **Testa mot samma svit.** `wix-data.test.ts` beskriver redan förväntat
   beteende; kör den mot Postgres-implementationen. CAS-metoderna får egna
   samtidighetstester (två parallella `claimTask` → exakt en vinnare).

3. **Kopiera.** `scripts/copy-to-postgres.ts` läser ur Wix (läsning fungerar,
   det är bara skrivning som blockeras) och upsertar. Idempotent och
   omkörningsbar. Rapporterar antal per tabell.

4. **Verifiera.** Radantal per tabell mot Wix, plus fält-för-fält-jämförelse på
   ett stickprov. ☠️ Antalet räcker inte som kvitto — det är sjunde gången i
   det här projektet ett svar utan fel visat sig vara tomt.

5. **Växla.** `STORE_BACKEND=postgres` i Vercel, omdeploy. Kör
   kopieringsskriptet en gång till i "fyll-bara-luckor"-läge för rader som
   ändrats under fönstret; det skriver aldrig över nyare Postgres-data.
   Följ en hel cron-cykel: synk, aosom-sync, order-backfill.

6. **Radera i Wix — SIST.** Först när steg 5 stått en dygnscykel. Det är den
   här raderingen som frigör kvoten.

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
