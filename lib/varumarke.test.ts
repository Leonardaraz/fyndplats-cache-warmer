// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
import test from "node:test";
import assert from "node:assert/strict";
import { BUTIKENS_MARKE, varumarke } from "./varumarke.ts";

test("en riktig märkesvara behåller sitt märke", () => {
  assert.equal(varumarke("Naturehike"), "Naturehike");
  assert.equal(varumarke("Baseus"), "Baseus");
  assert.equal(varumarke(" IMILAB "), "IMILAB");
});

test("☠️ Aosoms märken blir Fyndplats (white label, Leonard 2026-10-06)", () => {
  for (const m of ["HOMCOM", "homcom", "HOMCOM®", "Outsunny", "PawHut", "AIYAPLAY", "SPORTNOW", "Vinsetto", "kleankin", "DURHAND", "ZONEKIZ", "Aosom"]) {
    assert.equal(varumarke(m), BUTIKENS_MARKE, m);
  }
});

test("utan märke i Wix blir det Fyndplats — inget gissas", () => {
  assert.equal(varumarke(undefined), BUTIKENS_MARKE);
  assert.equal(varumarke(null), BUTIKENS_MARKE);
  assert.equal(varumarke("  "), BUTIKENS_MARKE);
  assert.equal(varumarke("Fyndplats"), BUTIKENS_MARKE);
});
