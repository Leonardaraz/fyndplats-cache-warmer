// lib/sms-parser.test.ts
//
// Run with: `pnpm test` (which calls `node --test --experimental-strip-types`).
//
// Real-world SMS bodies pulled from the carriers Fyndplats has actually seen
// on orders. The AliExpress C/o test case is the screenshot Leonard sent — it
// is the original motivation for the entire SMS-forwarding flow.

import test from "node:test";
import assert from "node:assert/strict";
import { parseSms } from "./sms-parser.ts";

test("PostNord — AliExpress C/o levererat (original incident SMS)", () => {
  const r = parseSms({
    from: "PostNord",
    text: "Ditt paket från AliExpress C/o är nu levererat vid din dörr, eller vid din postlåda.",
  });
  assert.equal(r.carrier, "PostNord");
  assert.equal(r.status, "delivered");
});

test("PostNord — available at ICA Maxi with pickup code", () => {
  const r = parseSms({
    from: "PostNord",
    text: "Ditt paket från Fyndplats är nu vid ICA Maxi Södertälje. Hämtkod: 1234. Tack!",
  });
  assert.equal(r.carrier, "PostNord");
  assert.equal(r.status, "available_for_pickup");
  assert.equal(r.pickup_code, "1234");
  assert.match(r.pickup_location ?? "", /ICA Maxi/);
});

test("PostNord — out for delivery today", () => {
  const r = parseSms({
    from: "PostNord",
    text: "Ditt paket är på väg hem till dig och levereras idag mellan 14-18.",
  });
  assert.equal(r.carrier, "PostNord");
  assert.equal(r.status, "out_for_delivery");
});

test("DHL — out for delivery (English)", () => {
  const r = parseSms({
    from: "DHL",
    text: "Your DHL Express parcel JJD0123456789012 is out for delivery today.",
  });
  assert.equal(r.carrier, "DHL");
  assert.equal(r.status, "out_for_delivery");
  assert.equal(r.tracking_number, "JJD0123456789012");
});

test("DHL — delivered", () => {
  const r = parseSms({
    from: "DHL Parcel",
    text: "Your parcel 0123456789 has been delivered.",
  });
  assert.equal(r.carrier, "DHL");
  assert.equal(r.status, "delivered");
});

test("DPD — pickup at Pressbyrån with code", () => {
  const r = parseSms({
    from: "DPD",
    text: "Ditt paket finns nu för upphämtning vid Pressbyrån Hötorget. Hämtkod 78901. Hälsningar DPD.",
  });
  assert.equal(r.carrier, "DPD");
  assert.equal(r.status, "available_for_pickup");
  assert.equal(r.pickup_code, "78901");
  assert.match(r.pickup_location ?? "", /Pressbyrån/);
});

test("Instabox — package ready", () => {
  const r = parseSms({
    from: "Instabox",
    text: "Hej! Ditt paket från Fyndplats är nu klart för upphämtning. Kod: 4321",
  });
  assert.equal(r.carrier, "Instabox");
  assert.equal(r.status, "available_for_pickup");
  assert.equal(r.pickup_code, "4321");
});

test("Budbee — out for delivery", () => {
  const r = parseSms({
    from: "Budbee",
    text: "Ditt Budbee-paket levereras idag mellan 17 och 22. Spårning: BUD12345.",
  });
  assert.equal(r.carrier, "Budbee");
  assert.equal(r.status, "out_for_delivery");
});

test("Cainiao — shipped with tracking", () => {
  const r = parseSms({
    from: "AliExpress",
    text: "Your package LP00100012345CN has been shipped via Cainiao.",
  });
  assert.equal(r.carrier, "Cainiao");
  assert.equal(r.status, "in_transit");
  assert.match(r.tracking_number ?? "", /^[A-Z]{2}\d/);
});

test("Bring — labelled tracking + delivered", () => {
  const r = parseSms({
    from: "Bring",
    text: "Hej! Ditt paket är levererat. Spårningsnummer: 70123456789",
  });
  assert.equal(r.carrier, "Bring");
  assert.equal(r.status, "delivered");
  assert.equal(r.tracking_number, "70123456789");
});

test("Unknown sender + no recognisable status", () => {
  const r = parseSms({ from: "RANDOM", text: "Hej, det här är inte ett paket." });
  assert.equal(r.carrier, "Unknown");
  assert.equal(r.status, "unknown");
  assert.equal(r.pickup_code, undefined);
});

test("Empty input does not throw", () => {
  const r = parseSms({ from: "", text: "" });
  assert.equal(r.carrier, "Unknown");
  assert.equal(r.status, "unknown");
});

test("Ombud phrase 'vid din dörr' should NOT be treated as ombud location", () => {
  const r = parseSms({
    from: "PostNord",
    text: "Paketet är levererat vid din dörr.",
  });
  // "vid din dörr" is the delivery location, not an ombud — must NOT be
  // extracted, otherwise customers get "Paketet är vid Din dörr" emails.
  assert.equal(r.pickup_location, undefined);
});

test("Hämtkod regex prefers labelled code over loose digits in same body", () => {
  const r = parseSms({
    from: "PostNord",
    text: "Order 555000 är nu vid ICA Nära. Hämtkod: 9876",
  });
  assert.equal(r.pickup_code, "9876");
});
