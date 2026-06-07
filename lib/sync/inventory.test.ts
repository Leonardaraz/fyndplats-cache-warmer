import { describe, expect, it } from "vitest";
import { buildInventoryUpdates, buildDesiredStock } from "./inventory";
import type { WixInventoryItem } from "../wix/client";

const items: WixInventoryItem[] = [
  { id: "inv1", revision: "5", variantId: "var1", productId: "p1" },
  { id: "inv2", revision: "3", variantId: "var2", productId: "p1" },
];

describe("buildInventoryUpdates", () => {
  it("matches desired stock to inventory items by variantId", () => {
    const { updates, unmatched } = buildInventoryUpdates(
      [
        { wixVariantId: "var1", quantity: 10 },
        { wixVariantId: "var2", quantity: 0 },
      ],
      items,
    );
    expect(unmatched).toEqual([]);
    expect(updates).toEqual([
      { id: "inv1", revision: "5", quantity: 10 },
      { id: "inv2", revision: "3", quantity: 0 },
    ]);
  });

  it("reports unmatched variants and clamps negatives", () => {
    const { updates, unmatched } = buildInventoryUpdates(
      [
        { wixVariantId: "var1", quantity: -4 },
        { wixVariantId: "ghost", quantity: 7 },
      ],
      items,
    );
    expect(updates).toEqual([{ id: "inv1", revision: "5", quantity: 0 }]);
    expect(unmatched).toEqual(["ghost"]);
  });

  it("truncates fractional quantities", () => {
    const { updates } = buildInventoryUpdates([{ wixVariantId: "var1", quantity: 9.8 }], items);
    expect(updates[0].quantity).toBe(9);
  });
});

describe("buildDesiredStock (sync-all seed-zero)", () => {
  const variants = [
    { wixVariantId: "var1", supplierVariantId: "sku-A" },
    { wixVariantId: "var2", supplierVariantId: "sku-B" },
  ];

  it("speglar saldo för varianter som finns i AE-svaret", () => {
    const desired = buildDesiredStock(variants, [
      { skuId: "sku-A", stock: 12 },
      { skuId: "sku-B", stock: 3 },
    ]);
    expect(desired).toEqual([
      { wixVariantId: "var1", quantity: 12 },
      { wixVariantId: "var2", quantity: 3 },
    ]);
  });

  it("NOLLAR en variant som saknas i AE-svaret (slutsåld/borttagen) — inte oversälj", () => {
    // sku-B droppades av AE (variant slutsåld) → ska bli 0, inte gammalt saldo.
    const desired = buildDesiredStock(variants, [{ skuId: "sku-A", stock: 5 }]);
    expect(desired).toEqual([
      { wixVariantId: "var1", quantity: 5 },
      { wixVariantId: "var2", quantity: 0 },
    ]);
  });

  it("hoppar över varianter utan wixVariantId", () => {
    const desired = buildDesiredStock(
      [{ supplierVariantId: "sku-A" }, { wixVariantId: "var2", supplierVariantId: "sku-B" }],
      [
        { skuId: "sku-A", stock: 9 },
        { skuId: "sku-B", stock: 4 },
      ],
    );
    expect(desired).toEqual([{ wixVariantId: "var2", quantity: 4 }]);
  });
});
