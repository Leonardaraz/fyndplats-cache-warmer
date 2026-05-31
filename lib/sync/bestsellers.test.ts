import { describe, expect, it } from "vitest";
import {
  selectBestsellerProductIds,
  planBestsellerPriority,
  priorityRank,
  BESTSELLER_REASON,
} from "./bestsellers";
import type { ProductMappingRecord } from "../store/index";

function mapping(overrides: Partial<ProductMappingRecord>): ProductMappingRecord {
  return {
    supplierProductId: "ae",
    wixProductId: "w",
    variants: [],
    ...overrides,
  };
}

describe("selectBestsellerProductIds", () => {
  it("väljer top-N efter sålda enheter, utelämnar 0-säljare", () => {
    const sales = { a: 5, b: 50, c: 0, d: 20 };
    const set = selectBestsellerProductIds(sales, 2);
    expect([...set].sort()).toEqual(["b", "d"]);
  });

  it("tar inte med produkter utan försäljning", () => {
    const set = selectBestsellerProductIds({ a: 0, b: 0 }, 50);
    expect(set.size).toBe(0);
  });
});

describe("planBestsellerPriority", () => {
  it("promotar nya bestsellers som inte redan är high", () => {
    const mappings = [
      mapping({ wixProductId: "a", priority: "normal" }),
      mapping({ wixProductId: "b", priority: "high", priorityReason: BESTSELLER_REASON }),
    ];
    const plan = planBestsellerPriority(mappings, new Set(["a", "b"]));
    expect(plan.promote).toEqual(["a"]);
    expect(plan.demote).toEqual([]);
  });

  it("nedgraderar bara high som SATTS av bestseller-logiken", () => {
    const mappings = [
      mapping({ wixProductId: "a", priority: "high", priorityReason: BESTSELLER_REASON }), // ramlat ur
      mapping({ wixProductId: "b", priority: "high", priorityReason: "manual" }), // manuell — rör ej
      mapping({ wixProductId: "c", priority: "high", priorityReason: "recent-purchase" }), // köp — rör ej
    ];
    const plan = planBestsellerPriority(mappings, new Set()); // inga bestsellers längre
    expect(plan.demote).toEqual(["a"]);
    expect(plan.promote).toEqual([]);
  });
});

describe("priorityRank", () => {
  it("rangordnar high < normal < low (lägre = synkas först)", () => {
    expect(priorityRank("high")).toBeLessThan(priorityRank("normal"));
    expect(priorityRank("normal")).toBeLessThan(priorityRank("low"));
    expect(priorityRank(undefined)).toBe(priorityRank("normal"));
  });
});
