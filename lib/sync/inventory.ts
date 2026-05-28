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
