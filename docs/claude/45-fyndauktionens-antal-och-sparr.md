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

☠️ **Black Week läggs in i `DAGAR` först när motorn klarar 50 och 100 om dagen.** Följande
måste vara på plats först:

- prisstegen med begränsad parallellism och samlade sparningar;
- butikens `getFreshPrices` i klump;
- en gemensam klocka för korten;
- orderläsningen till slutet.

Leonards datum: 50 om dagen 23–29 november, 100 fredag 27 november, och 10 igen från 30
november.

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
