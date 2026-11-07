// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Policyvarorna som aldrig skickas i Google-flödet (lib/google-uteslutna.ts).
import test from "node:test";
import assert from "node:assert/strict";
import { GOOGLE_UTESLUTNA, uteslutenFranGoogle } from "./google-uteslutna.ts";

test("cigarettmaskinen och PCP-pumpen är uteslutna, på produktens id", () => {
  assert.equal(uteslutenFranGoogle("f31eb0a5-5267-40fd-b193-a5adbebfb5d0"), true);
  assert.equal(uteslutenFranGoogle("975c9daf-d3da-4c9b-911b-7c21e48f27e2"), true);
  assert.equal(GOOGLE_UTESLUTNA.size, 2);
});

test("andra produkter, varianternas id och tomma värden släpps igenom", () => {
  assert.equal(uteslutenFranGoogle("207ce9e9-b2a1-47e3-9e3d-abf4c443e303"), false, "väggkaminen");
  // Variant-id (g:id) för en av cigarettmaskinens varianter: nyckeln är produktens.
  assert.equal(uteslutenFranGoogle("342975a2-fb4e-41ee-baf7-71247723b26d"), false);
  assert.equal(uteslutenFranGoogle(""), false);
  assert.equal(uteslutenFranGoogle(null), false);
  assert.equal(uteslutenFranGoogle(undefined), false);
});

test("varje utesluten produkt har ett skäl", () => {
  for (const [id, skal] of GOOGLE_UTESLUTNA) {
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    assert.match(skal, /^(tobak|vapendelar): /);
  }
});
