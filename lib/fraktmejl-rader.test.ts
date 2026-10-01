// Run: node --test --experimental-strip-types lib/fraktmejl-rader.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { heltSkickad, sandningsRader, slaIhopRader } from "./fraktmejl-rader.ts";

// Order 10051 (2026-09-30): en rad, två sängramar, två DPD-paket. Två
// fulfillments gav två fraktmejl. Nu ska ordern räknas som helt skickad först
// när båda paketen finns, och då går ETT mejl.
const order = { lineItems: [{ id: "rad-1", quantity: 2 }] };
const paket1 = { trackingInfo: { trackingNumber: "01497067378460" }, lineItems: [{ id: "rad-1", quantity: 1 }] };
const paket2 = { trackingInfo: { trackingNumber: "01497067378461" }, lineItems: [{ id: "rad-1", quantity: 1 }] };

test("ett av två paket: ordern är inte helt skickad (mejlet väntar)", () => {
  assert.equal(heltSkickad(order, [paket1]), false);
});

test("båda paketen: ordern är helt skickad (ett mejl med två nummer)", () => {
  assert.equal(heltSkickad(order, [paket1, paket2]), true);
});

test("ett paket med hela antalet räcker", () => {
  assert.equal(heltSkickad(order, [{ lineItems: [{ id: "rad-1", quantity: 2 }] }]), true);
});

test("Wix egen status FULFILLED gäller även utan radinfo", () => {
  assert.equal(heltSkickad({ fulfillmentStatus: "FULFILLED", lineItems: [] }, []), true);
});

test("flera rader: alla måste vara skickade", () => {
  const o = { lineItems: [{ id: "a", quantity: 1 }, { id: "b", quantity: 1 }] };
  assert.equal(heltSkickad(o, [{ lineItems: [{ id: "a", quantity: 1 }] }]), false);
  assert.equal(heltSkickad(o, [{ lineItems: [{ id: "a", quantity: 1 }] }, { lineItems: [{ _id: "b" }] }]), true);
});

test("saknas rader i ordern räknas den som inte helt skickad (cronen tar den)", () => {
  assert.equal(heltSkickad({}, [paket1, paket2]), false);
});

test("sändningarnas rader slås ihop per rad", () => {
  const rader = slaIhopRader([{ lineItems: sandningsRader(paket1) }, { lineItems: sandningsRader(paket2) }]);
  assert.deepEqual(rader, [{ id: "rad-1", quantity: 2 }]);
});
