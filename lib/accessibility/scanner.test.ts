import { describe, expect, it } from "vitest";
import { evaluateHtml, normalizeUrl } from "./scanner";

const GOOD = `<!doctype html><html lang="sv"><head><title>Min butik</title>
<meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body><h1>Välkommen</h1>
<img src="a.jpg" alt="En produkt">
<a href="/produkter">Se alla produkter</a>
<label for="q">Sök</label><input id="q" type="text">
<button>Köp nu</button></body></html>`;

const BAD = `<html><head></head><body>
<img src="a.jpg"><img src="b.jpg">
<a href="/x">klicka här</a>
<button></button>
<input type="text" name="q">
<meta name="viewport" content="width=device-width, user-scalable=no"></body></html>`;

describe("normalizeUrl", () => {
  it("adds https:// when scheme is missing", () => {
    expect(normalizeUrl("dinbutik.se")).toBe("https://dinbutik.se/");
  });
  it("keeps an explicit scheme", () => {
    expect(normalizeUrl("http://x.se/path")).toBe("http://x.se/path");
  });
  it("rejects garbage", () => {
    expect(() => normalizeUrl("not a url at all !!")).toThrow();
  });
});

describe("evaluateHtml", () => {
  it("gives a clean page a high score and no issues", () => {
    const r = evaluateHtml("https://x.se", GOOD);
    expect(r.issues).toHaveLength(0);
    expect(r.score).toBe(100);
    expect(r.grade).toBe("A");
  });

  it("detects the major WCAG problems on a bad page", () => {
    const r = evaluateHtml("https://x.se", BAD);
    const ids = r.issues.map((i) => i.id).sort();
    expect(ids).toContain("img-alt");
    expect(ids).toContain("html-lang");
    expect(ids).toContain("doc-title");
    expect(ids).toContain("link-text");
    expect(ids).toContain("button-name");
    expect(ids).toContain("meta-viewport");
    expect(ids).toContain("page-h1");
    expect(r.score).toBeLessThan(70);
  });

  it("counts multiple missing-alt images", () => {
    const r = evaluateHtml("https://x.se", BAD);
    const imgAlt = r.issues.find((i) => i.id === "img-alt");
    expect(imgAlt?.count).toBe(2);
  });

  it("sorts the most severe issues first", () => {
    const r = evaluateHtml("https://x.se", BAD);
    expect(r.issues[0].severity).toBe("critical");
  });
});
