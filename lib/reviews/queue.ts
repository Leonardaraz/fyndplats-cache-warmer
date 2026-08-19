// lib/reviews/queue.ts
//
// Kö för recensioner som väntar på översättning.
//
// Bakgrund (2026-08-17): recensionskedjan fanns men matades bara manuellt.
// Översättningarna görs av Claude i chatten — gratis och kurerade. Men då
// behövs någonstans att lägga de RÅA recensionerna mellan att de hittas och att
// de översätts.
//
// Kön är ingen ny kollektion. FyndplatsImportedReviews har redan statusen
// `pending`, och produktsidan visar bara `approved`/`edited` (VISIBLE_STATUSES)
// — en okänd rad kan alltså aldrig läcka ut till kund. Kön är helt enkelt
// raderna med status `pending` som ingen skrivit svensk text för
// (isAwaitingTranslation).
//
// Flödet:
//   1. Cron (eller en import) hittar nya recensioner hos AE  → köas som pending
//   2. Leonard säger till i chatten                          → Claude översätter
//   3. textSwedish fylls i i /admin/reviews (→ status `edited`) → syns på sidan
//
// Inga credits: hämtningen är ett gratis-anrop mot AE:s feedback-endpoint och
// översättningen sker i chatten.

import { filterAndRankReviews, deriveInitials, ensureReviewId, type AERReview } from "../import/review-import";
import { foreignLocaleVerdict } from "../import/review-locale-filter";
import { getReviewStore, type StoredReview } from "../store/reviews";
import { reviewImageFields, reviewImages } from "./images";

export interface QueueResult {
  /** Nya rader som lades i kön. */
  queued: number;
  /** Hoppades över för att de redan fanns (oavsett status). */
  skippedExisting: number;
  /** Sorterades bort av filtren (för kort, fel betyg, utländsk marknad …). */
  filtered: number;
}

const TOM: QueueResult = { queued: 0, skippedExisting: 0, filtered: 0 };

/**
 * Lägger nya recensioner för en produkt i översättningskön.
 *
 * Kör samma filter som den skarpa importen (filterAndRankReviews +
 * foreignLocaleVerdict), så kön aldrig fylls med sådant vi ändå inte skulle
 * publicera — det vore bara arbete att sålla bort i chatten senare.
 *
 * Best-effort: kastar aldrig. En trasig kö får aldrig fälla en produktimport.
 */
export async function queueReviewsForProduct(
  productId: string,
  rawReviews: AERReview[],
  opts: {
    max?: number;
    now?: Date;
    store?: ReturnType<typeof getReviewStore>;
    /**
     * Höjer längdgolvet för DEN HÄR körningen (se filterAndRankReviews).
     *
     * Finns för återsvep efter att ett filter rättats: sätt 301 så tas bara
     * sådant som det gamla 300-teckenstaket omöjligt kunde ha importerat.
     * Utan det konkurrerar de om samma topp-N-platser som de redan sparade
     * korta recensionerna — och förlorar, eftersom längdpoängen i
     * scoreReview är maxad redan vid 300 tecken.
     */
    minLength?: number;
  } = {},
): Promise<QueueResult> {
  if (!productId || !rawReviews?.length) return { ...TOM };
  const now = opts.now ?? new Date();
  const store = opts.store ?? getReviewStore();

  try {
    const ranked = filterAndRankReviews(rawReviews, now, {
      ...(opts.max ? { max: opts.max } : {}),
      ...(opts.minLength ? { minLength: opts.minLength } : {}),
    });
    const filtered = rawReviews.length - ranked.length;
    let queued = 0;
    let skippedExisting = 0;
    let extraFiltered = 0;

    for (const r of ranked) {
      const reviewIdAE = ensureReviewId(r);

      // Omdömen om en annan marknad ("levererades till Polen") är obegripliga
      // på en svensk sida. Samma grind som backfillen använder.
      if (foreignLocaleVerdict(r.text).foreign) {
        extraFiltered++;
        continue;
      }

      if (await store.exists(productId, reviewIdAE)) {
        skippedExisting++;
        continue;
      }

      const rad: StoredReview = {
        productId,
        reviewIdAE,
        rating: r.rating,
        textOriginal: r.text,
        // Tom tills någon översatt. Statusen `pending` håller den osynlig så
        // länge, men vi lämnar den tom med flit: en halvfärdig rad ska ALDRIG
        // kunna råka publiceras med engelsk text som "svensk".
        textSwedish: "",
        customerNameRaw: r.customerName,
        initials: deriveInitials(r.customerName, reviewIdAE),
        customerCountry: r.customerCountry,
        date: r.date,
        // Bilden hämtas hem först vid publicering (lib/wix/media-import.ts).
        // Att flytta hem bilder för rader som kanske aldrig godkänns vore
        // slöseri med både anrop och medialagring.
        // ALLA bilder bevaras redan här. Hemflytten sker vid publicering och
        // behöver hela listan för att kunna flytta hem den — sparas bara den
        // första gar resten förlorade innan grinden ens ser dem.
        ...reviewImageFields(reviewImages({ imageUrl: r.imageUrl, imageUrls: r.imageUrls })),
        status: "pending",
        importedAt: now.toISOString(),
      };

      await store.upsert(rad);
      queued++;
    }

    return { queued, skippedExisting, filtered: filtered + extraFiltered };
  } catch (err) {
    console.warn(
      "[review-queue] kunde inte köa recensioner för",
      productId,
      err instanceof Error ? err.message : err,
    );
    return { ...TOM };
  }
}

