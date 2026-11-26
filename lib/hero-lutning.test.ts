// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { lutning } from "./hero-lutning.ts";

describe("lutning: pekarens läge i hjälten", () => {
  it("−1 i början, 0 i mitten, 1 i slutet", () => {
    assert.equal(lutning(100, 100, 400), -1);
    assert.equal(lutning(300, 100, 400), 0);
    assert.equal(lutning(500, 100, 400), 1);
    assert.equal(lutning(400, 100, 400), 0.5);
  });

  it("stannar vid kanterna när pekaren är utanför", () => {
    assert.equal(lutning(-50, 100, 400), -1);
    assert.equal(lutning(9000, 100, 400), 1);
  });

  it("ger 0 för en ruta utan bredd eller ett läge som inte är ett tal", () => {
    assert.equal(lutning(10, 0, 0), 0);
    assert.equal(lutning(10, 0, -5), 0);
    assert.equal(lutning(Number.NaN, 0, 100), 0);
    assert.equal(lutning(10, Number.NaN, 100), 0);
  });
});
