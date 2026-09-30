// Vilket lager som är i drift. EN definition, läst av alla.
//
// ☠️ VARFÖR DEN HÄR FILEN FINNS. `STORE_BACKEND` lästes tidigare på sex ställen
// med tre olika semantiker, och tre av dem föll TYST tillbaka till minnet på
// varje värde som inte var exakt `"wix-data"`:
//
//   lib/llm/storage.ts     useWixBackend()  → allt LLM-lager in-memory
//   lib/watchlist/store.ts ternär           → MemoryWatchlistStore
//   lib/bulk-import/store.ts ternär         → MemoryBulkImportStore
//
// Att införa ett tredje backend-värde hade alltså stängt av tre saker utan ett
// ord i loggen. Den värsta är inte uppenbar: **den dagliga budgettaket bor i
// `FyndplatsAnthropicSpend`**. In-memory får varje lambda sin EGEN räknare, så
// taket slutar i praktiken gälla — och variantöversättningens cache töms, så
// samma råvärde betalas om vid varje import. Bulk-importen är nästan lika illa:
// jobbet skrivs i en lambda och worker-cronen läser i en annan, så det
// försvinner varje minut.
//
// Hittat i auditen av migreringsplanen 2026-08-31, innan något byggdes.
// Regeln bakom filen är husets vanliga: en tvilling glider isär, och ett
// misslyckande som ingen kan se är värre än ett som skriker.

/** Lagren vi stödjer. Okända värden är ett typo-fel och ska kasta, inte gissa. */
export const STORE_BACKENDS = ["memory", "wix-data", "postgres"] as const;
export type StoreBackend = (typeof STORE_BACKENDS)[number];

/**
 * Läser `STORE_BACKEND`. Default `"memory"` (dev/test), som förut.
 *
 * KASTAR på okända värden. Det är med flit: en tyst fallback gör en felstavad
 * variabel omöjlig att skilja från ett medvetet val, och priset betalas i
 * produktion — se filens huvud.
 */
export function storeBackend(): StoreBackend {
  // Tomt eller blanktecken = OSATT, inte fel. Ett tomt fält i Vercels UI är
  // inte en felstavning, och att krascha hela appen på det vore en sämre
  // gissning än att göra det osatta valet. En riktig felstavning ("postgress")
  // är fortfarande icke-tom och fälls nedan.
  const raw = (process.env.STORE_BACKEND ?? "").trim() || "memory";
  if ((STORE_BACKENDS as readonly string[]).includes(raw)) return raw as StoreBackend;
  throw new Error(
    `Okänt STORE_BACKEND="${raw}". Tillåtna värden: ${STORE_BACKENDS.join(", ")}.`,
  );
}

/**
 * Sant för allt utom `"memory"`.
 *
 * Det här är frågan de flesta anropare FAKTISKT ställer: "finns det en
 * persistent lagring att lita på?" Cron-rutterna hoppar över sig själva utan
 * en, och modulerna som ligger kvar i Wix Data (watchlist, bulk-import) väljer
 * sin Wix-implementation på den — inte på att värdet råkar vara `"wix-data"`.
 * Skillnaden är hela poängen: de bryr sig inte om vilken drift-databas Store
 * använder, och ska därför inte gå sönder när den byts.
 */
export function isPersistentBackend(): boolean {
  return storeBackend() !== "memory";
}

