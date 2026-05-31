import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROFITABILITY_SETTINGS,
  computeProfitabilityReport,
  marginPerUnit,
  netFromGross,
} from "./profitability";
import type { OrderUnitsByProduct } from "../wix/orders";
import type { ProductMappingRecord } from "../store/index";

const emptyOrders: OrderUnitsByProduct = {
  byProductId: {},
  bySku: {},
  totalGrossSek: 0,
  orderCount: 0,
  dailyGrossSek: {},
  lines: [],
};

describe("netFromGross", () => {
  it("räknar bort 25% moms", () => {
    expect(netFromGross(125, 25)).toBeCloseTo(100, 2);
  });
  it("0%-moms = identitet", () => {
    expect(netFromGross(99, 0)).toBe(99);
  });
});

describe("marginPerUnit", () => {
  it("räknar netto − inköp − frakt − klarna", () => {
    // sälj 250 inkl. moms (25%) → 200 netto
    // inköp 80, frakt 15, klarna 3% av 250 + 2 = 9.5
    // marginal = 200 − 80 − 15 − 9.5 = 95.5
    const r = marginPerUnit(250, 80, DEFAULT_PROFITABILITY_SETTINGS);
    expect(r.netRevenueSek).toBeCloseTo(200, 2);
    expect(r.marginSek).toBeCloseTo(95.5, 2);
    expect(r.marginPercent).toBeCloseTo(47.75, 1);
  });

  it("marginal kan vara negativ för förlust", () => {
    // sälj 100 inkl moms = 80 netto, inköp 150 → tydlig förlust
    const r = marginPerUnit(100, 150, DEFAULT_PROFITABILITY_SETTINGS);
    expect(r.marginSek).toBeLessThan(0);
    expect(r.marginPercent).toBeLessThan(0);
  });
});

describe("computeProfitabilityReport", () => {
  it("aggregerar rader och summary korrekt", () => {
    const mappings: ProductMappingRecord[] = [
      {
        supplierProductId: "ae-1",
        wixProductId: "wix-A",
        variants: [
          {
            supplierVariantId: "v1",
            sku: "AE-ae-1-v1",
            choices: {},
            costUsd: 8,
            landedCostSek: 80,
            grossSek: 250,
          },
        ],
      },
    ];

    const orders: OrderUnitsByProduct = {
      byProductId: {
        "wix-A": { units: 10, grossSek: 2500, lastSoldAt: "2026-05-30T10:00:00Z" },
      },
      bySku: {},
      totalGrossSek: 2500,
      orderCount: 5,
      dailyGrossSek: { "2026-05-30": 2500 },
      lines: [],
    };

    const report = computeProfitabilityReport({
      products: [
        { productId: "wix-A", name: "Test-produkt A", priceSek: 250, inStock: true, variantCount: 1 },
        { productId: "wix-B", name: "Test-produkt B utan försäljning", priceSek: 199, inStock: true },
      ],
      mappings,
      importCosts: [],
      orders,
      settings: DEFAULT_PROFITABILITY_SETTINGS,
      periodDays: 90,
    });

    expect(report.rows).toHaveLength(2);
    const a = report.rows.find((r) => r.productId === "wix-A")!;
    expect(a.costSource).toBe("mapping");
    expect(a.costSek).toBe(80);
    expect(a.unitsSold).toBe(10);
    expect(a.marginPerUnitSek).toBeCloseTo(95.5, 2);
    expect(a.totalProfitSek).toBeCloseTo(955, 1);

    const b = report.rows.find((r) => r.productId === "wix-B")!;
    expect(b.unitsSold).toBe(0);
    expect(b.costSource).toBe("fallback-pct"); // 30% av netto 159.2 ≈ 47.76
    expect(b.costSek).toBeGreaterThan(0);

    // Summary
    expect(report.summary.totalRevenueSek).toBeCloseTo(2500, 1);
    expect(report.summary.totalProfitSek).toBeCloseTo(955, 1);
    expect(report.summary.productsSoldCount).toBe(1);
    expect(report.summary.productsWithoutSalesCount).toBe(1);
    expect(report.summary.top5Profitable[0].productId).toBe("wix-A");
    expect(report.summary.bottom5ZeroSales[0].productId).toBe("wix-B");
  });

  it("manuell ImportCost-override vinner över mapping", () => {
    const report = computeProfitabilityReport({
      products: [{ productId: "wix-A", name: "A", priceSek: 200 }],
      mappings: [
        {
          supplierProductId: "ae-1",
          wixProductId: "wix-A",
          variants: [
            { supplierVariantId: "v1", sku: "s", choices: {}, costUsd: 5, landedCostSek: 50, grossSek: 200 },
          ],
        },
      ],
      importCosts: [
        {
          productId: "wix-A",
          costSek: 90,
          currency: "SEK",
          importedAt: "2026-05-30T00:00:00Z",
          source: "manual",
        },
      ],
      orders: emptyOrders,
      settings: DEFAULT_PROFITABILITY_SETTINGS,
      periodDays: 90,
    });
    expect(report.rows[0].costSek).toBe(90);
    expect(report.rows[0].costSource).toBe("import-cost-collection");
  });

  it("default-sortering är på totalProfitSek desc", () => {
    const report = computeProfitabilityReport({
      products: [
        { productId: "low", name: "Low", priceSek: 100 },
        { productId: "high", name: "High", priceSek: 100 },
      ],
      mappings: [],
      importCosts: [],
      orders: {
        byProductId: {
          high: { units: 10, grossSek: 1000 },
          low: { units: 2, grossSek: 200 },
        },
        bySku: {},
        totalGrossSek: 1200,
        orderCount: 2,
        dailyGrossSek: {},
        lines: [],
      },
      settings: DEFAULT_PROFITABILITY_SETTINGS,
      periodDays: 90,
    });
    expect(report.rows[0].productId).toBe("high");
    expect(report.rows[1].productId).toBe("low");
  });
});
