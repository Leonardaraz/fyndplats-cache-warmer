import { describe, expect, it } from "vitest";
import { optionComboKey, resolveImportStockQty } from "./variant-stock";

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

// Bug 2026-06-04: AE laddar inte langre SKU-id i sidan -> skrapan satter "idx-N"
// -> skuId-matchningen mot DS-API gav 0 traffar -> allt fick fallback 10. Vi
// matchar nu pa optionsVARDENA, som bada kallor delar.
describe("optionComboKey", () => {
  it("bygger en sorterad, normaliserad nyckel av optionsvardena", () => {
    expect(optionComboKey({ Color: "Red", Size: "M" })).toBe("m|red");
  });

  it("ar oberoende av nyckelordning (skrapan vs DS-API kan skilja)", () => {
    const scraped = optionComboKey({ Size: "M", Color: "Red" });
    const dsApi = optionComboKey({ Color: "Red", Size: "M" });
    expect(scraped).toBe(dsApi);
  });

  it("ar oberoende av optionsNAMN — matchar pa varden", () => {
    // Skrapan kan kalla axeln "Färg", DS-API "Color" — vardet "Red" delas.
    expect(optionComboKey({ "Färg": "Red" })).toBe(optionComboKey({ Color: "Red" }));
  });

  it("normaliserar skiftlage och blanksteg", () => {
    expect(optionComboKey({ Color: "  RED  " })).toBe("red");
  });

  it("hoppar over tomma varden och hanterar tomt/undefined", () => {
    expect(optionComboKey({ Color: "Red", Ships: "" })).toBe("red");
    expect(optionComboKey({})).toBe("");
    expect(optionComboKey(undefined)).toBe("");
  });

  it("ger distinkta nycklar for distinkta kombinationer", () => {
    const red = optionComboKey({ Color: "Red", Size: "M" });
    const blue = optionComboKey({ Color: "Blue", Size: "M" });
    expect(red).not.toBe(blue);
  });
});
