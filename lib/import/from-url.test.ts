import { describe, it, expect } from "vitest";
import { buildSwatchImagesFromDs, cleanAliCdnUrl } from "./from-url";
import type { AliExpressDsVariant } from "../aliexpress/types";

function dsv(skuId: string, skuProps: Record<string, string>, imageUrl?: string): AliExpressDsVariant {
  return { skuId, skuProps, imageUrl, price: 1 };
}

describe("cleanAliCdnUrl", () => {
  it("strippar suffix EFTER filändelsen", () => {
    expect(cleanAliCdnUrl("https://ae01.alicdn.com/kf/abc.jpg_220x220q75.jpg_.avif")).toBe(
      "https://ae01.alicdn.com/kf/abc.jpg",
    );
  });
  it("strippar storleks-suffix FÖRE filändelsen", () => {
    expect(cleanAliCdnUrl("https://ae01.alicdn.com/kf/abc_220x220.jpg")).toBe(
      "https://ae01.alicdn.com/kf/abc.jpg",
    );
    expect(cleanAliCdnUrl("https://ae01.alicdn.com/kf/abc_50x50q75.webp")).toBe(
      "https://ae01.alicdn.com/kf/abc.webp",
    );
  });
  it("lämnar redan rena URL:er orörda", () => {
    expect(cleanAliCdnUrl("https://ae01.alicdn.com/kf/abc.jpg")).toBe(
      "https://ae01.alicdn.com/kf/abc.jpg",
    );
  });
  it("normaliserar protokoll-relativ URL", () => {
    expect(cleanAliCdnUrl("//ae01.alicdn.com/kf/abc.jpg")).toBe("https://ae01.alicdn.com/kf/abc.jpg");
  });
  it("tom input → tom sträng", () => {
    expect(cleanAliCdnUrl(undefined)).toBe("");
    expect(cleanAliCdnUrl("")).toBe("");
  });
  it("rör inte URL:er med query-sträng (undviker mangling av query)", () => {
    expect(cleanAliCdnUrl("https://ae01.alicdn.com/kf/abc.png?w=a.jpg.webp")).toBe(
      "https://ae01.alicdn.com/kf/abc.png?w=a.jpg.webp",
    );
    expect(cleanAliCdnUrl("https://ae01.alicdn.com/kf/Sreal.png?sig=v_100x100.png")).toBe(
      "https://ae01.alicdn.com/kf/Sreal.png?sig=v_100x100.png",
    );
  });
});

describe("buildSwatchImagesFromDs", () => {
  it("väljer färg-axeln (distinkta bilder) och ignorerar storlek", () => {
    const variants = [
      dsv("s1", { Color: "Red", Size: "S" }, "red.jpg"),
      dsv("s2", { Color: "Red", Size: "M" }, "red.jpg"),
      dsv("s3", { Color: "Blue", Size: "S" }, "blue.jpg"),
      dsv("s4", { Color: "Blue", Size: "M" }, "blue.jpg"),
    ];
    expect(buildSwatchImagesFromDs(variants)).toEqual({
      Color: { Red: "red.jpg", Blue: "blue.jpg" },
    });
  });

  it("föredrar färg-axeln framför storlek även när storlek står först (audit #6)", () => {
    // Båda axlarna kvalificerar (varje värde → 1 distinkt bild), men Size står först
    // i skuProps. Utan färg-preferens skulle Size felaktigt få bilderna.
    const variants = [
      dsv("s1", { Size: "S", Color: "Red" }, "red.jpg"),
      dsv("s2", { Size: "L", Color: "Blue" }, "blue.jpg"),
    ];
    expect(buildSwatchImagesFromDs(variants)).toEqual({ Color: { Red: "red.jpg", Blue: "blue.jpg" } });
  });

  it("returnerar undefined när alla SKU:er delar SAMMA bild (ingen riktig swatch-axel)", () => {
    const variants = [
      dsv("s1", { Color: "Red", Size: "S" }, "hero.jpg"),
      dsv("s2", { Color: "Blue", Size: "M" }, "hero.jpg"),
    ];
    expect(buildSwatchImagesFromDs(variants)).toBeUndefined();
  });

  it("returnerar undefined för enkel-värdes-axel (en färg)", () => {
    const variants = [dsv("s1", { Color: "Red", Size: "S" }, "r.jpg"), dsv("s2", { Color: "Red", Size: "M" }, "r.jpg")];
    expect(buildSwatchImagesFromDs(variants)).toBeUndefined();
  });

  it("returnerar undefined när bilden varierar INOM en färg (inkonsistent)", () => {
    const variants = [
      dsv("s1", { Color: "Red", Size: "S" }, "red_s.jpg"),
      dsv("s2", { Color: "Red", Size: "M" }, "red_m.jpg"),
      dsv("s3", { Color: "Blue", Size: "S" }, "blue_s.jpg"),
      dsv("s4", { Color: "Blue", Size: "M" }, "blue_m.jpg"),
    ];
    expect(buildSwatchImagesFromDs(variants)).toBeUndefined();
  });

  it("rensar thumbnail-suffix från DS-bilderna (full-res linkedMedia)", () => {
    const variants = [
      dsv("s1", { Color: "Red" }, "https://ae01.alicdn.com/kf/red.jpg_220x220q75.jpg"),
      dsv("s2", { Color: "Blue" }, "https://ae01.alicdn.com/kf/blue_640x640.jpg"),
    ];
    expect(buildSwatchImagesFromDs(variants)).toEqual({
      Color: {
        Red: "https://ae01.alicdn.com/kf/red.jpg",
        Blue: "https://ae01.alicdn.com/kf/blue.jpg",
      },
    });
  });
});

