// lib/auction-day.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
// Verifierar dagsdramaturgins klocklogik: hettan 07→18, sista timmen 18–19,
// timindexet och dagens slut.

import test from "node:test";
import assert from "node:assert/strict";
import { dayHeat, isFinalHour, isDayOver, hourIndex, msToDayEnd, AUCTION_DAY_HOURS, FINAL_HOUR, auctionPhase, dayEndMs, fmtLeft, REFRESH_BACKOFF_MS } from "./auction-day.ts";

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

test("auctionPhase: hela dygnsresan i rätt ordning", () => {
  const start = START;                       // 07:00
  const t = (nextDropAtMs: number | null, startsAtMs: number | null = null) =>
    ({ startsAtMs, dayStartMs: start, nextDropAtMs });

  // Natt: startsAt i framtiden vinner över allt annat.
  assert.deepEqual(auctionPhase(start - 2 * H, t(start + H, start)), { phase: "pre", targetMs: start });
  // Dag med känd framtida sänkning.
  assert.equal(auctionPhase(start + H, t(start + 2 * H)).phase, "countdown");
  // Målet passerat men dagen pågår → stale (refresh-kedjan jobbar).
  assert.equal(auctionPhase(start + 2 * H + 60_000, t(start + 2 * H)).phase, "stale");
  // Golv utan nextDrop, dagen pågår → floor med dagens slut som mål.
  assert.deepEqual(auctionPhase(start + 11.5 * H, t(null)), {
    phase: "floor", targetMs: start + AUCTION_DAY_HOURS * H,
  });
  // ≥19:00 → ended, oavsett kvarvarande stale-mål från dagen.
  assert.equal(auctionPhase(start + 12 * H, t(start + 9 * H)).phase, "ended");
  assert.equal(auctionPhase(start + 15 * H, t(null)).phase, "ended");
});

test("auctionPhase: ended vinner inte över en NY dags pre-läge", () => {
  const yesterday = START;
  const tomorrow = START + 24 * H;
  // Efter rotation: dayStart = i morgon (framtid) → isDayOver false → pre.
  const out = auctionPhase(START + 15 * H, { startsAtMs: tomorrow, dayStartMs: tomorrow, nextDropAtMs: tomorrow + H });
  assert.deepEqual(out, { phase: "pre", targetMs: tomorrow });
  // Stale props (gammal dag) + inget startsAt → ended, target = gårdagens slut.
  const stale = auctionPhase(START + 15 * H, { startsAtMs: null, dayStartMs: yesterday, nextDropAtMs: null });
  assert.deepEqual(stale, { phase: "ended", targetMs: yesterday + AUCTION_DAY_HOURS * H });
});

test("dayEndMs + fmtLeft: gränsvärden", () => {
  assert.equal(dayEndMs(null), null);
  assert.equal(dayEndMs(START), START + AUCTION_DAY_HOURS * H);
  assert.equal(fmtLeft(0), "0:00");
  assert.equal(fmtLeft(-5000), "0:00");          // klampas, aldrig negativt
  assert.equal(fmtLeft(65_000), "1:05");
  assert.equal(fmtLeft(3 * H + 62_000), "3:01:02");
});

test("REFRESH_BACKOFF_MS: stigande och täcker väckarklockans drift", () => {
  for (let i = 1; i < REFRESH_BACKOFF_MS.length; i++) {
    assert.ok(REFRESH_BACKOFF_MS[i] > REFRESH_BACKOFF_MS[i - 1], "stegen ska vara stigande");
  }
  const sum = REFRESH_BACKOFF_MS.reduce((a, b) => a + b, 0);
  assert.ok(sum >= 25 * 60_000, `summan ${sum} ska täcka minst 25 min drift`);
});
