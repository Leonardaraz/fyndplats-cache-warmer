"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { getReviewStore, type ReviewStatus } from "@/lib/store/reviews";

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
