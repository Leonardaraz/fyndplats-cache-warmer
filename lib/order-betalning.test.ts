// lib/order-betalning.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Orderbekräftelsen får aldrig säga "Betalning bekräftad" om en obetald
// fakturaorder. Allt annat ska se ut som förut.

import test from "node:test";
import assert from "node:assert/strict";
import { BETALNING_BEKRAFTAD, BETALNING_MOT_FAKTURA, betalningstext } from "./order-betalning.ts";

const fakturaorder = { channelInfo: { type: "BACKOFFICE_MERCHANT" }, paymentStatus: "NOT_PAID" };

test("en obetald order som lagts upp för hand visas som faktura", () => {
  assert.equal(betalningstext(fakturaorder), BETALNING_MOT_FAKTURA);
  assert.notEqual(betalningstext(fakturaorder), BETALNING_BEKRAFTAD);
});

test("fakturatexten vinner även om Wix anger ett betalsätt", () => {
  assert.equal(betalningstext(fakturaorder, "Offline"), BETALNING_MOT_FAKTURA);
});

test("en handlagd order som är betald säger betalning bekräftad", () => {
  const betald = { channelInfo: { type: "BACKOFFICE_MERCHANT" }, paymentStatus: "PAID" };
  assert.equal(betalningstext(betald), BETALNING_BEKRAFTAD);
});

test("en webborder visar Wix betalsätt som förut", () => {
  const webb = { channelInfo: { type: "WEB" }, paymentStatus: "PAID" };
  assert.equal(betalningstext(webb, "Klarna Pay Later"), "Klarna Pay Later");
});

test("en webborder utan betalsätt får samma text som förut", () => {
  assert.equal(betalningstext({ channelInfo: { type: "WEB" }, paymentStatus: "NOT_PAID" }), BETALNING_BEKRAFTAD);
  assert.equal(betalningstext({}), BETALNING_BEKRAFTAD);
});
