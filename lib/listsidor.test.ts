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
    // Kategorisidan skickar dessutom sina måttfilter (lib/spec-config.ts).
    assert.ok(sb.includes(`{...listaForSidan(list, ${nyckel}`), sb);
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
  assert.match(route, /const dagMs = currentDayMs\(\);\s*const lista = await listaFor\(nyckel, dagMs\);/);
  // Bara bilder för det som kan synas direkt — resten ur bildkartan.
  // Plus kategorins måttnycklar, räknade med samma funktion som sidan.
  assert.match(route, /forListClient\(lista, dagMs, specNycklar\)/);
  assert.match(route, /const specNycklar = await specNycklarFor\(nyckel\);/);
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
  // Innan listan kommit visas sidans kort, eller de första korten i den valda
  // ordningen när sidan bär dem (lista.toppar).
  assert.match(src, /if \(!alla\) return toppLista \?\? products;/);
  // Utan filter i URL:en förhämtas listan först när webbläsaren är ledig.
  assert.match(src, /requestIdleCallback\(\(\) => hamtaLista\(\)/);
  assert.match(src, /if \(!arStandard\) \{ hamtaLista\(\); return; \}/);
  // Allt som kräver listan begär den — även reglagen, som på dator syns utan
  // att filterknappen rörs.
  assert.match(src, /useEffect\(\(\) => \{\s*if \(behoverLista && !listaFel\) hamtaLista\(\);/);
  // Tre misslyckade försök lämnar inte kunden i ett låst läge.
  assert.match(src, /listaFel && behoverLista && \(/);
});

test("korta listor skickas hela i sidan, utan hämtning", () => {
  const lib = readFileSync("lib/list-pages.ts", "utf8");
  assert.match(lib, /if \(ordnad\.length <= FORSTA_KORT\) return \{ products: forClient\(ordnad, undefined, nycklar\), \.\.\.medFacetter \};/);
  // Långa listor: sidans första kort bär inga mått — de följer med /api/lista.
  assert.match(lib, /const forsta = ordnad\.slice\(0, FORSTA_KORT\);\s*return \{\s*products: forClient\(forsta\),/);
});

test("långa listor bär de första korten i varje annan sortering (Nyast laddade länge)", () => {
  // Leonards rapport 2026-10-14: "Nyast" tog 3,1 s på en mobil (4G, 4×
  // långsammare processor), eftersom rutnätet väntade på hela listan.
  const lib = readFileSync("lib/list-pages.ts", "utf8");
  // Sidan räknar topparna med samma funktion som webbläsaren, på listan i
  // klientform, och skickar med de produkter i dem den inte redan bär.
  assert.match(lib, /\.\.\.topparFor\(ordnad, new Set\(forsta\.map\(\(p\) => p\.slug\)\)\),/);
  assert.match(lib, /const klient = forClient\(ordnad\);\s*const toppar = topparPerSortering\(klient, universalCollectionIds\(klient\), currentDayMs\(\), TOPP_KORT, "img"\);/);
  assert.match(lib, /extra: forClient\(ordnad\.filter\(\(p\) => behovs\.has\(p\.slug\)\)\)/);

  const src = readFileSync("components/shopbrowser.tsx", "utf8");
  // Rutnätet och sidan delar sorteringen och valen.
  assert.match(src, /out = sorteraLista\(out, sort, universalCollectionIds\(alla\), dayMs\);/);
  assert.match(src, /const SORTS = SORTERINGAR\.map\(\(v\) => \(\{ v, label: ETIKETTER\[v\] \}\)\);/);
  assert.doesNotMatch(src, /function sortera\(/, "en egen sortering i komponenten hade glidit isär från sidans");
  // En annan sortering utan filter visar topplistan direkt, och listan
  // behövs först när kunden vill se fler kort än den.
  assert.match(src, /const sidansKort = arStandard \? products\.length : toppLista \? toppLista\.length : 0;/);
  assert.match(src, /const behoverLista = !!lista && !alla && shown > sidansKort;/);
  // Korten kunden redan ser står kvar när listan kommer, som i standardläget.
  assert.match(src, /\} else if \(toppLista\) \{\s*\/\/[^\n]*\n\s*const forst = new Set\(toppLista\.map\(\(p\) => p\.slug\)\);\s*out = \[\.\.\.toppLista, \.\.\.out\.filter\(\(p\) => !forst\.has\(p\.slug\)\)\];/);
});

test("ShopBrowser: sammanfattningen, inte de första korten, styr filterpanelen", () => {
  const src = readFileSync("components/shopbrowser.tsx", "utf8");
  assert.match(src, /ov \? ov\.bounds : priceBounds\(products\)/);
  assert.match(src, /ov \? ov\.hist : prisHistogram\(products, bounds\)/);
  assert.match(src, /ov \? ov\.farger\.map\(\(\[k\]\) => k\) : fargNycklar\(products\)/);
  assert.match(src, /ov \? ov\.harSlutsalda : products\.some/);
});

test("ShopBrowser hydreras med serverns kort (ingen useSearchParams)", () => {
  // useSearchParams på en statisk sida ger BAILOUT_TO_CLIENT_SIDE_RENDERING:
  // React kastar serverns kort och ritar nya, och LCP-bilden syntes först
  // efter 6,9 s i Lighthouse (mobil, /kategori/mobler, 2026-10-01). Adressen
  // läses i stället efter monteringen.
  const src = readFileSync("components/shopbrowser.tsx", "utf8").replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(src, /\buseSearchParams\s*\(/);
  assert.match(src, /window\.location\.search/);
});

test("ShopBrowser: vyn med tom adress skriver inte bort parametrarna innan den byts ut", () => {
  // Bakåt till /alla-produkter?sortera=new efter två "Visa fler" gav 24 kort
  // och sidfoten (Leonard 2026-10-14). Den första vyn ritas med tom adress och
  // byts ut när adressen har parametrar, men dess URL-effekt hann tömma
  // adressen, och den nya vyn letade då efter listläget under fel nyckel.
  const src = readFileSync("components/shopbrowser.tsx", "utf8").replace(/\/\/.*$/gm, "");
  // URL-effekten: från `useEffect(() => {` till dess replaceState.
  const slut = src.indexOf('window.history.replaceState(null, "", url)');
  assert.ok(slut > 0, "URL-effekten finns");
  const effekt = src.slice(src.lastIndexOf("useEffect(() => {", slut), slut);
  assert.match(effekt, /^useEffect\(\(\) => \{\s*if \(bytsUt\?\.current\) return;/, "vakten först i URL-effekten");
  // Föräldern sätter flaggan innan den byter vy, och bara den första vyn får den.
  assert.match(src, /bytsUt\.current = true;\s*(?:\/\*[\s\S]*?\*\/\s*)?setAdress\(\{ sp: q, n: 1 \}\)/);
  assert.match(src, /bytsUt=\{adress\.n === 0 \? bytsUt : undefined\}/);
});
