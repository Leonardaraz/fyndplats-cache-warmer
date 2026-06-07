import {
  bulkUpdateInventoryQuantities,
  queryInventoryItemsByProductId,
  type InventoryQuantityUpdate,
  type WixInventoryItem,
} from "../wix/client";

export interface DesiredStock {
  wixVariantId: string;
  quantity: number;
}

/**
 * Matchar önskade lagersaldon mot Wix lagerposter via variant-id och bygger
 * uppdateringar (med rätt revision). Varianter utan matchande post hoppas över.
 * Ren funktion — enhetstestbar.
 */
export function buildInventoryUpdates(
  desired: DesiredStock[],
  items: WixInventoryItem[],
): { updates: InventoryQuantityUpdate[]; unmatched: string[] } {
  const byVariant = new Map(items.map((i) => [i.variantId, i]));
  const updates: InventoryQuantityUpdate[] = [];
  const unmatched: string[] = [];

  for (const d of desired) {
    const item = byVariant.get(d.wixVariantId);
    if (!item) {
      unmatched.push(d.wixVariantId);
      continue;
    }
    updates.push({ id: item.id, revision: item.revision, quantity: Math.max(0, Math.trunc(d.quantity)) });
  }

  return { updates, unmatched };
}

/**
 * Bygger önskat lager för batch-synken: seed:ar VARJE mappad variant och sätter
 * de som SAKNAS i AE-svaret (slutsåld/borttagen variant som AE droppat) till 0,
 * i stället för att behålla det gamla Wix-saldot → annars säljs en slutsåld
 * variant vidare (oversälj). Anropa BARA med ett icke-tomt AE-svar; ett tomt
 * svar är transient och ska hoppas över (rör inte lagret). Ren funktion.
 */
export function buildDesiredStock(
  variants: ReadonlyArray<{ wixVariantId?: string; supplierVariantId: string }>,
  inventory: ReadonlyArray<{ skuId: string; stock: number }>,
): DesiredStock[] {
  const bySupplier = new Map(inventory.map((inv) => [inv.skuId, inv]));
  const out: DesiredStock[] = [];
  for (const v of variants) {
    if (!v.wixVariantId) continue;
    const inv = bySupplier.get(v.supplierVariantId);
    out.push({ wixVariantId: v.wixVariantId, quantity: inv ? inv.stock : 0 });
  }
  return out;
}

/** Synkar lager för en produkt mot Wix (query → matcha → bulk-update). */
export async function syncProductStock(
  wixProductId: string,
  desired: DesiredStock[],
): Promise<{ updated: number; unmatched: string[] }> {
  const items = await queryInventoryItemsByProductId(wixProductId);
  const { updates, unmatched } = buildInventoryUpdates(desired, items);
  await bulkUpdateInventoryQuantities(updates);
  return { updated: updates.length, unmatched };
}
