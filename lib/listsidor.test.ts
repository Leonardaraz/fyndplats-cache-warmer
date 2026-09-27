// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Listsidornas två invarianter (se lib/list-pages.ts):
//
// 1. KORTEN I HTML:EN ÄR DE KUNDEN SER. Uppmätt 2026-09-27 skickade
//    kategorisidorna sina produkter i katalogordning medan ShopBrowser sorterade
//    om dem på "Rekommenderat" i webbläsaren: på /kategori/husdjur stod 0 av 24
//    kort kvar när sidan laddat klart. Varje listsida ska därför ordna listan
//    med ordnaLista och skicka samma dag (dayMs) till ShopBrowser.
//
// 2. HELA LISTAN LIGGER INTE I SIDAN. Den var 1 300 kB av /alla-produkter och
//    734 kB av /kategori/hem-inredning; Bing flaggade båda som över 1 MB. Sidan
//    bär de första korten (listaForSidan) och ShopBrowser hämtar resten.
//
// Sidorna och komponenten är TSX och går inte att rendera med node --test, så
// provet läser källan — samma grepp som lib/meganav-ssr.test.ts.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SIDOR = {
  "app/alla-produkter/page.tsx": '"alla"',
  "app/rea/page.tsx": '"rea"',
  "app/kategori/[slug]/page.tsx": "`kategori/${active.slug}`",
};

for (const [fil, nyckel] of Object.entries(SIDOR)) {
  const src = readFileSync(fil, "utf8");

  test(`${fil}: ordnar listan med samma dag som webbläsaren får`, () => {
    assert.match(src, /const dagMs = currentDayMs\(\);/);
    assert.match(src, /const list = await ordnaLista\(.*, dagMs\);/);
    const sb = src.match(/<ShopBrowser\b[^>]*\/>/g) ?? [];
    assert.equal(sb.length, 1, "en ShopBrowser per sida");
    assert.match(sb[0], /dayMs=\{dagMs\}/, "ShopBrowser måste få samma dag, annars sorteras rutnätet om vid laddning");
  });

  test(`${fil}: skickar bara början av listan`, () => {
    const sb = src.match(/<ShopBrowser\b[^>]*\/>/)![0];
    assert.ok(sb.includes(`{...listaForSidan(list, ${nyckel})}`), sb);
    assert.doesNotMatch(src, /forListClient|forClient\(/, "hela listan får inte gå ut i sidans HTML");
  });
}

test("kategorisidan sorterar inte om listan efter ordnaLista", () => {
  const src = readFileSync("app/kategori/[slug]/page.tsx", "utf8");
  // "De tre bästa bilderna först" var just det som skilde serverns ordning
  // från webbläsarens.
  assert.doesNotMatch(src, /topThree|topIds/);
});

test("/api/lista räknar samma lista som sidorna", () => {
  const route = readFileSync("app/api/lista/route.ts", "utf8");
  const lib = readFileSync("lib/list-pages.ts", "utf8");
  assert.match(route, /listaFor\(nyckel, currentDayMs\(\)\)/);
  assert.match(route, /Cache-Control/);
  // Samma urval som kategorisidan: kategoriProdukter + dedupeProducts + ordnaLista.
  assert.match(lib, /ordnaLista\(dedupeProducts\(kategoriProdukter\(active, collections, produkter\)\), dagMs\)/);
  const kat = readFileSync("app/kategori/[slug]/page.tsx", "utf8");
  assert.match(kat, /kategoriProdukter\(active, collections, products\)/);
  assert.match(kat, /ordnaLista\(dedupeProducts\(catList\), dagMs\)/);
});

test("ShopBrowser: sidans egna kort flyttas inte när hela listan kommer", () => {
  const src = readFileSync("components/shopbrowser.tsx", "utf8");
  // I standardläget står sidans kort först, i sin ordning.
  assert.match(src, /if \(lista && arStandard\) \{\s*const forst = new Set\(products\.map\(\(p\) => p\.slug\)\);\s*out = \[\.\.\.products, \.\.\.out\.filter\(\(p\) => !forst\.has\(p\.slug\)\)\];/);
  // Innan listan kommit visas sidans kort, inget annat.
  assert.match(src, /if \(!alla\) return products;/);
  // Utan filter i URL:en förhämtas listan först när webbläsaren är ledig.
  assert.match(src, /requestIdleCallback\(\(\) => hamtaLista\(\)/);
  assert.match(src, /if \(!arStandard\) \{ hamtaLista\(\); return; \}/);
});

test("ShopBrowser: sammanfattningen, inte de första korten, styr filterpanelen", () => {
  const src = readFileSync("components/shopbrowser.tsx", "utf8");
  assert.match(src, /ov \? ov\.bounds : priceBounds\(products\)/);
  assert.match(src, /ov \? ov\.hist : prisHistogram\(products, bounds\)/);
  assert.match(src, /ov \? ov\.farger\.map\(\(\[k\]\) => k\) : fargNycklar\(products\)/);
  assert.match(src, /ov \? ov\.harSlutsalda : products\.some/);
});
