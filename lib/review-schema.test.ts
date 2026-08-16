// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
//
// Recensionerna som visas är AliExpress-köpares omdömen om samma produkt. Att
// visa texten är ett beslut vi tagit; att skicka betyget som strukturerad data
// till Google är ett annat. Grinden håller isär dem.

import test from "node:test";
import assert from "node:assert/strict";
import { reviewSchemaMode, shouldEmitReviewSchema } from "./review-schema.ts";

test("default är AV — betyget skickas inte utan uttryckligt beslut", () => {
  assert.equal(reviewSchemaMode(undefined), "off");
  assert.equal(reviewSchemaMode(""), "off");
  assert.equal(reviewSchemaMode("off"), "off");
  // Allt som inte är exakt "on" räknas som av: en halvskriven env-variabel
  // ska inte råka publicera ett betygspåstående.
  assert.equal(reviewSchemaMode("true"), "off");
  assert.equal(reviewSchemaMode("1"), "off");
  assert.equal(reviewSchemaMode("ON!"), "off");
});

test("bara exakt on slår på den (skiftlägesokänsligt, tål blanksteg)", () => {
  assert.equal(reviewSchemaMode("on"), "on");
  assert.equal(reviewSchemaMode("ON"), "on");
  assert.equal(reviewSchemaMode("  On  "), "on");
});

test("av → inget aggregateRating ens när recensioner finns", () => {
  assert.equal(shouldEmitReviewSchema("off", 12, 4.8), false);
});

test("på → skickas när det finns riktig data", () => {
  assert.equal(shouldEmitReviewSchema("on", 12, 4.8), true);
  assert.equal(shouldEmitReviewSchema("on", 1, 5), true);
});

// Ett hårdkodat/tomt betyg är precis den review snippet-spam Google slår ner
// på — det gamla statiska 4.9/20 låg här en gång.
test("på men utan data → fortfarande inget påstående", () => {
  assert.equal(shouldEmitReviewSchema("on", 0, null), false);
  assert.equal(shouldEmitReviewSchema("on", 0, 4.9), false);
  assert.equal(shouldEmitReviewSchema("on", 5, null), false);
});
