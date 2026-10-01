// lib/auction-next-start.test.ts
//
// Fyndauktionens tomma läge: nästa start kl 07 i Stockholm, vad den tomma
// listan betyder och dagtexten. Logiken bor i components/auction-next-start.ts
// eftersom både servern (första render) och klientens nedräkning använder den.

import test from "node:test";
import assert from "node:assert/strict";
import { nastaStartMs, tomtLage, startDagText, nedrakning } from "../components/auction-next-start.ts";

const iso = (ms: number) => new Date(ms).toISOString();

test("nästa start: före 07 är det i dag, efter 07 i morgon (sommartid)", () => {
  // 30 sep 2026 är sommartid (UTC+2): 07:00 = 05:00Z.
  assert.equal(iso(nastaStartMs(Date.parse("2026-09-30T02:00:00Z"))), "2026-09-30T05:00:00.000Z");
  assert.equal(iso(nastaStartMs(Date.parse("2026-09-30T05:00:00Z"))), "2026-10-01T05:00:00.000Z");
  assert.equal(iso(nastaStartMs(Date.parse("2026-09-30T17:30:00Z"))), "2026-10-01T05:00:00.000Z");
});

test("nästa start: vintertid och midnatt", () => {
  // 15 jan: UTC+1, 07:00 = 06:00Z. 23:30Z den 14:e är 00:30 den 15:e i Sverige.
  assert.equal(iso(nastaStartMs(Date.parse("2026-01-14T23:30:00Z"))), "2026-01-15T06:00:00.000Z");
  assert.equal(iso(nastaStartMs(Date.parse("2026-01-15T19:00:00Z"))), "2026-01-16T06:00:00.000Z");
});

test("nästa start räknar förskjutningen vid målet, inte nu (sommartid → vintertid)", () => {
  // Natten mot 25 okt 2026 går klockan tillbaka. Kvällen den 24:e (UTC+2)
  // ska nästa start bli 07:00 UTC+1 = 06:00Z, inte 05:00Z.
  assert.equal(iso(nastaStartMs(Date.parse("2026-10-24T18:00:00Z"))), "2026-10-25T06:00:00.000Z");
  // Och tvärtom i mars: 29 mar 2026 går klockan fram.
  assert.equal(iso(nastaStartMs(Date.parse("2026-03-28T19:00:00Z"))), "2026-03-29T05:00:00.000Z");
});

test("tomt läge följer Stockholms klocka", () => {
  assert.equal(tomtLage(Date.parse("2026-09-30T04:59:59Z")), "fore"); // 06:59:59
  assert.equal(tomtLage(Date.parse("2026-09-30T05:00:00Z")), "snart"); // 07:00
  assert.equal(tomtLage(Date.parse("2026-09-30T05:14:59Z")), "snart"); // 07:14
  assert.equal(tomtLage(Date.parse("2026-09-30T05:15:00Z")), "salda"); // 07:15
  assert.equal(tomtLage(Date.parse("2026-09-30T16:59:59Z")), "salda"); // 18:59
  assert.equal(tomtLage(Date.parse("2026-09-30T17:00:00Z")), "kvall"); // 19:00
  assert.equal(tomtLage(Date.parse("2026-09-30T21:59:00Z")), "kvall"); // 23:59
  assert.equal(tomtLage(Date.parse("2026-09-30T22:00:00Z")), "fore"); // 00:00
});

test("dagtexten säger i dag / i morgon med svenskt datum", () => {
  const nu = Date.parse("2026-09-30T17:30:00Z");
  assert.equal(startDagText(nastaStartMs(nu), nu), "i morgon, torsdag 1 oktober");
  const natt = Date.parse("2026-09-30T01:00:00Z");
  assert.equal(startDagText(nastaStartMs(natt), natt), "i dag, onsdag 30 september");
});

test("nedräkningen delas i timmar, minuter och sekunder och blir aldrig negativ", () => {
  assert.deepEqual(nedrakning(((11 * 60 + 59) * 60 + 58) * 1000 + 400), { h: 11, m: 59, s: 58 });
  assert.deepEqual(nedrakning(-5000), { h: 0, m: 0, s: 0 });
});
