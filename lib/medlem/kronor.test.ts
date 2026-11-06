// Medlemspriset som text (lib/medlem/kronor.ts): samma öre som kassan.

import { test } from "node:test";
import assert from "node:assert/strict";
import { kronorText } from "./kronor.ts";

test("hela kronor utan ören, annars med två decimaler och kommatecken", () => {
  assert.equal(kronorText(186_900), "1 869 kr");
  assert.equal(kronorText(183_162), "1 831,62 kr");
  assert.equal(kronorText(183_160), "1 831,60 kr");
  assert.equal(kronorText(5), "0,05 kr");
  assert.equal(kronorText(100), "1 kr");
  assert.equal(kronorText(0), "0 kr");
  assert.equal(kronorText(123_456_789), "1 234 567,89 kr");
});

test("bara hela, positiva ören", () => {
  for (const fel of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) assert.throws(() => kronorText(fel), /ogiltigt belopp/);
});
