## Fyndauktionen flyttar till Postgres (`AUCTIONS_BACKEND`, 2026-09-29)

Wix CMS var fullt igen: **4 020 rader mot taket 4 000**, och
`FyndplatsAuctions` var **3 561** av dem (3 308 i kön, 5 live, 248
avslutade). Kön är en rad per produkt i katalogen och växer med varje import.
Taket stoppade två sammanslagningars omdirigeringar i runda B64, och
auktionsseeden kan inte lägga nya produkter i kön. Leonard bad om flytten.

Samma ordning som recensionerna, och samma skäl för varje steg:

| steg | vad | frigör taket? |
|---|---|:---:|
| 1 | `auctions`-tabell, Postgres-lager, `AUCTIONS_BACKEND` (default `wix-data`) | nej |
| 2 | butiken läser och avslutar via `/api/auctions/*`, inte Wix Data direkt | nej |
| 3 | kopiera (`?tabeller=auctions`), verifiera strikt | nej |
| 4 | växlingen: defaulten blir `postgres` i koden (2026-09-30) | nej |
| 5 | radera Wix-raderna, med Leonards ja | **ja** |

Två rutter för butiken, båda med `Bearer REVIEW_INGEST_SECRET` (den hemlighet
de två projekten redan delar, så ingen ny behöver föras in för hand):

- `GET /api/auctions/rader?status=live|sold` — raderna butiken visar.
- `POST /api/auctions/avsluta` — butikens webhook avslutar ett sålt live-fynd
  direkt. Priset återställs först, sedan sold, samma ordning som timcronen.

Sex egenskaper som inte ska tas bort:

1. ☠️ **Defaulten var `wix-data` fram till växlingen, även när
   `STORE_BACKEND=postgres`.** Hade auktionerna följt drift-datans växel hade
   ticken läst en tom tabell i samma sekund som lagret deployades. Sedan
   2026-09-30 är defaulten `postgres`. Växlingen gjordes i koden, för Vercel
   svarade 403 på att skapa `AUCTIONS_BACKEND` för produktion. Samma
   produktionsbygge som hade burit variabeln bär nu defaulten.
   `AUCTIONS_BACKEND=wix-data` är vägen tillbaka så länge Wix-raderna finns.
2. ☠️ **Butiken går via motorn.** Läste den Wix direkt hade den efter växlingen
   visat gårdagens fynd, och webhooken hade avslutat auktioner i ett lager
   ingen läser. Nu byter butiken lager i samma ögonblick som motorn.
3. ☠️ **Rutternas svar är en allowlist** (`lib/auction/butiksvy.ts`). Golvet
   (`floorPrice`, `variantPrices`) lämnar aldrig motorn. Stegen följer med för
   live-rader, eftersom butikens server räknar nästa sänkning ur den, och det
   är därför rutterna kräver en hemlighet.
4. ☠️ **Svaret bär `lager`**, alltså vilket lager som faktiskt svarade. En
   env-variabel binds vid deploy, så en växling ska läsas ur svaret och inte
   antas ur Vercels panel.
5. **Ticken läser bara köns första 200** (`köHuvud`). Den främjar högst fem åt
   gången och går var tionde minut. Hela kön är ~2,4 MB, och att läsa den 144
   gånger per dygn hade kostat ~10 GB i månaden ur databasen. Seeden,
   pensioneringens spärr och morgonmejlet läser hela kön, och i Postgres utan
   Wix-frågans tak på 1 000 rader.
6. ☠️ **Kopieringen är tillåten och verifieringen strikt tills växeln slagit
   om** (`EGEN_VÄXEL` i kopieringsrutten, samma undantag som recensionerna
   hade). Efter växlingen vägrar kopieringen, för då hade den skrivit tillbaka
   gamla Wix-rader över levande data.

⚠️ **Radera Wix-raderna direkt efter en verifierad växling, inte ett dygn
senare.** Auktionerna har inget retention-fönster, och efter växlingen tar
seeden (03:17 UTC) och ticken bort rader ur Postgres. En sådan rad finns kvar i
Wix men inte i kopian, och raderingen avbryter då hela sidan.

✅ **Leonard sa ja till raderingen 2026-09-29.** `FyndplatsAuctions` är släppt ur
`ALDRIG_RADERA`, men raderingsverktyget tar den bara när auktionerna bor i
Postgres i den körande deploymenten (`VÄXELSTYRDA` i `lib/migration/radera-wix.ts`,
`auctionsBackend() === "postgres"`). Före växlingen hade en radering tömt den
levande auktionen.
