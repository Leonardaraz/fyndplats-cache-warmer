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

**Generalrepetitionen står i `DAGAR`** (Leonards ja 2026-11-14): 50 fynd onsdag 18 november,
en vanlig vardag före Black Week. Tisdag 17/11 kl 08 schemaläggs 40 till onsdagen och kl 19
resten, och torsdag 19/11 är det tio igen. `antal.test.ts` låser 17→18→19, och
`tick-blackweek.test.ts` kör de tre dagarna genom ticken.

**Black Week står i `DAGAR`**, med Leonards datum: 50 om dagen 23–29 november, 100 fredag
27 november, och 10 igen från 30 november. Ticken fyller en större dag redan dagen före:
söndag 22/11 kl 08 schemaläggs 40 till måndagen, och torsdag 26/11 fylls fredagen till 100 i
två omgångar (kl 08 och kl 19). `antal.test.ts` låser varje datum och övergångarna 22→23,
26→27→28 och 29→30, och `tick-blackweek.test.ts` kör hela veckan genom ticken var tionde minut.

☠️ **Grindarna före söndag 22 november**, när ticken börjar schemalägga måndagens 50:

- butikens gemensamma klocka för korten är mergad (planens del C2, butiken);
- generalrepetitionen med 50 fynd onsdag 18/11 är gjord och mätt (Leonards ja 2026-11-14);
- kön räcker: 15–29/11 tar cirka 520 olika produkter (tio om dagen, 50 den 18/11 och veckans
  400 = 6 × 50 + 100), och 30-dagarsspärren släpper aldrig samma vara två gånger. Kön hade
  862 fynd 2026-11-14. Med pristaket (nedan) blir det 655 av 773 den 18/11, mot cirka 440
  som återstår till 29/11.

### Ticken klarar 50 och 100 om dagen (`lib/auction/tick.ts`, planens del C2)

Ticken skrev förut en produkt i taget och sparade varje rad för sig. Med 100 fynd hade
timslaget blivit 100 läsningar, 100 skrivningar och 100 sparningar i rad, och kl 19 lika många
till plus främjandena. Rutten (`app/api/cron/auction-tick`) är nu bara kopplingen till Wix, och
logiken bor i `korTick` med beroendena utifrån, så att den går att pröva med 100 fynd.

Nio egenskaper som inte ska tas bort:

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
9. ☠️ **Ett fynd främjas bara om startpriset är varans pris i Wix just då**
   (`lib/auction/framjbar.ts`, `produktNu` i `store.ts`). Samma läsning som förut prövade att
   produkten finns ger nu också priset per variant, och varje spårad variant jämförs i öre.
   Ett annat pris, en variant som saknas eller ett pris som inte gick att läsa: raden står kvar
   i kön (`prisHoppade`, `prishopp=` i loggraden), och nästa natts seed räknar om den. Bara en
   raderad produkt (404) tas bort. ☠️ Förut räknades ett läsfel som "finns" och raden främjades;
   nu hoppas den över, och efter `FEL_LASNINGAR_MAX` (8) läsfel i ett tick slutar ticken läsa och
   resten står i `kvar`. Annars hade en strypning fått ticken att läsa igenom hela kön. Skälet är fynden 12–14/11 (nedan): kön bar priser från före
   en priskörning, och sju fynd fick ett överstruket pris som varan inte haft dagen före.

Varje tick skriver en rad i Vercels logg, med bara antal:
`[auction-tick] mal=… sald=… slut=… steg=… framjad=… dod=… fel=… kvar=…/…/…/… wix429=… tid=…ms`,
med `prishopp=…` och `vantar=…` bara när de inte är noll.

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

Därefter är det dagliga bortfallet oftast litet, men inte efter en stor prisändring (se
nästa avsnitt). Är spärren på och prishistoriken oläsbar skriver seeden ingenting, eftersom
ett fynd utan prövning inte får starta.

### ☠️ Kön stod still 12–14/11: skyddsräcket räknade spärrens avslag (2026-11-14)

Prissynkens ikappkörning 2026-11-11 skrev drygt 5 000 priser. En vara med nytt pris klarar
inte spärren på 30 dagar, så seeden ville ta bort 393 köade på en natt. Skyddsräcket
(max(50, 20 % av kön)) tog det för en trasig katalogläsning och skrev ingenting, tre nätter i
rad. Kön fylldes inte på, och morgondagens schemalagda fynd prövades aldrig: av de tio som
skulle starta 15/11 klarade fem inte spärren. GitHub-schemat startade dessutom 10:56, 11:35
och 11:51 UTC, alltså efter 07-starten.

Rättat i C2:

- **Skyddsräcket räknar bara köade som försvinner utan spärrens skäl** (`raknaForsvunna` i
  `lib/auction/seed.ts`, `seed-skyddsracke.test.ts`). Rapporten visar spärrens del som
  `removeFromQueueSparren`.
