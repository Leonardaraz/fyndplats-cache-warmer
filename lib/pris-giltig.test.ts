// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
import test from "node:test";
import assert from "node:assert/strict";
import { prisGiltigTill } from "./pris-giltig.ts";

test("sista dagen i nästa månad", () => {
  assert.equal(prisGiltigTill(new Date("2026-10-01T03:00:00Z")), "2026-11-30");
  assert.equal(prisGiltigTill(new Date("2026-10-31T23:59:59Z")), "2026-11-30");
  assert.equal(prisGiltigTill(new Date("2026-12-15T12:00:00Z")), "2027-01-31");
  assert.equal(prisGiltigTill(new Date("2027-01-31T12:00:00Z")), "2027-02-28");
  assert.equal(prisGiltigTill(new Date("2028-01-10T12:00:00Z")), "2028-02-29");
});

test("samma värde hela månaden — sidan blir inte ny varje dygn", () => {
  const varden = new Set<string>();
  for (let dag = 1; dag <= 31; dag++) {
    varden.add(prisGiltigTill(new Date(Date.UTC(2026, 9, dag, 12))));
  }
  assert.deepEqual([...varden], ["2026-11-30"]);
});

test("alltid minst 28 dagar fram", () => {
  for (let m = 0; m < 24; m++) {
    for (const dag of [1, 15, 28]) {
      const nu = new Date(Date.UTC(2026, m, dag, 23, 59));
      const dagarFram = (Date.parse(prisGiltigTill(nu)) - nu.getTime()) / 86400000;
      assert.ok(dagarFram >= 27.9, `${nu.toISOString()} → bara ${dagarFram.toFixed(1)} dagar fram`);
    }
  }
});
