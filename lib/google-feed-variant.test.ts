// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Google-flödet ska skicka VARIANTENS bild och länka till varianten
// (2026-09-27). Flödet och produktsidan är route/TSX och går inte att köra i
// node --test, så provet läser källan — samma grepp som lib/meganav-ssr.test.ts.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const feed = readFileSync("app/feed/google.xml/route.ts", "utf8");
const pdp = readFileSync("components/productview.tsx", "utf8");

test("flödet tar bilden ur valens bilder före variantens media", () => {
  // v.media är produktens huvudbild på varje variant — får aldrig stå först.
  assert.match(feed, /const image: string = bildForVariant\(v\?\.optionChoices, valbilder\) \|\| v\?\.media\?\.image\?\.url \|\| mainImg;/);
  assert.match(feed, /const valbilderPerProdukt = await fetchVariantImageMaps\(\);/);
  assert.match(feed, /valbilderPerProdukt\.get\(pid\)/);
});

test("flödets länk öppnar varianten när det finns fler än en", () => {
  assert.match(feed, /\$\{SITE\}\/produkt\/\$\{slug\}\?variant=\$\{encodeURIComponent\(variantId\)\}/);
  assert.match(feed, /<g:link>\$\{xmlEscape\(link\)\}<\/g:link>/);
  assert.match(feed, /\(antalVarianter\.get\(pid\) \?\? 0\) > 1/);
});

test("produktsidan förväljer varianten ur ?variant=", () => {
  assert.match(pdp, /new URLSearchParams\(window\.location\.search\)\.get\("variant"\)/);
  // Alla tre väljarlägena: flera axlar, bildval och textval.
  assert.match(pdp, /table\.find\(\(t\) => t\.variantId === vid\)/);
  assert.match(pdp, /imageChoices\.findIndex\(\(c\) => c\.variantId === vid\)/);
  assert.match(pdp, /variants\.findIndex\(\(v\) => v\.id === vid\)/);
});
