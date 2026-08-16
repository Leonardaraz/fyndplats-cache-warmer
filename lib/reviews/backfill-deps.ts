// lib/reviews/backfill-deps.ts
//
// Skarp I/O-koppling för recensions-backfillen. Ligger separat så cron-rutten
// och admin-knappen kör EXAKT samma väg — annars driver de isär och bara den
// ena får t.ex. budgetkollen rätt.

import { getStore } from "../store/factory";
import { fetchAeReviews } from "../aliexpress/reviews";
import { importReviewsForProduct } from "../import/review-import";
import { getReviewStore } from "../store/reviews";
import { getTranslationUsageStore, monthKey, monthlyBudget } from "../translate/usage";
import type { ReviewBackfillCandidate, ReviewBackfillDeps } from "./backfill";

export interface BackfillDepsOptions {
  /** Hoppa över utkast/avvisade — de syns inte för kund. */
  onlyPublished?: boolean;
  /** AE-sidor per produkt. */
  pages?: number;
}

export function buildReviewBackfillDeps(opts: BackfillDepsOptions = {}): ReviewBackfillDeps {
  const reviewStore = getReviewStore();
  const usageStore = getTranslationUsageStore();

  return {
    listCandidates: async (): Promise<ReviewBackfillCandidate[]> => {
      const mappings = await getStore().listMappings();
      return mappings
        .filter((m) => m.supplierProductId && m.wixProductId)
        // Rader utan draftStatus är gamla och räknas som publicerade.
        .filter((m) => !opts.onlyPublished || (m.draftStatus ?? "published") === "published")
        .map((m) => ({
          wixProductId: m.wixProductId,
          supplierProductId: m.supplierProductId,
          title: m.seoTitle,
        }));
    },
    countExisting: async (wixProductId) => (await reviewStore.listByProduct(wixProductId, 1)).length,
    fetchReviews: async (supplierProductId) => {
      const r = await fetchAeReviews(supplierProductId, opts.pages ? { pages: opts.pages } : {});
      return { reviews: r.reviews, throttled: r.throttled };
    },
    importReviews: async (wixProductId, reviews) => {
      const r = await importReviewsForProduct(wixProductId, reviews);
      return {
        imported: r.imported,
        skippedExisting: r.skippedExisting,
        charsUsed: r.charsUsed,
        budgetExceeded: r.budgetExceeded,
      };
    },
    budgetRemaining: async () => {
      const used = await usageStore.getMonthlyUsage(monthKey(new Date()));
      return Math.max(0, monthlyBudget() - used);
    },
  };
}
