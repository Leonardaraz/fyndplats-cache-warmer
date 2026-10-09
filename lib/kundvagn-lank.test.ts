// lib/kundvagn-lank.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Vaktar länken från en rad i varukorgen till produktsidan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { produktLankForRad } from "./kundvagn-lank.ts";

test("Wix produktsida blir butikens /produkt/<slug>", () => {
  assert.equal(
    produktLankForRad({ url: { relativePath: "/product-page/gungbank-2-sits-for-tradgard" } }),
    "/produkt/gungbank-2-sits-for-tradgard",
  );
});

test("avslutande snedstreck tål vi", () => {
  assert.equal(produktLankForRad({ url: { relativePath: "/product-page/stol/" } }), "/produkt/stol");
});

test("okänd form eller saknad adress ger ingen länk", () => {
  assert.equal(produktLankForRad({ url: { relativePath: "/booking/abc" } }), null);
  assert.equal(produktLankForRad({ url: { relativePath: "/product-page/" } }), null);
  assert.equal(produktLankForRad({ url: { relativePath: "/product-page/a/b" } }), null);
  assert.equal(produktLankForRad({ url: {} }), null);
  assert.equal(produktLankForRad({}), null);
  assert.equal(produktLankForRad(null), null);
});
