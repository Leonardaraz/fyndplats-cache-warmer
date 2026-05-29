import { describe, expect, it } from "vitest";
import { eaaRisk, impactOf, quickWins } from "./prioritize";
import { buildCategory, type CategoryResult } from "./types";

const categories: CategoryResult[] = [
  buildCategory("accessibility", "Tillgänglighet (EAA)", [
    // img-alt = critical (15) × 4 = 60, effort låg (1) → score 60 (toppen)
    { id: "img-alt", title: "alt", severity: "critical", count: 4, examples: [] },
    // video-no-captions = serious (8) × 1 = 8, effort hög (3) → score ~2.7
    { id: "video-no-captions", title: "video", severity: "serious", count: 1, examples: [] },
  ], 17),
  buildCategory("seo", "SEO & teknik", [
    // meta-description = serious (8) × 1, effort låg (1) → score 8
    { id: "meta-description", title: "meta", severity: "serious", count: 1, examples: [] },
  ], 7),
];

describe("impactOf", () => {
  it("is severity weight times count", () => {
    expect(impactOf({ id: "x", title: "", severity: "critical", count: 2, examples: [] })).toBe(30);
  });
});

describe("quickWins", () => {
  it("ranks highest impact-per-effort first", () => {
    const wins = quickWins(categories, 3);
    expect(wins[0].finding.id).toBe("img-alt");
    expect(wins[0].categoryLabel).toBe("Tillgänglighet (EAA)");
  });
  it("respects the max", () => {
    expect(quickWins(categories, 1)).toHaveLength(1);
  });
});

describe("eaaRisk", () => {
  it("maps score to a risk level", () => {
    expect(eaaRisk(95)).toBe("Låg");
    expect(eaaRisk(65)).toBe("Medel");
    expect(eaaRisk(30)).toBe("Hög");
  });
});
