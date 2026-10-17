// Run: node --test --experimental-strip-types lib/fraktmejl-rader.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  delaSparningsnummer,
  fraktmejlAmne,
  heltSkickad,
  sandningarIFulfillment,
  sandningsRader,
  slaIhopRader,
} from "./fraktmejl-rader.ts";

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

// Order 10095 (2026-10-17): ett hantelset som Aosom skickade i två DPD-paket.
// Wix tar ett spårningsnummer per fulfillment och en fulfillment per
// artikelantal, så båda numren står i samma fält. Numren här är påhittade, i
// samma form.
const FALT_10095 = "01234567890123, 01234567890125";

test("uppdelningen: 'A, B' ger [A, B]", () => {
  assert.deepEqual(delaSparningsnummer("A, B"), ["A", "B"]);
  assert.deepEqual(delaSparningsnummer(FALT_10095), ["01234567890123", "01234567890125"]);
});

test("uppdelningen: ett enskilt nummer ger exakt samma nummer som i dag", () => {
  assert.deepEqual(delaSparningsnummer("A"), ["A"]);
  assert.deepEqual(delaSparningsnummer("01497067385169"), ["01497067385169"]);
  // Fältet trimmades förut (firstStr i webhooken), så det gör uppdelningen också.
  assert.deepEqual(delaSparningsnummer("  01497067385169 "), ["01497067385169"]);
});

test("uppdelningen: 'A,,B ; A' ger [A, B], utan tomma och dubbletter, i fältets ordning", () => {
  assert.deepEqual(delaSparningsnummer("A,,B ; A"), ["A", "B"]);
  assert.deepEqual(delaSparningsnummer("B, A"), ["B", "A"]);
});

test("uppdelningen: ett nummer med mellanslag delas inte", () => {
  assert.deepEqual(delaSparningsnummer("JJD 0001 2345 6789"), ["JJD 0001 2345 6789"]);
  assert.deepEqual(delaSparningsnummer("JJD 0001 2345, JJD 0001 2346"), ["JJD 0001 2345", "JJD 0001 2346"]);
});

test("uppdelningen: semikolon och radbrytningar delar också", () => {
  assert.deepEqual(delaSparningsnummer("A;B"), ["A", "B"]);
  assert.deepEqual(delaSparningsnummer("A\nB\r\nC"), ["A", "B", "C"]);
});

test("uppdelningen: tomt eller saknat fält ger inga nummer", () => {
  assert.deepEqual(delaSparningsnummer(""), []);
  assert.deepEqual(delaSparningsnummer(" , ; "), []);
  assert.deepEqual(delaSparningsnummer(undefined), []);
  assert.deepEqual(delaSparningsnummer(null), []);
});

test("sändningar: raderna hör till första numret, det andra paketet får inga", () => {
  const f = { trackingInfo: { trackingNumber: FALT_10095 }, lineItems: [{ id: "rad-1", quantity: 1 }] };
  assert.deepEqual(sandningarIFulfillment(f), [
    { trackingNumber: "01234567890123", lineItems: [{ id: "rad-1", quantity: 1 }] },
    { trackingNumber: "01234567890125", lineItems: [] },
  ]);
  // Hantelsetet är fortfarande 1 st när paketens rader slås ihop.
  assert.deepEqual(slaIhopRader(sandningarIFulfillment(f)), [{ id: "rad-1", quantity: 1 }]);
});

test("sändningar: ett nummer ger samma sändning som förut", () => {
  assert.deepEqual(sandningarIFulfillment(paket1), [
    { trackingNumber: "01497067378460", lineItems: [{ id: "rad-1", quantity: 1 }] },
  ]);
  // Numret kan också ligga direkt på fulfillmenten.
  assert.deepEqual(sandningarIFulfillment({ trackingNumber: "A, B", lineItems: [] }), [
    { trackingNumber: "A", lineItems: [] },
    { trackingNumber: "B", lineItems: [] },
  ]);
});

test("sändningar: en fulfillment utan spårningsnummer ger inga", () => {
  assert.deepEqual(sandningarIFulfillment({ lineItems: [{ id: "rad-1", quantity: 1 }] }), []);
  assert.deepEqual(sandningarIFulfillment({ trackingInfo: { trackingNumber: " " } }), []);
  assert.deepEqual(sandningarIFulfillment(undefined), []);
});

test("ämnesraden räknar paketen", () => {
  assert.equal(fraktmejlAmne("10095", 2), "Dina 2 paket är på väg – order 10095");
  assert.equal(fraktmejlAmne("10095", 1), "Ditt paket är på väg – order 10095");
});
