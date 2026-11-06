// lib/order-raknas.test.ts — vilka Wix-ordrar som är köp (lib/order-raknas.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { arKop } from "./order-raknas.ts";

test("en order som väntar på betalning i vår kassa är inget köp", () => {
  assert.equal(arKop({ status: "INITIALIZED", paymentStatus: "PENDING" }), false);
  assert.equal(arKop({ status: "INITIALIZED", paymentStatus: "NOT_PAID" }), false);
  assert.equal(arKop({ status: "initialized" }), false, "gemener som popularitetens läsning");
});

test("en avbruten order som aldrig betalades är inget köp", () => {
  for (const p of ["NOT_PAID", "PENDING", "PENDING_MERCHANT", "CANCELED", "DECLINED", "UNSPECIFIED", "not_paid"]) {
    assert.equal(arKop({ status: "CANCELED", paymentStatus: p }), false, p);
  }
});

test("betalda ordrar är köp, också avbrutna och återbetalda", () => {
  assert.equal(arKop({ status: "APPROVED", paymentStatus: "PAID" }), true);
  assert.equal(arKop({ status: "APPROVED", paymentStatus: "NOT_PAID" }), true, "manuell betalning: godkänd men obetald");
  assert.equal(arKop({ status: "CANCELED", paymentStatus: "FULLY_REFUNDED" }), true);
  assert.equal(arKop({ status: "CANCELED", paymentStatus: "PARTIALLY_REFUNDED" }), true);
  assert.equal(arKop({ status: "CANCELED", paymentStatus: "PAID" }), true);
});

test("ett fält som saknas tappar aldrig en order", () => {
  assert.equal(arKop({}), true);
  assert.equal(arKop({ status: "CANCELED" }), true);
  assert.equal(arKop({ paymentStatus: "NOT_PAID" }), true);
  assert.equal(arKop({ status: 7 }), true);
  assert.equal(arKop(undefined), true);
  assert.equal(arKop(null), true);
});
