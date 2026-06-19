import { describe, it, expect } from "vitest";
import { buildShoppingFeedXml, isFeedEligible } from "./feed";
import type { WixV3ProductSummary } from "../wix/v3-products";

function product(overrides: Partial<WixV3ProductSummary> = {}): WixV3ProductSummary {
  return {
    id: "p1",
    name: "Radiostyrd amfibiebil",
    slug: "radiostyrd-amfibiebil",
    imageUrl: "https://static.wixstatic.com/media/a.jpg",
    variantCount: 1,
    hasSeoTitle: true,
    hasSeoDescription: true,
    hasJsonLd: true,
    hasOgTags: true,
    hasImage: true,
    hasDescription: true,
    priceMin: "389",
    inStock: true,
    visible: true,
    ...overrides,
  };
}

describe("isFeedEligible", () => {
  it("kräver slug, synlig, pris och bild", () => {
    expect(isFeedEligible(product())).toBe(true);
    expect(isFeedEligible(product({ visible: false }))).toBe(false);
    expect(isFeedEligible(product({ priceMin: undefined }))).toBe(false);
    expect(isFeedEligible(product({ imageUrl: undefined }))).toBe(false);
    expect(isFeedEligible(product({ slug: "" }))).toBe(false);
  });
  it("inkluderar produkter där visible saknas (undefined ≠ draft)", () => {
    expect(isFeedEligible(product({ visible: undefined }))).toBe(true);
  });
});

describe("buildShoppingFeedXml", () => {
  it("bygger giltig RSS med g:-fält och korrekt produkt-URL", () => {
    const xml = buildShoppingFeedXml([product()]);
    expect(xml).toContain('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">');
    expect(xml).toContain("<g:id>p1</g:id>");
    expect(xml).toContain("<g:link>https://www.fyndplats.se/products/radiostyrd-amfibiebil</g:link>");
    expect(xml).toContain("<g:price>389 SEK</g:price>");
    expect(xml).toContain("<g:availability>in_stock</g:availability>");
    expect(xml).toContain("<g:condition>new</g:condition>");
  });

  it("mappar out_of_stock och använder handle som g:id när det finns", () => {
    const xml = buildShoppingFeedXml([product({ inStock: false, handle: "FP-amfibie" })]);
    expect(xml).toContain("<g:id>FP-amfibie</g:id>");
    expect(xml).toContain("<g:availability>out_of_stock</g:availability>");
  });

  it("hoppar över draft- och ofullständiga produkter", () => {
    const xml = buildShoppingFeedXml([
      product({ id: "ok" }),
      product({ id: "draft", visible: false }),
      product({ id: "nopris", priceMin: undefined }),
    ]);
    expect(xml).toContain("<g:id>ok</g:id>");
    expect(xml).not.toContain("<g:id>draft</g:id>");
    expect(xml).not.toContain("<g:id>nopris</g:id>");
  });

  it("escapar XML-specialtecken i titel/beskrivning", () => {
    const xml = buildShoppingFeedXml([
      product({ name: "Bil & <Båt>", plainDescription: "<p>Far & flyg</p>" }),
    ]);
    expect(xml).toContain("<g:title>Bil &amp; &lt;Båt&gt;</g:title>");
    expect(xml).toContain("Far &amp; flyg");
    expect(xml).not.toContain("<p>"); // HTML strippad ur beskrivningen
  });
});
