"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { getReviewStore, type ReviewStatus } from "@/lib/store/reviews";
import { buildReviewBackfillDeps } from "@/lib/reviews/backfill-deps";
import { runReviewBackfill } from "@/lib/reviews/backfill";

/** Moderering: godkänn / avvisa en recension. */
export async function setReviewStatus(
  productId: string,
  reviewIdAE: string,
  status: ReviewStatus,
): Promise<void> {
  await getReviewStore().setStatus(productId, reviewIdAE, status);
  await audit("review-moderate", productId, `${reviewIdAE} → ${status}`);
  revalidatePath("/admin/reviews");
}

/**
 * Hämta recensioner från AliExpress för produkter som saknar dem.
 *
 * Ligger som admin-knapp och inte bara som cron-rutt eftersom skarpt läge är
 * ett PUBLICERINGSBESLUT: importerade recensioner auto-godkänns och syns direkt
 * på produktsidan, och de tänder dessutom aggregateRating i produktsidans
 * strukturerade data. Det ska tryckas på medvetet, inte schemaläggas.
 *
 * Kör samma väg som /api/cron/review-backfill (delad deps-modul).
 */
export async function runReviewBackfillAction(formData: FormData): Promise<void> {
  const dryRun = String(formData.get("mode") || "dry") !== "live";
  const limit = Math.max(1, Math.min(200, Number(formData.get("limit")) || 25));
  const maxPerProduct = Math.max(1, Math.min(15, Number(formData.get("maxPerProduct")) || 8));
  const onlyPublished = String(formData.get("onlyPublished") || "1") === "1";

  const summary = await runReviewBackfill(
    buildReviewBackfillDeps({ onlyPublished }),
    { dryRun, limit, maxPerProduct },
  );

  if (!dryRun && summary.reviewsImported > 0) {
    await audit(
      "reviews-backfill",
      "admin",
      `${summary.reviewsImported} recensioner på ${summary.withReviews} produkter ` +
        `(DeepL ${summary.charsSpent} tecken, stopp: ${summary.stoppedBy})`,
    );
  }

  // Resultatet tillbaka till sidan via query — server-actions har ingen egen
  // returkanal till en serverkomponent.
  const q = new URLSearchParams({
    k: dryRun ? "dry" : "live",
    p: String(summary.considered),
    w: String(summary.withReviews),
    i: String(summary.reviewsImported),
    e: String(summary.reviewsEligible),
    c: String(dryRun ? summary.charsEstimated : summary.charsSpent),
    t: String(summary.throttled),
    f: String(summary.errors),
    s: summary.stoppedBy,
    b: String(summary.budgetRemainingAtEnd),
  });
  revalidatePath("/admin/reviews");
  redirect(`/admin/reviews?${q.toString()}`);
}

/** Moderering: redigera svensk text (liten typo) → status "edited". */
export async function editReviewText(formData: FormData): Promise<void> {
  const productId = String(formData.get("productId") || "");
  const reviewIdAE = String(formData.get("reviewIdAE") || "");
  const text = String(formData.get("text") || "").trim();
  if (!productId || !reviewIdAE || !text) return;
  await getReviewStore().editText(productId, reviewIdAE, text);
  await audit("review-edit", productId, `${reviewIdAE} redigerad`);
  revalidatePath("/admin/reviews");
}