- **Seeden går på Vercels klocka**: `vercel.json`, 03:47 UTC, `apply=1`, aldrig `force`
  (`app/api/cron/auction-seed/schema.test.ts`). Workflowen finns kvar för körningar för hand
  och som larm, och dess eget schema är andra chansen.
- **Påfyllningen gjordes för hand** 2026-11-14 22:39 UTC med `apply` och `force`: 862 i kön,
  393 borttagna, 0 fel. Ticken fyllde de fem lediga platserna inför 15/11.

**Mätt 2026-11-14 (bara läsning, spärrens regel på de 30 raderna med start 12, 13 och 14/11):**
alla hade historik och 0 luckor. 23 klarade spärren. **7 klarade den inte** (`lagre_pris`): det
överstrukna priset låg 1–15 % över varans pris dagen före. I alla sju hade synken sänkt priset
efter seeden 11/11, och auktionen startade på det gamla, högre priset. I 20 andra hade synken
höjt priset, och auktionen startade på det gamla, lägre (lagligt, men lägre marginal). Alla 30
slutade osålda, och ingen order sedan 12/11 innehöll någon av dem.

Därför egenskap 9 ovan: ticken främjar inte en rad vars pris inte längre är varans pris, också
om seeden skulle falla en natt till.

### Pristaket: inget fynd över 2 000 kr (`lib/auction/pristak.ts`, 2026-11-18)

Leonard 2026-11-18: "kan du göra så fyndauktionen inte har grejer som är dyrare än 2000 kr".
`AUKTION_PRISTAK_KR` = 2000, ordinarie pris inklusive moms. Exakt 2 000 kr får vara med.

**Varje variant räknas**, inte bara den billigaste som kortet visar. En sida "från 1 499 kr"
med en storlek för 2 899 kr hade annars sålt den dyra storleken till auktionspris. Den 18/11
gav de två läsningarna samma tal (118), eftersom nästan inga produkter med flera varianter
har kommit igenom 30-dagarsspärren än; från december skiljer de sig.

Taket prövas på tre ställen, och alla behövs:

1. **Seeden** (`evaluateCandidate`, skälet `overPristak`): varan lämnar urvalet. En köad rad
   och en schemalagd rad som inte startat tas då bort av `planSeed`, och ticken fyller platsen
   före 07. En startad auktion rörs aldrig mitt i sin dag.
2. **Ticken** (`korTick`): en rad över taket främjas aldrig. Det täcker tiden mellan
   driftsättningen och första seeden. ☠️ Det täcker också de AVSLUTADE raderna: dem rör seeden
   inte, och ticken återvinner dem när kön sinar.
3. **Skyddsräcket** (`raknaForsvunna`): det taket stoppar räknas inte som försvunnet, på
   samma sätt som spärrens avslag. Annars står seeden still nästa gång en priskörning lyfter
   många varor över taket, som den gjorde 12–14/11. Rapporten visar talet för sig
   (`removeFromQueuePristak`, och `excluded.overPristak` för hela katalogen).

Taket byts genom att ändra konstanten. Det står inte i `FyndplatsAppConfig`: en ändring ska
gå genom proven.

**Mätt 2026-11-18 (bara läsning i `FyndplatsAuctions`):** 773 köade, 118 med någon variant
över 2 000 kr, 655 kvar. Morgondagens tio schemalagda låg alla på högst 1 999 kr.

**En avslutad rad med gammalt pris slinker inte igenom.** En rad vars pris höjts över taket
EFTER dess senaste auktion bär sitt gamla, lägre pris, och taket ser den inte. Återvinns den,
stoppar prisjämförelsen vid främjandet den (`framjbar`, egenskap 9: radens pris är inte varans
pris just då).

**"Varför är inte de nya varorna med?"** (Leonard samma dag). Seeden läser HELA katalogen
varje natt, så ingen vara behöver läggas till för hand, och ingen saknade kostnad (`noCost`
0). Det som håller nya varor utanför är 30-dagarsspärren. Dagens rapport (2026-11-18):
18 226 produkter i katalogen, 10 670 dolda utkast, 993 slut i lager, 156 med rea, 45 med för
tunn marginal. Av de 6 362 som prövades stoppade spärren 5 458: 3 080 där historiken inte
täcker hela fönstret (`ofullstandig`, mest produkter med flera varianter, som har
timhistorik först från 2026-11-01), 304 nya i butiken (`ny`), 1 869 med ett lägre pris de
senaste 30 dagarna (`lagre_pris`, efter priskörningen 11/11) och 205 som nyss auktionerats.
De kommer in av sig själva när deras 30 dagar har gått. Att släppa in dem tidigare vore att
visa ett överstruket pris som lagen inte tillåter.
