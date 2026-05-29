import { describe, expect, it } from "vitest";
import { generateMissingSeoTags, type V3ProductForEnrich, type SeoTag } from "./enrich";

const baseProduct: V3ProductForEnrich = {
  id: "p1",
  name: "Trådlös Mus",
  slug: "tradlos-mus",
  brand: { name: "Fyndplats" },
  media: { main: { image: { url: "https://cdn.example.com/img.jpg" } } },
  actualPriceRange: { minValue: { amount: "199.00" } },
  inventory: { availabilityStatus: "IN_STOCK" },
  seoTitle: "Trådlös Mus | Fyndplats",
  seoDescription: "En riktigt bra mus.",
  seoData: {
    tags: [
      { type: "title", children: "Trådlös Mus | Fyndplats" },
      { type: "meta", props: { name: "description" }, children: "En riktigt bra mus." },
    ],
  },
  handle: "MUS-001",
};

describe("generateMissingSeoTags", () => {
  it("genererar 6 OG-tags + canonical + 2 JSON-LD när allt saknas", () => {
    const tags = generateMissingSeoTags(baseProduct);
    const ogTypes = tags.filter((t) => t.type === "meta" && t.props?.property?.startsWith("og:"));
    expect(ogTypes).toHaveLength(6);
    expect(tags.filter((t) => t.type === "link" && t.props?.rel === "canonical")).toHaveLength(1);
    expect(tags.filter((t) => t.type === "script")).toHaveLength(2);
  });

  it("är idempotent — körd 2 ggr genererar inga dubletter", () => {
    const first = generateMissingSeoTags(baseProduct);
    const augmented: V3ProductForEnrich = {
      ...baseProduct,
      seoData: {
        tags: [
          ...(baseProduct.seoData?.tags ?? []),
          ...(first as unknown as SeoTag[]),
        ],
      },
    };
    const second = generateMissingSeoTags(augmented);
    expect(second).toHaveLength(0);
  });

  it("hoppar över OG-image om produkten saknar bild", () => {
    const noImage: V3ProductForEnrich = { ...baseProduct, media: undefined };
    const tags = generateMissingSeoTags(noImage);
    expect(tags.some((t) => t.props?.property === "og:image")).toBe(false);
  });

  it("hoppar över Product JSON-LD om pris saknas", () => {
    const noPrice: V3ProductForEnrich = { ...baseProduct, actualPriceRange: undefined };
    const tags = generateMissingSeoTags(noPrice);
    const hasProductLd = tags.some(
      (t) => t.type === "script" && t.children?.includes('"@type":"Product"'),
    );
    expect(hasProductLd).toBe(false);
  });

  it("genererar fortfarande BreadcrumbList även utan pris/bild", () => {
    const bare: V3ProductForEnrich = {
      ...baseProduct,
      actualPriceRange: undefined,
      media: undefined,
    };
    const tags = generateMissingSeoTags(bare);
    const hasBreadcrumb = tags.some(
      (t) => t.type === "script" && t.children?.includes('"@type":"BreadcrumbList"'),
    );
    expect(hasBreadcrumb).toBe(true);
  });

  it("Product JSON-LD innehåller rätt URL, pris, SKU, availability", () => {
    const tags = generateMissingSeoTags(baseProduct);
    const ld = tags.find((t) => t.type === "script" && t.children?.includes('"@type":"Product"'));
    expect(ld).toBeDefined();
    const parsed = JSON.parse(ld!.children!);
    expect(parsed.offers.url).toBe("https://www.fyndplats.se/products/tradlos-mus");
    expect(parsed.offers.price).toBe("199.00");
    expect(parsed.sku).toBe("MUS-001");
    expect(parsed.offers.availability).toBe("https://schema.org/InStock");
  });

  it("availability=OutOfStock när inventory inte är IN_STOCK", () => {
    const oos: V3ProductForEnrich = {
      ...baseProduct,
      inventory: { availabilityStatus: "OUT_OF_STOCK" },
    };
    const tags = generateMissingSeoTags(oos);
    const ld = tags.find((t) => t.type === "script" && t.children?.includes('"@type":"Product"'));
    const parsed = JSON.parse(ld!.children!);
    expect(parsed.offers.availability).toBe("https://schema.org/OutOfStock");
  });

  it("respekterar custom baseUrl och newPathPrefix", () => {
    const tags = generateMissingSeoTags(baseProduct, {
      baseUrl: "https://staging.example.com",
      newPathPrefix: "/p",
    });
    const canonical = tags.find((t) => t.type === "link" && t.props?.rel === "canonical");
    expect(canonical!.props?.href).toBe("https://staging.example.com/p/tradlos-mus");
  });

  it("fallback: använder name som description om seoDescription och description saknas", () => {
    const noDesc: V3ProductForEnrich = {
      ...baseProduct,
      seoDescription: undefined,
      description: undefined,
    };
    const tags = generateMissingSeoTags(noDesc);
    const ogDesc = tags.find((t) => t.props?.property === "og:description");
    expect(ogDesc!.props?.content).toBe("Trådlös Mus");
  });

  it("strippar HTML från description-fallback", () => {
    const htmlDesc: V3ProductForEnrich = {
      ...baseProduct,
      seoDescription: undefined,
      description: "<p>Riktigt <strong>bra</strong> produkt!</p>",
    };
    const tags = generateMissingSeoTags(htmlDesc);
    const ogDesc = tags.find((t) => t.props?.property === "og:description");
    expect(ogDesc!.props?.content).toBe("Riktigt bra produkt!");
  });
});
