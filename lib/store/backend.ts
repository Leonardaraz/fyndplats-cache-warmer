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
export const STORE_BACKENDS = ["memory", "wix-data"] as const;
export type StoreBackend = (typeof STORE_BACKENDS)[number];

/**
 * ☠️ "postgres" I MILJÖN BETYDER WIX, och ska göra det tills Leonard rättat variablerna.
 *
 * Drift-datan bodde i Neon 2026-08-31 till 2026-10-29 och flyttade sedan
 * tillbaka till Wix (Elite, 10 miljoner rader). Postgres-vägarna togs bort
 * 2026-11-05 och Neon sägs upp. Vercel nekar oss att läsa och ändra
 * miljövariablerna (403), och `STORE_BACKEND` och `REVIEWS_BACKEND` står på
 * "postgres" i produktion. Värdet pekar alltså på ett lager som inte finns
 * längre, och läses som Wix — där datan faktiskt bor.
 *
 * Ta inte bort tolkningen förrän variablerna står på "wix-data" i Vercel:
 * ett okänt värde kastar, och då stannar hela motorn.
 */
const GAMMALT_POSTGRES = "postgres";

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
  if (raw === GAMMALT_POSTGRES) return "wix-data";
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
 * en, och modulerna väljer sin Wix-implementation på den — inte på att värdet
 * råkar vara `"wix-data"`. Skillnaden är hela poängen: "postgres" i miljön är
 * också ett persistent lager (Wix), se `GAMMALT_POSTGRES`.
 */
export function isPersistentBackend(): boolean {
  return storeBackend() !== "memory";
}

/**
 * Var RECENSIONERNA bor. Egen switch, `REVIEWS_BACKEND`, default `"wix-data"`.
 *
 * ☠️ VARFÖR DEN INTE FÖLJER `STORE_BACKEND`. Default:en är Wix även när
 * variabeln saknas, eftersom recensionerna ALDRIG får hamna i minnet i
 * produktion: `/admin/reviews` och butiken hade då sett en tom lista utan att
 * något kastade. Samma familj som `/api/tracking-events` 2026-09-01: en läsare
 * som blir TOM syns varken i en kodaudit eller i en felräknare.
 *
 * Historik: recensionerna flyttade till Postgres 2026-09 (REVIEWS_BACKEND=postgres)
 * och tillbaka till Wix med resten 2026-10-29. Postgres-vägen togs bort 2026-11-05.
 *
 * Ligger i den HÄR filen, inte i reviews.ts, av samma skäl som resten:
 * `backend.test.ts` fäller om någon annan fil läser en backend-variabel.
 */
export function reviewsBackend(): StoreBackend {
  const raw = (process.env.REVIEWS_BACKEND ?? "").trim();
  // Osatt = Wix. Default:en pekar åt det håll som INTE tappar data.
  if (!raw || raw === GAMMALT_POSTGRES) return "wix-data";
  if ((STORE_BACKENDS as readonly string[]).includes(raw)) return raw as StoreBackend;
  throw new Error(
    `Okänt REVIEWS_BACKEND="${raw}". Tillåtna värden: ${STORE_BACKENDS.join(", ")}.`,
  );
}
