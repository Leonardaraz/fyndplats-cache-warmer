import { describe, it, expect, vi } from "vitest";
import { enrichSwatchImagesFromApi, needsSwatchBackfill } from "./variant-images";
import { translateOptionColorCodes, translateVariantOptions } from "./variant-translations";
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

describe("enrichSwatchImagesFromApi", () => {
  it("bygger swatch-kartan ur DS sku_image (matchat på SKU-id) via buildSwatchImagesFromDs", async () => {
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

  it("returnerar {} för enkel-färgad produkt (ärver buildSwatchImagesFromDs guards)", async () => {
    const p = product({ variants: [variant("s1", { Färg: "Röd" }), variant("s2", { Färg: "Röd" })] });
    const getProduct = vi.fn(async () => ({
      variants: [
        { skuId: "s1", imageUrl: "r.jpg" },
        { skuId: "s2", imageUrl: "r.jpg" },
      ],
    }));
    expect(await enrichSwatchImagesFromApi(p, { getProduct })).toEqual({});
  });

  it("varianter med icke-matchande SKU-id (idx-fallback) hoppas tyst över", async () => {
    const p = product({
      variants: [variant("idx-0", { Färg: "Röd" }), variant("s2", { Färg: "Blå" })],
    });
    const getProduct = vi.fn(async () => ({
      variants: [
        { skuId: "s1", imageUrl: "red.jpg" }, // matchar ingen scrape-variant
        { skuId: "s2", imageUrl: "blue.jpg" },
      ],
    }));
    // Bara Blå (s2) matchar → en enda färg → buildSwatchImagesFromDs kräver ≥2 → {}.
    expect(await enrichSwatchImagesFromApi(p, { getProduct })).toEqual({});
  });
});

describe("namn-match efter översättning (load-bearing: swatch ↔ Wix-optionsval)", () => {
  it("backfilld swatch matchar de översatta variant-axlarna/-värdena", async () => {
    const variants = [variant("s1", { Color: "Red" }), variant("s2", { Color: "Blue" })];
    const getProduct = async () => ({
      variants: [
        { skuId: "s1", imageUrl: "r.jpg" },
        { skuId: "s2", imageUrl: "b.jpg" },
      ],
    });
    const swatch = await enrichSwatchImagesFromApi(product({ variants }), { getProduct });

    // Pipelinen översätter swatch-kartan (translateOptionColorCodes) och härleder
    // Wix-optioner ur översatta varianter (translateVariantOptions). Nycklarna MÅSTE
    // matcha annars kopplas inga bilder (det var ju hela buggen).
    const translatedSwatch = translateOptionColorCodes(swatch);
    const tAxis = Object.keys(translateVariantOptions({ Color: "Red" }))[0];
    const tRed = translateVariantOptions({ Color: "Red" })[tAxis];
    const tBlue = translateVariantOptions({ Color: "Blue" })[tAxis];

    expect(Object.keys(translatedSwatch)).toContain(tAxis);
    expect(translatedSwatch[tAxis][tRed]).toBe("r.jpg");
    expect(translatedSwatch[tAxis][tBlue]).toBe("b.jpg");
  });
});
