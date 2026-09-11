// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
import test from "node:test";
import assert from "node:assert/strict";
import {
  categoryTier,
  categoryIndexable,
  categoryInSitemap,
  categoryInMainNav,
} from "./category-threshold.ts";

test("banden följer åtgärdslistans gränser", () => {
  assert.equal(categoryTier(0), "tom");
  assert.equal(categoryTier(1), "tunn");
  assert.equal(categoryTier(4), "tunn");
  assert.equal(categoryTier(5), "bedom");
  assert.equal(categoryTier(9), "bedom");
  assert.equal(categoryTier(10), "full");
  assert.equal(categoryTier(2326), "full");
});

test("skräpvärden faller till tom, inte till full", () => {
  // En trasig räkning ska tysta kategorin, inte släppa in den i index.
  assert.equal(categoryTier(Number.NaN), "tom");
  assert.equal(categoryTier(-3), "tom");
  // Infinity är inte finit och faller därför också till "tom". Det är rätt väg
  // att falla: ett trasigt värde ska tysta kategorin, inte släppa in den.
  assert.equal(categoryTier(Infinity), "tom");
});

test("de fyra tunna kategorierna på skarp katalog tystas", () => {
  // Mobiltillbehör 1, Pälsvård & Skötsel 1, Väskor & Necessärer 1,
  // Mode & Accessoarer 3 — mätt på /butik 2026-09-10.
  for (const n of [1, 1, 1, 3]) {
    assert.equal(categoryIndexable(n), false);
    assert.equal(categoryInSitemap(n), false);
    assert.equal(categoryInMainNav(n), false);
  }
});

test("5–9 rör vi inte — det är ett omdöme, inte en tröskel", () => {
  // Laddare & Kablar har sex produkter och är ett självklart sökord. Att
  // noindexa den automatiskt vore att fatta beslutet åt Leonard.
  for (const n of [5, 6, 7, 9]) {
    assert.equal(categoryIndexable(n), true, `${n} ska förbli indexerbar`);
    assert.equal(categoryInMainNav(n), true);
  }
});

test("sitemap och robots säger alltid samma sak", () => {
  // Att lista en sida i sitemapen och samtidigt noindexa den är att be Google
  // hämta något vi inte vill ha indexerat.
  for (let n = 0; n <= 30; n++) {
    assert.equal(categoryInSitemap(n), categoryIndexable(n), `divergerar vid ${n}`);
  }
});

// ── Att regeln faktiskt ANVÄNDS, inte bara finns ────────────────────────────
import { readFileSync } from "node:fs";

test("sitemapen, kategorisidan och navigationen läser den delade regeln", () => {
  // Tre ytor avgör om en kategori syns: sitemapen listar den, kategorisidans
  // robots-tagg släpper in den i index, navigationen visar den. Sa de olika
  // saker skulle vi lista en sida i sitemapen som vi samtidigt noindexar.
  const ytor: [string, string][] = [
    ["lib/site-urls.ts", "categoryInSitemap"],
    ["app/kategori/[slug]/page.tsx", "categoryIndexable"],
    ["lib/category-groups.ts", "categoryInMainNav"],
  ];
  const bad: string[] = [];
  for (const [fil, fn] of ytor) {
    const t = readFileSync(fil, "utf8");
    if (!t.includes(fn)) bad.push(`${fil} anropar inte ${fn}()`);
    if (!/category-threshold/.test(t)) bad.push(`${fil} importerar inte regeln`);
  }
  assert.deepEqual(bad, []);
});

test("ingen yta bär en egen tröskelsiffra", () => {
  // Skrivs gränsen in på plats driver den isär vid första justeringen — samma
  // fel som "1 produkter" på sjutton ytor och returtexten på tio.
  const bad: string[] = [];
  for (const fil of ["lib/site-urls.ts", "app/kategori/[slug]/page.tsx", "lib/category-groups.ts"]) {
    const t = readFileSync(fil, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/(^|[^:])\/\/.*$/gm, "$1 ");
    for (const m of t.match(/count[^\n]{0,30}[<>]=?\s*(?:[1-9]|10)\b/gi) || []) {
      if (/> 0\b/.test(m)) continue; // "finns alls" är inte en SEO-tröskel
      bad.push(`${fil}: ${m.trim()}`);
    }
  }
  assert.deepEqual(bad, []);
});

test("båda navigationsbyggarna räknar huvud + underkategorier", () => {
  // DET HÄR ÄR FELET JAG GJORDE. Tröskelfiltret läste counts.get(id) — antalet
  // produkter som ligger DIREKT i huvud-kollektionen — medan siffran som visas
  // räknar huvudkategorin PLUS dess underkategorier. En huvudkategori med två
  // produkter direkt och tvåhundra i sina underkategorier hade försvunnit ur
  // navigationen.
  //
  // Repot hade redan lärt sig det här. buildGroupCards bär en kommentar från
  // re-auditen 2026-05-31: "Huvudkategorins antal MÅSTE räknas på samma sätt
  // som buildCategoryTree ... inte bara de som ligger direkt i huvud-
  // kollektionen. Annars driftar siffran." Jag gick rakt in i den ändå.
  //
  // Provet är på källnivå: lib/category-groups.ts importerar Wix-SDK:n via
  // ./products och går inte att ladda i node-testköraren. Ett beteendeprov
  // skulle kräva att urvalsregeln bryts ut till en beroendefri modul, som
  // programmatic-select.ts. Det är rätt nästa steg, men inte en audit-fix.
  const src = readFileSync("lib/category-groups.ts", "utf8");
  const anrop = src.match(/categoryInMainNav\([^)]*\)/g) || [];
  assert.equal(anrop.length, 2, `förväntade två anrop (mega-nav + /butik-rutnät), fann ${anrop.length}`);
  for (const a of anrop) {
    assert.equal(
      /counts\.get/.test(a),
      false,
      `${a} läser den DIREKTA siffran; den ska läsa huvud+sub (totalt()/mainCount())`,
    );
    assert.equal(
      /totalt\(|mainCount\(/.test(a),
      true,
      `${a} måste räkna huvudkategorin plus dess underkategorier`,
    );
  }
});

test("tröskeln gäller all huvudnavigation, inte bara mega-menyn", () => {
  // Mitt första försök ändrade bara buildCategoryTree. /butik-rutnätet och
  // startsidans kategorirad byggs av buildGroupCards, som jag inte rörde — så
  // "Mode & Accessoarer" stod kvar som huvudkort med tre produkter bakom sig,
  // och min verifiering påstod motsatsen.
  const src = readFileSync("lib/category-groups.ts", "utf8");
  const tree = src.slice(src.indexOf("export function buildCategoryTree"), src.indexOf("export function buildGroupCards"));
  const cards = src.slice(src.indexOf("export function buildGroupCards"));
  assert.ok(/categoryInMainNav\(/.test(tree), "buildCategoryTree (mega-nav) saknar tröskeln");
  assert.ok(/categoryInMainNav\(/.test(cards), "buildGroupCards (/butik + startsida) saknar tröskeln");
});
