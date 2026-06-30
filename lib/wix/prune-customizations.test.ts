import { describe, it, expect } from "vitest";
import { buildHeadroomReport, formatHeadroomWarnings, type WixCustomization } from "./prune-customizations";

const c = (name: string, renderType: string, choiceCount: number, type = "PRODUCT_OPTION", id = name + renderType): WixCustomization =>
  ({ id, name, renderType, customizationType: type, choiceCount });

describe("buildHeadroomReport", () => {
  // Spegel av live-läget 2026-06-30: två "Färg" (olika renderType), Storlek nära taket.
  const live = [
    c("Storlek", "TEXT_CHOICES", 97),
    c("Modell", "TEXT_CHOICES", 33),
    c("Färg", "TEXT_CHOICES", 24),
    c("Färg", "SWATCH_CHOICES", 22),
    c("Tom", "TEXT_CHOICES", 0),
    c("Material", "TEXT_CHOICES", 2),
    c("Gravyr", "TEXT_CHOICES", 150, "MODIFIER"), // modifier — ska EXKLUDERAS
  ];

  it("exkluderar MODIFIER, behåller bara PRODUCT_OPTION", () => {
    const r = buildHeadroomReport(live);
    expect(r.buckets.some((b) => b.name === "Gravyr")).toBe(false);
    expect(r.buckets).toHaveLength(6);
  });

  it("håller två 'Färg' (olika renderType) som SEPARATA hinkar", () => {
    const r = buildHeadroomReport(live);
    const fargs = r.buckets.filter((b) => b.name === "Färg");
    expect(fargs).toHaveLength(2);
    expect(new Set(fargs.map((b) => b.key)).size).toBe(2); // distinkta nycklar
    expect(r.duplicateKeys).toHaveLength(0); // ingen anomali
  });

  it("flaggar nära-taket-hinkar (Storlek 97 ≥ 85) och beräknar headroom", () => {
    const r = buildHeadroomReport(live, { warnAt: 85 });
    expect(r.maxChoiceCount).toBe(97);
    expect(r.nearLimit.map((b) => b.name)).toEqual(["Storlek"]);
    const storlek = r.buckets.find((b) => b.name === "Storlek")!;
    expect(storlek.headroom).toBe(3);
    expect(storlek.atLimit).toBe(false);
  });

  it("räknar tomma hinkar (skräp-axlar)", () => {
    expect(buildHeadroomReport(live).emptyCount).toBe(1);
  });

  it("sorterar störst först", () => {
    const names = buildHeadroomReport(live).buckets.map((b) => b.name);
    expect(names[0]).toBe("Storlek");
  });

  it("atLimit + war-text när taket nåtts", () => {
    const r = buildHeadroomReport([c("Färg", "TEXT_CHOICES", 100)], { warnAt: 85 });
    const b = r.buckets[0];
    expect(b.atLimit).toBe(true);
    expect(b.headroom).toBe(0);
    const warn = formatHeadroomWarnings(r);
    expect(warn).toHaveLength(1);
    expect(warn[0]).toContain("TAKET NÅTT");
  });

  it("upptäcker duplicate-nyckel-anomali (två id, samma name+renderType)", () => {
    const dup = [
      c("Färg", "TEXT_CHOICES", 10, "PRODUCT_OPTION", "id-a"),
      c("Färg", "TEXT_CHOICES", 5, "PRODUCT_OPTION", "id-b"),
    ];
    expect(buildHeadroomReport(dup).duplicateKeys).toHaveLength(1);
  });

  it("tom indata → inga hinkar, max 0, inga varningar", () => {
    const r = buildHeadroomReport([]);
    expect(r.buckets).toHaveLength(0);
    expect(r.maxChoiceCount).toBe(0);
    expect(formatHeadroomWarnings(r)).toHaveLength(0);
  });
});
