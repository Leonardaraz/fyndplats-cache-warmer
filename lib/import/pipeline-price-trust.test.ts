// Prisspärren sedd FRÅN IMPORTPRODUCT — inte bara från den rena funktionen.
//
// price-trust.test.ts bevisar att bedömningen är rätt. Det här beviser att den
// är INKOPPLAD: att en produkt vars varianter delar pris utan per-SKU-täckning
// faktiskt skapas osynlig i Wix och bär motiveringen vidare. Utan ett test på
// den nivån kan kopplingen tyst falla bort (fel variabel, fel ordning, en
// omskriven visible-rad) medan alla enhetstester står gröna.
//
// Bakgrund: Leonards rapport 2026-08-20 — 4-pack och 6-pack båda 589 kr.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AliExpressProduct, PricingRules } from "./types";

const { createProduct } = vi.hoisted(() => ({
  createProduct: vi.fn(
    async (input: { slug?: string; visible?: boolean; variants?: { sku: string }[] }) => ({
      id: "wix-prod-1",
      slug: input.slug || "produkt",
      revision: "1",
      variants: (input.variants ?? []).map((v, i) => ({ id: `v${i}`, sku: v.sku })),
    }),
  ),
}));

// DS-uppslaget: styrs per test så vi kan spela upp båda felmoderna (kastar =
// uppslaget föll, tomma varianter = avstämningen avbryter) och det lyckade
// fallet där DS bekräftar att priserna FAKTISKT är lika.
const { getProduct } = vi.hoisted(() => ({ getProduct: vi.fn() }));

vi.mock("../wix/client", () => ({
  createProduct,
  getCollections: vi.fn(async () => []),
  addProductToCollection: vi.fn(async () => undefined),
  linkChoiceMedia: vi.fn(async () => 0),
}));
vi.mock("../aliexpress/client", () => ({ getProduct }));
vi.mock("../wix/media", () => ({
  importMediaUrls: vi.fn(async (items: { url: string }[]) =>
    items.map((it, i) => ({ url: it.url, id: `m${i}` })),
  ),
  importMediaByUrl: vi.fn(async (url: string) => ({ url, id: "x" })),
}));
vi.mock("../audit", () => ({ audit: vi.fn(async () => undefined) }));

import { importProduct } from "./pipeline";

const RULES: PricingRules = {
  usdToSek: 10,
  vatRatePercent: 25,
  defaultMultiplier: 2,
  fixedSurchargeSek: 0,
  categoryMultipliers: {},
  tiersEnabled: false,
  tiers: [],
  rounding: "none",
};

/** Produkt som skrapats med DOM-fallbacken: dom-id och ETT pris på allt. */
function domFallbackProdukt(costUsd = 22.9): AliExpressProduct {
  return {
    supplierProductId: "1005012184926577",
    sourceUrl: "https://www.aliexpress.com/item/1005012184926577.html",
    rawTitle: "Tomatstöd i metall stapelbart för växthus och odling",
    rawDescription: "Stapelbara tomatstöd i lackerad metall för växthus.",
    imageUrls: ["https://img.example/1.jpg"],
    variants: [
      { supplierVariantId: "dom-0", options: { Antal: "4-pack" }, costUsd, included: true },
      { supplierVariantId: "dom-1", options: { Antal: "6-pack" }, costUsd, included: true },
    ],
    specifications: {},
    packageContents: [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.IMPORT_DRAFT_DEFAULT;
});
afterEach(() => vi.clearAllMocks());

describe("importProduct — prisspärren", () => {
  it("skapar produkten OSYNLIG när DS-uppslaget föll", async () => {
    getProduct.mockRejectedValueOnce(new Error("DS 503"));

    const r = await importProduct(domFallbackProdukt(), RULES, undefined, { enableAI: false });

    expect(createProduct.mock.calls[0][0].visible).toBe(false);
    expect(r.priceUnverified).toMatch(/DS-uppslaget föll/);
    expect(r.priceUnverified).toMatch(/underprisade/);
  });

  it("skapar produkten OSYNLIG när avstämningen avbryts", async () => {
    // DS svarar, men ingen SKU går att para ihop → matchningen underkänns.
    getProduct.mockResolvedValueOnce({
      productId: "1005012184926577",
      variants: [
        { skuId: "9001", price: 22.9, stock: 5, skuProps: { Helt: "Annat" } },
        { skuId: "9002", price: 31.5, stock: 5, skuProps: { Något: "Annat" } },
      ],
    });

    const r = await importProduct(domFallbackProdukt(), RULES, undefined, { enableAI: false });

    expect(createProduct.mock.calls[0][0].visible).toBe(false);
    expect(r.priceUnverified).toMatch(/avbröts/);
  });

  // DEN VIKTIGA MOTVIKTEN, hela vägen genom pipelinen: bekräftar DS att
  // priserna är lika är produkten helt i sin ordning och ska INTE hållas kvar.
  it("flaggar INTE när DS bekräftar att priserna verkligen är lika", async () => {
    getProduct.mockResolvedValueOnce({
      productId: "1005012184926577",
      variants: [
        { skuId: "9001", price: 22.9, stock: 5, skuProps: { Antal: "4-pack" } },
        { skuId: "9002", price: 22.9, stock: 5, skuProps: { Antal: "6-pack" } },
      ],
    });

    const r = await importProduct(domFallbackProdukt(), RULES, undefined, { enableAI: false });

    expect(r.priceUnverified).toBeUndefined();
  });

  // Och när DS har de RIKTIGA priserna ska de slå igenom hela vägen till
  // variantmappningen — det är trots allt det som var felet från början.
  it("rättar priserna när DS har dem, och flaggar då ingenting", async () => {
    getProduct.mockResolvedValueOnce({
      productId: "1005012184926577",
      variants: [
        { skuId: "9001", price: 22.9, stock: 5, skuProps: { Antal: "4-pack" } },
        { skuId: "9002", price: 31.5, stock: 5, skuProps: { Antal: "6-pack" } },
      ],
    });

    const r = await importProduct(domFallbackProdukt(), RULES, undefined, { enableAI: false });

    expect(r.priceUnverified).toBeUndefined();
    const kostnader = r.variantMappings.map((v) => v.costUsd).sort((a, b) => a - b);
    expect(kostnader).toEqual([22.9, 31.5]);
    // Och priserna i butiken skiljer sig därmed också.
    const priser = new Set(r.variantMappings.map((v) => v.grossSek));
    expect(priser.size).toBe(2);
  });
});
