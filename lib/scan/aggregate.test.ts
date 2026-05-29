import { describe, expect, it } from "vitest";
import { mergeCategoryPages } from "./aggregate";
import { buildCategory, type CategoryResult } from "./types";

function page(imgAltCount: number, extra?: string): CategoryResult[] {
  const a11y = buildCategory(
    "accessibility",
    "Tillgänglighet (EAA)",
    [{ id: "img-alt", title: "Bilder saknar alt-text", severity: "critical", ref: "WCAG 1.1.1", count: imgAltCount, examples: [`<img ${extra ?? ""}>`] }],
    13,
  );
  const seo = buildCategory("seo", "SEO & teknik", [], 7);
  return [a11y, seo];
}

describe("mergeCategoryPages", () => {
  it("sums counts for the same finding across pages", () => {
    const merged = mergeCategoryPages([page(2), page(3)]);
    const a11y = merged.find((c) => c.category === "accessibility")!;
    const imgAlt = a11y.findings.find((f) => f.id === "img-alt")!;
    expect(imgAlt.count).toBe(5);
  });

  it("preserves category order and includes empty categories", () => {
    const merged = mergeCategoryPages([page(1), page(1)]);
    expect(merged.map((c) => c.category)).toEqual(["accessibility", "seo"]);
    expect(merged.find((c) => c.category === "seo")!.findings).toHaveLength(0);
  });

  it("caps merged examples at 3", () => {
    const merged = mergeCategoryPages([page(1, "a"), page(1, "b"), page(1, "c"), page(1, "d")]);
    const imgAlt = merged[0].findings.find((f) => f.id === "img-alt")!;
    expect(imgAlt.examples.length).toBeLessThanOrEqual(3);
  });

  it("recomputes the score from the summed findings", () => {
    const single = mergeCategoryPages([page(1)]);
    const many = mergeCategoryPages([page(5), page(5)]);
    expect(many[0].score).toBeLessThanOrEqual(single[0].score);
  });

  it("returns empty for no pages", () => {
    expect(mergeCategoryPages([])).toEqual([]);
  });
});
