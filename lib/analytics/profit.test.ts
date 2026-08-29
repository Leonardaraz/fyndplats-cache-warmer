import { describe, expect, it } from "vitest";
import { feeForGross, summarizeProductProfit } from "./profit";
import type { ProductMappingRecord } from "../store/index";

const mapping: ProductMappingRecord = {
  supplierProductId: "ae-1",
  wixProductId: "wix-1",
  variants: [
    { supplierVariantId: "a", sku: "AE-1-a", choices: {}, costUsd: 5, landedCostSek: 50, grossSek: 199 },
    { supplierVariantId: "b", sku: "AE-1-b", choices: {}, costUsd: 7, landedCostSek: 70, grossSek: 249 },
  ],
};

describe("feeForGross", () => {
  it("applies percent + fixed fee", () => {
    expect(feeForGross(200, { percent: 3, fixedSek: 2 })).toBe(8);
  });
});

describe("summarizeProductProfit", () => {
  it("computes per-variant profit on net revenue (excl. VAT)", () => {
    const s = summarizeProductProfit(mapping, 25, { percent: 3, fixedSek: 2 })!;
    expect(s.variantCount).toBe(2);
    // variant a: nettointäkt 199/1,25 = 159,2; avgift 199×0,03+2 = 7,97;
    // landad kostnad 50 är INKL moms → verklig kostnad 50/1,25 = 40.
    // 159,2 − 40 − 7,97 = 111,23. (Väntade sig 101,23 innan momsen drogs av
    // ur kostnaden — alltså 10 kr för lite, exakt 25 % av inköpet.)
    expect(s.variants[0].profitSek).toBeCloseTo(111.23, 2);
    expect(s.minProfit).toBeLessThanOrEqual(s.maxProfit);
  });

  it("returns null for a mapping with no variants", () => {
    expect(summarizeProductProfit({ ...mapping, variants: [] }, 25, { percent: 0, fixedSek: 0 })).toBeNull();
  });
});
