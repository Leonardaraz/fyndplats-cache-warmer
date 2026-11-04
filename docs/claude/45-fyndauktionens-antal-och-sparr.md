## Fyndauktionen: tio fynd om dagen och 30-dagarsspärren (2026-11-04)

ChatGPT:s audit föreslog att fyndauktionen ska synas tydligare på startsidan, och Leonard
frågade om tio fynd om dagen kostar mer än fem, och om Black Week kan ha 50 om dagen och 100
på fredagen. Svaret och planen står i PR-texten. Kort:

- **Driften kostar nästan ingenting mer.** Ticken går var tionde minut oavsett antal
  (`auction-tick.yml`), Wix tar inte betalt per anrop, och GitHub Actions är gratis för ett
  publikt repo.
- **Det som kostar är rabatten på de fynd som säljs**: högst 15 % (`MAX_DISCOUNT`), och
  golvet håller marginalen ovanför −7 % (`buildFloor`).
- **Under Black Week** blir det fler Aosom-ordrar att lägga för hand. En vara som
  auktionerats får heller ingen automatisk rea på 30 dagar (rea-regel 5 i
  `16-automatisk-rea.md`).

### Antalet per dag (`lib/auction/antal.ts`)

`auktionerFor(startAt)` ger antalet för auktionsdagen som startar 07:00 den dagen (svensk
väggklocka): `STANDARD_ANTAL` = 10, och `DAGAR` kan ge ett datum ett annat antal. Ticken
främjar tills ALLA levande (startade och schemalagda) är lika många som NÄSTA starts antal:

- **En dag med fler** (10 → 50): resten schemaläggs redan under dagen. Butiken visar en
  schemalagd rad först när dagens är slut, så de syns inte för tidigt.
- **En dag med färre** (100 → 50): ingenting främjas förrän dagens tagit slut kl 19.
- **Slotnumren** blir de lägsta lediga talen. En slot är bara raden id bland de levande.
- **`/api/auctions/rader`** läser upp till 200 levande rader. Startade och schemalagda kan
  samsas dagen före en större dag. "Senast sålda" har kvar sina 50.

**Black Week står i `DAGAR`**, med Leonards datum: 50 om dagen 23–29 november, 100 fredag
27 november, och 10 igen från 30 november. Ticken fyller en större dag redan dagen före:
söndag 22/11 kl 08 schemaläggs 40 till måndagen, och torsdag 26/11 fylls fredagen till 100 i
två omgångar (kl 08 och kl 19). `antal.test.ts` låser varje datum och övergångarna 22→23,
26→27→28 och 29→30, och `tick-blackweek.test.ts` kör hela veckan genom ticken var tionde minut.

☠️ **Grindarna före söndag 22 november**, när ticken börjar schemalägga måndagens 50:

- butikens gemensamma klocka för korten är mergad (planens del C2, butiken);
- generalrepetitionen med 50 fynd en vardag är gjord, med Leonards ja;
- kön räcker: veckan tar 400 olika produkter (6 × 50 + 100), och 30-dagarsspärren släpper
  aldrig samma vara två gånger.

### Ticken klarar 50 och 100 om dagen (`lib/auction/tick.ts`, planens del C2)

Ticken skrev förut en produkt i taget och sparade varje rad för sig. Med 100 fynd hade
timslaget blivit 100 läsningar, 100 skrivningar och 100 sparningar i rad, och kl 19 lika många
till plus främjandena. Rutten (`app/api/cron/auction-tick`) är nu bara kopplingen till Wix, och
logiken bor i `korTick` med beroendena utifrån, så att den går att pröva med 100 fynd.

Åtta egenskaper som inte ska tas bort:

1. **Högst fyra Wix-anrop samtidigt** (`SAMTIDIGA`). Wix stryper täta Stores-anrop:
   spec-skrivaren stoppades efter 186 och 127 sidor i rad (2026-11-01).
2. **Prisskrivningen gör om ett strypt försök** (`lib/auction/store.ts`, `PRIS_PAUS_MS`
   1, 3 och 8 s, och `Retry-After` upp till 15 s). Det gäller 429, edge-spärrens HTML-sida,
   408, 409 och 5xx. Varje nytt försök läser en färsk revision. En 404 (produkten är raderad)
   görs aldrig om, och ingen väntan får sluta efter tickens tidsgräns.
