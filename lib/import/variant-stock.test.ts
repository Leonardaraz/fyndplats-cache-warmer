import { describe, expect, it } from "vitest";
import { resolveImportStockQty } from "./variant-stock";

describe("resolveImportStockQty", () => {
  it("anvander skrapans per-variant-saldo nar det ar > 0", () => {
    expect(resolveImportStockQty(37, 10)).toBe(37);
    expect(resolveImportStockQty(1, 10)).toBe(1);
  });

  it("truncar decimaler till heltal", () => {
    expect(resolveImportStockQty(12.9, 10)).toBe(12);
  });

  it("faller tillbaka pa default nar saldo saknas eller ar ogiltigt", () => {
    expect(resolveImportStockQty(undefined, 10)).toBe(10);
    expect(resolveImportStockQty(-5, 10)).toBe(10);
    expect(resolveImportStockQty(NaN, 10)).toBe(10);
  });

  // Bug 2026-06-02: 0 ar ett LEGITIMT varde fran AE (uttrycklig OOS) och ska
  // INTE falla tillbaka till default 10. Tidigare blev AE:s 0-lager -> 10 i Wix
  // -> kunder kunde bestalla varor vi saknade.
  it("respekterar 0 som legitim OOS (ingen fallback)", () => {
    expect(resolveImportStockQty(0, 10)).toBe(0);
    expect(resolveImportStockQty(0, 10, true)).toBe(0);
  });

  it("OOS-produkt -> 0 oavsett per-variant-saldo", () => {
    expect(resolveImportStockQty(50, 10, false)).toBe(0);
    expect(resolveImportStockQty(undefined, 10, false)).toBe(0);
  });

  it("i lager (true) beter sig som default", () => {
    expect(resolveImportStockQty(50, 10, true)).toBe(50);
    expect(resolveImportStockQty(undefined, 10, true)).toBe(10);
  });
});
