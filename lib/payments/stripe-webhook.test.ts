import { describe, expect, it } from "vitest";
import { computeSignature, parseSignatureHeader, verifyStripeSignature } from "./stripe-webhook";

const SECRET = "whsec_test_hemlighet";
const PAYLOAD = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });

function signedHeader(payload: string, t: number): string {
  return `t=${t},v1=${computeSignature(payload, SECRET, t)}`;
}

describe("parseSignatureHeader", () => {
  it("extracts t and all v1 signatures", () => {
    const p = parseSignatureHeader("t=123,v1=aaa,v1=bbb");
    expect(p.t).toBe(123);
    expect(p.v1).toEqual(["aaa", "bbb"]);
  });
});

describe("verifyStripeSignature", () => {
  const now = 1_700_000_000;

  it("accepts a correctly signed payload", () => {
    const header = signedHeader(PAYLOAD, now);
    expect(verifyStripeSignature({ payload: PAYLOAD, header, secret: SECRET, nowSec: now })).toBe(true);
  });

  it("rejects a tampered payload", () => {
    const header = signedHeader(PAYLOAD, now);
    expect(
      verifyStripeSignature({ payload: PAYLOAD + "x", header, secret: SECRET, nowSec: now }),
    ).toBe(false);
  });

  it("rejects the wrong secret", () => {
    const header = signedHeader(PAYLOAD, now);
    expect(
      verifyStripeSignature({ payload: PAYLOAD, header, secret: "whsec_fel", nowSec: now }),
    ).toBe(false);
  });

  it("rejects a timestamp outside the tolerance (replay)", () => {
    const header = signedHeader(PAYLOAD, now - 10_000);
    expect(verifyStripeSignature({ payload: PAYLOAD, header, secret: SECRET, nowSec: now })).toBe(false);
  });

  it("rejects an empty or malformed header", () => {
    expect(verifyStripeSignature({ payload: PAYLOAD, header: "", secret: SECRET, nowSec: now })).toBe(false);
    expect(verifyStripeSignature({ payload: PAYLOAD, header: "garbage", secret: SECRET, nowSec: now })).toBe(false);
  });
});