/**
 * Var RECENSIONERNA bor. Egen switch, `REVIEWS_BACKEND`, default `"wix-data"`.
 *
 * ☠️ VARFÖR DEN INTE FÖLJER `STORE_BACKEND`. Produktionen står redan på
 * `postgres` sedan drift-datan flyttade 2026-08-31. Hade recensionslagret läst
 * den variabeln hade `getReviewStore()` bytt lager i samma sekund koden
 * deployades — alltså börjat skriva till en TOM tabell, medan
 * `/admin/reviews` slutade se de 2 514 befintliga och butiken fortsatte läsa
 * Wix. Det hade inte kastat någonstans. Det hade bara varit tomt.
 *
 * Samma familj som `/api/tracking-events` 2026-09-01: en läsare som blir TOM
 * syns varken i en kodaudit eller i en felräknare, för ett tomt svar från rätt
 * API mot rätt tabell ser i källkoden ut precis som ett friskt anrop.
 *
 * Recensionerna ligger alltså ETT STEG EFTER drift-datan i sin egen migrering,
 * och växlingen är en medveten handling efter att kopian verifierats — precis
 * som `STORE_BACKEND` flippades först då. Ordningen:
 *
 *   1. tabell + lager finns (den här koden)      ← default wix-data, inget händer
 *   2. kopiera 2 514 rader, verifiera kanoniskt
 *   3. REVIEWS_BACKEND=postgres                  ← växlingen
 *   4. butiksrepot läser via API i stället för Wix Data direkt
 *   5. radera Wix-raderna                        ← FÖRST här frigörs taket
 *
 * Ligger i den HÄR filen, inte i reviews.ts, av samma skäl som resten:
 * `backend.test.ts` fäller om någon annan fil läser en backend-variabel.
 */
export function reviewsBackend(): StoreBackend {
  const raw = (process.env.REVIEWS_BACKEND ?? "").trim();
  // Osatt = kvar i Wix. Default:en pekar åt det håll som INTE tappar data.
  if (!raw) return "wix-data";
  if ((STORE_BACKENDS as readonly string[]).includes(raw)) return raw as StoreBackend;
  throw new Error(
    `Okänt REVIEWS_BACKEND="${raw}". Tillåtna värden: ${STORE_BACKENDS.join(", ")}.`,
  );
}

/** Lagren auktionerna kan bo i. Inget minneslager: motorn har aldrig haft ett,
 *  och en tick mot en tom minneskö hade sett ut som "inget att främja". */
export const AUCTION_BACKENDS = ["wix-data", "postgres"] as const;
export type AuctionBackend = (typeof AUCTION_BACKENDS)[number];

/**
 * Var FYNDAUKTIONEN bor. Egen switch, `AUCTIONS_BACKEND`, default `"postgres"`
 * sedan växlingen 2026-09-30.
 *
 * Samma skäl som `reviewsBackend` ovan, och samma ordning:
 *
 *   1. tabell + lager + rutter för butiken finns (default wix-data, inget händer)
 *   2. butiken läser och avslutar via motorns rutter, inte Wix Data direkt
 *   3. kopiera raderna, verifiera strikt (wix = pg, avvikande 0)
 *   4. växlingen: default postgres                 ← den här raden
 *   5. radera Wix-raderna                          ← FÖRST här frigörs taket
 *
 * ☠️ Växlingen gjordes i KODEN, inte i Vercel. Att skapa AUCTIONS_BACKEND för
 * produktion avvisades med 403 ("Additional permissions are required"), och
 * en env-variabel binds ändå först vid bygget. Defaulten följer därför med
 * samma produktionsbygge som hade burit variabeln. `AUCTIONS_BACKEND=wix-data`
 * är vägen tillbaka, men bara så länge Wix-raderna finns: efter steg 5 hade den
 * pekat på en tom kollektion, och då är ingen väg tillbaka bättre än den.
 *
 * ☠️ Kön är en rad per produkt i katalogen (3 561 rader 2026-09-29, 89 % av
 * Wix-taket på 4 000). Den växer med katalogen, så taket slår i igen för varje
 * import så länge raderna bor i Wix.
 *
 * ☠️ Butiken går via motorn och växlar därför SAMTIDIGT som motorn. Läste den
 * Wix direkt hade den efter växlingen visat gårdagens fynd, och webhooken hade
 * avslutat auktioner i ett lager ingen läser.
 */
export function auctionsBackend(): AuctionBackend {
  const raw = (process.env.AUCTIONS_BACKEND ?? "").trim();
  if (!raw) return "postgres";
  if ((AUCTION_BACKENDS as readonly string[]).includes(raw)) return raw as AuctionBackend;
  throw new Error(
    `Okänt AUCTIONS_BACKEND="${raw}". Tillåtna värden: ${AUCTION_BACKENDS.join(", ")}.`,
  );
}
