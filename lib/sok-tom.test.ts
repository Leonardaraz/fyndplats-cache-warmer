import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { populartNu } from "./sok-tom.ts";

const p = (slug: string, over: Record<string, unknown> = {}) => ({ slug, inStock: true, img: "bild.jpg", priceNum: 499, popularity: 0, imageScore: 0, createdAt: 0, ...over });

describe("populartNu", () => {
  it("mest sålda först, högst fyra", () => {
    const ut = populartNu([p("a", { popularity: 1 }), p("b", { popularity: 9 }), p("c", { popularity: 4 }), p("d", { popularity: 2 }), p("e", { popularity: 3 })]);
    assert.deepEqual(ut.map((x) => x.slug), ["b", "c", "e", "d"]);
  });

  it("aldrig en slutsåld vara, en utan bild eller en utan pris", () => {
    const ut = populartNu([
      p("slut", { popularity: 99, inStock: false }),
      p("utan-bild", { popularity: 98, img: "" }),
      p("utan-pris", { popularity: 97, priceNum: 0 }),
      p("kopbar", { popularity: 1 }),
    ]);
    assert.deepEqual(ut.map((x) => x.slug), ["kopbar"]);
  });

  it("vid lika försäljning: bättre bild, sedan nyare, sedan sluggen", () => {
    const ut = populartNu([p("z"), p("a"), p("ny", { createdAt: 5 }), p("fin", { imageScore: 3 })], 4);
    assert.deepEqual(ut.map((x) => x.slug), ["fin", "ny", "a", "z"]);
  });

  it("ändrar inte listan den får och tål en tom lista", () => {
    const lista = [p("a", { popularity: 1 }), p("b", { popularity: 2 })];
    populartNu(lista);
    assert.deepEqual(lista.map((x) => x.slug), ["a", "b"]);
    assert.deepEqual(populartNu([]), []);
    assert.deepEqual(populartNu(lista, 0), []);
  });
});

describe("söksidan utan träff", () => {
  const sida = readFileSync(join(import.meta.dirname, "..", "app", "sok", "page.tsx"), "utf8");

  it("visar vägar vidare, kategorier och populära varor", () => {
    assert.match(sida, /const tom = Boolean\(term\) && results\.length === 0;/);
    assert.match(sida, /populartNu\(all, 4\)/);
    assert.match(sida, /populara\(tree, MAIN_ORDER\)/);
    assert.match(sida, /className="nf-cats"/);
    assert.match(sida, /href="\/butik"/);
    assert.match(sida, /href="\/kontaktaoss"/);
  });

  it("läser menyn som 404-sidan, utan att fälla sidan om den saknas", () => {
    assert.match(sida, /try \{\s*const \{ tree \} = await sidhuvudsdata\(\);/);
    assert.match(sida, /\} catch \{/);
  });

  it("sidan är fortfarande noindex och har ingen länk i den svaga orange färgen", () => {
    assert.match(sida, /robots: \{ index: false, follow: true \}/);
    assert.doesNotMatch(sida, /var\(--orange\)/);
  });
});
