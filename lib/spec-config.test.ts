// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Kategoriernas måttfilter: arv nedåt, egna namn, och att hela sortimentet
// (alla, rea, populära) aldrig får måttfilter.

import { test } from "node:test";
import assert from "node:assert/strict";
import { facetterFor, KONFIGURERADE } from "./spec-config.ts";

test("egen rad vinner, med kategorins namn på filtret", () => {
  const f = facetterFor("vaxthus-odling", ["trädgård-utemöbler"]);
  assert.deepEqual(f.slice(0, 2), [{ nyckel: "b", namn: "Längd" }, { nyckel: "d", namn: "Bredd" }]);
});

test("underkategori utan egen rad ärver närmaste förälder", () => {
  assert.deepEqual(facetterFor("okand-underkategori", ["mobler"]).map((f) => f.nyckel), ["b", "d", "h", "sh", "ml", "m"]);
});

test("hela sortimentet får inga måttfilter", () => {
  for (const s of ["all-products", "rea", "populara"]) assert.deepEqual(facetterFor(s), []);
  assert.deepEqual(facetterFor("finns-inte"), []);
});

test("stolar frågar efter sitthöjd först", () => {
  assert.equal(facetterFor("fatoljer")[0].nyckel, "sh");
  assert.equal(facetterFor("kontorsstolar")[0].nyckel, "sh");
});

test("inga dubbletter i någon rad", () => {
  for (const s of KONFIGURERADE) {
    const k = facetterFor(s).map((f) => f.nyckel);
    assert.equal(new Set(k).size, k.length, s);
  }
});
