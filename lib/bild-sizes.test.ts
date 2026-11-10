// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// `sizes` ska säga hur bred bilden VISAS. Provet räknar bredden ur layoutens
// egna tal (marginaler, mellanrum, antal kolumner i app/globals.css) och
// jämför med vad strängarna i lib/bild-sizes.ts ger, och väljer sedan
// srcset-kandidat som en webbläsare gör. En för liten bredd ger en suddig
// bild, en för stor en onödigt tung fil.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { HERO_SIZES, TILE_SIZES, kortSizes } from "./bild-sizes.ts";

/** Bredden en webbläsare läser ur `sizes` vid en viss skärmbredd. */
function visad(sizes: string, vw: number): number {
  const langd = (uttryck: string) => {
    const js = uttryck
      .replace(/calc/g, "")
      .replace(/([\d.]+)vw/g, (_, n) => String((vw * Number(n)) / 100))
      .replace(/([\d.]+)px/g, "$1");
    assert.match(js, /^[\d\s.()*+\-/]+$/, uttryck);
    return Function(`"use strict";return (${js})`)() as number;
  };
  for (const del of sizes.split(",").map((s) => s.trim())) {
    const m = del.match(/^\(max-width:(\d+)px\)\s+(.*)$/);
    if (!m) return langd(del);
    if (vw <= Number(m[1])) return langd(m[2]);
  }
  throw new Error("ingen gren utan villkor");
}

// Nexts kandidater (deviceSizes och imageSizes, next/dist/shared/lib/image-config.js).
const KANDIDATER = [32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];
const vald = (sizes: string, vw: number, dpr: number) => KANDIDATER.find((k) => k >= visad(sizes, vw) * dpr - 0.5)!;

// Layoutens tal (app/globals.css).
const MARGINAL = 52; // .container: 26 px på var sida
const nara = (a: number, b: number, vad: string) => assert.ok(Math.abs(a - b) < 0.75, `${vad}: ${a} mot ${b}`);

test("hjältebilden: sidans bredd minus marginalen på mobil, 544 px på dator", () => {
  for (const vw of [360, 390, 414, 430, 760]) nara(visad(HERO_SIZES, vw), vw - MARGINAL, `hjälte ${vw}`);
  assert.equal(visad(HERO_SIZES, 1440), 544);
  // Datorkolumnen: (1180 − marginal − 40 px mellanrum) / 2.
  assert.equal((1180 - MARGINAL - 40) / 2, 544);
});

test("bildrutorna: 36 % av galleriets bredd på mobil (.gtile)", () => {
  for (const vw of [360, 390, 430]) nara(visad(TILE_SIZES, vw), (vw - MARGINAL) * 0.36, `ruta ${vw}`);
  assert.equal(visad(TILE_SIZES, 1440), 180);
});

test("kortet: rutnätets kolumnbredd i varje brytpunkt", () => {
  // .prodgrid.listgrid upp till 540 px: 12 px kant och 10 px mellanrum.
  for (const vw of [360, 390, 414, 540]) nara(visad(kortSizes(true), vw), (vw - 24 - 10) / 2, `två kort ${vw}`);
  // Ett kort i full bredd.
  nara(visad(kortSizes(false), 390), 390 - MARGINAL, "ett kort 390");
  // Två kort med 20 px mellanrum, upp till 900 px.
  for (const vw of [600, 768, 900]) nara(visad(kortSizes(true), vw), (vw - MARGINAL - 20) / 2, `två kort ${vw}`);
  // Fyra kort med 20 px mellanrum, upp till 1180 px, och sedan fast bredd.
  for (const vw of [1000, 1180]) nara(visad(kortSizes(true), vw), (vw - MARGINAL - 60) / 4, `fyra kort ${vw}`);
  for (const vw of [1181, 1440, 1920, 2560]) assert.equal(visad(kortSizes(true), vw), (1180 - MARGINAL - 60) / 4);
});

test("webbläsaren väljer en mindre fil än med hela skärmens bredd, aldrig en för liten", () => {
  // iPhone 390 px i 3x: hjälten 1080w (förut 1200w), bildrutorna 384w (förut 640w).
  assert.equal(vald(HERO_SIZES, 390, 3), 1080);
  assert.equal(vald("(max-width:760px) 100vw, (max-width:1180px) 45vw, 544px", 390, 3), 1200);
  assert.equal(vald(TILE_SIZES, 390, 3), 384);
  assert.equal(vald("(max-width:760px) 38vw, (max-width:1180px) 15vw, 180px", 390, 3), 640);
  // Telefon 414 px i 2x och en bred dator i 1x: kortet 384w (förut 640w).
  assert.equal(vald(kortSizes(true), 414, 2), 384);
  assert.equal(vald(kortSizes(true), 1920, 1), 384);
  assert.equal(vald("(max-width:540px) 50vw, (max-width:900px) 50vw, 25vw", 414, 2), 640);
  assert.equal(vald("(max-width:540px) 50vw, (max-width:900px) 50vw, 25vw", 1920, 1), 640);
  // Aldrig färre pixlar än rutan gånger skärmens täthet.
  for (const [vw, dpr] of [[360, 2], [390, 3], [412, 2.625], [414, 2], [430, 3], [768, 2], [1440, 1], [1440, 2], [1920, 1]] as const) {
    for (const [namn, s] of [["hjälte", HERO_SIZES], ["ruta", TILE_SIZES], ["kort", kortSizes(true)], ["kort ensam", kortSizes(false)]] as const) {
      assert.ok(vald(s, vw, dpr) >= Math.floor(visad(s, vw) * dpr), `${namn} ${vw}@${dpr}`);
    }
  }
});

test("de första korten hämtas med hög prioritet (next/image sätter den inte själv)", () => {
  // Listsidornas största bild är första kortets. `priority` ger förladdning och
  // eager, men inte fetchpriority=high: på /kategori/fatoljer stod fyra
  // förladdningslänkar utan attributet, och bilderna köade efter skripten.
  const kort = readFileSync(new URL("../components/card-gallery.tsx", import.meta.url), "utf8");
  assert.match(kort, /priority=\{priority\}[\s\S]{0,600}fetchPriority=\{priority \? "high" : undefined\}/);
});

test("Next hittar en vw-term i varje sträng och stryker de minsta kandidaterna", () => {
  // Samma regex som next/dist/shared/lib/get-img-props.js. Minsta termen
  // avgör vilka kandidater som skrivs ut, och den ska vara som förut.
  const minst = (s: string) => Math.min(...[...s.matchAll(/(^|\s)(1?\d?\d)vw/g)].map((m) => Number(m[2])));
  assert.equal(minst(HERO_SIZES), 45);
  assert.equal(minst(TILE_SIZES), 15);
  assert.equal(minst(kortSizes(true)), 25);
  assert.equal(minst(kortSizes(false)), 25);
});
