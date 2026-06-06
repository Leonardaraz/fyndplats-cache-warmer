import { describe, it, expect, vi } from "vitest";
import {
  deriveSwatchFromVariantImages,
  enrichSwatchImagesFromApi,
  mergeSwatchImages,
  needsSwatchBackfill,
} from "./variant-images";
import type { AliExpressProduct } from "./types";

function product(partial: Partial<AliExpressProduct>): AliExpressProduct {
  return {
    supplierProductId: "1005001",
    sourceUrl: "https://aliexpress.com/item/1005001.html",
    rawTitle: "x",
    rawDescription: "",
    imageUrls: [],
    variants: [],
    ...partial,
  } as AliExpressProduct;
}

function variant(id: string, options: Record<string, string>) {
  return { supplierVariantId: id, options, costUsd: 1, included: true };
}

describe("needsSwatchBackfill", () => {
  it("true när varianter finns men inga swatch-bilder skrapades", () => {
    expect(needsSwatchBackfill(product({ variants: [variant("s1", { Färg: "Röd" })] }))).toBe(true);
  });
  it("true när swatchImages bara har tomma axlar", () => {
    expect(
      needsSwatchBackfill(product({ variants: [variant("s1", { Färg: "Röd" })], swatchImages: { Färg: {} } })),
    ).toBe(true);
  });
  it("false när skrapan redan gav swatch-bilder", () => {
    expect(
      needsSwatchBackfill(
        product({ variants: [variant("s1", { Färg: "Röd" })], swatchImages: { Färg: { Röd: "r.jpg" } } }),
      ),
    ).toBe(false);
  });
  it("false när produkten saknar varianter", () => {
    expect(needsSwatchBackfill(product({ variants: [] }))).toBe(false);
  });
});

describe("deriveSwatchFromVariantImages", () => {
  it("väljer den bildbärande (färg-)axeln och ignorerar storlek", () => {
    const variants = [
      variant("s1", { Färg: "Röd", Storlek: "S" }),
      variant("s2", { Färg: "Röd", Storlek: "M" }),
      variant("s3", { Färg: "Blå", Storlek: "S" }),
      variant("s4", { Färg: "Blå", Storlek: "M" }),
    ];
    const imageBySkuId = new Map([
      ["s1", "red.jpg"],
      ["s2", "red.jpg"],
      ["s3", "blue.jpg"],
      ["s4", "blue.jpg"],
    ]);
    expect(deriveSwatchFromVariantImages(variants, imageBySkuId)).toEqual({
      Färg: { Röd: "red.jpg", Blå: "blue.jpg" },
    });
  });

  it("hanterar enkel-axlad produkt", () => {
    const variants = [variant("s1", { Färg: "Röd" }), variant("s2", { Färg: "Blå" })];
    const imageBySkuId = new Map([
      ["s1", "red.jpg"],
      ["s2", "blue.jpg"],
    ]);
    expect(deriveSwatchFromVariantImages(variants, imageBySkuId)).toEqual({
      Färg: { Röd: "red.jpg", Blå: "blue.jpg" },
    });
  });

  it("returnerar {} när inga SKU-id matchar en bild", () => {
    const variants = [variant("s1", { Färg: "Röd" })];
    expect(deriveSwatchFromVariantImages(variants, new Map())).toEqual({});
  });

  it("returnerar {} när enda axeln är inkonsistent (samma värde, olika bilder)", () => {
    const variants = [variant("s1", { Färg: "Röd" }), variant("s2", { Färg: "Röd" })];
    const imageBySkuId = new Map([
      ["s1", "a.jpg"],
      ["s2", "b.jpg"],
    ]);
    expect(deriveSwatchFromVariantImages(variants, imageBySkuId)).toEqual({});
  });
});

describe("mergeSwatchImages", () => {
  it("base vinner, extra fyller bara luckor", () => {
    const base = { Färg: { Röd: "scrape-red.jpg" } };
    const extra = { Färg: { Röd: "api-red.jpg", Blå: "api-blue.jpg" } };
    expect(mergeSwatchImages(base, extra)).toEqual({
      Färg: { Röd: "scrape-red.jpg", Blå: "api-blue.jpg" },
    });
  });
  it("fungerar utan base", () => {
    expect(mergeSwatchImages(undefined, { Färg: { Röd: "r.jpg" } })).toEqual({
      Färg: { Röd: "r.jpg" },
    });
  });
});

describe("enrichSwatchImagesFromApi", () => {
  it("bygger swatch-kartan ur DS-API:ts sku_image, matchat på SKU-id", async () => {
    const p = product({
      variants: [variant("s1", { Färg: "Röd" }), variant("s2", { Färg: "Blå" })],
    });
    const getProduct = vi.fn(async () => ({
      variants: [
        { skuId: "s1", imageUrl: "red.jpg" },
        { skuId: "s2", imageUrl: "blue.jpg" },
        { skuId: "s3", imageUrl: "" }, // ingen bild → ignoreras
      ],
    }));
    expect(await enrichSwatchImagesFromApi(p, { getProduct })).toEqual({
      Färg: { Röd: "red.jpg", Blå: "blue.jpg" },
    });
    expect(getProduct).toHaveBeenCalledWith("1005001");
  });

  it("returnerar {} (fail-open) när DS-anropet kastar", async () => {
    const p = product({ variants: [variant("s1", { Färg: "Röd" })] });
    const getProduct = vi.fn(async () => {
      throw new Error("AE 500");
    });
    expect(await enrichSwatchImagesFromApi(p, { getProduct })).toEqual({});
  });

  it("returnerar {} när DS-API:t inte gav några per-SKU-bilder", async () => {
    const p = product({ variants: [variant("s1", { Färg: "Röd" })] });
    const getProduct = vi.fn(async () => ({ variants: [{ skuId: "s1", imageUrl: "" }] }));
    expect(await enrichSwatchImagesFromApi(p, { getProduct })).toEqual({});
  });
});
