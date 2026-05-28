import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ALL_PRODUCTS_LEGACY_ID,
  slugify,
  transformProduct,
  type TransformContext,
  type V1Product,
} from "./transform";

// Använder den verkliga sample-produkten som testfixtur.
const sampleFile = JSON.parse(
  readFileSync(path.resolve(__dirname, "../sample-products.json"), "utf8"),
) as { samples: V1Product[] };

const sample = sampleFile.samples[0];

// En kategorimap som speglar verkligheten: bara giltiga legacy-ID:n får ny ID,
// "All Products" är medvetet utelämnad eftersom den filtreras bort i transformen.
const ctx: TransformContext = {
  imageMap: {},
  categoryMap: {
    "423b892f-ac55-a13e-e296-4561f6914c36": "new-orhangen",
    "6b5926fc-4c43-1121-71c7-8a1f25ddf9c3": "new-smycken",
    "a7e9dfa4-eb25-7841-a08c-b682b6cf3776": "new-mode-accessoarer",
  },
};

describe("transformProduct (Fyndplats v1 → v3)", () => {
  it("maps top-level fields and uses PHYSICAL enum + physicalProperties:{}", () => {
    const { product } = transformProduct(sample, ctx);
    expect(product.name).toBe(sample.name);
    expect(product.slug).toBe(sample.slug);
    expect(product.visible).toBe(true);
    expect(product.productType).toBe("PHYSICAL");
    expect(product.physicalProperties).toEqual({});
    expect(product.brand).toEqual({ name: "Fyndplats" });
    expect(product.ribbon).toBeUndefined(); // sample.ribbon = null
  });

  it("keeps the HTML description as plainDescription (Ricos fills in description later)", () => {
    const { product, descriptionsToConvert } = transformProduct(sample, ctx);
    expect(product.plainDescription).toBe(sample.description);
    expect(product.description).toBeUndefined();
    // Beskrivningen + 4 info-sektioner ska konverteras
    expect(descriptionsToConvert).toHaveLength(5);
    expect(descriptionsToConvert[0].path).toBe("description");
  });

  it("renames additionalInfoSections to infoSections with unique uniqueName per section", () => {
    const { product } = transformProduct(sample, ctx);
    expect(product.infoSections).toHaveLength(4);
    const titles = product.infoSections.map((s) => s.title);
    expect(titles).toEqual([
      "Tekniska specifikationer",
      "Användning och skötsel",
      "Vanliga frågor",
      "Kontakta oss",
    ]);
    const uniqueNames = product.infoSections.map((s) => s.uniqueName);
    expect(new Set(uniqueNames).size).toBe(uniqueNames.length); // alla unika
    expect(uniqueNames[0]).toContain(sample.slug);
  });

  it("maps the first non-AllProducts collection to mainCategoryId and the rest to secondary", () => {
    const { product, secondaryCategoryIds } = transformProduct(sample, ctx);
    expect(product.mainCategoryId).toBe("new-orhangen");
    expect(secondaryCategoryIds).toEqual(["new-smycken", "new-mode-accessoarer"]);
    // "All Products" ska filtreras bort
    expect(sample.collectionIds).toContain(ALL_PRODUCTS_LEGACY_ID);
    const all = [product.mainCategoryId, ...secondaryCategoryIds];
    expect(all).not.toContain(ALL_PRODUCTS_LEGACY_ID);
  });

  it("builds options as TEXT_CHOICES with CHOICE_TEXT entries", () => {
    const { product } = transformProduct(sample, ctx);
    expect(product.options).toHaveLength(1);
    expect(product.options![0].name).toBe("Metallfärg");
    expect(product.options![0].optionRenderType).toBe("TEXT_CHOICES");
    expect(product.options![0].choicesSettings.choices[0]).toEqual({
      choiceType: "CHOICE_TEXT",
      name: "6mm Stil D",
    });
  });

  it("converts variants with string prices and per-choice renderType", () => {
    const { product } = transformProduct(sample, ctx);
    const variants = product.variantsInfo.variants;
    expect(variants).toHaveLength(4);
    const v0 = variants[0];
    expect(v0.sku).toBe("FYND-SMY-002-01");
    expect(v0.price.actualPrice.amount).toBe("42.99"); // sträng, inte tal
    expect(typeof v0.price.actualPrice.amount).toBe("string");
    expect(v0.choices[0].optionChoiceNames).toEqual({
      optionName: "Metallfärg",
      choiceName: "6mm Stil D",
      renderType: "TEXT_CHOICES",
    });
    expect(v0.inventoryStatus.inStock).toBe(true); // 6970 i lager
  });

  it("adds compareAtPrice only when discounted < ordinarie", () => {
    const { product } = transformProduct(
      { ...sample, variants: [{ ...sample.variants![0], price: 99, discountedPrice: 79 }] },
      ctx,
    );
    const v0 = product.variantsInfo.variants[0];
    expect(v0.price.actualPrice.amount).toBe("79");
    expect(v0.price.compareAtPrice?.amount).toBe("99");
  });

  it("creates a single default variant when v1 has no productOptions", () => {
    const noOpts: V1Product = {
      ...sample,
      productOptions: [],
      variants: [],
      manageVariants: false,
    };
    const { product } = transformProduct(noOpts, ctx);
    expect(product.options).toBeUndefined();
    expect(product.variantsInfo.variants).toHaveLength(1);
    expect(product.variantsInfo.variants[0].choices).toEqual([]);
    expect(product.variantsInfo.variants[0].sku).toBe(`${sample.slug}-default`);
  });

  it("maps media items via imageMap when present, falls back to original URL otherwise", () => {
    const oldUrl = sample.mediaItems![0].url;
    const newUrl = "https://static.wixstatic.com/media/new-id~mv2.jpg";
    const { product } = transformProduct(sample, { ...ctx, imageMap: { [oldUrl]: newUrl } });
    expect(product.media!.itemsInfo.items[0].url).toBe(newUrl);
    expect(product.media!.itemsInfo.items[1].url).toBe(sample.mediaItems![1].url); // fallback
    expect(product.media!.main!.url).toBe(newUrl); // första = main
    expect(product.media!.itemsInfo.items[0].mediaType).toBe("IMAGE");
    expect(product.media!.itemsInfo.items[0].altText).toBe(sample.name);
  });

  it("collects initialStock for Step 7 (variant SKU + quantity)", () => {
    const { initialStock } = transformProduct(sample, ctx);
    expect(initialStock).toHaveLength(4);
    expect(initialStock[0]).toEqual({ sku: "FYND-SMY-002-01", quantity: 6970 });
  });
});

describe("slugify", () => {
  it("strips diacritics and lowercases", () => {
    expect(slugify("Örhängen Glittriga")).toBe("orhangen-glittriga");
  });
  it("collapses non-alphanumeric runs and trims dashes", () => {
    expect(slugify("  Foo --- Bar!! ")).toBe("foo-bar");
  });
});
