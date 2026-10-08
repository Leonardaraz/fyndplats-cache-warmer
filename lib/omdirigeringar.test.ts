// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Omdirigeringarna i next.config.ts. Provet vaktar fyra saker:
//
// 1. INGA KEDJOR. En regel får inte peka på en adress som själv omdirigeras.
//    Kategoriflytten 2026-09-30 gjorde 41 av de äldre reglerna till kedjor
//    (gammal Wix-produkt → nedlagd kategori → ny kategori), och ingen märkte
//    det förrän Search Console-exporten 2026-10-08 följdes steg för steg.
//    Google följer kedjan men kostar två genomsökningar per adress.
// 2. INGA DUBBLETTER. Next tar första regeln som matchar, så en andra regel
//    för samma adress gör ingenting och ser ändå ut att göra något.
// 3. KODADE KÄLLOR. Next matchar source mot den URL-kodade sökvägen, så ett
//    "ö" rakt i en source matchar aldrig (se kommentaren i next.config.ts).
// 4. MÅLEN FINNS. Ett blogginlägg som pekas ut måste finnas, och de gamla
//    Wix-produkterna måste stå före wildcarden /product-page/:slug, annars
//    skickar den dem till en /produkt/-sida som svarar 404.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import nextConfig from "../next.config.ts";

const regler = await nextConfig.redirects!();
const exakta = (r: { source: string }) => !r.source.includes(":");
const vag = (mal: string) => mal.split("?")[0];

test("ingen regel pekar på en adress som själv omdirigeras", () => {
  const kallor = new Set(regler.filter(exakta).map((r) => r.source));
  const kedjor = regler
    .filter((r) => !r.destination.includes(":") && kallor.has(vag(r.destination)))
    .map((r) => `${r.source} → ${r.destination}`);
  assert.deepEqual(kedjor, []);
});

test("varje adress har högst en regel", () => {
  const sedda = new Set<string>();
  const dubbletter = regler.filter((r) => (sedda.has(r.source) ? true : (sedda.add(r.source), false)));
  assert.deepEqual(dubbletter.map((r) => r.source), []);
});

test("källorna är URL-kodade", () => {
  const okodade = regler.filter((r) => !/^[\x21-\x7e]+$/.test(r.source)).map((r) => r.source);
  assert.deepEqual(okodade, []);
});

test("bloggreglerna pekar på inlägg som finns", () => {
  for (const r of regler.filter((r) => r.destination.startsWith("/blogg/"))) {
    const slug = vag(r.destination).slice("/blogg/".length);
    assert.ok(existsSync(`content/blog/${slug}.md`), `${r.source} pekar på ${r.destination}, som saknas`);
  }
});

test("de gamla Wix-produkterna står före wildcarden", () => {
  const wildcard = regler.findIndex((r) => r.source === "/product-page/:slug");
  assert.ok(wildcard > 0, "saknar /product-page/:slug");
  const efter = regler.slice(wildcard + 1).filter((r) => r.source.startsWith("/product-page/"));
  assert.deepEqual(efter.map((r) => r.source), []);
});

test("nya regler ur Search Console 2026-10-08", () => {
  const mal = new Map(regler.map((r) => [r.source, r.destination]));
  assert.equal(mal.get("/kategori/barn-och-familj"), "/kategori/barn-familj");
  assert.equal(mal.get("/kategori/hemtextil-badrum"), "/kategori/badrum-hemtextil");
  assert.equal(mal.get("/kategori/kok-matlagning"), "/kategori/kok-husgerad");
  assert.equal(mal.get("/mobiltillbehor"), mal.get("/mobiltillbeh%C3%B6r"));
  assert.equal(
    mal.get("/post/bladl%C3%B6s-nackfl%C3%A4kt-2026-k%C3%B6pguide-test-och-3-saker-att-kolla"),
    "/blogg/bladlos-nackflakt-kopguide-2026",
  );
  // Kategorin finns inte, och regeln gav en 308 rakt in i en 404.
  assert.equal(mal.has("/smycken"), false);
  // Varor vi inte säljer får en ärlig 404 (granskningen 2026-09-24).
  for (const s of ["hogtalare", "laddare", "iphoneskal", "armband", "halsband", "datorvaska", "mobil-surfplatta"]) {
    assert.equal(mal.has(`/kategori/${s}`), false, `/kategori/${s} ska svara 404`);
  }
});
