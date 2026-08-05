// lib/related-products.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Vaktar urvalslogiken för "Liknande produkter" (pickRelated): kuraterade LLM-val
// först, meningsfullt kategori-överlapp som fallback, och — det audit:en 2026-07
// hittade — att den universella "All Products"-kategorin INTE räknas som "samma
// kategori" (annars blir varje produkt relaterad till varenda annan).

import test from "node:test";
import assert from "node:assert/strict";
import { pickRelated, universalCollectionIds, sharedCategoryCount } from "./related-pick.ts";
import type { Product } from "./products.ts";

// Minimal produkt — bara fälten pickRelated läser (resten stubbas).
function mk(slug: string, collectionIds: string[], inStock = true): Product {
  return { slug, collectionIds, inStock, id: slug, name: slug } as unknown as Product;
}

// Katalog: 11 cykel + 11 telefon, ALLA i den universella "ALL"-kategorin.
function catalog(): Product[] {
  const out: Product[] = [];
  for (let i = 0; i < 11; i++) out.push(mk(`bike-${i}`, ["ALL", "bike"]));
  for (let i = 0; i < 11; i++) out.push(mk(`phone-${i}`, ["ALL", "phone"]));
  return out;
}

test("universalCollectionIds hittar den katalogtäckande kategorin", () => {
  const uni = universalCollectionIds(catalog());
  assert.ok(uni.has("ALL"));
  assert.ok(!uni.has("bike"));
  assert.ok(!uni.has("phone"));
});

test("sharedCategoryCount ignorerar universella kategorier", () => {
  const uni = new Set(["ALL"]);
  const a = mk("a", ["ALL", "bike"]);
  const bikeB = mk("b", ["ALL", "bike"]);
  const phoneC = mk("c", ["ALL", "phone"]);
  assert.equal(sharedCategoryCount(a, bikeB, uni), 1); // delar "bike"
  assert.equal(sharedCategoryCount(a, phoneC, uni), 0); // delar bara "ALL" → 0
});

test("fallback: bara samma MENINGSFULLA kategori (inte via universell)", () => {
  const all = catalog();
  const p = all[0]; // bike-0
  const related = pickRelated(p, all, [], 4);
  assert.equal(related.length, 4);
  assert.ok(related.every((r) => r.slug.startsWith("bike-")), "alla ska vara cykel-produkter");
  assert.ok(related.every((r) => r.slug !== p.slug), "aldrig produkten själv");
});

test("kuraterade val används först, i ordning", () => {
  const all = catalog();
  const p = all[0]; // bike-0
  // Kurera två telefoner (annan kategori) — de ska ändå komma FÖRST.
  const related = pickRelated(p, all, ["phone-3", "phone-7"], 4);
  assert.equal(related[0].slug, "phone-3");
  assert.equal(related[1].slug, "phone-7");
  // Resten fylls på med cykel-fallback.
  assert.ok(related.slice(2).every((r) => r.slug.startsWith("bike-")));
  assert.equal(related.length, 4);
});

test("slutsålda kuraterade val hoppas över", () => {
  const all = catalog();
  all.push(mk("phone-oos", ["ALL", "phone"], false)); // slutsåld
  const p = all[0];
  const related = pickRelated(p, all, ["phone-oos", "phone-2"], 4);
  assert.ok(!related.some((r) => r.slug === "phone-oos"), "slutsåld kuraterad ska ej med");
  assert.equal(related[0].slug, "phone-2");
});

test("okänd/borttagen kuraterad slug ignoreras", () => {
  const all = catalog();
  const p = all[0];
  const related = pickRelated(p, all, ["finns-inte", "phone-1"], 4);
  assert.equal(related[0].slug, "phone-1");
  assert.ok(!related.some((r) => r.slug === "finns-inte"));
});

test("produkten själv och dubbletter exkluderas", () => {
  const all = catalog();
  const p = all[0]; // bike-0
  const related = pickRelated(p, all, ["bike-0", "bike-1", "bike-1"], 4);
  const slugs = related.map((r) => r.slug);
  assert.ok(!slugs.includes("bike-0"), "aldrig sig själv även om kurerad");
  assert.equal(new Set(slugs).size, slugs.length, "inga dubbletter");
});

test("respekterar limit; kan returnera färre (anroparen grindar på ≥2)", () => {
  const all = catalog();
  const p = all[0];
  assert.equal(pickRelated(p, all, [], 4).length, 4);
  assert.equal(pickRelated(p, all, [], 2).length, 2);
  // Produkt helt utan meningsfull kategori och utan kuraterade → tom.
  const lonely = mk("lonely", ["ALL"]);
  const all2 = [...all, lonely];
  assert.equal(pickRelated(lonely, all2, []).length, 0);
});

test("fallback föredrar i-lager vid lika kategori-överlapp", () => {
  const all = [
    mk("p", ["ALL", "bike"]),
    mk("oos", ["ALL", "bike"], false),
    mk("instock", ["ALL", "bike"], true),
    ...Array.from({ length: 20 }, (_, i) => mk(`filler-${i}`, ["ALL", "misc"])),
  ];
  const related = pickRelated(all[0], all, [], 4);
  // Bara "instock" och "oos" delar "bike"; i-lager ska rankas först.
  assert.equal(related[0].slug, "instock");
});

// 2026-08-04: fallback-påfyllningen sorterade slutsålda sist men tog ändå med
// dem när överlappet var tunt → PDP:n tipsade om varor man inte kan köpa.
test("fallback föreslår ALDRIG en slutsåld produkt", () => {
  const all = [
    mk("bike-0", ["ALL", "bike"]),
    mk("bike-slut", ["ALL", "bike"], false),
    mk("bike-1", ["ALL", "bike"]),
  ];
  const rel = pickRelated(mk("bike-mig", ["ALL", "bike"]), all, []);
  assert.ok(!rel.some((p) => !p.inStock), "slutsåld produkt slank in i förslagen");
  assert.deepEqual(rel.map((p) => p.slug).sort(), ["bike-0", "bike-1"]);
});

test("hellre färre förslag än ett som inte går att köpa", () => {
  const all = [mk("bike-0", ["ALL", "bike"]), mk("bike-slut", ["ALL", "bike"], false)];
  const rel = pickRelated(mk("bike-mig", ["ALL", "bike"]), all, [], 4);
  assert.equal(rel.length, 1);
});
