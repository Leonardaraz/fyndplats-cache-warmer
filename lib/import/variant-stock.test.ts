import { describe, expect, it } from "vitest";
import { resolveImportStockQty } from "./variant-stock";

describe("resolveImportStockQty", () => {
  it("använder skrapans per-variant-saldo när det är > 0", () => {
    expect(resolveImportStockQty(37, 10)).toBe(37);
    expect(resolveImportStockQty(1, 10)).toBe(1);
  });

  it("truncar decimaler till heltal", () => {
    expect(resolveImportStockQty(12.9, 10)).toBe(12);
  });

  it("faller tillbaka på default när saldo saknas, är 0 eller ogiltigt", () => {
    expect(resolveImportStockQty(undefined, 10)).toBe(10);
    expect(resolveImportStockQty(0, 10)).toBe(10);
    expect(resolveImportStockQty(-5, 10)).toBe(10);
    expect(resolveImportStockQty(NaN, 10)).toBe(10);
  });

  it("OOS-produkt → 0 oavsett per-variant-saldo", () => {
    expect(resolveImportStockQty(50, 10, false)).toBe(0);
    expect(resolveImportStockQty(undefined, 10, false)).toBe(0);
  });

  it("i lager (true) beter sig som default", () => {
    expect(resolveImportStockQty(50, 10, true)).toBe(50);
    expect(resolveImportStockQty(undefined, 10, true)).toBe(10);
  });
});
