import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { iRutansForm, unsplashIForm, wixIForm } from "./bildformat.ts";

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

// Köpguidernas omslag (1200 × 630) i startsidans ruta på 4:3 (2026-11-25).
describe("wixIForm", () => {
  const OMSLAG = "https://static.wixstatic.com/media/b379ce_7f1149cab8664706a7fc9275fccd4df2~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85/leksakskok-kopguide.jpg";

  it("ett brett omslag kortas på bredden till rutans form, höjden står kvar", () => {
    assert.equal(
      wixIForm(OMSLAG, "4:3"),
      "https://static.wixstatic.com/media/b379ce_7f1149cab8664706a7fc9275fccd4df2~mv2.jpg/v1/fill/w_840,h_630,al_c,q_85/leksakskok-kopguide.jpg",
    );
  });

  it("en för hög bild kortas på höjden, och måtten växer aldrig", () => {
    const hog = "https://static.wixstatic.com/media/b379ce_abc~mv2.jpg/v1/fill/w_600,h_900,al_c,q_80/file.webp";
    assert.equal(wixIForm(hog, "4:3"), "https://static.wixstatic.com/media/b379ce_abc~mv2.jpg/v1/fill/w_600,h_450,al_c,q_80/file.webp");
    for (const url of [OMSLAG, hog]) {
      const [, w, h] = wixIForm(url, "4:3").match(/w_(\d+),h_(\d+)/)!.map(Number);
      const [, w0, h0] = url.match(/w_(\d+),h_(\d+)/)!.map(Number);
      assert.ok(w <= w0 && h <= h0);
      assert.ok(Math.abs(w / h - 4 / 3) < 0.01);
    }
  });

  it("en bild som redan har rutans form är orörd", () => {
    const ratt = "https://static.wixstatic.com/media/b379ce_abc~mv2.jpg/v1/fill/w_560,h_420,al_c,q_72/file.webp";
    assert.equal(wixIForm(ratt, "4:3"), ratt);
  });

  it("en naken adress får en fill i rutans form, längsta sidan 1200 px", () => {
    const naken = "https://static.wixstatic.com/media/b379ce_abc~mv2.jpg";
    assert.equal(wixIForm(naken, "1:1"), `${naken}/v1/fill/w_1200,h_1200,al_c,q_72/file.webp`);
    assert.equal(wixIForm(naken, "4:3"), `${naken}/v1/fill/w_1200,h_900,al_c,q_72/file.webp`);
    assert.equal(wixIForm(naken, "3:4"), `${naken}/v1/fill/w_900,h_1200,al_c,q_72/file.webp`);
    assert.equal(wixIForm(`${naken}/`, "1:1"), `${naken}/v1/fill/w_1200,h_1200,al_c,q_72/file.webp`);
  });

  it("ett brett omslag blir en kvadrat för bloggkortet", () => {
    assert.match(wixIForm(OMSLAG, "1:1"), /\/v1\/fill\/w_630,h_630,al_c,q_85\/leksakskok-kopguide\.jpg$/);
  });

  it("lämnar allt annat orört: beskärning, fit, lokala filer och Unsplash", () => {
    for (const url of [
      "https://static.wixstatic.com/media/b379ce_abc~mv2.jpg/v1/crop/x_44,y_0,w_1512,h_1512/fill/w_600,h_600,al_c,q_72/file.webp",
      "https://static.wixstatic.com/media/b379ce_abc~mv2.jpg/v1/fit/w_800,h_800,q_80/file.webp",
      "https://static.wixstatic.com/media/b379ce_abc~mv2.jpg?x=1",
      "/blog-eu-tull-2026.jpg",
      "https://www.fyndplats.se/blog-medlemskap.jpg",
      UNSPLASH,
      "",
    ]) assert.equal(wixIForm(url, "4:3"), url);
  });

  it("iRutansForm tar båda källorna", () => {
    assert.match(iRutansForm(OMSLAG, "4:3"), /\/fill\/w_840,h_630,/);
    assert.equal(new URL(iRutansForm(UNSPLASH, "4:3")).searchParams.get("ar"), "4:3");
    assert.equal(iRutansForm("/blog-eu-tull-2026.jpg", "4:3"), "/blog-eu-tull-2026.jpg");
  });

  it("bloggkorten ber om en kvadrat, och sizes är rutans bredd i rutnätet", () => {
    const sida = readFileSync(join(import.meta.dirname, "..", "app", "blogg", "page.tsx"), "utf8");
    assert.match(sida, /<Image src=\{iRutansForm\(p\.cover, "1:1"\)\} alt=\{p\.alt \|\| p\.title\} fill sizes="\(max-width:540px\) calc\( 100vw - 52px\), \(max-width:900px\) calc\( 50vw - 36px\), \(max-width:1179px\) calc\( 25vw - 28px\), 267px"/);
    // 267 px, inte kortens 265: bloggkortet har ingen ram (app/globals.css). Med
    // 265 hade en fil på 265 px valts och förstorats i en ruta på 267.
    const css = readFileSync(join(import.meta.dirname, "..", "app", "globals.css"), "utf8");
    assert.match(css, /\.prod:not\(\.auction-card\):not\(\.blogg-kort\) \.pimg\{border:1px solid/);
    // Inläggets egen sida visar omslaget i dess egen form och går inte hit.
    const inlagg = readFileSync(join(import.meta.dirname, "..", "app", "blogg", "[slug]", "page.tsx"), "utf8");
    assert.doesNotMatch(inlagg, /iRutansForm|wixIForm/);
  });

  it("guidekorten på startsidan ber om omslaget i rutans form", () => {
    const rad = readFileSync(join(import.meta.dirname, "..", "components", "guide-karusell.tsx"), "utf8");
    assert.match(rad, /<Image src=\{iRutansForm\(g\.cover, "4:3"\)\} alt="" fill sizes="\(max-width:880px\) 78vw, 362px" \/>/);
    // Rutan är 4:3 (app/startsida.css eller app/globals.css): annars stämmer inte formen.
    const css = ["app/globals.css", "app/startsida.css"].map((f) => { try { return readFileSync(join(import.meta.dirname, "..", f), "utf8"); } catch { return ""; } }).join("\n");
    assert.match(css, /\.guide-bild\{[^}]*aspect-ratio:4\s*\/\s*3/);
  });
});
