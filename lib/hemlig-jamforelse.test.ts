// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
import test from "node:test";
import assert from "node:assert/strict";
import { sammaHemlighet, bearerVarde } from "./hemlig-jamforelse.ts";

test("lika hemligheter släpps igenom, olika inte", () => {
  assert.equal(sammaHemlighet("abc123", "abc123"), true);
  assert.equal(sammaHemlighet("abc124", "abc123"), false);
  assert.equal(sammaHemlighet("abc", "abc123"), false);
});

test("☠️ en osatt eller tom väntad hemlighet släpper aldrig igenom något", () => {
  assert.equal(sammaHemlighet("", ""), false);
  assert.equal(sammaHemlighet("x", undefined), false);
  assert.equal(sammaHemlighet(undefined, undefined), false);
  assert.equal(sammaHemlighet(null, ""), false);
  assert.equal(sammaHemlighet("undefined", undefined), false);
});

test("Bearer-värdet plockas ut, allt annat blir null", () => {
  assert.equal(bearerVarde("Bearer abc"), "abc");
  assert.equal(bearerVarde("bearer abc "), "abc");
  assert.equal(bearerVarde("Basic abc"), null);
  assert.equal(bearerVarde("Bearer "), null);
  assert.equal(bearerVarde("Bearer a b"), null);
  assert.equal(bearerVarde(null), null);
});
