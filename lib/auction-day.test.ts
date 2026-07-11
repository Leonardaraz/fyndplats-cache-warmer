// lib/auction-day.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
// Verifierar dagsdramaturgins klocklogik: hettan 07→18, sista timmen 18–19,
// timindexet och dagens slut.

import test from "node:test";
import assert from "node:assert/strict";
import { dayHeat, isFinalHour, isDayOver, hourIndex, msToDayEnd, AUCTION_DAY_HOURS, FINAL_HOUR } from "./auction-day.ts";

const H = 3_600_000;
const START = Date.parse("2026-07-12T05:00:00.000Z"); // 07:00 svensk sommartid

test("dayHeat: 0 vid start, 0.5 halvvägs till 18, 1 vid golvet och därefter", () => {
  assert.equal(dayHeat(START, START), 0);
  assert.equal(dayHeat(START, START + (FINAL_HOUR / 2) * H), 0.5);
  assert.equal(dayHeat(START, START + FINAL_HOUR * H), 1);
  assert.equal(dayHeat(START, START + 11.5 * H), 1);
  assert.equal(dayHeat(START, START - 3 * H), 0); // schemalagd, ej startad
  assert.equal(dayHeat(null, START), 0);
});

test("isFinalHour: exakt 18:00–18:59, inte före eller efter", () => {
  assert.equal(isFinalHour(START, START + FINAL_HOUR * H - 1), false);
  assert.equal(isFinalHour(START, START + FINAL_HOUR * H), true);
  assert.equal(isFinalHour(START, START + AUCTION_DAY_HOURS * H - 1), true);
  assert.equal(isFinalHour(START, START + AUCTION_DAY_HOURS * H), false);
  assert.equal(isFinalHour(null, START), false);
});

test("isDayOver: från 19:00", () => {
  assert.equal(isDayOver(START, START + AUCTION_DAY_HOURS * H - 1), false);
  assert.equal(isDayOver(START, START + AUCTION_DAY_HOURS * H), true);
});

test("hourIndex: 0 första timmen, 11 sista, klampat i båda ändar", () => {
  assert.equal(hourIndex(START, START + 30 * 60_000), 0);
  assert.equal(hourIndex(START, START + 5 * H + 1), 5);
  assert.equal(hourIndex(START, START + 11 * H), 11);
  assert.equal(hourIndex(START, START + 20 * H), 11);
  assert.equal(hourIndex(START, START - 2 * H), 0);
});

test("msToDayEnd: räknar ner till 19:00, null efter", () => {
  assert.equal(msToDayEnd(START, START + 11 * H), H);
  assert.equal(msToDayEnd(START, START + AUCTION_DAY_HOURS * H), null);
  assert.equal(msToDayEnd(null, START), null);
});
