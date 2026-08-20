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

async function applyAction(
  wixProductIds: string[],
  kind: "publish" | "reject",
  force = false,
): Promise<void> {
  const store = getStore();
  for (const id of wixProductIds) {
    try {
      const mapping = await store.getMappingByWixProductId(id);
      if (!mapping) continue;

      // PRISSPÄRREN GÄLLER ÄVEN HÄR. Utan det här blocket var kön det enda
      // stället där flaggan gick att kringgå: knappen "Publicera" satte
      // visible:true och tog bort raden ur kön, så badgen försvann samtidigt
      // som de felprissatta varianterna gick live. Spärren i importen hade då
      // bara skjutit upp felet ett klick.
      //
      // Avvisa går fortfarande utan hinder — det är alltid ett säkert utfall.
      if (kind === "publish" && typeof mapping.priceUnverified === "string" && !force) {
        await audit(
          "review-publish-blockerad",
          id,
          `Priser overifierade: ${mapping.priceUnverified.slice(0, 160)}`,
        );
        continue;
      }

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
  // Massmarkeringen tvingar ALDRIG. Vill man publicera en prisflaggad produkt
  // finns publishOneForced, som tar en produkt i taget.
  await applyAction(ids, "publish");
}

/**
 * Publicerar EN prisflaggad produkt förbi spärren.
 *
 * Egen action och egen fältnyckel eftersom knappen sitter inuti
 * massmarkeringens formulär: den skickar med alla ikryssade wixProductId också,
 * och de ska inte publiceras av ett klick på en enskild rad.
 */
export async function publishOneForced(formData: FormData): Promise<void> {
  const id = String(formData.get("forcePublishId") || "");
  if (!id) return;
  await applyAction([id], "publish", true);
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
