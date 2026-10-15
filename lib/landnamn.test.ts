// lib/landnamn.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).

import test from "node:test";
import assert from "node:assert/strict";
import { landnamn } from "./landnamn.ts";

test("en svensk adress visar Sverige, inte landskoden", () => {
  assert.equal(landnamn("SE", "Sverige"), "Sverige");
  assert.equal(landnamn("SE"), "Sverige");
  assert.equal(landnamn("se", "Sweden"), "Sverige");
});

test("andra länder visas som förut", () => {
  assert.equal(landnamn("NO", "Norge"), "NO");
  assert.equal(landnamn(undefined, "Danmark"), "Danmark");
});

test("inget land ger ingen rad", () => {
  assert.equal(landnamn(), undefined);
  assert.equal(landnamn("", " "), undefined);
});
