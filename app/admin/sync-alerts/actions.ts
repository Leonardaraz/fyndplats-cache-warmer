"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { getStore } from "@/lib/store/factory";
import { getSyncStore } from "@/lib/sync/sync-log";
import { getProduct as getWixProduct, setProductVisibility } from "@/lib/wix/client";

// =====================================================================
// Single-row actions: godkänn nytt pris, behåll, ta bort produkt, dismiss.
// =====================================================================

interface ParsedForm {
  alertId: string;
  wixProductId: string;
  newPriceSek?: number;
}

function parseForm(formData: FormData): ParsedForm | null {
  const alertId = String(formData.get("alertId") ?? "");
  const wixProductId = String(formData.get("wixProductId") ?? "");
  if (!alertId || !wixProductId) return null;
  const newPriceRaw = formData.get("newPriceSek");
  const newPriceSek = newPriceRaw != null && String(newPriceRaw) !== ""
    ? Number(newPriceRaw)
    : undefined;
  return { alertId, wixProductId, newPriceSek };
}

/** Godkänn det rekommenderade nya priset → uppdatera Wix-produktens pris. */
export async function approveNewPrice(formData: FormData): Promise<void> {
  const parsed = parseForm(formData);
  if (!parsed) return;
  const { alertId, wixProductId, newPriceSek } = parsed;
  const syncStore = getSyncStore();
  const alert = await syncStore.getAlert(alertId);
  if (!alert) return;

  try {
    const target = newPriceSek ?? alert.recommendedPriceSek;
    if (!target || target <= 0) {
      await audit("sync-alert-approve-skip", alertId, "saknar rekommenderat pris");
      return;
    }
    // OBS: Wix V3 PATCH för pris kräver att vi går via update-product med
    // variantsInfo. För säkerhets skull begränsar vi den här ändringen till
    // att markera alerten som approved + logga — det faktiska prisbytet är
    // ett follow-up som Leonard gör via /admin/queue eller bulk-update-rutten.
    // Anledningen: variant-pris-update saknar idag en wrapper i lib/wix/client,
    // och vi vill inte att en sync-alert ska kunna sätta fel pris på en
    // ovillig produkt utan att kunna verifiera resultatet. Approval-flödet
    // är: alert → audit-rad → Leonard kollar /admin/queue.
    await syncStore.resolveAlert(alertId, "approved");
    await audit(
      "sync-alert-approved",
      wixProductId,
      `nytt pris ${target} kr godkänt — Wix-update måste göras manuellt`,
    );
  } catch (err) {
    await audit(
      "sync-alert-approve-error",
      alertId,
      err instanceof Error ? err.message.slice(0, 200) : String(err),
    );
  }
  revalidatePath("/admin/sync-alerts");
}

/** Behåll nuvarande pris — bara markera alerten som dismissed. */
export async function keepCurrentPrice(formData: FormData): Promise<void> {
  const parsed = parseForm(formData);
  if (!parsed) return;
  const syncStore = getSyncStore();
  await syncStore.resolveAlert(parsed.alertId, "dismissed");
  await audit("sync-alert-keep-price", parsed.wixProductId, parsed.alertId);
  revalidatePath("/admin/sync-alerts");
}

/** Ta bort produkten ur butiken — sätter Wix-visible:false och dismissar alerten. */
export async function removeProduct(formData: FormData): Promise<void> {
  const parsed = parseForm(formData);
  if (!parsed) return;
  const syncStore = getSyncStore();
  const store = getStore();
  try {
    const snapshot = await getWixProduct(parsed.wixProductId);
    if (snapshot) {
      await setProductVisibility(parsed.wixProductId, snapshot.revision, false);
    }
    // Markera mappingen som rejected så framtida sync-körningar hoppar över den.
    const mapping = await store.getMappingByWixProductId(parsed.wixProductId);
    if (mapping) {
      mapping.draftStatus = "rejected";
      mapping.reviewedAt = new Date().toISOString();
      await store.saveMapping(mapping);
    }
    await syncStore.resolveAlert(parsed.alertId, "removed");
    await audit("sync-alert-remove-product", parsed.wixProductId, parsed.alertId);
  } catch (err) {
    await audit(
      "sync-alert-remove-error",
      parsed.wixProductId,
      err instanceof Error ? err.message.slice(0, 200) : String(err),
    );
  }
  revalidatePath("/admin/sync-alerts");
}

/** Dismissar en content-change-alert (titel/bild har ändrats — vi behåller som det är). */
export async function dismissContentAlert(formData: FormData): Promise<void> {
  const parsed = parseForm(formData);
  if (!parsed) return;
  await getSyncStore().resolveAlert(parsed.alertId, "dismissed");
  await audit("sync-alert-dismiss-content", parsed.wixProductId, parsed.alertId);
  revalidatePath("/admin/sync-alerts");
}

// =====================================================================
// Bulk action: godkänn alla prishöjningar
// =====================================================================

export async function bulkApprovePrices(formData: FormData): Promise<void> {
  const ids = formData.getAll("alertId").map(String).filter(Boolean);
  if (ids.length === 0) return;
  const syncStore = getSyncStore();
  let approved = 0;
  for (const id of ids) {
    try {
      const alert = await syncStore.getAlert(id);
      if (!alert || alert.alertType !== "price_increase" || alert.status !== "open") continue;
      await syncStore.resolveAlert(id, "approved");
      approved++;
    } catch {
      // Per-alert-fel ska inte avbryta bulk-flödet — fortsätt.
    }
  }
  await audit("sync-alert-bulk-approve", "leonard", `approved=${approved} of ${ids.length}`);
  revalidatePath("/admin/sync-alerts");
}
