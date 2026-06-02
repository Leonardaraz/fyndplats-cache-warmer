// lib/push-tokens.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Verifierar den rena urvalslogiken: filterByPreferences() ska bara släppa
// igenom mottagare vars preferens för den aktuella kanalen är på, mappa rätt
// kanal → flagga, och behandla saknad/ofullständig preferences som "allt på".

import test from "node:test";
import assert from "node:assert/strict";
import {
  filterByPreferences,
  coercePreferences,
  DEFAULT_PREFERENCES,
  type PushChannel,
  type PushPreferences,
} from "./push-tokens.ts";

function rec(token: string, prefs: Partial<PushPreferences> | null | undefined) {
  return { expoToken: token, preferences: prefs };
}

const ALL_ON: PushPreferences = { orderUpdates: true, restock: true, promotions: true, cartReminders: true };
const ALL_OFF: PushPreferences = { orderUpdates: false, restock: false, promotions: false, cartReminders: false };

test("varje kanal styrs av rätt preferens-flagga", () => {
  const cases: Array<[PushChannel, keyof PushPreferences]> = [
    ["order", "orderUpdates"],
    ["restock", "restock"],
    ["promo", "promotions"],
    ["cart", "cartReminders"],
  ];
  for (const [channel, flag] of cases) {
    const on = rec("on", { ...ALL_OFF, [flag]: true });
    const off = rec("off", { ...ALL_ON, [flag]: false });
    const kept = filterByPreferences([on, off], channel);
    assert.deepEqual(
      kept.map((r) => r.expoToken),
      ["on"],
      `kanal ${channel} ska bara behålla den vars ${flag}=true`,
    );
  }
});

test("promo skickas inte när promotions=false", () => {
  const records = [rec("a", { ...ALL_ON, promotions: false }), rec("b", ALL_ON)];
  const kept = filterByPreferences(records, "promo");
  assert.deepEqual(kept.map((r) => r.expoToken), ["b"]);
});

test("alla av → tom lista oavsett kanal", () => {
  const records = [rec("a", ALL_OFF), rec("b", ALL_OFF)];
  for (const ch of ["order", "restock", "promo", "cart"] as PushChannel[]) {
    assert.equal(filterByPreferences(records, ch).length, 0, `kanal ${ch}`);
  }
});

test("saknad/ofullständig preferences tolkas som allt-på (default)", () => {
  const records = [
    rec("null-prefs", null),
    rec("undef-prefs", undefined),
    rec("partial", { promotions: false }), // övriga flaggor saknas → på
  ];
  // order: alla tre ska med (ingen har orderUpdates=false)
  assert.equal(filterByPreferences(records, "order").length, 3);
  // promo: "partial" har promotions=false → faller bort, övriga två med
  assert.deepEqual(
    filterByPreferences(records, "promo").map((r) => r.expoToken),
    ["null-prefs", "undef-prefs"],
  );
});

test("filterByPreferences muterar inte input och bevarar ordning", () => {
  const records = [rec("a", ALL_ON), rec("b", { ...ALL_ON, orderUpdates: false }), rec("c", ALL_ON)];
  const kept = filterByPreferences(records, "order");
  assert.deepEqual(kept.map((r) => r.expoToken), ["a", "c"]);
  assert.equal(records.length, 3, "originalet är orört");
});

test("coercePreferences defaultar saknade flaggor till på, bevarar explicit false", () => {
  assert.deepEqual(coercePreferences(undefined), DEFAULT_PREFERENCES);
  assert.deepEqual(coercePreferences({}), DEFAULT_PREFERENCES);
  assert.deepEqual(coercePreferences({ promotions: false }), {
    orderUpdates: true,
    restock: true,
    promotions: false,
    cartReminders: true,
  });
});
