// Run: node --test --experimental-strip-types lib/delivery-status.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  POLL_MAX_PER_KÖRNING,
  POLL_MAX_ÅLDER_DAGAR,
  POLL_STATUSAR,
  notisStatusFör,
  skaSkrivaStatus,
  ärTerminalStatus,
} from "./delivery-status.ts";
import type { DeliveryStatus } from "../emails/delivery-notification.tsx";
import type { NotisStatus } from "./delivery-status.ts";

test("notisStatusFör – bara Delivered och OutForDelivery ger mejl", () => {
  assert.equal(notisStatusFör("Delivered"), "delivered");
  assert.equal(notisStatusFör("OutForDelivery"), "out_for_delivery");
});

test("☠️ notisStatusFör – AvailableForPickup ägs av SMS-flödet och ger ALDRIG push/poll-mejl", () => {
  // Hämtkoden finns bara i carrier-SMS:et. Ett mejl härifrån hade sagt
  // "hämta ditt paket" utan kod.
  assert.equal(notisStatusFör("AvailableForPickup"), null);
});

test("notisStatusFör – transit och terminala status ger inget mejl", () => {
  for (const s of ["InTransit", "PickedUp", "InfoReceived", "Exception", "Expired", "NotFound", "", undefined, null]) {
    assert.equal(notisStatusFör(s), null, `status ${String(s)}`);
  }
});

test("ärTerminalStatus – de sju terminala, inget annat", () => {
  for (const s of ["Exception", "DeliveryFailure", "Returning", "Returned", "Expired", "NotFound", "Undelivered"]) {
    assert.equal(ärTerminalStatus(s), true, s);
  }
  for (const s of ["Delivered", "InTransit", "OutForDelivery", undefined]) {
    assert.equal(ärTerminalStatus(s), false, String(s));
  }
});

test("☠️ NotisStatus är en delmängd av mallens DeliveryStatus", () => {
  // Kompileringstidskontroll: bryts unionen i mallen faller den här raden i
  // strip-types-körningen inte — men i `next build` gör den det.
  const a: DeliveryStatus = "delivered" satisfies NotisStatus;
  const b: DeliveryStatus = "out_for_delivery" satisfies NotisStatus;
  assert.ok(a && b);
});

test("☠️ pollen tittar på out_for_delivery också — annars omöjliggör första mejlet det andra", () => {
  assert.deepEqual([...POLL_STATUSAR], ["in_transit", "out_for_delivery"]);
});

test("pollens tal är rimliga och positiva", () => {
  assert.ok(POLL_MAX_ÅLDER_DAGAR >= 30 && POLL_MAX_ÅLDER_DAGAR <= 90);
  assert.ok(POLL_MAX_PER_KÖRNING >= 10);
});

test("☠️ skaSkrivaStatus – skickat eller redan skickat, ALDRIG vid Resend-fel", () => {
  assert.equal(skaSkrivaStatus({ sent: true }), true);
  assert.equal(skaSkrivaStatus({ sent: false, reason: "duplicate_suppressed" }), true);
  // Vid fel ska raden ligga kvar så nästa körning försöker igen.
  assert.equal(skaSkrivaStatus({ sent: false, reason: "resend_failed" }), false);
  assert.equal(skaSkrivaStatus({ sent: false, reason: "resend_not_configured" }), false);
  assert.equal(skaSkrivaStatus({ sent: false, reason: "internal_error" }), false);
});
