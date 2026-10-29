// Importpipelinen frågar AliExpress DS-API:t bara om en AliExpress-produkt.
//
// Fram till 2026-10-29 gjorde variantbildens och beskrivningens kompletteringar
// ett DS-anrop för varje produkt utan färgbilder, och då gick varje
// Aosom-import ut till AliExpress med Aosoms artikelnummer som produkt-id. Ett
// anrop som aldrig kan träffa, mot fel leverantör. VEVOR-importen hade gjort
// samma sak med VEVOR:s nummer. Allt här är påhittat.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AliExpressProduct, PricingRules } from "./types";

const { getProduct } = vi.hoisted(() => ({ getProduct: vi.fn() }));
vi.mock("../aliexpress/client", () => ({ getProduct, getTracking: vi.fn(), createOrder: vi.fn() }));
vi.mock("../claude/client", () => ({
  analyzeImages: vi.fn(async () => []),
  suggestCategory: vi.fn(async () => ({ collectionSlug: null, confidence: 0, reason: "" })),
  completeJsonRouted: vi.fn(),
  TEXT_MODEL: "claude-haiku-4-5-20251001",
}));
vi.mock("../wix/client", () => ({
  createProduct: vi.fn(async (input: { slug?: string; variants?: { sku: string }[] }) => ({
    id: "wix-prod-1",
    slug: input.slug || "produkt",
    revision: "1",
    variants: (input.variants ?? []).map((v, i) => ({ id: `v${i}`, sku: v.sku })),
  })),
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

/** En produkt som gör alla tre kompletteringarna aktuella: inga färgbilder, tunn text, inga specar. */
function produkt(supplierProductId: string): AliExpressProduct {
  return {
    supplierProductId,
    sourceUrl: "https://example.test/produkt",
    rawTitle: "Testvagn",
    rawDescription: "Kort.",
    imageUrls: ["https://img.example.test/1.jpg"],
    variants: [{ supplierVariantId: "V1", options: {}, costUsd: 10, included: true }],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getProduct.mockRejectedValue(new Error("ska inte anropas"));
  process.env.AI_ENRICHMENT_ENABLED = "false";
});
afterEach(() => {
  delete process.env.AI_ENRICHMENT_ENABLED;
});

describe("importProduct och AliExpress DS-API:t", () => {
  it("☠️ en VEVOR- eller Aosom-produkt skickas aldrig till AliExpress", async () => {
    await importProduct(produkt("vevor:TESTSKUABCDEFGH0001"), RULES, undefined, { qualityMode: "raw" });
    await importProduct(produkt("aosom:000-000TEST"), RULES, undefined, { qualityMode: "raw" });
    expect(getProduct).not.toHaveBeenCalled();
  });

  it("en AliExpress-produkt kompletteras som förut", async () => {
    await importProduct(produkt("1005000000000001"), RULES, undefined, { qualityMode: "raw" });
    expect(getProduct).toHaveBeenCalledWith("1005000000000001");
  });
});
