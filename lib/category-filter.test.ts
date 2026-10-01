// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Leonards rapport 2026-08-16: startsidan och /alla-produkter visade
// "0 kategorier", och det kom och gick mellan sidladdningar. Kategorimenyns
// tom-filter byggs ur produkternas collectionIds — saknades de sållades ALLA
// kategorier bort, och resultatet cachades i lambdan.

import test from "node:test";
import assert from "node:assert/strict";
import { categorySignalIsUsable, keepCategory, medForaldrar } from "./category-filter.ts";

test("signalen är oanvändbar när ingen produkt bär kategori", () => {
  assert.equal(categorySignalIsUsable(0), false);
  assert.equal(categorySignalIsUsable(1), true);
  assert.equal(categorySignalIsUsable(44), true);
});

test("utan signal visas ALLA kategorier — menyn får aldrig blankas", () => {
  const tom = new Set<string>();
  for (const id of ["husdjur", "hem", "vad-som-helst"]) {
    assert.equal(keepCategory(id, tom), true);
  }
});

test("med signal döljs bara de kategorier som faktiskt saknar produkter", () => {
  const used = new Set(["husdjur", "hem"]);
  assert.equal(keepCategory("husdjur", used), true);
  assert.equal(keepCategory("hem", used), true);
  assert.equal(keepCategory("tom-kategori", used), false);
});

// Nödkatalogen (products.json) har alltid collectionIds: [] — exakt det läge
// som blankade menyn under Wix-avbrottet.
test("nödkatalogens tomma collectionIds blankar inte navigationen", () => {
  const usedFrånNödkatalog = new Set<string>();
  assert.equal(keepCategory("friluftsliv-resa", usedFrånNödkatalog), true);
});

test("en avdelning utan egna produkter visas när en underkategori har produkter (Jul & Högtider 2026-10-01)", () => {
  const kategorier = [
    { id: "jul", parentId: null },
    { id: "julgranar", parentId: "jul" },
    { id: "verktyg", parentId: null },
    { id: "tom-under", parentId: "verktyg" },
  ];
  const used = medForaldrar(new Set(["julgranar"]), kategorier);
  assert.equal(keepCategory("jul", used), true);
  assert.equal(keepCategory("julgranar", used), true);
  // En förälder vars enda underkategori är tom visas inte.
  assert.equal(keepCategory("verktyg", used), false);
  // Indata lämnas orörd.
  assert.equal(new Set(["julgranar"]).has("jul"), false);
});
