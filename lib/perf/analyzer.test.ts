import { describe, expect, it } from "vitest";
import { analyzePerformance } from "./analyzer";

describe("analyzePerformance", () => {
  it("passes a well-optimised page", () => {
    const html = `<html><head><meta charset="utf-8">
      <script src="/a.js" defer></script></head><body>
      <img src="1.jpg" width="100" height="100" loading="lazy">
      <img src="2.jpg" width="100" height="100" loading="lazy">
      <img src="3.jpg" width="100" height="100" loading="lazy"></body></html>`;
    const r = analyzePerformance(html);
    expect(r.category).toBe("performance");
    expect(r.findings).toHaveLength(0);
  });

  it("flags missing dimensions, no lazy, render-blocking js and missing charset", () => {
    const html = `<html><head><script src="/a.js"></script></head><body>
      <img src="1.jpg"><img src="2.jpg"><img src="3.jpg"></body></html>`;
    const ids = analyzePerformance(html).findings.map((f) => f.id);
    expect(ids).toContain("img-no-dimensions");
    expect(ids).toContain("img-no-lazy");
    expect(ids).toContain("render-blocking-js");
    expect(ids).toContain("no-charset");
  });

  it("does not flag render-blocking for async/defer scripts", () => {
    const html = `<html><head><meta charset="utf-8">
      <script src="/a.js" async></script></head><body></body></html>`;
    const ids = analyzePerformance(html).findings.map((f) => f.id);
    expect(ids).not.toContain("render-blocking-js");
  });

  it("flags a very large HTML document", () => {
    const big = "<p>x</p>".repeat(25000); // > 150 kB
    const html = `<html><head><meta charset="utf-8"></head><body>${big}</body></html>`;
    const ids = analyzePerformance(html).findings.map((f) => f.id);
    expect(ids).toContain("large-dom");
  });
});
