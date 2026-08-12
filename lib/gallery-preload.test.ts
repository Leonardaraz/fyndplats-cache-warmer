// Run: node --test --experimental-strip-types lib/gallery-preload.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { nearWindow, prefersDataSaving } from "./gallery-preload.ts";

test("nearWindow – mitt i galleriet: 2 framåt, 1 bakåt", () => {
  assert.deepEqual(nearWindow(2, 6), [3, 4, 1]);
});

test("nearWindow – första bilden wrappar bakåt till sista", () => {
  assert.deepEqual(nearWindow(0, 6), [1, 2, 5]);
});

test("nearWindow – sista bilden wrappar framåt till början", () => {
  assert.deepEqual(nearWindow(5, 6), [0, 1, 4]);
});

test("nearWindow – enbildsgalleri ger tomt fönster", () => {
  assert.deepEqual(nearWindow(0, 1), []);
});

test("nearWindow – tvåbildsgalleri: grannen en gång, aldrig dubblett", () => {
  assert.deepEqual(nearWindow(0, 2), [1]);
  assert.deepEqual(nearWindow(1, 2), [0]);
});

test("nearWindow – trebildsgalleri: wrap ger inga dubbletter", () => {
  // framåt: 1, 2 — bakåt: 2 (dubblett, filtreras)
  assert.deepEqual(nearWindow(0, 3), [1, 2]);
});

test("nearWindow – innehåller aldrig active självt", () => {
  for (let len = 1; len <= 12; len++) {
    for (let a = 0; a < len; a++) {
      const w = nearWindow(a, len);
      assert.ok(!w.includes(a), `nearWindow(${a}, ${len}) innehöll active`);
      assert.equal(new Set(w).size, w.length, `nearWindow(${a}, ${len}) hade dubbletter`);
      for (const i of w) assert.ok(i >= 0 && i < len, `nearWindow(${a}, ${len}) utanför intervallet: ${i}`);
    }
  }
});

test("prefersDataSaving – saveData och 2g-lägen stänger av, annars på", () => {
  assert.equal(prefersDataSaving(undefined), false);
  assert.equal(prefersDataSaving({}), false);
  assert.equal(prefersDataSaving({ saveData: true }), true);
  assert.equal(prefersDataSaving({ effectiveType: "2g" }), true);
  assert.equal(prefersDataSaving({ effectiveType: "slow-2g" }), true);
  assert.equal(prefersDataSaving({ effectiveType: "4g" }), false);
  assert.equal(prefersDataSaving({ saveData: false, effectiveType: "3g" }), false);
});
