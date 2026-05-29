import { describe, expect, it } from "vitest";
import { analyzeAeo } from "./analyzer";

describe("analyzeAeo", () => {
  it("passes an AI-friendly page", () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@type":"FAQPage"}</script>
      </head><body>
      <header>h</header><nav>n</nav>
      <main><article>
        <h2>Om oss</h2><h2>Frakt</h2>
        <p>${"Lång och innehållsrik text om butiken. ".repeat(30)}</p>
      </article></main></body></html>`;
    const r = analyzeAeo(html);
    expect(r.category).toBe("aeo");
    expect(r.findings).toHaveLength(0);
  });

  it("flags missing structured data, semantics, thin content, weak headings, no faq", () => {
    const html = `<html><head></head><body><div>Kort.</div></body></html>`;
    const ids = analyzeAeo(html).findings.map((f) => f.id);
    expect(ids).toContain("no-structured-data");
    expect(ids).toContain("no-semantic-html");
    expect(ids).toContain("thin-content");
    expect(ids).toContain("weak-headings");
    expect(ids).toContain("no-faq");
  });

  it("does not count ld+json inside content as thin when text is long", () => {
    const html = `<html><head>
      <script type="application/ld+json">{"@type":"Product"}</script></head>
      <body><main><article><h2>a</h2><h2>b</h2>
      <p>${"Mycket text. ".repeat(60)}</p></article></main></body></html>`;
    const ids = analyzeAeo(html).findings.map((f) => f.id);
    expect(ids).not.toContain("no-structured-data");
    expect(ids).not.toContain("thin-content");
  });
});