3. **Sparningarna samlas** i ett massanrop per steg (`sparaAuktioner`, felen per rad). ☠️ Går
   en såld eller avslutad rad inte att spara väntar främjandena: lagret säger då fortfarande
   live, och platsen hade fyllts två gånger.
4. **Tidsbudgeten är 240 s** av ruttens 300. Ingen ny skrivning startar efter den. Det som inte
   hann göras står i `kvar`, och nästa tick tar det. Varje steg tål att göras om.
5. ☠️ **Främjanden startar aldrig i Aosoms synkfönster**, och inte heller den sista minuten före
   det. Synken läser auktionerna en gång per körning (`05-aosom-synken/09-levande-fyndauktion.md`),
   och en rad som blev live mitt i en körning hade den inte sett. **Återställningen kl 19 väntar
   däremot aldrig**: ett auktionspris får inte stå kvar efter dagens slut.
6. ☠️ **En såld eller avslutad auktion stegas aldrig**, inte heller när återställningen föll.
   Förut sänktes en avslutad auktion vars återställning föll till golvet efter kl 19.
7. **Ordrarna läses till slutet**, med `strict`. Förut lästes tre sidor, och ett 403 gav tyst
   inga ordrar alls. Ett fel att läsa dem står nu i `errors`, och resten av ticket går ändå.
8. ☠️ **Klockan är Vercels cron var tionde minut** (`vercel.json`, låst i `schema.test.ts`).
   GitHub-schemat körde 29 gånger på 122 timmar i stället för ~735 (`39-orderpipelinen.md`),
   så ticket som skulle ta resten hade kunnat dröja en timme. Workflowen finns kvar för en
   körning för hand och som larm: de körningar GitHub ändå gör blir röda på `ok:false`.

Varje tick skriver en rad i Vercels logg, med bara antal:
`[auction-tick] mal=… sald=… slut=… steg=… framjad=… fel=… kvar=…/…/…/… wix429=… tid=…ms`.

**Mäts under generalrepetitionen:** `tid` och `wix429` på timslagen och kl 19, butikens
ombyggnadstid, sidvikten på mobil och korten i 390 px.

### 30-dagarsspärren (`lib/auction/trettio-dagar.ts`)

Under auktionen står ordinarie pris överstruket. 7 a § prisinformationslagen kräver att det
överstrukna priset är det LÄGSTA vi tagit de 30 dagarna före sänkningen. Leonard
2026-11-04: spärren gäller alltid.

Auktionens första sänkning kommer ett steg efter start (08:00). Fönstret är 30 dygn plus ett
dygns marginal före den, samma som rea-jobbet. Ett fynd stoppas av två skäl:

- **`prishistorik`**: `FyndplatsPrisforlopp` visar ett lägre pris i fönstret, eller kan inte
  belägga hela fönstret. Det gäller när varianten saknas, när historiken börjar för sent, när
  varianten inte gick att köpa när fönstret började, och när en lucka i avläsningen ligger i
  fönstret.
- **`nyssAuktionerad`**: produktens förra auktion slutade inom fönstret. Historiken ser inte
  auktionspriset, så auktionsraden är beviset.

**Följd under november:** produkter med flera varianter har bara timhistorik sedan
2026-11-01. Bakåtfyllningen gäller bara en variant. De, och nya produkter, går inte till
auktion förrän historiken räcker.

Seeden prövar varje kandidat som inte startat: en köad mot nästa start, en schemalagd mot sin
egen. Den körs varje natt 03:47 UTC, före 07-starten, och är sista grinden. Tickens
återvinning tar aldrig en vara vars auktion slutade inom fönstret.

### Strömbrytaren och första påslaget

Spärren står i `FyndplatsAppConfig` (`auktionTrettioDagar`). Den slås på med workflowen
auction-seed (`sparr`: `pa`/`av`), aldrig för hand, eftersom raden bär hemliga nycklar som
aldrig ska läsas ut. Av = torrläge: seeden räknar avslagen per skäl i rapporten
(`trettioDagar`) men tar inte bort något.

☠️ **Första påslaget tar bort många köade på en gång, och seedens skyddsräcke skriver då
INGENTING.** Det gäller också morgonens prisuppdatering av dagens fynd, som var felet
2026-09-28. Ordningen är därför:

1. Läs torrlägets tal.
2. Slå på med `sparr: pa`.
3. Kör seeden för hand med `apply` och `force`.

Därefter är det dagliga bortfallet litet. Är spärren på och prishistoriken oläsbar skriver
seeden ingenting, eftersom ett fynd utan prövning inte får starta.
