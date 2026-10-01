// Run: node --test --experimental-strip-types lib/carrier-detect.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { detect17TrackCarrier } from "./track17.ts";

test("PostNord parcel connect: verifierat 14-siffrigt 07-nummer → PostNord Sweden (19241)", () => {
  // Det skarpa numret från order #10012 som 17TRACK inte kunde auto-detektera.
  const hint = detect17TrackCarrier("07084026870677");
  assert.ok(hint);
  assert.equal(hint.key, 19241);
});

test("UPU S10 adresserat till SE → PostNord Sweden", () => {
  const hint = detect17TrackCarrier("RR123456789SE");
  assert.ok(hint);
  assert.equal(hint.key, 19241);
});

test("gemener och whitespace normaliseras", () => {
  assert.ok(detect17TrackCarrier(" rr123456789se "));
});

test("DPD: verifierat 14-siffrigt 01-nummer → DPD (100007)", () => {
  // Ett av de två DPD-paketen i order #10051 (september 2026).
  const hint = detect17TrackCarrier("01497067378460");
  assert.ok(hint);
  assert.equal(hint.key, 100007);
});

test("okända format → null (hellre ingen gissning än fel transportör)", () => {
  assert.equal(detect17TrackCarrier("00340434123456789012"), null); // SSCC-18 — ej verifierat än
  assert.equal(detect17TrackCarrier("RR123456789CN"), null); // S10 till annat land
  assert.equal(detect17TrackCarrier(""), null);
});
