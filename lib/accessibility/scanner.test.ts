import { describe, expect, it } from "vitest";
import { evaluateHtml, normalizeUrl, stripNonContent } from "./scanner";

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

  it("flags iframes without a title", () => {
    const html = `<html lang="sv"><head><title>x</title></head><body><h1>x</h1>
      <iframe src="https://maps.example"></iframe></body></html>`;
    const r = evaluateHtml("https://x.se", html);
    expect(r.issues.map((i) => i.id)).toContain("iframe-title");
  });

  it("accepts an iframe that has a title", () => {
    const html = `<html lang="sv"><head><title>x</title></head><body><h1>x</h1>
      <iframe src="https://maps.example" title="Karta"></iframe></body></html>`;
    const r = evaluateHtml("https://x.se", html);
    expect(r.issues.map((i) => i.id)).not.toContain("iframe-title");
  });

  it("flags an icon link with no discernible text", () => {
    const html = `<html lang="sv"><head><title>x</title></head><body><h1>x</h1>
      <a href="/cart"><img src="cart.svg"></a></body></html>`;
    const r = evaluateHtml("https://x.se", html);
    const ids = r.issues.map((i) => i.id);
    // img saknar alt -> img-alt; länken saknar urskiljbar text -> empty-link
    expect(ids).toContain("empty-link");
  });

  it("does not flag an icon link whose image has alt text", () => {
    const html = `<html lang="sv"><head><title>x</title></head><body><h1>x</h1>
      <a href="/cart"><img src="cart.svg" alt="Varukorg"></a></body></html>`;
    const r = evaluateHtml("https://x.se", html);
    expect(r.issues.map((i) => i.id)).not.toContain("empty-link");
  });

  it("flags autoplay media and positive tabindex", () => {
    const html = `<html lang="sv"><head><title>x</title></head><body><h1>x</h1>
      <video src="v.mp4" autoplay></video>
      <div tabindex="3">x</div></body></html>`;
    const ids = evaluateHtml("https://x.se", html).issues.map((i) => i.id);
    expect(ids).toContain("media-autoplay");
    expect(ids).toContain("positive-tabindex");
  });

  it("ignores markup inside <script>, <style> and comments (no false positives)", () => {
    const html = `<html lang="sv"><head><title>x</title>
      <style>a::before{content:"klicka här"}</style>
      <script>const html='<img src=x>'; const t='<a href=#>klicka här</a>';</script>
      </head><body><h1>x</h1>
      <!-- <img src="ignored.jpg"> <button></button> -->
      <p>Riktigt innehåll</p></body></html>`;
    const ids = evaluateHtml("https://x.se", html).issues.map((i) => i.id);
    expect(ids).not.toContain("img-alt");
    expect(ids).not.toContain("link-text");
    expect(ids).not.toContain("button-name");
  });

  it("detects duplicate ids, heading skips, headerless tables and uncaptioned video", () => {
    const html = `<html lang="sv"><head><title>x</title></head><body>
      <h1>A</h1><h3>Hopp</h3>
      <div id="dup"></div><div id="dup"></div>
      <table><tr><td>1</td></tr></table>
      <video src="v.mp4"></video></body></html>`;
    const ids = evaluateHtml("https://x.se", html).issues.map((i) => i.id);
    expect(ids).toContain("duplicate-ids");
    expect(ids).toContain("heading-skip");
    expect(ids).toContain("table-no-headers");
    expect(ids).toContain("video-no-captions");
  });

  it("does not flag a clean heading order, th table or captioned video", () => {
    const html = `<html lang="sv"><head><title>x</title></head><body>
      <h1>A</h1><h2>B</h2>
      <table><tr><th>H</th></tr><tr><td>1</td></tr></table>
      <video src="v.mp4"><track kind="captions" src="c.vtt"></video></body></html>`;
    const ids = evaluateHtml("https://x.se", html).issues.map((i) => i.id);
    expect(ids).not.toContain("duplicate-ids");
    expect(ids).not.toContain("heading-skip");
    expect(ids).not.toContain("table-no-headers");
    expect(ids).not.toContain("video-no-captions");
  });

  it("stripNonContent removes script/style/comments", () => {
    const out = stripNonContent(`a<script>X</script>b<style>Y</style>c<!--Z-->d`);
    expect(out).not.toMatch(/X|Y|Z/);
    expect(out).toMatch(/a.*b.*c.*d/s);
  });

  it("flags multiple h1 but allows tabindex=0 and -1", () => {
    const html = `<html lang="sv"><head><title>x</title></head><body>
      <h1>A</h1><h1>B</h1>
      <div tabindex="0">x</div><div tabindex="-1">y</div></body></html>`;
    const ids = evaluateHtml("https://x.se", html).issues.map((i) => i.id);
    expect(ids).toContain("multiple-h1");
    expect(ids).not.toContain("positive-tabindex");
  });
});
