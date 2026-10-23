// lib/shipping.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Vaktar fraktregeln som varukorgen, produktsidans JSON-LD och produktflödet
// delar (fraktKr). Wix-kassans egen regel (Frakt & leverans → Sverige) ska
// stå på samma gräns, se kommentaren i lib/shipping.ts.
import test from "node:test";
import assert from "node:assert/strict";
import {
  DELIVERY_MAX_DAYS,
  DELIVERY_MIN_DAYS,
  FREE_SHIPPING_FROM_KR,
  HANDLING_MAX_DAYS,
  HANDLING_MIN_DAYS,
  STANDARD_SHIPPING_KR,
  TRANSIT_MAX_DAYS,
  TRANSIT_MIN_DAYS,
  fraktKr,
} from "./shipping.ts";

test("frakten är fri från gränsen och standard under den", () => {
  assert.equal(fraktKr(FREE_SHIPPING_FROM_KR), 0);
  assert.equal(fraktKr(FREE_SHIPPING_FROM_KR + 1200), 0);
  assert.equal(fraktKr(FREE_SHIPPING_FROM_KR - 1), STANDARD_SHIPPING_KR);
  assert.equal(fraktKr(0), STANDARD_SHIPPING_KR);
});

test("gränsen är 500 kr, så en vara för 499 kr har frakt", () => {
  assert.equal(FREE_SHIPPING_FROM_KR, 500);
  assert.equal(fraktKr(499), STANDARD_SHIPPING_KR);
  assert.equal(fraktKr(499.99), STANDARD_SHIPPING_KR);
});

// Google räknar leveransdatumet ur hanteringstid + transporttid. Summan måste
// vara samma löfte som resten av sajten visar, annars lovar sökresultatet en
// annan leveranstid än produktsidan.
test("hanteringstid och transporttid blir tillsammans leveranslöftet", () => {
  assert.equal(HANDLING_MIN_DAYS + TRANSIT_MIN_DAYS, DELIVERY_MIN_DAYS);
  assert.equal(HANDLING_MAX_DAYS + TRANSIT_MAX_DAYS, DELIVERY_MAX_DAYS);
  assert.ok(HANDLING_MIN_DAYS <= HANDLING_MAX_DAYS);
  assert.ok(TRANSIT_MIN_DAYS >= 1 && TRANSIT_MIN_DAYS <= TRANSIT_MAX_DAYS);
});
