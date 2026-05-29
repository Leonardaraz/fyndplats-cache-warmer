import { describe, expect, it } from "vitest";
import { analyzeSeo } from "./analyzer";

const GOOD = `<html lang="sv"><head><title>Min butik – tröjor online</title>
<meta name="description" content="Vi säljer sköna tröjor i hög kvalitet till bra pris.">
<link rel="canonical" href="https://x.se/">
<link rel="icon" href="/favicon.ico">
<meta property="og:title" content="Min butik">
<meta property="og:image" content="https://x.se/og.png">
</head><body><h1>x</h1></body></html>`;

describe("analyzeSeo", () => {
  it("passes a well-optimised page", () => {
    const r = analyzeSeo(GOOD, "https://x.se/");
    expect(r.category).toBe("seo");
    expect(r.findings).toHaveLength(0);
    expect(r.grade).toBe("A");
  });

  it("flags missing meta description, canonical, og and favicon", () => {
    const html = `<html><head><title>Min butik online idag</title></head><body></body></html>`;
    const ids = analyzeSeo(html, "https://x.se/").findings.map((f) => f.id);
    expect(ids).toContain("meta-description");
    expect(ids).toContain("no-canonical");
    expect(ids).toContain("no-opengraph");
    expect(ids).toContain("no-favicon");
  });

  it("flags http (no https)", () => {
    const ids = analyzeSeo(GOOD, "http://x.se/").findings.map((f) => f.id);
    expect(ids).toContain("no-https");
  });

  it("flags noindex as critical", () => {
    const html = `<html><head><title>Butiken min online</title>
      <meta name="robots" content="noindex,follow"></head><body></body></html>`;
    const f = analyzeSeo(html, "https://x.se/").findings.find((x) => x.id === "robots-noindex");
    expect(f?.severity).toBe("critical");
  });
});