// --- Specar hela vägen från DS-svaret (audit 2026-08-18) --------------------
//
// Serverns importväg (CSV/bulk) har ingen webbläsare. Innan detta byggdes
// produkten utan `specifications` överhuvudtaget → tom spec-flik på varje
// produkt som kom in den vägen, och magert underlag för SEO-poleringen.
import { convertDsToAliExpressProduct } from "./from-url";
import type { AliExpressDsProduct } from "../aliexpress/types";

function ds(patch: Partial<AliExpressDsProduct> = {}): AliExpressDsProduct {
  return {
    productId: "1005007857803500",
    title: "SucceBuy Inflatable Paint Booth",
    description: "…",
    images: ["https://ae01.alicdn.com/kf/a.jpg"],
    variants: [{ skuId: "1", skuProps: { Size: "23ft" }, price: 671 }],
    ...patch,
  };
}

describe("convertDsToAliExpressProduct — specar följer med", () => {
  it("DS-egenskaper blir specifications", () => {
    const { product } = convertDsToAliExpressProduct(
      ds({ properties: { Material: "Oxford Cloth", "Brand Name": "SucceBuy" } }),
      "https://www.aliexpress.com/item/1005007857803500.html",
    );
    expect(product.specifications).toEqual({ Material: "Oxford Cloth", "Brand Name": "SucceBuy" });
  });

  it("utan egenskaper sätts fältet inte alls — oförändrat beteende", () => {
    const utan = convertDsToAliExpressProduct(ds(), "https://x").product;
    expect(utan.specifications).toBeUndefined();
    const tomma = convertDsToAliExpressProduct(ds({ properties: {} }), "https://x").product;
    expect(tomma.specifications).toBeUndefined();
  });
});

describe("lagerlandet följer med från DS (fynd 2026-08-20)", () => {
  // Bulk-vägen kopierade aldrig shipFrom, så VARJE CSV-importerad produkt fick
  // tom shipsFromCountries på mappningen → ingen EU-ribbon, inget EU-filter och
  // inget underlag för lager-failovern.
  const ds = {
    productId: "1005005913089619",
    title: "Gängverktygssats",
    description: "",
    images: ["https://img/1.jpg"],
    shipsFromCountries: ["ES", "CN"],
    variants: [
      { skuId: "9001", price: 22.9, stock: 5, skuProps: { Color: "40 PCs Metric" }, shipFrom: "ES" },
      { skuId: "9002", price: 31.5, stock: 3, skuProps: { Color: "110 PCs Metric" }, shipFrom: "CN" },
    ],
  } as unknown as Parameters<typeof convertDsToAliExpressProduct>[0];

  it("varje variant bär sitt lagerland", () => {
    const { product } = convertDsToAliExpressProduct(ds, "https://x/y.html");
    expect(product.variants.map((v) => v.shipFrom)).toEqual(["ES", "CN"]);
  });

  it("produkten bär de aggregerade lagerländerna", () => {
    const { product } = convertDsToAliExpressProduct(ds, "https://x/y.html");
    expect(product.shipsFrom).toEqual(["ES", "CN"]);
  });

  it("och priserna skiljer sig fortfarande per variant", () => {
    const { product } = convertDsToAliExpressProduct(ds, "https://x/y.html");
    expect(product.variants.map((v) => v.costUsd)).toEqual([22.9, 31.5]);
  });
});
