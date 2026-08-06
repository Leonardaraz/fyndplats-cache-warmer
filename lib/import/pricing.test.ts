import { describe, expect, it } from "vitest";
import {
  addVat,
  applyMarkup,
  applyOverrideBounds,
  computePrice,
  computePriceWithRules,
  computeProfit,
  costToSek,
  exceedsIossThreshold,
  resolveMarkup,
  roundPrice,
} from "./pricing";
import type { PricingConfig, PricingRules } from "./types";

const config: PricingConfig = {
  usdToSek: 10,
  vatRatePercent: 25,
  markup: { multiplier: 2.5, fixedSek: 0 },
  rounding: "none",
};

const rules: PricingRules = {
  usdToSek: 10,
  vatRatePercent: 25,
  defaultMultiplier: 2.0,
  fixedSurchargeSek: 0,
  categoryMultipliers: { "Skönhet & Hälsa": 3.0, Husdjur: 2.5 },
  tiersEnabled: false,
  tiers: [
    { minCostSek: 0, maxCostSek: 50, multiplier: 3.5 },
    { minCostSek: 50, maxCostSek: 150, multiplier: 2.5 },
    { minCostSek: 150, maxCostSek: null, multiplier: 1.7 },
  ],
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
  it("charm9 rounds UP to the next integer ending in 9", () => {
    expect(roundPrice(199, "charm9")).toBe(199); // redan ...9 → oförändrat
    expect(roundPrice(195, "charm9")).toBe(199);
    expect(roundPrice(192, "charm9")).toBe(199); // uppåt, inte 189
    expect(roundPrice(489, "charm9")).toBe(489);
    expect(roundPrice(490, "charm9")).toBe(499); // 489 < 490 → upp till 499
    expect(roundPrice(571, "charm9")).toBe(579);
    expect(roundPrice(3, "charm9")).toBe(9); // golv vid 9
  });
  it("nearest10 rounds UP to whole tens", () => {
    expect(roundPrice(251, "nearest10")).toBe(260);
    expect(roundPrice(250, "nearest10")).toBe(250);
    expect(roundPrice(240.01, "nearest10")).toBe(250);
  });
});

describe("resolveMarkup", () => {
  it("falls back to default multiplier with no category/tier match", () => {
    expect(resolveMarkup(80, null, rules)).toEqual({ multiplier: 2.0, fixedSek: 0 });
  });
  it("applies per-category multiplier (case-insensitive)", () => {
    expect(resolveMarkup(80, "skönhet & hälsa", rules).multiplier).toBe(3.0);
  });
  it("tier overrides category when tiers enabled", () => {
    const r = { ...rules, tiersEnabled: true };
    // costSek 80 → tier 50–150 = 2.5, beats category 3.0
    expect(resolveMarkup(80, "Skönhet & Hälsa", r).multiplier).toBe(2.5);
  });
  it("ignores tiers when disabled", () => {
    expect(resolveMarkup(80, "Husdjur", rules).multiplier).toBe(2.5);
  });
  it("carries the fixed surcharge", () => {
    expect(resolveMarkup(80, null, { ...rules, fixedSurchargeSek: 50 }).fixedSek).toBe(50);
  });
});

describe("computePriceWithRules", () => {
  it("uses category multiplier in the full price calc", () => {
    // 5 USD × 10 = 50 SEK; kategori 3.0× → slutpris 150 (ingen moms ovanpå).
    const b = computePriceWithRules(5, rules, "Skönhet & Hälsa");
    expect(b.costSek).toBe(50);
    expect(b.grossSek).toBe(150);
  });
  it("uses default multiplier without a category", () => {
    const b = computePriceWithRules(5, rules, null);
    // 50 × 2.0 = 100 — multiplikatorn ger slutpriset direkt.
    expect(b.grossSek).toBe(100);
  });
});

describe("computePrice", () => {
  it("produces a consistent net + VAT = gross breakdown", () => {
    const b = computePrice(5, config); // 5 USD × 10 = 50 SEK kostnad
    // Slutpris = 50 × 2.5 = 125. Momsen är en DEL av priset (125/1,25 = 100
    // netto + 25 moms), inte ett påslag ovanpå — Leonards beslut 2026-08-06.
    expect(b.costSek).toBe(50);
    expect(b.grossSek).toBe(125);
    expect(b.netSek).toBe(100);
    expect(round2(b.netSek + b.vatSek)).toBe(b.grossSek);
  });

  it("keeps net+VAT consistent after charm rounding", () => {
    const b = computePrice(5, { ...config, rounding: "charm90" });
    expect(b.grossSek).toBe(124.9);
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

describe("computePriceWithRules — pricingOverride (Marginal-tier)", () => {
  // rules.defaultMultiplier=2.0, usdToSek=10, VAT 25%, rounding "none".
  it("Custom 3.5× åsidosätter default-multiplikatorn", () => {
    // cost $10 → 100 SEK; ×3.5 = 350 SLUTPRIS (netto 280 + moms 70 UR priset).
    const p = computePriceWithRules(10, rules, null, { multiplier: 3.5 });
    expect(p.costSek).toBe(100);
    expect(p.netSek).toBe(280);
    expect(p.grossSek).toBe(350);
  });

  it("override vinner även över en matchande kategori-regel", () => {
    // Utan override skulle "Skönhet & Hälsa" ge 3.0×; override tvingar 2.0×.
    const p = computePriceWithRules(10, rules, "Skönhet & Hälsa", { multiplier: 2.0 });
    expect(p.grossSek).toBe(200); // 100 × 2.0 — ingen moms ovanpå
  });

  it("floorSek höjer priset så att minsta vinst nås", () => {
    // cost 100, 1.5× → 150 brutto (vinst 150/1,25 − 100 = 20 kr).
    // Floor 120 → minsta netto 220 → brutto 275. Vinsten räknas alltid
    // exkl. moms — floor-garantin är oförändrad av nya prisformeln.
    const p = computePriceWithRules(10, rules, null, { multiplier: 1.5, floorSek: 120 });
    expect(p.netSek).toBe(220);
    expect(p.grossSek).toBe(275);
  });

  it("floorSek rör inte priset när vinsten redan räcker", () => {
    // 3.5× → 350 brutto (vinst 350/1,25 − 100 = 180) ≥ floor 100 → oförändrat.
    const p = computePriceWithRules(10, rules, null, { multiplier: 3.5, floorSek: 100 });
    expect(p.grossSek).toBe(350);
  });

  it("ceilingSek kapar slutpriset hårt", () => {
    // 3.5× → 350 brutto; tak 300 → kapas till 300.
    const p = computePriceWithRules(10, rules, null, { multiplier: 3.5, ceilingSek: 300 });
    expect(p.grossSek).toBe(300);
    expect(round2(p.netSek + p.vatSek)).toBe(300); // netto + moms = brutto
  });

  it("ceiling vinner över floor (kan underskrida min vinst med för lågt tak)", () => {
    // floor 200 → minst (100+200)×1,25 = 375 brutto, men ceiling 260 kapar sist → 260.
    const p = computePriceWithRules(10, rules, null, { multiplier: 3.5, floorSek: 200, ceilingSek: 260 });
    expect(p.grossSek).toBe(260);
  });
});

describe("applyOverrideBounds", () => {
  const base = { costUsd: 10, costSek: 100, netSek: 240, vatSek: 60, grossSek: 300 };
  it("är en no-op utan floor/ceiling", () => {
    expect(applyOverrideBounds(base, { multiplier: 3 }, 25, "none")).toBe(base);
  });
});

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
