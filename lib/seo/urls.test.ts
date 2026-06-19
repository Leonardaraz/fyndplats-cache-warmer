import { describe, it, expect } from "vitest";
import { productUrl } from "./urls";

describe("productUrl", () => {
  it("bygger /products/<slug> mot default-basen", () => {
    expect(productUrl("radiostyrd-amfibiebil-land-vatten-stuntbil")).toBe(
      "https://www.fyndplats.se/products/radiostyrd-amfibiebil-land-vatten-stuntbil",
    );
  });

  it("hanterar bas med trailing slash och prefix utan slash", () => {
    expect(productUrl("abc", { baseUrl: "https://x.se/", newPathPrefix: "/p" })).toBe("https://x.se/p/abc");
  });

  it("dubblar inte slash i prefixet", () => {
    expect(productUrl("abc", { baseUrl: "https://x.se", newPathPrefix: "/products/" })).toBe("https://x.se/products/abc");
  });
});
