// Spec-backfill via DS-API:t (audit 2026-08-18).
//
// Måleritältet (AE 1005007857803500) importerades med tre innehållslösa
// specrader ("High-concerned chemical: None", "Brand Name", "Type: Awnings") —
// exakt den första kollapsade batchen. Spec-blocket lazy-renderas hos
// leverantören och ligger dessutom avkortat bakom "View more", så en skrapa som
// läser DOM:en i befintligt skick får i bästa fall toppen av listan.
//
// Tillägget fäller numera ut sidan först, men det är en klient vi inte styr
// versionen på — och en tom spec-flik ger dessutom magert underlag för
// SEO-poleringen, vilket är svårt att upptäcka i efterhand. Servern fyller
// därför i från DS-svaret när skrapan inte gav något.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AliExpressProduct, PricingRules } from "./types";

const { getProduct } = vi.hoisted(() => ({ getProduct: vi.fn() }));
vi.mock("../aliexpress/client", () => ({
  getProduct,
  getTracking: vi.fn(),
  createOrder: vi.fn(),
}));

vi.mock("../claude/client", () => ({
  analyzeImages: vi.fn(async () => []),
  suggestCategory: vi.fn(async () => ({ collectionSlug: null, confidence: 0, reason: "" })),
  completeJsonRouted: vi.fn(),
  TEXT_MODEL: "claude-haiku-4-5-20251001",
}));

const { createProduct } = vi.hoisted(() => ({
  createProduct: vi.fn(async (input: { slug?: string; variants?: { sku: string }[] }) => ({
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

/** Måleritältet som det faktiskt kom in: riktigt produkt-id, inga specar. */
function tältet(patch: Partial<AliExpressProduct> = {}): AliExpressProduct {
  return {
    supplierProductId: "1005007857803500",
    sourceUrl: "https://www.aliexpress.com/item/1005007857803500.html",
    rawTitle: "SucceBuy Inflatable Paint Booth with Blowers and Air Filter System",
    rawDescription: "Uppblåsbar målerihall med fläktar och filtersystem.",
    imageUrls: ["https://img.example/1.jpg"],
    variants: [
      { supplierVariantId: "14:200", options: { Size: "23ft" }, costUsd: 671, included: true },
    ],
    ...patch,
  };
}

const DS_SVAR = {
  productId: "1005007857803500",
  title: "SucceBuy Inflatable Paint Booth",
  description: "",
  images: [],
  variants: [],
  properties: { Material: "Oxford Cloth", "Brand Name": "SucceBuy", "Power Source": "Electric" },
};

beforeEach(() => {
  vi.clearAllMocks();
  getProduct.mockResolvedValue(DS_SVAR);
  process.env.AI_ENRICHMENT_ENABLED = "false";
});
afterEach(() => {
  vi.clearAllMocks();
  delete process.env.AI_ENRICHMENT_ENABLED;
});

describe("importProduct — spec-backfill när skrapan gav inga specar", () => {
  it("fyller spec-fliken ur DS-svaret i stället för att skapa produkten utan specar", async () => {
    const res = await importProduct(tältet(), RULES, {});
    expect(res.wixProductId).toBeTruthy();
    expect(getProduct).toHaveBeenCalledWith("1005007857803500");

    // Spec-fliken bakas in i beskrivnings-HTML:en (appendTabSections), inte i
    // Wix infoSections — det är där man ska leta efter den.
    const payload = createProduct.mock.calls[0][0] as { plainDescription?: string };
    expect(payload.plainDescription ?? "").toContain("Oxford Cloth");
    expect(payload.plainDescription ?? "").toContain("SucceBuy");
  });

  it("rör INTE specarna när skrapan faktiskt gav några", async () => {
    await importProduct(tältet({ specifications: { Material: "Från sidan" } }), RULES, {});
    const payload = createProduct.mock.calls[0][0] as { plainDescription?: string };
    expect(payload.plainDescription ?? "").toContain("Från sidan");
    expect(payload.plainDescription ?? "").not.toContain("Oxford Cloth");
  });

  it("ett DS-fel fäller aldrig importen — produkten skapas utan specar som förut", async () => {
    getProduct.mockRejectedValue(new Error("AliExpress API-fel: ApiCallLimit"));
    const res = await importProduct(tältet(), RULES, {});
    expect(res.wixProductId).toBeTruthy();
  });

  it("ett DS-svar utan egenskaper ger inga påhittade specar", async () => {
    getProduct.mockResolvedValue({ ...DS_SVAR, properties: {} });
    const res = await importProduct(tältet(), RULES, {});
    expect(res.wixProductId).toBeTruthy();
    const payload = createProduct.mock.calls[0][0] as { plainDescription?: string };
    expect(payload.plainDescription ?? "").not.toContain("Oxford");
  });

  it("backfillar inte för icke-numeriska produkt-id", async () => {
    // Samma id-vakt som prisavstämningen använder. (getProduct kan ändå
    // anropas av beskrivnings-backfillen, som har egna villkor — det vi låser
    // här är att SPECARNA inte fylls i för ett id vi inte litar på.)
    await importProduct(tältet({ supplierProductId: "AE-123" }), RULES, {});
    const payload = createProduct.mock.calls[0][0] as { plainDescription?: string };
    expect(payload.plainDescription ?? "").not.toContain("Oxford Cloth");
  });
});
