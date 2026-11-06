// Vad kassasidan visar (lib/kassa/vy.ts).
// Kör: node --test --experimental-strip-types lib/kassa/vy.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { visaTomKorg } from "./vy.ts";

const lugn = { rader: 0, korgVantas: false, kollar: false, skickar: false, klarVantar: false };

test("en korg utan varor är tom, också när den har ett id (efter köpet)", () => {
  // Leonards skärmbild 2026-11-06 14:21: formuläret och "Fri frakt" i en ny, tom korg.
  assert.equal(visaTomKorg(lugn), true);
});

test("varor, en korg som hämtas, en kontroll eller en betalning som pågår: inget tomt", () => {
  assert.equal(visaTomKorg({ ...lugn, rader: 1 }), false);
  assert.equal(visaTomKorg({ ...lugn, korgVantas: true }), false);
  assert.equal(visaTomKorg({ ...lugn, kollar: true }), false);
  assert.equal(visaTomKorg({ ...lugn, skickar: true }), false);
  assert.equal(visaTomKorg({ ...lugn, klarVantar: true }), false);
});
