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
import { checkDeeplHealth } from "../translate/deepl";
import type { ReviewBackfillCandidate, ReviewBackfillDeps } from "./backfill";

/**
 * Hur länge en produkt som genomsökts utan träff lämnas ifred. Nya recensioner
 * dyker upp hos AE över tid, så noll är fel — men varje körning är också fel.
 */
export const REVIEW_RECHECK_DAYS = 30;

export interface BackfillDepsOptions {
  /** Hoppa över utkast/avvisade — de syns inte för kund. */
  onlyPublished?: boolean;
  /** AE-sidor per produkt. */
  pages?: number;
  /** Ta med produkter som redan genomsökts (kringgår omkontroll-intervallet). */
  ignoreCheckedAt?: boolean;
}

/** true om produkten genomsöktes så nyligen att den ska hoppas över. */
export function checkedRecently(checkedAt: string | undefined, nowMs: number): boolean {
  if (!checkedAt) return false;
  const t = Date.parse(checkedAt);
  if (!Number.isFinite(t)) return false;
  return nowMs - t < REVIEW_RECHECK_DAYS * 24 * 60 * 60 * 1000;
}

export function buildReviewBackfillDeps(opts: BackfillDepsOptions = {}): ReviewBackfillDeps {
  const reviewStore = getReviewStore();
  const usageStore = getTranslationUsageStore();
  const store = getStore();

  return {
    listCandidates: async (): Promise<ReviewBackfillCandidate[]> => {
      const nowMs = Date.now();
      const mappings = await store.listMappings();
      return mappings
        .filter((m) => m.supplierProductId && m.wixProductId)
        // Rader utan draftStatus är gamla och räknas som publicerade.
        .filter((m) => !opts.onlyPublished || (m.draftStatus ?? "published") === "published")
        // Redan genomsökta hoppas över → körningen konvergerar i stället för
        // att hämta om de recensionslösa produkterna varje gång.
        .filter((m) => opts.ignoreCheckedAt || !checkedRecently(m.reviewsCheckedAt, nowMs))
        .map((m) => ({
          wixProductId: m.wixProductId,
          supplierProductId: m.supplierProductId,
          title: m.seoTitle,
        }));
    },
    markChecked: async (wixProductId, atIso) => {
      const mapping = await store.getMappingByWixProductId(wixProductId);
      if (!mapping) return;
      await store.saveMapping({ ...mapping, reviewsCheckedAt: atIso });
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
    // Kostar noll tecken (/v2/usage) — men hindrar att en saknad eller spärrad
    // nyckel tyst publicerar engelsk text på hundratals svenska produktsidor.
    translationHealthy: () => checkDeeplHealth(),
  };
}
