import { describe, it, expect } from "vitest";
import { mappingSupplier, isAliExpressMapping, isAosomMapping, aosomSkuOf } from "./supplier";

describe("mappingSupplier", () => {
  it("läser det sparade fältet när det finns", () => {
    expect(mappingSupplier({ supplier: "aosom", supplierProductId: "vad-som-helst" })).toBe("aosom");
    expect(mappingSupplier({ supplier: "aliexpress", supplierProductId: "aosom:x" })).toBe("aliexpress");
  });

  it("faller tillbaka på id-prefixet när fältet saknas", () => {
    expect(mappingSupplier({ supplierProductId: "aosom:845-030CG" })).toBe("aosom");
    expect(mappingSupplier({ supplierProductId: "1005010804316400" })).toBe("aliexpress");
  });

  it("gamla rader utan fält räknas som AliExpress — det var allt som fanns före 2026-08-27", () => {
    expect(mappingSupplier({ supplierProductId: "" })).toBe("aliexpress");
    expect(mappingSupplier({ supplierProductId: undefined as unknown as string })).toBe("aliexpress");
  });
});

describe("isAliExpressMapping", () => {
  it("släpper igenom AE-rader och stoppar Aosom-rader", () => {
    expect(isAliExpressMapping({ supplierProductId: "1005010804316400" })).toBe(true);
    expect(isAliExpressMapping({ supplierProductId: "aosom:845-030CG" })).toBe(false);
    expect(isAliExpressMapping({ supplier: "aosom", supplierProductId: "845-030CG" })).toBe(false);
  });

  it("isAosomMapping är exakt motsatsen", () => {
    for (const m of [
      { supplierProductId: "1005010804316400" },
      { supplierProductId: "aosom:845-030CG" },
      { supplier: "aosom" as const, supplierProductId: "845-030CG" },
    ]) {
      expect(isAosomMapping(m)).toBe(!isAliExpressMapping(m));
    }
  });
});

describe("aosomSkuOf", () => {
  it("skalar av prefixet", () => {
    expect(aosomSkuOf({ supplierProductId: "aosom:845-030CG" })).toBe("845-030CG");
  });

  it("ger null för AE-rader", () => {
    expect(aosomSkuOf({ supplierProductId: "1005010804316400" })).toBeNull();
  });

  it("ger null när fältet säger aosom men id:t saknar prefix — gissa inte", () => {
    expect(aosomSkuOf({ supplier: "aosom", supplierProductId: "845-030CG" })).toBeNull();
  });
});
