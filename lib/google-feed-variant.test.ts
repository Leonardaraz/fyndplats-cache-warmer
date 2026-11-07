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
  // Storlekens bild hoppas över som huvudbild (måttritningen, 2026-11-07).
  assert.match(feed, /const image: string = bildForVariant\(v\?\.optionChoices, valbilder, \{ utanStorlek: true \}\) \|\| v\?\.media\?\.image\?\.url \|\| mainImg;/);
  assert.match(feed, /const valbilderPerProdukt = await fetchVariantImageMaps\(\);/);
  assert.match(feed, /valbilderPerProdukt\.get\(pid\)/);
});

test("storlekens bild blir första extrabild, inte borttappad", () => {
  assert.match(feed, /const storleksbild = bildForVariant\(v\?\.optionChoices, valbilder\);/);
  assert.match(feed, /const additional = \[storleksbild, \.\.\.gallery\]/);
});

test("policyvarorna skickas inte till Google", () => {
  assert.match(feed, /import \{ uteslutenFranGoogle \} from "@\/lib\/google-uteslutna";/);
  assert.match(feed, /if \(uteslutenFranGoogle\(pd\.productId\)\) return null;/);
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

test("färgfiltret: kortet visar den filtrerade färgen och produktsidan öppnar på den", () => {
  const browser = readFileSync("components/shopbrowser.tsx", "utf8");
  const products = readFileSync("lib/products.ts", "utf8");
  // Kortet byter till färgens bild och länkar med ?farg=.
  assert.match(browser, /p\.fargBild\[k\]/);
  assert.match(browser, /\?farg=\$\{encodeURIComponent\(k\)\}/);
  // fargBild följer med listan oavsett medBild (bara produkter med färgval har den).
  assert.match(products, /if \(p\.fargBild\) \{/);
  // Produktsidan läser ?farg= och väljer ett val i lager med den färgen.
  assert.match(pdp, /get\("farg"\)/);
  assert.match(pdp, /colorKeysOf\(text\)\.has\(nyckel\)/);
});
