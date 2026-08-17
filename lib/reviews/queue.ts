// lib/reviews/queue.ts
//
// Kö för recensioner som väntar på översättning.
//
// Bakgrund (2026-08-17): recensionskedjan fanns men matades bara manuellt.
// DeepL valdes bort (Leonard) och översättningarna görs i stället av Claude i
// chatten — gratis och kurerade. Men då behövs någonstans att lägga de RÅA
// recensionerna mellan att de hittas och att de översätts.
//
// Kön är ingen ny kollektion. FyndplatsImportedReviews har redan statusen
// `pending`, och produktsidan visar bara `approved`/`edited` (VISIBLE_STATUSES)
// — en okänd rad kan alltså aldrig läcka ut till kund. Kön är helt enkelt
// raderna med status `pending` och tom `textSwedish`.
//
// Flödet:
//   1. Cron (eller en import) hittar nya recensioner hos AE  → köas som pending
//   2. Leonard säger till i chatten                          → Claude översätter
//   3. textSwedish fylls i och status sätts till approved     → syns på sidan
//
// Ingen DeepL, inga Claude-credits: hämtningen är ett gratis-anrop mot AE:s
// feedback-endpoint och översättningen sker i chatten.

import { filterAndRankReviews, deriveInitials, ensureReviewId, type AERReview } from "../import/review-import";
import { foreignLocaleVerdict } from "../import/review-locale-filter";
import { getReviewStore, type StoredReview } from "../store/reviews";

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
  opts: { max?: number; now?: Date; store?: ReturnType<typeof getReviewStore> } = {},
): Promise<QueueResult> {
  if (!productId || !rawReviews?.length) return { ...TOM };
  const now = opts.now ?? new Date();
  const store = opts.store ?? getReviewStore();

  try {
    const ranked = filterAndRankReviews(rawReviews, now, opts.max ? { max: opts.max } : {});
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
        hasImage: Boolean(r.imageUrl),
        imageUrl: r.imageUrl,
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

/** True för rader som väntar på översättning. */
export function isAwaitingTranslation(r: StoredReview): boolean {
  return r.status === "pending" && !String(r.textSwedish ?? "").trim();
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