/** En rad i kön, i den form chatten behöver för att kunna översätta. */
export interface QueuedReview {
  productId: string;
  reviewIdAE: string;
  rating: number;
  textOriginal: string;
  customerCountry?: string;
  date?: string;
  hasImage: boolean;
}

/**
 * True för rader som väntar på översättning.
 *
 * TVÅ former, för att de två skrivvägarna valde olika (och båda är rimliga):
 *   - kön här lämnar `textSwedish` TOM,
 *   - importen (lib/import/review-import.ts) skriver in KÄLLTEXTEN, så
 *     /admin/reviews har något att visa och redigera i textrutan.
 *
 * Fram till 2026-08-19 kände den här funktionen bara igen den första formen.
 * Det spelade ingen roll så länge importen översatte via DeepL — men när DeepL
 * togs bort blev varje importerad rad oöversatt OCH osynlig för kön, alltså
 * exakt de rader den finns till för att hitta.
 */
export function isAwaitingTranslation(r: StoredReview): boolean {
  if (r.status !== "pending") return false;
  const sv = String(r.textSwedish ?? "").trim();
  if (!sv) return true;
  return sv === String(r.textOriginal ?? "").trim();
}

/**
 * Allt som väntar på översättning, grupperat per produkt.
 *
 * Grupperingen finns för att översättningen ska kunna läsa produktens namn en
 * gång och sedan tolka alla dess omdömen mot RÄTT produkt. Lärdomen från
 * 2026-08-17: en italienare skrev "ballongerna" om en bollkastare, och det går
 * bara att fånga om man vet vad produkten är.
 */
export function groupAwaitingTranslation(rows: StoredReview[]): Map<string, QueuedReview[]> {
  const ut = new Map<string, QueuedReview[]>();
  for (const r of rows) {
    if (!isAwaitingTranslation(r)) continue;
    const lista = ut.get(r.productId) ?? [];
    lista.push({
      productId: r.productId,
      reviewIdAE: r.reviewIdAE,
      rating: r.rating,
      textOriginal: r.textOriginal,
      customerCountry: r.customerCountry,
      date: r.date,
      hasImage: r.hasImage,
    });
    ut.set(r.productId, lista);
  }
  return ut;
}

/**
 * Hämtar från AE och köar — TIDSBEGRÄNSAT, för importvägarna.
 *
 * Varför en egen väg i stället för att anropa fetchAeReviews direkt: bulk-
 * workern processar 10 produkter på en 50-sekundersbudget (3 s/produkt av
 * AE-rate-limit-skäl). En ogränsad hämtning med tre återförsök per produkt kan
 * äta upp marginalen och få körningen kapad mitt i. Tilläggsimporten har samma
 * problem fast mot en väntande människa.
 *
 * Därför: EN sida, INGA återförsök, hård tidsgräns. Hinner den inte är det
 * ofarligt — produkten saknar `reviewsCheckedAt`, så veckocronet plockar upp
 * den ändå. Bättre att missa några omdömen i sekunden än att fälla importen.
 */
export async function fetchAndQueueForImport(
  productId: string,
  supplierProductId: string,
  opts: { timeoutMs?: number } = {},
): Promise<QueueResult & { timedOut: boolean }> {
  const timeoutMs = opts.timeoutMs ?? 4000;
  if (!productId || !supplierProductId) return { ...TOM, timedOut: false };

  try {
    const { fetchAeReviews } = await import("../aliexpress/reviews");
    const hämtning = fetchAeReviews(supplierProductId, { pages: 1, retries: 0 });
    const klocka = new Promise<null>((r) => setTimeout(() => r(null), timeoutMs));
    const res = await Promise.race([hämtning, klocka]);

    if (!res) return { ...TOM, timedOut: true };
    if (res.throttled || !res.reviews.length) return { ...TOM, timedOut: false };

    const kö = await queueReviewsForProduct(productId, res.reviews);
    return { ...kö, timedOut: false };
  } catch (err) {
    console.warn(
      "[review-queue] hämtning vid import misslyckades för",
      productId,
      err instanceof Error ? err.message : err,
    );
    return { ...TOM, timedOut: false };
  }
}
