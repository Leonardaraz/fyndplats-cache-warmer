import { describe, expect, it } from "vitest";
import { REMEDIATION, remediationFor } from "./remediation";

// Alla regel-id som scannern/analysmodulerna kan returnera.
const RULE_IDS = [
  // accessibility
  "img-alt", "html-lang", "doc-title", "link-text", "button-name",
  "meta-viewport", "page-h1", "input-label", "iframe-title", "empty-link",
  "media-autoplay", "positive-tabindex", "multiple-h1",
  "duplicate-ids", "heading-skip", "table-no-headers", "video-no-captions",
  // seo
  "no-https", "meta-description", "title-length", "no-canonical",
  "no-opengraph", "robots-noindex", "no-favicon",
  // aeo
  "no-structured-data", "no-semantic-html", "thin-content", "weak-headings", "no-faq",
  "no-robots", "blocks-ai-crawlers", "no-sitemap", "no-llms-txt",
  // performance
  "img-no-dimensions", "img-no-lazy", "render-blocking-js", "large-dom", "no-charset",
];

describe("remediation knowledge base", () => {
  it("has an entry for every scanner rule id", () => {
    for (const id of RULE_IDS) {
      expect(REMEDIATION[id], `saknar åtgärd för ${id}`).toBeDefined();
      expect(REMEDIATION[id].why.length).toBeGreaterThan(10);
      expect(REMEDIATION[id].fix.length).toBeGreaterThan(10);
    }
  });

  it("falls back gracefully for an unknown id", () => {
    const r = remediationFor("something-new");
    expect(r.why.length).toBeGreaterThan(0);
    expect(r.fix.length).toBeGreaterThan(0);
    expect(r.effort).toBe("medel");
  });
});
