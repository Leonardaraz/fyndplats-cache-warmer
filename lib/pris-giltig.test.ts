// Run: node --test --experimental-strip-types 'lib/**/*.test.ts'
import test from "node:test";
import assert from "node:assert/strict";
import { prisGiltigFran, prisGiltigTill } from "./pris-giltig.ts";

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

test("startdatumet är första dagen i månaden", () => {
  assert.equal(prisGiltigFran(new Date("2026-10-01T00:00:00Z")), "2026-10-01");
  assert.equal(prisGiltigFran(new Date("2026-10-22T12:20:00Z")), "2026-10-01");
  assert.equal(prisGiltigFran(new Date("2026-10-31T23:59:59Z")), "2026-10-01");
  assert.equal(prisGiltigFran(new Date("2027-01-15T08:00:00Z")), "2027-01-01");
});

test("startdatumet byts bara en gång i månaden, samtidigt som slutdatumet", () => {
  const par = new Set<string>();
  for (let dag = 1; dag <= 31; dag++) {
    const nu = new Date(Date.UTC(2026, 9, dag, 12));
    par.add(`${prisGiltigFran(nu)}…${prisGiltigTill(nu)}`);
  }
  assert.deepEqual([...par], ["2026-10-01…2026-11-30"]);
});

test("startdatumet ligger aldrig i framtiden", () => {
  for (let m = 0; m < 24; m++) {
    for (const [dag, tim] of [[1, 0], [1, 23], [15, 12], [28, 23]] as const) {
      const nu = new Date(Date.UTC(2026, m, dag, tim, 0, 1));
      assert.ok(Date.parse(prisGiltigFran(nu)) <= nu.getTime(), `${nu.toISOString()} → ${prisGiltigFran(nu)}`);
      assert.ok(prisGiltigFran(nu) < prisGiltigTill(nu));
    }
  }
});
