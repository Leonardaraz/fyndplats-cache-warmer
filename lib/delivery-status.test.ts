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

// ── Levererat per order (2026-10-07) ────────────────────────────────────────

import { VÄNTA_PÅ_ÖVRIGA_DAGAR, levereratBeslut, orderNyckel, svepKandidater } from "./delivery-status.ts";

const DAG = 86_400_000;
const NU = Date.UTC(2026, 9, 7, 12);

test("levereratBeslut – ett av två paket framme: vänta", () => {
  assert.equal(levereratBeslut({ statusar: ["delivered", "in_transit"], orderStatus: "FULFILLED", förstaLevererad: NU - 3_600_000, nu: NU }), "vänta");
});

test("levereratBeslut – båda paketen framme och ordern helt skickad: skicka", () => {
  assert.equal(levereratBeslut({ statusar: ["delivered", "delivered"], orderStatus: "FULFILLED", förstaLevererad: NU - DAG, nu: NU }), "skicka");
});

test("levereratBeslut – ett paket: skicka direkt, som förut", () => {
  assert.equal(levereratBeslut({ statusar: ["delivered"], orderStatus: "FULFILLED", förstaLevererad: NU, nu: NU }), "skicka");
});

test("☠️ levereratBeslut – alla kända paket framme men ordern inte helt skickad: vänta", () => {
  // Resten av ordern har inget spårningsnummer än. Mejlet hade sagt
  // "levererat" om varor som inte ens lämnat lagret.
  assert.equal(levereratBeslut({ statusar: ["delivered"], orderStatus: "PARTIALLY_FULFILLED", förstaLevererad: NU, nu: NU }), "vänta");
});

test("levereratBeslut – ordern gick inte att läsa: paketen avgör", () => {
  assert.equal(levereratBeslut({ statusar: ["delivered", "delivered"], orderStatus: null, förstaLevererad: NU, nu: NU }), "skicka");
});

test("☠️ levereratBeslut – ett paket som aldrig rapporteras stoppar inte mejlet för alltid", () => {
  const nyss = NU - (VÄNTA_PÅ_ÖVRIGA_DAGAR * DAG - 60_000);
  const förr = NU - VÄNTA_PÅ_ÖVRIGA_DAGAR * DAG;
  assert.equal(levereratBeslut({ statusar: ["delivered", "exception"], orderStatus: "FULFILLED", förstaLevererad: nyss, nu: NU }), "vänta");
  assert.equal(levereratBeslut({ statusar: ["delivered", "exception"], orderStatus: "FULFILLED", förstaLevererad: förr, nu: NU }), "skicka");
  assert.equal(levereratBeslut({ statusar: ["delivered", "in_transit"], orderStatus: "PARTIALLY_FULFILLED", förstaLevererad: förr, nu: NU }), "skicka");
});

test("levereratBeslut – inget paket levererat: vänta", () => {
  assert.equal(levereratBeslut({ statusar: ["in_transit"], orderStatus: "FULFILLED", förstaLevererad: null, nu: NU }), "vänta");
  assert.equal(levereratBeslut({ statusar: [], orderStatus: null, förstaLevererad: null, nu: NU }), "vänta");
});

test("orderNyckel – kan inte krocka med ett spårningsnummer", () => {
  assert.equal(orderNyckel("10056"), "order:10056");
});

test("skaSkrivaStatus – ett paket som väntar på resten av ordern är framme", () => {
  assert.equal(skaSkrivaStatus({ sent: false, reason: "vantar_pa_ovriga_paket" }), true);
  assert.equal(skaSkrivaStatus({ sent: false, reason: "resend_failed" }), false);
});

test("svepKandidater: order med nyligen levererat paket, kunden från senaste paketet, nycklar för mejlspärren", () => {
  const nu = Date.parse("2026-10-29T12:00:00.000Z");
  const rader = [
    { tracking_number: "A1", order_id: "o1", customer_email: "gammal@x.se", customer_name: "G", status: "in_transit", created_at: "2026-10-20T10:00:00.000Z", levererad_at: null },
    { tracking_number: "A2", order_id: "o1", customer_email: "ny@x.se", customer_name: "N", status: "delivered", created_at: "2026-10-21T10:00:00.000Z", levererad_at: "2026-10-28T10:00:00.000Z" },
    // Levererad för länge sedan: inte med.
    { tracking_number: "B1", order_id: "o2", customer_email: "b@x.se", customer_name: null, status: "delivered", created_at: "2026-10-01T10:00:00.000Z", levererad_at: "2026-10-05T10:00:00.000Z" },
    // Karantän och paket utan order räknas aldrig.
    { tracking_number: "C1", order_id: "o3", customer_email: "c@x.se", customer_name: null, status: "ambiguous", created_at: "2026-10-28T10:00:00.000Z", levererad_at: "2026-10-28T11:00:00.000Z" },
    { tracking_number: "D1", order_id: null, customer_email: "d@x.se", customer_name: null, status: "delivered", created_at: "2026-10-28T10:00:00.000Z", levererad_at: "2026-10-28T11:00:00.000Z" },
  ];
  const k = svepKandidater(rader, nu, 10);
  assert.equal(k.length, 1);
  assert.deepEqual(k[0], {
    order_id: "o1",
    tracking_number: "A2",
    customer_email: "ny@x.se",
    customer_name: "N",
    nycklar: [orderNyckel("o1"), "A1", "A2"],
  });
});
