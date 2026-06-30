import { describe, it, expect } from "vitest";
import {
  buildHeadroomReport,
  formatHeadroomWarnings,
  planCustomizationPrune,
  executePrune,
  type ChoiceUsage,
  type WixCustomization,
} from "./prune-customizations";

const c = (name: string, renderType: string, choiceCount: number, type = "PRODUCT_OPTION", id = name + renderType): WixCustomization =>
  ({ id, name, renderType, customizationType: type, choiceCount });

// Helper för prune-tester: customization med faktiska val (id+namn) + revision.
const withChoices = (
  id: string,
  name: string,
  choiceNames: string[],
  type = "PRODUCT_OPTION",
): WixCustomization => ({
  id,
  name,
  renderType: "TEXT_CHOICES",
  customizationType: type,
  choiceCount: choiceNames.length,
  revision: "1",
  choices: choiceNames.map((n) => ({ choiceId: `${id}:${n}`, name: n })),
});

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

describe("planCustomizationPrune", () => {
  it("flaggar tomma PRODUCT_OPTION-hinkar för radering", () => {
    const custs = [withChoices("a", "Färg", ["Röd"]), withChoices("b", "Länd", [])];
    const plan = planCustomizationPrune(custs, new Map([["a", new Set(["a:Röd"])]]));
    expect(plan.emptyToDelete.map((e) => e.name)).toEqual(["Länd"]);
  });

  it("identifierar föräldralösa val (ej i bruk) men behåller använda", () => {
    const cust = withChoices("storlek", "Storlek", ["S", "M", "L"]);
    const usage: ChoiceUsage = new Map([["storlek", new Set(["storlek:S", "storlek:L"])]]); // M oanvänd
    const plan = planCustomizationPrune([cust], usage);
    expect(plan.totalOrphanChoices).toBe(1);
    expect(plan.choicePrunes[0].orphanNames).toEqual(["M"]);
    expect(plan.choicePrunes[0].keepCount).toBe(2);
  });

  it("ingen prune när alla val är i bruk", () => {
    const cust = withChoices("f", "Färg", ["Röd", "Blå"]);
    const usage: ChoiceUsage = new Map([["f", new Set(["f:Röd", "f:Blå"])]]);
    const plan = planCustomizationPrune([cust], usage);
    expect(plan.choicePrunes).toHaveLength(0);
    expect(plan.emptyToDelete).toHaveLength(0);
  });

  it("hink utan användnings-post → ALLA dess val räknas som föräldralösa", () => {
    // (Hela hinken oanvänd — t.ex. efter att produkterna strippats.)
    const cust = withChoices("x", "Variant", ["a", "b"]);
    const plan = planCustomizationPrune([cust], new Map());
    expect(plan.totalOrphanChoices).toBe(2);
  });

  it("exkluderar MODIFIER", () => {
    const cust = withChoices("g", "Gravyr", ["Text1"], "MODIFIER");
    const plan = planCustomizationPrune([cust], new Map());
    expect(plan.choicePrunes).toHaveLength(0);
    expect(plan.emptyToDelete).toHaveLength(0);
  });
});

describe("executePrune (dry-run)", () => {
  it("dry-run muterar inget men rapporterar vad som SKULLE tas bort", async () => {
    const plan = planCustomizationPrune(
      [withChoices("s", "Storlek", ["S", "M"]), withChoices("e", "Tom", [])],
      new Map([["s", new Set(["s:S"])]]),
    );
    const r = await executePrune(plan, { dryRun: true });
    expect(r.dryRun).toBe(true);
    expect(r.emptyDeleted).toBe(1); // skulle radera "Tom"
    expect(r.choicesRemoved).toBe(1); // skulle ta bort "M"
    expect(r.failures).toHaveLength(0);
  });
});
