import { describe, expect, it } from "vitest";
import { extractInternalLinks } from "./crawl";

const HTML = `<html><body>
  <a href="/">Hem</a>
  <a href="/produkt/troja">Tröja</a>
  <a href="/kategori/herr">Herr</a>
  <a href="/kassa">Kassa</a>
  <a href="/om-oss">Om</a>
  <a href="https://annan.se/extern">Extern</a>
  <a href="mailto:a@b.se">Mejl</a>
  <a href="#topp">Topp</a>
  <a href="/broschyr.pdf">PDF</a>
  <a href="/produkt/troja#recensioner">Dup med fragment</a>
</body></html>`;

describe("extractInternalLinks", () => {
  it("keeps only internal, non-file, non-anchor links", () => {
    const links = extractInternalLinks(HTML, "https://butik.se/", 10);
    expect(links.some((l) => l.includes("annan.se"))).toBe(false);
    expect(links.some((l) => l.includes("mailto"))).toBe(false);
    expect(links.some((l) => l.endsWith(".pdf"))).toBe(false);
    expect(links.some((l) => l.includes("#"))).toBe(false);
  });

  it("excludes the homepage itself and dedupes", () => {
    const links = extractInternalLinks(HTML, "https://butik.se/", 10);
    expect(links).not.toContain("https://butik.se");
    expect(new Set(links).size).toBe(links.length);
  });

  it("prioritises product/category/checkout pages and respects max", () => {
    const links = extractInternalLinks(HTML, "https://butik.se/", 3);
    expect(links).toHaveLength(3);
    expect(links.join(" ")).toMatch(/produkt|kategori|kassa/);
    expect(links.join(" ")).not.toMatch(/om-oss/); // lägre prioritet, faller utanför topp 3
  });

  it("resolves relative URLs to absolute on the same host", () => {
    const links = extractInternalLinks(HTML, "https://butik.se/", 10);
    for (const l of links) expect(l.startsWith("https://butik.se/")).toBe(true);
  });

  it("returns empty for an invalid base url", () => {
    expect(extractInternalLinks(HTML, "inte en url")).toEqual([]);
  });
});
