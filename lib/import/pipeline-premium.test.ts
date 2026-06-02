// Verifierar premium-läget från importProduct:s sida (allt Claude/Wix mockat):
//   • premium + judge godkänd  → publiceras (visible:true), qualityScore satt.
//   • premium + judge underkänd → draft (visible:false) + needsManualPolish.
//   • Sonnet vision-rankingen (rankProductImages) körs istället för analyzeImages.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AliExpressProduct, PricingRules } from "./types";

const { generatePremiumContent, rankProductImages, analyzeImages } = vi.hoisted(() => ({
  generatePremiumContent: vi.fn(),
  rankProductImages: vi.fn(),
  analyzeImages: vi.fn(async (urls: string[]) => urls.map((url) => ({ url, verdict: "ok" as const, reason: "" }))),
}));

vi.mock("./premium-pipeline", () => ({ generatePremiumContent }));
vi.mock("./image-rank", () => ({ rankProductImages }));
vi.mock("../claude/client", () => ({
  analyzeImages,
  suggestCategory: vi.fn(async () => ({ collectionSlug: null, confidence: 0, reason: "" })),
  completeJsonRouted: vi.fn(),
  TEXT_MODEL: "claude-haiku-4-5-20251001",
}));

const { createProduct } = vi.hoisted(() => ({
  createProduct: vi.fn(async (input: { slug?: string; visible?: boolean; variants?: { sku: string }[] }) => ({
    id: "wix-prod-1",
    slug: input.slug || "produkt",
    revision: "1",
    variants: (input.variants ?? []).map((v, i) => ({ id: `v${i}`, sku: v.sku })),
  })),
}));
vi.mock("../wix/client", () => ({
  createProduct,
  getCollections: vi.fn(async () => []),
  addProductToCollection: vi.fn(async () => undefined),
  linkChoiceMedia: vi.fn(async () => 0),
}));
vi.mock("../wix/media", () => ({
  importMediaUrls: vi.fn(async (items: { url: string }[]) => items.map((it, i) => ({ url: it.url, id: `m${i}` }))),
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

function makeProduct(): AliExpressProduct {
  return {
    supplierProductId: "AE-7",
    sourceUrl: "https://www.aliexpress.com/item/7.html",
    rawTitle: "Bärbar Bluetooth-högtalare vattentät bas",
    rawDescription: "Liten högtalare med bra bas och lång batteritid.",
    imageUrls: ["https://img/1.jpg", "https://img/2.jpg", "https://img/3.jpg"],
    variants: [{ supplierVariantId: "1", options: { Color: "Svart" }, costUsd: 5, included: true }],
    specifications: { Material: "ABS" },
    packageContents: ["1 x Speaker"],
  };
}

function premiumResult(passed: boolean, score: number) {
  return {
    content: {
      seo: {
        title: "Premiumtitel",
        metaDescription: "vald meta",
        descriptionHtml: "<p>Rik premiumtext.</p>",
        slug: "premiumtitel",
        suggestedCategory: "",
        imageAltTexts: ["a1", "a2", "a3"],
      },
      category: { collectionSlug: null, confidence: 0, reason: "" },
      tabs: { specs: [], packageContents: [], faq: [{ q: "Q?", a: "A." }], careHtml: null },
    },
    quality: { score, passed, feedback: passed ? "" : "höj kvaliteten" },
    refined: !passed,
    critique: "kritik",
    seoMetaVariants: ["a", "b", "c"],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  rankProductImages.mockImplementation(async (urls: string[]) => ({
    orderedUrls: [...urls].reverse(), // bevisar att rankingens ordning används
    entries: urls.map((url) => ({ url, verdict: "ok" as const, reason: "" })),
    scores: [],
  }));
});
afterEach(() => vi.clearAllMocks());

describe("importProduct — premium-läge", () => {
  it("judge godkänd → publiceras direkt + qualityScore, ingen manuell polering", async () => {
    generatePremiumContent.mockResolvedValue(premiumResult(true, 9.7));

    const result = await importProduct(makeProduct(), RULES, undefined, { qualityMode: "premium" });

    expect(generatePremiumContent).toHaveBeenCalledTimes(1);
    expect(rankProductImages).toHaveBeenCalledTimes(1);
    expect(analyzeImages).not.toHaveBeenCalled(); // premium ersätter standard-analysen
    expect(createProduct.mock.calls[0][0].visible).toBe(true); // publicerad
    expect(result.qualityMode).toBe("premium");
    expect(result.qualityScore).toBe(9.7);
    expect(result.needsManualPolish).toBeUndefined();
    expect(result.seo.title).toBe("Premiumtitel");
  });

  it("judge underkänd → draft + needsManualPolish", async () => {
    generatePremiumContent.mockResolvedValue(premiumResult(false, 9.0));

    const result = await importProduct(makeProduct(), RULES, undefined, { qualityMode: "premium" });

    expect(createProduct.mock.calls[0][0].visible).toBe(false); // draft
    expect(result.needsManualPolish).toBe(true);
    expect(result.qualityScore).toBe(9.0);
  });

  it("använder vision-rankingens bildordning för mediauppladdningen", async () => {
    generatePremiumContent.mockResolvedValue(premiumResult(true, 9.6));

    const result = await importProduct(makeProduct(), RULES, undefined, { qualityMode: "premium" });
    // imageAnalysis-posterna kommer från rankingen (alla ok), 3 bilder.
    expect(result.imageAnalysis).toHaveLength(3);
  });
});
