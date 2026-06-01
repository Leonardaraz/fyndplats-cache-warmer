"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { getReviewStore } from "@/lib/store/reviews";

/** Visa/dölj en recension på produktsidan (moderering). */
export async function setReviewHidden(
  productId: string,
  reviewIdAE: string,
  hidden: boolean,
): Promise<void> {
  await getReviewStore().setHidden(productId, reviewIdAE, hidden);
  await audit("review-moderate", productId, `${reviewIdAE} → ${hidden ? "dold" : "synlig"}`);
  revalidatePath("/admin/reviews");
}
