import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CONSENT_COOKIE, CONSENT_KEY, marketingConsentFromCookie } from "./consent.ts";

// Granskning 2026-08-19: samtycket låg bara i localStorage, som servern inte
// kan läsa. /tack bygger Google-konfigurationen SERVER-side och den innehåller
// kundens e-postadress — utan en serverläsbar signal hamnade adressen i sidans
// RSC-payload även för den som valt "bara nödvändiga", tvärtemot vad
// sekretesspolicyn lovar.

describe("marketingConsentFromCookie", () => {
  it("bara exakt \"all\" räknas som samtycke", () => {
    assert.equal(marketingConsentFromCookie("all"), true);
    assert.equal(marketingConsentFromCookie(" all "), true);
  });

  it("nekar som default — saknad cookie är inte samtycke", () => {
    // Ett uteblivet enkätfönster är ett mycket mindre fel än en e-postadress
    // i HTML hos någon som sagt nej.
    for (const v of [null, undefined, "", "necessary", "ALL", "true", "yes"]) {
      assert.equal(marketingConsentFromCookie(v), false);
    }
  });

  it("cookien och localStorage-nyckeln har samma namn", () => {
    // Två namn för samma val hade drivit isär vid första ändring.
    assert.equal(CONSENT_COOKIE, CONSENT_KEY);
  });
});
