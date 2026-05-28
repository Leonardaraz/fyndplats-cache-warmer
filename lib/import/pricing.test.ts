import { describe, expect, it } from "vitest";
import {
  addVat,
  applyMarkup,
  computePrice,
  computeProfit,
  costToSek,
  exceedsIossThreshold,
  roundPrice,
} from "./pricing";
import type { PricingConfig } from "./types";

const config: PricingConfig = {
  usdToSek: 10,
  vatRatePercent: 25,
  markup: { multiplier: 2.5, fixedSek: 0 },
  rounding: "none",
};

describe("costToSek", () => {
  it("converts USD to SEK", () => {
    expect(costToSek(5, 10.5)).toBe(52.5);
  });
});

describe("applyMarkup", () => {
  it("applies multiplier and fixed addition", () => {
    expect(applyMarkup(50, { multiplier: 2, fixedSek: 10 })).toBe(110);
  });
});

describe("addVat", () => {
  it("adds 25% VAT", () => {
    expect(addVat(100, 25)).toBe(125);
  });
});

describe("roundPrice", () => {
  it("charm90 rounds to nearest .90 ending", () => {
    expect(roundPrice(248.3, "charm90")).toBe(247.9);
    expect(roundPrice(249.7, "charm90")).toBe(249.9);
  });
  it("integer rounds to whole number", () => {
    expect(roundPrice(249.7, "integer")).toBe(250);
  });
  it("never returns negative charm price", () => {
    expect(roundPrice(0.2, "charm90")).toBe(0.9);
  });
});

describe("computePrice", () => {
  it("produces a consistent net + VAT = gross breakdown", () => {
    const b = computePrice(5, config); // 5 USD * 10 = 50 SEK cost
    // net = 50 * 2.5 = 125; gross = 156.25
    expect(b.costSek).toBe(50);
    expect(b.grossSek).toBe(156.25);
    expect(round2(b.netSek + b.vatSek)).toBe(b.grossSek);
  });

  it("keeps net+VAT consistent after charm rounding", () => {
    const b = computePrice(5, { ...config, rounding: "charm90" });
    expect(b.grossSek).toBe(155.9);
    expect(round2(b.netSek + b.vatSek)).toBe(b.grossSek);
  });
});

describe("computeProfit", () => {
  it("computes profit on revenue excluding VAT", () => {
    // gross 250 incl 25% VAT => net revenue 200; cost 80; fee 10 => profit 110
    const r = computeProfit({ grossSek: 250, vatRatePercent: 25, landedCostSek: 80, paymentFeeSek: 10 });
    expect(r.netRevenueSek).toBe(200);
    expect(r.profitSek).toBe(110);
    expect(r.marginPercent).toBe(55);
  });

  it("does not overstate profit by ignoring VAT", () => {
    const withVat = computeProfit({ grossSek: 250, vatRatePercent: 25, landedCostSek: 80, paymentFeeSek: 0 });
    expect(withVat.profitSek).toBeLessThan(250 - 80);
  });
});

describe("exceedsIossThreshold", () => {
  it("flags orders above 150 EUR", () => {
    // 2000 SEK * 0.088 = 176 EUR > 150
    expect(exceedsIossThreshold(2000, 0.088, 150)).toBe(true);
  });
  it("allows orders under threshold", () => {
    expect(exceedsIossThreshold(1000, 0.088, 150)).toBe(false);
  });
});

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
