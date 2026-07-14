import { describe, expect, it } from "vitest";
import type { VariantMapping } from "../import/pipeline";
import { checkMappingShippability, isShippabilityStale, SHIPPABILITY_RECHECK_MS } from "./shippability";
import type { FreightQueryOutcome } from "../aliexpress/freight";

const NOW = Date.parse("2026-07-13T22:00:00.000Z");

function variant(overrides: Partial<VariantMapping>): VariantMapping {
  return {
    supplierVariantId: "sku-1",
    sku: "FP-test",
    wixVariantId: "wix-1",
    choices: { Antal: "39 Lådor" },
    costUsd: 10,
    landedCostSek: 100,
    grossSek: 199,
    ...overrides,
  };
}

const AE = [
  { skuId: "sku-1", skuProps: { Color: "39 Drawers" } },
  { skuId: "sku-2", skuProps: { Color: "22 Drawers" } },
];

function shippableOutcome(): Promise<FreightQueryOutcome> {
  return Promise.resolve({
    method: "aliexpress.ds.freight.query",
    raw: { result: { delivery_options: { delivery_option_d_t_o: [{ code: "STD" }] } } },
  });
}

function unshippableOutcome(): Promise<FreightQueryOutcome> {
  return Promise.resolve({
    method: "aliexpress.ds.freight.query",
    raw: { result: { delivery_options: { delivery_option_d_t_o: [] } } },
  });
}

describe("isShippabilityStale", () => {
  it("aldrig kontrollerad → stale; färsk kontroll → inte stale; 7+ dygn → stale", () => {
    expect(isShippabilityStale(variant({}), NOW)).toBe(true);
    expect(isShippabilityStale(variant({ shippabilityCheckedAt: new Date(NOW - 1000).toISOString() }), NOW)).toBe(false);
    expect(isShippabilityStale(variant({ shippabilityCheckedAt: new Date(NOW - SHIPPABILITY_RECHECK_MS - 1).toISOString() }), NOW)).toBe(true);
  });
});

describe("checkMappingShippability", () => {
  it("nej-svar markerar INTE (unknown efter kod röd 2026-07-14); ja-svar markerar fraktbar", async () => {
    const budget = { remaining: 10 };
    const res = await checkMappingShippability({
      mapping: {
        supplierProductId: "1005012347030872",
        variants: [variant({ supplierVariantId: "sku-1" }), variant({ supplierVariantId: "sku-2", wixVariantId: "wix-2", sku: "FP-test-2" })],
      },
      aeVariants: AE,
      nowMs: NOW,
      budget,
      delayMs: 0,
      queryFn: (_pid, skuId) => (skuId === "sku-1" ? unshippableOutcome() : shippableOutcome()),
    });
    expect(res.apiCalls).toBe(2);
    expect(budget.remaining).toBe(8);
    expect(res.unshippable).toBe(0);
    // sku-1: tomt/nekande svar → orörd + fortsatt stale (ingen stämpel).
    expect(res.variants[0].shippableToSe).toBeUndefined();
    expect(res.variants[0].shippabilityCheckedAt).toBeUndefined();
    // sku-2: positiv evidens → fraktbar + stämplad.
    expect(res.variants[1]).toMatchObject({ shippableToSe: true });
    expect(res.variants[1].shippabilityCheckedAt).toBeTruthy();
  });

  it("färska varianter hoppar kontrollen — inga anrop", async () => {
    const fresh = new Date(NOW - 1000).toISOString();
    const res = await checkMappingShippability({
      mapping: {
        supplierProductId: "p",
        variants: [variant({ shippabilityCheckedAt: fresh, shippableToSe: true })],
      },
      aeVariants: AE,
      nowMs: NOW,
      budget: { remaining: 10 },
      delayMs: 0,
      queryFn: () => { throw new Error("ska inte anropas"); },
    });
    expect(res.apiCalls).toBe(0);
    expect(res.changed).toBe(false);
  });

  it("slut budget → resterande varianter lämnas orörda (stale kvar)", async () => {
    const res = await checkMappingShippability({
      mapping: {
        supplierProductId: "p",
        variants: [variant({ supplierVariantId: "sku-1" }), variant({ supplierVariantId: "sku-2", sku: "FP-2" })],
      },
      aeVariants: AE,
      nowMs: NOW,
      budget: { remaining: 1 },
      delayMs: 0,
      queryFn: () => shippableOutcome(),
    });
    expect(res.apiCalls).toBe(1);
    expect(res.variants[1].shippabilityCheckedAt).toBeUndefined();
  });

  it("unknown-svar ändrar INGENTING (varianten förblir stale)", async () => {
    const res = await checkMappingShippability({
      mapping: { supplierProductId: "p", variants: [variant({ shippableToSe: true })] },
      aeVariants: AE,
      nowMs: NOW,
      budget: { remaining: 10 },
      delayMs: 0,
      queryFn: () => Promise.resolve({ method: "x", error: "AliExpress API HTTP-fel: 502" }),
    });
    expect(res.apiCalls).toBe(1);
    expect(res.changed).toBe(false);
    expect(res.variants[0]).toMatchObject({ shippableToSe: true });
    expect(res.variants[0].shippabilityCheckedAt).toBeUndefined();
  });

  it("ingen entydig SKU-matchning → inget anrop, ingen dom", async () => {
    const res = await checkMappingShippability({
      mapping: { supplierProductId: "p", variants: [variant({ supplierVariantId: "okänd-sku" })] },
      aeVariants: AE,
      nowMs: NOW,
      budget: { remaining: 10 },
      delayMs: 0,
      queryFn: () => { throw new Error("ska inte anropas"); },
    });
    expect(res.apiCalls).toBe(0);
    expect(res.details[0].note).toContain("ingen entydig SKU-matchning");
  });

  it("fraktväg tillbaka → varianten blir fraktbar igen (självläkande)", async () => {
    const stale = new Date(NOW - SHIPPABILITY_RECHECK_MS - 1000).toISOString();
    const res = await checkMappingShippability({
      mapping: {
        supplierProductId: "p",
        variants: [variant({ shippableToSe: false, shippabilityCheckedAt: stale })],
      },
      aeVariants: AE,
      nowMs: NOW,
      budget: { remaining: 10 },
      delayMs: 0,
      queryFn: () => shippableOutcome(),
    });
    expect(res.variants[0]).toMatchObject({ shippableToSe: true });
    expect(res.unshippable).toBe(0);
  });
});
