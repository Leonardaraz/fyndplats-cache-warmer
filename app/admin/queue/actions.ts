"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { getStore } from "@/lib/store/factory";
import { getProduct, setProductVisibility } from "@/lib/wix/client";

async function applyAction(
  wixProductIds: string[],
  kind: "publish" | "reject",
): Promise<void> {
  const store = getStore();
  for (const id of wixProductIds) {
    try {
      const mapping = await store.getMappingByWixProductId(id);
      if (!mapping) continue;

      if (kind === "publish") {
        const snapshot = await getProduct(id);
        if (snapshot) {
          await setProductVisibility(id, snapshot.revision, true);
        }
      }

      mapping.draftStatus = kind === "publish" ? "published" : "rejected";
      mapping.reviewedAt = new Date().toISOString();
      await store.saveMapping(mapping);
      await audit(
        kind === "publish" ? "review-publish" : "review-reject",
        id,
        mapping.seoTitle?.slice(0, 100),
      );
    } catch (err) {
      await audit(
        "review-error",
        id,
        err instanceof Error ? err.message.slice(0, 200) : String(err),
      );
    }
  }
  revalidatePath("/admin/queue");
}

/** Server action — kopplas till formulär på review-sidan. */
export async function publishProducts(formData: FormData): Promise<void> {
  const ids = formData.getAll("wixProductId").map(String).filter(Boolean);
  if (ids.length === 0) return;
  await applyAction(ids, "publish");
}

export async function rejectProducts(formData: FormData): Promise<void> {
  const ids = formData.getAll("wixProductId").map(String).filter(Boolean);
  if (ids.length === 0) return;
  await applyAction(ids, "reject");
}
