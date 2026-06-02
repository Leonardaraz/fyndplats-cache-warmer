// lib/cron-time.test.ts
//
// Run with: `pnpm test` (which calls `node --test --experimental-strip-types`).
//
// Verifies the DST gate fires the 08:00-Swedish cron exactly once per day across
// the year. Vercel runs the cron at "0 6,7 * * *" (06:00 + 07:00 UTC); the gate
// must let through only the firing whose Stockholm wall-clock is 08:00:
//   • summer (CEST, UTC+2): 06:00 UTC = 08:00 ✓  |  07:00 UTC = 09:00 ✗
//   • winter (CET,  UTC+1): 06:00 UTC = 07:00 ✗  |  07:00 UTC = 08:00 ✓

import test from "node:test";
import assert from "node:assert/strict";
import { swedishHour, isSwedishHour, cronClock } from "./cron-time.ts";

const TARGET = 8;

// Midsummer's day 2026 (DST active, CEST = UTC+2). Both Vercel firings:
const SUMMER_06_UTC = new Date("2026-06-20T06:00:00Z"); // → 08:00 Swedish
const SUMMER_07_UTC = new Date("2026-06-20T07:00:00Z"); // → 09:00 Swedish

// A February day 2026 (no DST, CET = UTC+1). Both Vercel firings:
const WINTER_06_UTC = new Date("2026-02-10T06:00:00Z"); // → 07:00 Swedish
const WINTER_07_UTC = new Date("2026-02-10T07:00:00Z"); // → 08:00 Swedish

test("swedishHour resolves Stockholm local hour across DST", () => {
  assert.equal(swedishHour(SUMMER_06_UTC), 8, "06 UTC is 08:00 CEST in summer");
  assert.equal(swedishHour(SUMMER_07_UTC), 9, "07 UTC is 09:00 CEST in summer");
  assert.equal(swedishHour(WINTER_06_UTC), 7, "06 UTC is 07:00 CET in winter");
  assert.equal(swedishHour(WINTER_07_UTC), 8, "07 UTC is 08:00 CET in winter");
});

test("DST gate: midsummer (DST) fires only the 06:00-UTC trigger", () => {
  assert.equal(isSwedishHour(TARGET, SUMMER_06_UTC), true, "06 UTC fires in summer");
  assert.equal(isSwedishHour(TARGET, SUMMER_07_UTC), false, "07 UTC is skipped in summer");
});

test("DST gate: February (non-DST) fires only the 07:00-UTC trigger", () => {
  assert.equal(isSwedishHour(TARGET, WINTER_06_UTC), false, "06 UTC is skipped in winter");
  assert.equal(isSwedishHour(TARGET, WINTER_07_UTC), true, "07 UTC fires in winter");
});

test("exactly one of the two daily firings passes the gate, year-round", () => {
  for (const [a, b] of [
    [SUMMER_06_UTC, SUMMER_07_UTC],
    [WINTER_06_UTC, WINTER_07_UTC],
  ]) {
    const passes = [a, b].filter((d) => isSwedishHour(TARGET, d)).length;
    assert.equal(passes, 1, "precisely one firing per day lands on 08:00 Swedish");
  }
});

test("cronClock reports both UTC and Swedish clock for the audit log", () => {
  const summer = cronClock(SUMMER_06_UTC);
  assert.equal(summer.utc, "2026-06-20T06:00:00.000Z");
  assert.equal(summer.swedishHour, 8);
  assert.match(summer.swedish, /08[:.]/); // 08:00:00 in sv-SE formatting

  const winter = cronClock(WINTER_07_UTC);
  assert.equal(winter.utc, "2026-02-10T07:00:00.000Z");
  assert.equal(winter.swedishHour, 8);
});
