// lib/track17.test.ts
//
// Run with: `pnpm test` (node --test --experimental-strip-types).
//
// Signaturverifieringen är säkerhetskritisk: den är det ENDA som skiljer en
// äkta 17TRACK-push från en förfalskad. Lås beteendet.

import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { verify17TrackSign } from "./track17.ts";

const API_KEY = "test-17track-key-abc123";
const BODY = JSON.stringify({ event: "TRACKING_UPDATED", data: { number: "LP123SE" } });
const goodSign = createHash("sha256").update(`${BODY}/${API_KEY}`).digest("hex");

test("verify17TrackSign accepts a correctly signed body", () => {
  process.env.TRACK17_API_KEY = API_KEY;
  assert.equal(verify17TrackSign(BODY, goodSign), true);
});

test("verify17TrackSign rejects a wrong signature", () => {
  process.env.TRACK17_API_KEY = API_KEY;
  assert.equal(verify17TrackSign(BODY, "deadbeef".repeat(8)), false);
});

test("verify17TrackSign rejects a tampered body (same sign)", () => {
  process.env.TRACK17_API_KEY = API_KEY;
  assert.equal(verify17TrackSign(BODY + " ", goodSign), false);
});

test("verify17TrackSign rejects missing signature", () => {
  process.env.TRACK17_API_KEY = API_KEY;
  assert.equal(verify17TrackSign(BODY, null), false);
  assert.equal(verify17TrackSign(BODY, ""), false);
});

test("verify17TrackSign rejects when API key is unset", () => {
  delete process.env.TRACK17_API_KEY;
  assert.equal(verify17TrackSign(BODY, goodSign), false);
});
