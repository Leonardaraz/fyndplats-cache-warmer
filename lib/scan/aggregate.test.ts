import { describe, expect, it } from "vitest";
import { mergeCategoryPages, type ScannedPage } from "./aggregate";
import { buildCategory } from "./types";

function page(url: string, imgAltCount: number, extra?: string): ScannedPage {
  const a11y = buildCategory(
    "accessibility",
    "Tillgänglighet (EAA)",
    [{ id: "img-alt", title: "Bilder saknar alt-text", severity: "critical", ref: "WCAG 1.1.1", count: imgAltCount, examples: [`<img ${extra ?? ""}>`] }],
    13,
  );
  const seo = buildCategory("seo", "SEO & teknik", [], 7);
  return { url, categories: [a11y, seo] };
}

describe("mergeCategoryPages", () => {
  it("sums counts for the same finding across pages", () => {
    const merged = mergeCategoryPages([page("https://x.se/", 2), page("https://x.se/a", 3)]);
    const a11y = merged.find((c) => c.category === "accessibility")!;
    const imgAlt = a11y.findings.find((f) => f.id === "img-alt")!;
    expect(imgAlt.count).toBe(5);
  });

  it("records the pages where a finding occurs", () => {
    const merged = mergeCategoryPages([page("https://x.se/", 1), page("https://x.se/kassa", 1)]);
    const imgAlt = merged[0].findings.find((f) => f.id === "img-alt")!;
    expect(imgAlt.pages).toEqual(["https://x.se/", "https://x.se/kassa"]);
  });

  it("preserves category order and includes empty categories", () => {
    const merged = mergeCategoryPages([page("https://x.se/", 1), page("https://x.se/a", 1)]);
    expect(merged.map((c) => c.category)).toEqual(["accessibility", "seo"]);
    expect(merged.find((c) => c.category === "seo")!.findings).toHaveLength(0);
  });

  it("caps merged examples at 3", () => {
    const merged = mergeCategoryPages([
      page("https://x.se/1", 1, "a"), page("https://x.se/2", 1, "b"),
      page("https://x.se/3", 1, "c"), page("https://x.se/4", 1, "d"),
    ]);
    const imgAlt = merged[0].findings.find((f) => f.id === "img-alt")!;
    expect(imgAlt.examples.length).toBeLessThanOrEqual(3);
  });

  it("recomputes the score from the summed findings", () => {
    const single = mergeCategoryPages([page("https://x.se/", 1)]);
    const many = mergeCategoryPages([page("https://x.se/", 5), page("https://x.se/a", 5)]);
    expect(many[0].score).toBeLessThanOrEqual(single[0].score);
  });

  it("returns empty for no pages", () => {
    expect(mergeCategoryPages([])).toEqual([]);
  });
});
