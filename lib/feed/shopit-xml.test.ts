import { describe, expect, it } from "vitest";
import { buildShopitFeedXml, type ShopitFeedItem } from "./shopit-xml";

const META = { siteTitle: "Fyndplats", siteUrl: "https://fyndplats.se" };

function item(overrides: Partial<ShopitFeedItem> = {}): ShopitFeedItem {
  return {
    id: "abc-123",
    title: "Växthus med takfönster",
    descriptionHtml: "<p>Ett <strong>bra</strong> växthus.</p>",
    link: "https://fyndplats.se/produkt/vaxthus-med-takfonster",
    imageUrl: "https://static.wixstatic.com/media/foo.jpg",
    categoryPath: "Hem & Inredning > Trädgård & Odling",
    priceSek: 959,
    inStock: true,
    ...overrides,
  };
}

describe("buildShopitFeedXml", () => {
  it("bär g:id, g:title, g:description, link, bild, pris och skick", () => {
    const xml = buildShopitFeedXml([item()], META);
    expect(xml).toContain("<g:id>abc-123</g:id>");
    expect(xml).toContain("<![CDATA[Växthus med takfönster]]>");
    expect(xml).toContain("<link>https://fyndplats.se/produkt/vaxthus-med-takfonster</link>");
    expect(xml).toContain("<g:image_link>https://static.wixstatic.com/media/foo.jpg</g:image_link>");
    expect(xml).toContain("<g:price>959.00 SEK</g:price>");
    expect(xml).toContain("<g:condition>new</g:condition>");
  });

  it("strippar HTML ur beskrivningen till ren text i CDATA", () => {
    const xml = buildShopitFeedXml([item()], META);
    expect(xml).toContain("<![CDATA[Ett bra växthus.]]>");
    expect(xml).not.toContain("<strong>");
    expect(xml).not.toContain("<p>");
  });

  it("mappar lager till in_stock / out_of_stock", () => {
    const iLager = buildShopitFeedXml([item({ inStock: true })], META);
    const slutsald = buildShopitFeedXml([item({ inStock: false })], META);
    expect(iLager).toContain("<g:availability>in_stock</g:availability>");
    expect(slutsald).toContain("<g:availability>out_of_stock</g:availability>");
  });

  it("hoppar över g:image_link när bild saknas, i stället för att skriva en tom tagg", () => {
    const xml = buildShopitFeedXml([item({ imageUrl: undefined })], META);
    expect(xml).not.toContain("g:image_link");
  });

  it("skriver g:product_type som Shopits Product Category (2026-09-19)", () => {
    const xml = buildShopitFeedXml([item()], META);
    expect(xml).toContain("<![CDATA[Hem & Inredning > Trädgård & Odling]]>");
    expect(xml).toContain("<g:product_type>");
  });

  it("hoppar över g:product_type när kategorisökväg saknas, i stället för att gissa en", () => {
    const xml = buildShopitFeedXml([item({ categoryPath: undefined })], META);
    expect(xml).not.toContain("g:product_type");
  });

  it("XML-escapar & i länk och id", () => {
    const xml = buildShopitFeedXml(
      [item({ id: "a&b", link: "https://fyndplats.se/produkt/x?a=1&b=2" })],
      META,
    );
    expect(xml).toContain("<g:id>a&amp;b</g:id>");
    expect(xml).toContain("<link>https://fyndplats.se/produkt/x?a=1&amp;b=2</link>");
  });

  it("försvarar CDATA mot en bokstavlig ']]>' i källtexten", () => {
    const xml = buildShopitFeedXml([item({ title: "Rea]]>fint" })], META);
    expect(xml).not.toContain("]]>fint]]>");
    expect(() => xml).not.toThrow();
  });

  // ☠️ REGRESSIONSSPÄRR. Feeden ska ALDRIG hitta på ett varumärke (leverantörs-
  // namnen HOMCOM/Outsunny m.fl. stryks vid polering och får inte läcka
  // tillbaka), inte hitta på ett GTIN/MPN (Aosom/AliExpress-underlaget saknar
  // det helt — 100 % tomt, uppmätt), och inte hitta på frakt eller
  // leveranstid (Shopit-panelen har redan egna kontostandarder för det).
  it("skriver aldrig g:brand, g:gtin, g:mpn, g:shipping eller ett leveranslöfte", () => {
    const xml = buildShopitFeedXml([item()], META);
    expect(xml).not.toContain("g:brand");
    expect(xml).not.toContain("g:gtin");
    expect(xml).not.toContain("g:mpn");
    expect(xml).not.toContain("g:shipping");
    expect(xml).toContain("<g:identifier_exists>no</g:identifier_exists>");
  });

  it("truncar titel till 150 tecken och beskrivning till 5000 (Googles gränser)", () => {
    const xml = buildShopitFeedXml(
      [item({ title: "x".repeat(200), descriptionHtml: `<p>${"y".repeat(6000)}</p>` })],
      META,
    );
    const titleMatch = xml.match(/<g:title><!\[CDATA\[(.*?)\]\]><\/g:title>/);
    const descMatch = xml.match(/<g:description><!\[CDATA\[(.*?)\]\]><\/g:description>/s);
    expect(titleMatch?.[1].length).toBe(150);
    expect(descMatch?.[1].length).toBe(5000);
  });

  it("bygger kanalens title/link från meta, oavsett antal produkter", () => {
    const xml = buildShopitFeedXml([], META);
    expect(xml).toContain("<title>Fyndplats</title>");
    expect(xml).toContain("<link>https://fyndplats.se</link>");
    expect(xml).toContain('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">');
  });
});
