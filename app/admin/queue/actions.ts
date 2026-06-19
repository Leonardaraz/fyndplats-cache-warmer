"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { getStore } from "@/lib/store/factory";
import {
  addProductToCollection,
  getProduct,
  getProductMedia,
  setProductMedia,
  setProductVisibility,
} from "@/lib/wix/client";
import { pingProductSlugs } from "@/lib/seo/indexnow";

async function applyAction(
  wixProductIds: string[],
  kind: "publish" | "reject",
): Promise<void> {
  const store = getStore();
  // Slugs för produkter som faktiskt publicerades → pingas till IndexNow efter
  // loopen (en gång, batchat). snapshot.slug finns redan i GET-svaret → 0 extra anrop.
  const publishedSlugs: string[] = [];
  for (const id of wixProductIds) {
    try {
      const mapping = await store.getMappingByWixProductId(id);
      if (!mapping) continue;

      if (kind === "publish") {
        const snapshot = await getProduct(id);
        if (snapshot) {
          await setProductVisibility(id, snapshot.revision, true);
          if (snapshot.slug) publishedSlugs.push(snapshot.slug);
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
  // IndexNow: snabb crawl-begäran för de nypublicerade sidorna. Best-effort
  // (kastar aldrig) och no-await så publiceringssvaret inte blockeras.
  if (publishedSlugs.length > 0) void pingProductSlugs(publishedSlugs);
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

/**
 * Tar bort en specifik bild från en Wix-produkts mediaItems och uppdaterar
 * mapping.imageAnalysis så att kö-UI:t reflekterar det direkt.
 *
 * Formulärfält:
 *   wixProductId: string
 *   imageUrl: string (URL:en som ska tas bort — matchas mot Wix media-arrayen)
 */
export async function removeImage(formData: FormData): Promise<void> {
  const wixProductId = String(formData.get("wixProductId") ?? "");
  const imageUrl = String(formData.get("imageUrl") ?? "");
  if (!wixProductId || !imageUrl) return;

  try {
    const snapshot = await getProductMedia(wixProductId);
    if (snapshot) {
      const remaining = snapshot.media.filter((m) => m.url !== imageUrl);
      // Bara kalla Wix om vi faktiskt tog bort något.
      if (remaining.length !== snapshot.media.length) {
        await setProductMedia(wixProductId, snapshot.revision, remaining);
      }
    }

    // Uppdatera mapping-posten så bilden inte fortsätter visas i kön.
    const store = getStore();
    const mapping = await store.getMappingByWixProductId(wixProductId);
    if (mapping?.imageAnalysis) {
      mapping.imageAnalysis = mapping.imageAnalysis.filter((e) => e.url !== imageUrl);
      await store.saveMapping(mapping);
    }

    await audit("queue-remove-image", wixProductId, imageUrl.slice(0, 200));
  } catch (err) {
    await audit(
      "queue-remove-image-error",
      wixProductId,
      err instanceof Error ? err.message.slice(0, 200) : String(err),
    );
  }
  revalidatePath("/admin/queue");
}

/**
 * Accepterar Claudes kategoriförslag — lägger till produkten i kollektionen
 * och uppdaterar mappingens status till "auto" (visas inte längre som förslag).
 *
 * Formulärfält:
 *   wixProductId: string
 */
export async function acceptCategorySuggestion(formData: FormData): Promise<void> {
  const wixProductId = String(formData.get("wixProductId") ?? "");
  if (!wixProductId) return;

  try {
    const store = getStore();
    const mapping = await store.getMappingByWixProductId(wixProductId);
    if (!mapping?.categorySuggestion?.collectionId) return;

    await addProductToCollection(wixProductId, mapping.categorySuggestion.collectionId);
    mapping.categorySuggestion = { ...mapping.categorySuggestion, status: "auto" };
    await store.saveMapping(mapping);
    await audit(
      "queue-accept-category",
      wixProductId,
      mapping.categorySuggestion.collectionSlug ?? "",
    );
  } catch (err) {
    await audit(
      "queue-accept-category-error",
      wixProductId,
      err instanceof Error ? err.message.slice(0, 200) : String(err),
    );
  }
  revalidatePath("/admin/queue");
}
