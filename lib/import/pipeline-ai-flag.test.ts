// Verifierar AI_ENRICHMENT_ENABLED-master-switchen från importProduct:s sida:
//   • flagga AV (flags.enableAI=false) → NOLL Claude-anrop, produkt skapas RÅ
//     (draft/visible:false, needsAiPolish=true), rå titel/beskrivning används.
//   • flagga PÅ (flags.enableAI=true) → AI-stegen körs som vanligt.
//
// Alla externa beroenden (Wix, media, audit) mockas. AI-funktionerna är spioner
// så vi kan assert:a att de INTE anropas i RÅ-läge (= $0 Anthropic, vilket är
// hela poängen med flaggan).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AliExpressProduct, PricingRules } from "./types";

// --- Spioner på AI-anropen ---------------------------------------------------
// vi.hoisted: vi.mock-fabrikerna hissas till toppen, så spionerna måste skapas
// i ett hissat block för att vara tillgängliga inuti fabrikerna.
const {
  analyzeImages,
  suggestCategory,
  generateProductContent,
  generateSeo,
  generateTabs,
} = vi.hoisted(() => ({
  analyzeImages: vi.fn(async (urls: string[]) =>
    urls.map((url) => ({ url, verdict: "ok" as const, reason: "" })),
  ),
  suggestCategory: vi.fn(async () => ({ collectionSlug: null, confidence: 0, reason: "" })),
  generateProductContent: vi.fn(async () => ({
    seo: {
      title: "AI-genererad titel",
      metaDescription: "meta",
      descriptionHtml: "<p>AI-beskrivning</p>",
      slug: "ai-slug",
      suggestedCategory: "",
      imageAltTexts: [],
    },
    category: { collectionSlug: null, confidence: 0, reason: "" },
    tabs: { specs: [], packageContents: [], faq: [], careHtml: null },
  })),
  generateSeo: vi.fn(),
  generateTabs: vi.fn(),
}));

vi.mock("../claude/client", () => ({
  analyzeImages,
  suggestCategory,
  completeJsonRouted: vi.fn(),
  TEXT_MODEL: "claude-haiku-4-5-20251001",
}));

vi.mock("./generate", () => ({ generateProductContent }));

vi.mock("./seo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./seo")>();
  return { ...actual, generateSeo };
});

vi.mock("./tabs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./tabs")>();
  return { ...actual, generateTabs };
});

// --- Mock:ade externa sidoeffekter ------------------------------------------
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
vi.mock("../wix/client", () => ({
  createProduct,
  getCollections: vi.fn(async () => []),
  addProductToCollection: vi.fn(async () => undefined),
  linkChoiceMedia: vi.fn(async () => 0),
}));

vi.mock("../wix/media", () => ({
  importMediaUrls: vi.fn(async (items: { url: string }[]) =>
    items.map((it, i) => ({ url: it.url, id: `m${i}` })),
  ),
  importMediaByUrl: vi.fn(async (url: string) => ({ url, id: "x" })),
}));

vi.mock("../audit", () => ({ audit: vi.fn(async () => undefined) }));

// Importeras EFTER mock-deklarationerna (vi.mock hissas, men importProduct ska
// binda mot mockarna).
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
    supplierProductId: "AE-123",
    sourceUrl: "https://www.aliexpress.com/item/123.html",
    rawTitle: "Trådlös Bluetooth-högtalare bärbar vattentät",
    rawDescription: "En bra liten högtalare med kraftigt bas och lång batteritid.",
    imageUrls: ["https://img.example/1.jpg", "https://img.example/2.jpg"],
    variants: [
      { supplierVariantId: "1", options: { Color: "Black" }, costUsd: 5, included: true },
      { supplierVariantId: "2", options: { Color: "Blue" }, costUsd: 5, included: true },
    ],
    specifications: { Material: "ABS", Battery: "2000mAh" },
    packageContents: ["1 x Speaker", "1 x Cable"],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.IMPORT_DRAFT_DEFAULT;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("importProduct — AI_ENRICHMENT_ENABLED av (rå import)", () => {
  it("gör NOLL Claude-anrop och skapar produkten RÅ (draft + needs_ai_polish)", async () => {
    const result = await importProduct(makeProduct(), RULES, undefined, { enableAI: false });

    // Inte ETT enda AI-anrop.
    expect(analyzeImages).not.toHaveBeenCalled();
    expect(suggestCategory).not.toHaveBeenCalled();
    expect(generateProductContent).not.toHaveBeenCalled();
    expect(generateSeo).not.toHaveBeenCalled();
    expect(generateTabs).not.toHaveBeenCalled();

    // Produkten skapas men som draft (osynlig) och flaggas för polering.
    expect(createProduct).toHaveBeenCalledTimes(1);
    expect(createProduct.mock.calls[0][0].visible).toBe(false);
    expect(result.needsAiPolish).toBe(true);

    // Rå titel/beskrivning används (buildFallbackSeo, ingen LLM).
    expect(result.seo.title).toBe("Trådlös Bluetooth-högtalare bärbar vattentät");
    expect(result.seo.descriptionHtml).toContain("högtalare");

    // Kategorin lämnas okategoriserad (ingen AI-kategorisering).
    expect(result.categorySuggestion.status).toBe("uncategorized");
    expect(result.categorySuggestion.collectionSlug).toBeNull();
  });

  it("tvingar draft även när IMPORT_DRAFT_DEFAULT=false", async () => {
    process.env.IMPORT_DRAFT_DEFAULT = "false";
    await importProduct(makeProduct(), RULES, undefined, { enableAI: false });
    expect(createProduct.mock.calls[0][0].visible).toBe(false);
  });

  it("respekterar env AI_ENRICHMENT_ENABLED=false utan explicit flagga", async () => {
    const prev = process.env.AI_ENRICHMENT_ENABLED;
    process.env.AI_ENRICHMENT_ENABLED = "false";
    try {
      const result = await importProduct(makeProduct(), RULES);
      expect(analyzeImages).not.toHaveBeenCalled();
      expect(generateProductContent).not.toHaveBeenCalled();
      expect(result.needsAiPolish).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.AI_ENRICHMENT_ENABLED;
      else process.env.AI_ENRICHMENT_ENABLED = prev;
    }
  });
});

describe("importProduct — AI_ENRICHMENT_ENABLED på (normal import)", () => {
  it("kör AI-stegen och flaggar INTE för polering", async () => {
    const prev = process.env.AI_ENRICHMENT_ENABLED;
    delete process.env.AI_ENRICHMENT_ENABLED; // default = på
    try {
      const result = await importProduct(makeProduct(), RULES, undefined, { enableAI: true });

      // Bild-analys + sammanslaget text-anrop körs (batchat flöde är default på).
      expect(analyzeImages).toHaveBeenCalledTimes(1);
      expect(generateProductContent).toHaveBeenCalledTimes(1);

      expect(result.needsAiPolish).toBeUndefined();
      expect(result.seo.title).toBe("AI-genererad titel");
    } finally {
      if (prev === undefined) delete process.env.AI_ENRICHMENT_ENABLED;
      else process.env.AI_ENRICHMENT_ENABLED = prev;
    }
  });
});
