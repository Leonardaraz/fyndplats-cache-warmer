import { describe, expect, it } from "vitest";
import { assessPriceTrust, harDelatPris, type PriceTrustContext } from "./price-trust";

// Syntetiska id:n ser ut som "dom-0" (isSyntheticVariantId i variant-reconcile).
const dom = (i: number, costUsd: number, included = true) => ({
  supplierVariantId: `dom-${i}`,
  costUsd,
  included,
});
const sku = (id: string, costUsd: number, included = true) => ({
  supplierVariantId: id,
  costUsd,
  included,
});

const AVBRUTEN: PriceTrustContext = {
  reconcileAttempted: true,
  reconcileAborted: true,
  dsLookupFailed: false,
};
const DS_FÖLL: PriceTrustContext = {
  reconcileAttempted: true,
  reconcileAborted: false,
  dsLookupFailed: true,
};
const BEKRÄFTAD: PriceTrustContext = {
  reconcileAttempted: true,
  reconcileAborted: false,
  dsLookupFailed: false,
};
const KÖRDES_EJ: PriceTrustContext = {
  reconcileAttempted: false,
  reconcileAborted: false,
  dsLookupFailed: false,
};

describe("harDelatPris", () => {
  it("två varianter med samma pris delar pris", () => {
    expect(harDelatPris([dom(0, 22.9), dom(1, 22.9)])).toBe(true);
  });

  it("olika pris delar inte", () => {
    expect(harDelatPris([dom(0, 22.9), dom(1, 31.5)])).toBe(false);
  });

  it("en ensam variant delar ingenting", () => {
    expect(harDelatPris([dom(0, 22.9)])).toBe(false);
  });

  // Exkluderade varianter är inte till salu och ska inte dra med i bedömningen.
  it("räknar bara inkluderade varianter", () => {
    expect(harDelatPris([dom(0, 22.9), dom(1, 22.9, false)])).toBe(false);
  });

  it("varianter utan pris räknas inte", () => {
    expect(harDelatPris([dom(0, 0), dom(1, 0)])).toBe(false);
  });
});

describe("assessPriceTrust", () => {
  // Leonards tre produkter 2026-08-20: 4-pack och 6-pack båda 589 kr.
  it("flaggar delat pris när skrapan saknade SKU-id och avstämningen avbröts", () => {
    const v = assessPriceTrust([dom(0, 22.9), dom(1, 22.9)], AVBRUTEN);
    expect(v.trusted).toBe(false);
    if (!v.trusted) {
      expect(v.sharedCount).toBe(2);
      expect(v.reason).toMatch(/avbröts/);
      expect(v.reason).toMatch(/underprisade/);
    }
  });

  it("flaggar även när DS-uppslaget föll", () => {
    const v = assessPriceTrust([dom(0, 22.9), dom(1, 22.9)], DS_FÖLL);
    expect(v.trusted).toBe(false);
    if (!v.trusted) expect(v.reason).toMatch(/DS-uppslaget föll/);
  });

  it("flaggar när avstämningen aldrig kördes", () => {
    const v = assessPriceTrust([dom(0, 22.9), dom(1, 22.9)], KÖRDES_EJ);
    expect(v.trusted).toBe(false);
    if (!v.trusted) expect(v.reason).toMatch(/kördes aldrig/);
  });

  // DEN VIKTIGA MOTVIKTEN: färgvarianter kostar nästan alltid lika mycket.
  // Har DS bekräftat matchningen är delat pris ett faktum om varan.
  it("bekräftad avstämning gör delat pris helt i sin ordning", () => {
    expect(assessPriceTrust([dom(0, 22.9), dom(1, 22.9)], BEKRÄFTAD).trusted).toBe(true);
  });

  it("riktiga SKU-id:n räcker — då hade skrapan per-SKU-data", () => {
    expect(assessPriceTrust([sku("12000041", 22.9), sku("12000042", 22.9)], AVBRUTEN).trusted).toBe(
      true,
    );
  });

  it("olika priser är alltid i sin ordning", () => {
    expect(assessPriceTrust([dom(0, 22.9), dom(1, 31.5)], AVBRUTEN).trusted).toBe(true);
  });

  it("en enda variant kan inte dela pris med någon", () => {
    expect(assessPriceTrust([dom(0, 22.9)], AVBRUTEN).trusted).toBe(true);
  });

  it("tom lista är i sin ordning", () => {
    expect(assessPriceTrust([], AVBRUTEN).trusted).toBe(true);
  });

  // Blandade id:n: en enda syntetisk räcker för att datan ska vara suspekt,
  // eftersom DOM-fallbacken slår på hela produkten.
  it("en syntetisk bland riktiga räcker för att flagga", () => {
    const v = assessPriceTrust([sku("12000041", 22.9), dom(1, 22.9)], AVBRUTEN);
    expect(v.trusted).toBe(false);
  });

  it("motiveringen bär priset så det går att felsöka ur loggen", () => {
    const v = assessPriceTrust([dom(0, 22.9), dom(1, 22.9), dom(2, 22.9)], AVBRUTEN);
    if (!v.trusted) {
      expect(v.reason).toContain("22.9");
      expect(v.sharedCount).toBe(3);
    }
  });
});
