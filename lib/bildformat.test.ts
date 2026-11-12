import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { unsplashIForm } from "./bildformat.ts";

const UNSPLASH = "https://images.unsplash.com/photo-1538307602205-80b5c2ff26ec?q=80&w=1600&h=1280&fit=crop&crop=center&auto=format";

describe("unsplashIForm", () => {
  it("ber Unsplash beskära till rutans form", () => {
    const u = new URL(unsplashIForm(UNSPLASH, "4:3"));
    assert.equal(u.searchParams.get("ar"), "4:3");
    assert.equal(u.searchParams.get("fit"), "crop");
    // Samma utsnitt som object-fit:cover: mitten av fotot.
    assert.equal(u.searchParams.get("crop"), "center");
  });

  it("sätter fit=crop också när adressen hade ett annat fit, annars gäller inte ar", () => {
    const u = new URL(unsplashIForm("https://images.unsplash.com/photo-1?w=800&fit=max", "4:3"));
    assert.equal(u.searchParams.get("fit"), "crop");
  });

  it("lämnar andra bilder orörda", () => {
    for (const url of [
      "https://static.wixstatic.com/media/b379ce_abc~mv2.jpg/v1/fill/w_800,h_800/file.webp",
      "https://www.fyndplats.se/blog-medlemskap.jpg",
      "/blog-eu-tull-2026.jpg",
      "",
    ]) assert.equal(unsplashIForm(url, "4:3"), url);
  });

  it("bildladdaren låter formen vara: den byter bara bredd, kvalitet och format och tar bort h", () => {
    // Laddaren går inte att importera här (dess egna importer saknar filändelse),
    // så provet läser dess Unsplash-gren.
    const laddare = readFileSync(join(import.meta.dirname, "image-loader.ts"), "utf8");
    const start = laddare.indexOf('src.includes("images.unsplash.com")');
    const gren = laddare.slice(start, laddare.indexOf("return src;", start));
    assert.ok(start > 0 && gren.length > 50, "hittar inte Unsplash-grenen i lib/image-loader.ts");
    assert.doesNotMatch(gren, /searchParams\.(set|delete)\("(ar|fit|crop)"/);
    assert.match(gren, /searchParams\.delete\("h"\)/);
  });
});
