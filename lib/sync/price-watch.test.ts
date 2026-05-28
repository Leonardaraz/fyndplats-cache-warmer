import { describe, expect, it } from "vitest";
import { evaluatePriceChange, percentChange } from "./price-watch";
import type { PricingConfig } from "../import/types";

const pricing: PricingConfig = {
  usdToSek: 10,
  vatRatePercent: 25,
  markup: { multiplier: 2.5, fixedSek: 0 },
  rounding: "none",
};

describe("percentChange", () => {
  it("computes a rise", () => {
    expect(percentChange(10, 12)).toBe(20);
  });
  it("computes a drop", () => {
    expect(percentChange(10, 9)).toBe(-10);
  });
  it("treats new cost from zero as full increase", () => {
    expect(percentChange(0, 5)).toBe(100);
  });
});

describe("evaluatePriceChange", () => {
  const watch = { thresholdPercent: 10, autoAdjust: false };

  it("flags a cost rise above threshold when auto-adjust is off", () => {
    const r = evaluatePriceChange(10, 12, pricing, watch);
    expect(r.exceedsThreshold).toBe(true);
    expect(r.flagged).toBe(true);
    expect(r.newGrossSek).toBeUndefined();
  });

  it("does not flag a small change", () => {
    const r = evaluatePriceChange(10, 10.5, pricing, watch);
    expect(r.exceedsThreshold).toBe(false);
    expect(r.flagged).toBe(false);
  });

  it("does not flag a price drop, even above threshold", () => {
    const r = evaluatePriceChange(10, 8, pricing, watch);
    expect(r.exceedsThreshold).toBe(true);
    expect(r.flagged).toBe(false);
  });

  it("auto-adjusts the gross price instead of flagging", () => {
    const r = evaluatePriceChange(10, 12, pricing, { thresholdPercent: 10, autoAdjust: true });
    expect(r.flagged).toBe(false);
    // 12 USD * 10 = 120 cost; *2.5 = 300 net; *1.25 = 375 gross
    expect(r.newGrossSek).toBe(375);
  });

  it("does not auto-adjust below threshold", () => {
    const r = evaluatePriceChange(10, 10.5, pricing, { thresholdPercent: 10, autoAdjust: true });
    expect(r.newGrossSek).toBeUndefined();
  });
});
