// lib/order-betalning.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Orderbekräftelsen får aldrig säga "Betalning bekräftad" om en obetald
// fakturaorder. Allt annat ska se ut som förut.

import test from "node:test";
import assert from "node:assert/strict";
import {
  BETALNING_BEKRAFTAD,
  BETALNING_MOT_FAKTURA,
  BETALNING_MOT_FORSKOTT,
  FORSKOTT_MARKOR,
  betalningstext,
} from "./order-betalning.ts";
import { FORSKOTT_MARKOR as VARUKORGENS_MARKOR } from "./medlem/varukorg.ts";

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

test("förskottsordern från företagskontot säger att varorna skickas när fakturan är betald", () => {
  const forskott = { ...fakturaorder, buyerNote: "Förskottsfaktura. Org.nr: 556000-0000." };
  assert.equal(betalningstext(forskott), BETALNING_MOT_FORSKOTT);
  // Betald är den betald, som andra handlagda ordrar.
  assert.equal(betalningstext({ ...forskott, paymentStatus: "PAID" }), BETALNING_BEKRAFTAD);
  // En vanlig fakturaorder har kvar sin text.
  assert.equal(betalningstext({ ...fakturaorder, buyerNote: "Faktura till Exempel AB" }), BETALNING_MOT_FAKTURA);
  // Markören är densamma som butiken skriver i ordern (lib/medlem/varukorg.ts).
  assert.equal(FORSKOTT_MARKOR, VARUKORGENS_MARKOR);
});
