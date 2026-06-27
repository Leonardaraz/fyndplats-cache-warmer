// lib/carrier-mask.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// HÅRD INVARIANT: AliExpress/Cainiao-identiteten får ALDRIG passera maskeringen
// och nå kunden. Detta är den enda kvarvarande maskeringsregeln (produkterna
// skickas från EU). Lås den.

import test from "node:test";
import assert from "node:assert/strict";
import { maskCarrier, maskCarrierOrUndefined, MASKED_CARRIER } from "./carrier-mask.ts";

test("AliExpress/Cainiao identity is ALWAYS masked", () => {
  for (const name of [
    "Cainiao",
    "AliExpress",
    "AliExpress Standard Shipping",
    "Cainiao Super Economy",
    "Alibaba",
    "4PX",
    "Yanwen",
    "China Post",
    "AliExpress Logistics",
  ]) {
    assert.equal(maskCarrier(name), MASKED_CARRIER, `${name} must mask to ${MASKED_CARRIER}`);
    assert.equal(maskCarrierOrUndefined(name), undefined, `${name} must be undefined (carrier row hidden)`);
  }
});

test("Known EU carriers pass through with a normalised label", () => {
  const cases: Array<[string, string]> = [
    ["PostNord Sweden", "PostNord"],
    ["DHL eCommerce", "DHL"],
    ["DPD", "DPD"],
    ["Bring", "Bring"],
    ["Budbee", "Budbee"],
    ["Instabox", "Instabox"],
    ["DB Schenker", "Schenker"],
    ["PostNL", "PostNL"],
    ["InPost", "InPost"],
    ["Colissimo", "Colissimo"],
    ["Deutsche Post", "Deutsche Post"],
    ["Royal Mail", "Royal Mail"],
    ["Evri", "Evri"],
    ["Bpost", "Bpost"],
  ];
  for (const [input, expected] of cases) {
    assert.equal(maskCarrier(input), expected, `${input} → ${expected}`);
    assert.equal(maskCarrierOrUndefined(input), expected, `${input} → ${expected}`);
  }
});

test("Empty/unknown carrier never leaks", () => {
  assert.equal(maskCarrier(""), "");
  assert.equal(maskCarrierOrUndefined(""), undefined);
  assert.equal(maskCarrierOrUndefined("Some Random Courier AB"), undefined);
  assert.equal(maskCarrier(null), "");
  assert.equal(maskCarrier(undefined), "");
});
