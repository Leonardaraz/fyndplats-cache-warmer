import { describe, expect, it } from "vitest";
import { parseAliExpressUrl, canonicalizeAliExpressUrl } from "./url";

describe("parseAliExpressUrl", () => {
  it("extracts product id from standard URL", () => {
    const r = parseAliExpressUrl("https://www.aliexpress.com/item/1005006789012345.html");
    expect(r.productId).toBe("1005006789012345");
    expect(r.normalizedUrl).toBe("https://www.aliexpress.com/item/1005006789012345.html");
  });

  it("ignores tracking query params", () => {
    const r = parseAliExpressUrl("https://www.aliexpress.com/item/1005006789012345.html?spm=foo&sku_id=abc");
    expect(r.productId).toBe("1005006789012345");
  });

  it("supports mobile, /i/, and country domain hosts", () => {
    expect(parseAliExpressUrl("https://m.aliexpress.com/item/1005006789012345.html").productId).toBe("1005006789012345");
    expect(parseAliExpressUrl("https://aliexpress.com/i/1005006789012345.html").productId).toBe("1005006789012345");
    expect(parseAliExpressUrl("https://www.aliexpress.us/item/1005006789012345.html").productId).toBe("1005006789012345");
  });

  it("rejects non-aliexpress domain", () => {
    expect(parseAliExpressUrl("https://example.com/item/12345.html").error).toMatch(/aliexpress/);
  });

  it("rejects shortened links", () => {
    expect(parseAliExpressUrl("https://a.aliexpress.com/_mN1tA2D").error).toMatch(/Kortlänk/);
  });

  it("rejects empty input", () => {
    expect(parseAliExpressUrl("").error).toBe("URL saknas");
  });

  it("rejects invalid URL syntax", () => {
    expect(parseAliExpressUrl("not a url at all").error).toBeDefined();
  });
});

describe("canonicalizeAliExpressUrl", () => {
  it("returns canonical form for valid URLs", () => {
    expect(canonicalizeAliExpressUrl("https://www.aliexpress.com/item/1005006789012345.html?spm=x"))
      .toBe("https://www.aliexpress.com/item/1005006789012345.html");
  });
  it("returns null for invalid URLs", () => {
    expect(canonicalizeAliExpressUrl("https://example.com")).toBeNull();
  });
});
