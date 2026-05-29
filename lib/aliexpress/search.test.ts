import { describe, expect, it } from "vitest";
import { extractAliExpressProductId } from "./client";

describe("extractAliExpressProductId", () => {
  it("returnerar rent product-ID som det är", () => {
    expect(extractAliExpressProductId("1005006789012345")).toBe("1005006789012345");
    expect(extractAliExpressProductId(" 1234567890 ")).toBe("1234567890");
  });

  it("plockar ID från /item/<id>.html-URL", () => {
    expect(extractAliExpressProductId("https://www.aliexpress.com/item/1005006789012345.html"))
      .toBe("1005006789012345");
    expect(extractAliExpressProductId("https://aliexpress.com/item/1234567890.html?foo=bar"))
      .toBe("1234567890");
  });

  it("plockar ID från /<id>.html-URL (utan /item/)", () => {
    expect(extractAliExpressProductId("https://www.aliexpress.com/store/1005006789012345.html"))
      .toBe("1005006789012345");
  });

  it("plockar ID från ?productId=-query", () => {
    expect(extractAliExpressProductId("https://example.com/?productId=1005006789012345"))
      .toBe("1005006789012345");
    expect(extractAliExpressProductId("https://example.com/?product_id=1234567890"))
      .toBe("1234567890");
  });

  it("returnerar null när inget ID kan hittas", () => {
    expect(extractAliExpressProductId("garbage")).toBeNull();
    expect(extractAliExpressProductId("https://example.com/")).toBeNull();
    expect(extractAliExpressProductId("123")).toBeNull(); // för kort
    expect(extractAliExpressProductId("")).toBeNull();
  });
});
