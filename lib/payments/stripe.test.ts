import { describe, expect, it } from "vitest";
import { encodeForm } from "./stripe";

describe("encodeForm (Stripe form-kodning)", () => {
  it("encodes flat key/value pairs", () => {
    expect(encodeForm({ mode: "payment" })).toBe("mode=payment");
  });

  it("encodes nested line_items in Stripe's bracket format", () => {
    const out = encodeForm({ line_items: { 0: { price: "price_123", quantity: 1 } } });
    expect(out).toBe("line_items[0][price]=price_123&line_items[0][quantity]=1");
  });

  it("url-encodes values (success_url etc.)", () => {
    const out = encodeForm({ success_url: "https://x.se/grade?betalning=klar" });
    expect(out).toBe(
      "success_url=https%3A%2F%2Fx.se%2Fgrade%3Fbetalning%3Dklar",
    );
  });

  it("skips undefined and null values", () => {
    const out = encodeForm({ a: "1", b: undefined, c: null, d: "2" });
    expect(out).toBe("a=1&d=2");
  });

  it("encodes metadata object", () => {
    const out = encodeForm({ metadata: { scanned_url: "x.se", plan: "audit" } });
    expect(out).toBe("metadata[scanned_url]=x.se&metadata[plan]=audit");
  });
});
