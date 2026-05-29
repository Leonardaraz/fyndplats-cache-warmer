import { describe, expect, it } from "vitest";
import { compareSites, type CompareEntry } from "./compare";

const entries: CompareEntry[] = [
  {
    url: "https://min.se/",
    overall: 70,
    categories: [
      { category: "accessibility", label: "Tillgänglighet (EAA)", score: 60 },
      { category: "seo", label: "SEO & teknik", score: 80 },
    ],
  },
  {
    url: "https://konkurrent.se/",
    overall: 85,
    categories: [
      { category: "accessibility", label: "Tillgänglighet (EAA)", score: 90 },
      { category: "seo", label: "SEO & teknik", score: 80 },
    ],
  },
];

describe("compareSites", () => {
  it("ranks by overall score, best first", () => {
    const r = compareSites(entries);
    expect(r.ranking[0].url).toBe("https://konkurrent.se/");
    expect(r.ranking[0].rank).toBe(1);
    expect(r.ranking[1].rank).toBe(2);
  });

  it("finds the leader per category", () => {
    const r = compareSites(entries);
    const a11y = r.byCategory.find((c) => c.category === "accessibility")!;
    expect(a11y.leader).toBe("https://konkurrent.se/");
    expect(a11y.scores).toHaveLength(2);
  });

  it("handles a single site", () => {
    const r = compareSites([entries[0]]);
    expect(r.ranking).toHaveLength(1);
    expect(r.ranking[0].rank).toBe(1);
  });
});
