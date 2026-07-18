// Verifierar att avbockade varianter (included:false) INTE importeras alls
// (Leonards beslut 2026-07-02): de ska varken skapas dolda, ta plats i options-
// härledningen (Wix ≤100 val/option + delade customization-listor) eller påverka
// produktens metadata. Legacy-beteendet (skapa dolda) ligger bakom
// IMPORT_KEEP_DESELECTED_VARIANTS=true och testas också.
//
// Alla externa beroenden (Wix, media, audit, AI) mockas — samma scaffolding som
// pipeline-ai-flag.test.ts. Testerna kör i RÅ-läge (enableAI:false) och med
// variant-AI/backfills avstängda för full determinism ($0, inga nätanrop).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AliExpressProduct, PricingRules } from "./types";

const { analyzeImages, suggestCategory, generateProductContent } = vi.hoisted(() => ({
  analyzeImages: vi.fn(async (urls: string[]) =>
    urls.map((url) => ({ url, verdict: "ok" as const, reason: "" })),
  ),
  suggestCategory: vi.fn(async () => ({ collectionSlug: null, confidence: 0, reason: "" })),
  generateProductContent: vi.fn(),
}));

vi.mock("../claude/client", () => ({
  analyzeImages,
  suggestCategory,
  completeJsonRouted: vi.fn(),
  TEXT_MODEL: "claude-haiku-4-5-20251001",
}));

vi.mock("./generate", () => ({ generateProductContent }));

// --- Mock:ade externa sidoeffekter ------------------------------------------
interface CreatedVariant {
  sku: string;
  visible: boolean;
  choices: Record<string, string>;
  inventoryQuantity: number;
}
interface CreatedInput {
  slug?: string;
  visible?: boolean;
  plainDescription?: string;
  options?: { name: string; choices: { name: string }[] }[];
  variants: CreatedVariant[];
}
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

/** 3 färgvarianter där "Red" är avbockad i popupen. */
function makeColorProduct(overrides?: Partial<AliExpressProduct>): AliExpressProduct {
  return {
    supplierProductId: "AE-777",
    sourceUrl: "https://www.aliexpress.com/item/777.html",
    rawTitle: "Praktisk förvaringslåda i plast med lock",
    rawDescription:
      "En rymlig och stapelbar förvaringslåda i tålig plast med tättslutande lock. " +
      "Perfekt för garderoben, garaget eller flytten. Enkel att bära med stadiga handtag.",
    imageUrls: ["https://img.example/1.jpg", "https://img.example/2.jpg"],
    variants: [
      { supplierVariantId: "s1", options: { Color: "Black" }, costUsd: 5, stock: 10, included: true },
      { supplierVariantId: "s2", options: { Color: "Blue" }, costUsd: 5, stock: 5, included: true },
      { supplierVariantId: "s3", options: { Color: "Red" }, costUsd: 5, stock: 1, included: false },
    ],
    specifications: { Material: "PP" },
    packageContents: ["1 x Låda"],
    ...overrides,
  };
}

const ENV_KEYS = [
  "IMPORT_KEEP_DESELECTED_VARIANTS",
  "IMPORT_VARIANT_TRIM",
  "IMPORT_VARIANT_TRIM_MAX",
  "IMPORT_DRAFT_DEFAULT",
  "VARIANT_AI_TRANSLATION_ENABLED",
  "IMPORT_VARIANT_IMAGE_BACKFILL",
  "IMPORT_DESCRIPTION_BACKFILL",
] as const;
const savedEnv = new Map<string, string | undefined>();

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of ENV_KEYS) savedEnv.set(k, process.env[k]);
  // Determinism: statisk varianttabell (inga AI-anrop), inga DS-backfills.
  process.env.VARIANT_AI_TRANSLATION_ENABLED = "false";
  process.env.IMPORT_VARIANT_IMAGE_BACKFILL = "false";
  process.env.IMPORT_DESCRIPTION_BACKFILL = "false";
  delete process.env.IMPORT_KEEP_DESELECTED_VARIANTS;
  delete process.env.IMPORT_VARIANT_TRIM;
  delete process.env.IMPORT_VARIANT_TRIM_MAX;
  delete process.env.IMPORT_DRAFT_DEFAULT;
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    const v = savedEnv.get(k);
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  vi.clearAllMocks();
});

function createdInput(): CreatedInput {
  expect(createProduct).toHaveBeenCalledTimes(1);
  return createProduct.mock.calls[0][0] as unknown as CreatedInput;
}

describe("importProduct — avbockade varianter (default: utelämnas helt)", () => {
  it("skapar INTE avbockade varianter, inte ens dolda", async () => {
    await importProduct(makeColorProduct(), RULES, undefined, { enableAI: false });

    const input = createdInput();
    // Bara de 2 valda varianterna — ingen tredje dold.
    expect(input.variants).toHaveLength(2);
    expect(input.variants.every((v) => v.visible === true)).toBe(true);
    // Båda har riktigt lager (inte legacy-mönstrets qty=0 på dolda).
    expect(input.variants.every((v) => v.inventoryQuantity > 0)).toBe(true);
  });

  it("härleder options bara ur valda varianter (avbockat val tar ingen kvotplats)", async () => {
    await importProduct(makeColorProduct(), RULES, undefined, { enableAI: false });

    const input = createdInput();
    expect(input.options).toHaveLength(1);
    const choiceNames = input.options![0].choices.map((c) => c.name);
    expect(choiceNames).toHaveLength(2);
    // Det avbockade valet (Red/Röd) finns inte bland optionsvalen.
    expect(choiceNames.some((n) => /red|röd/i.test(n))).toBe(false);
  });

  it("axel som blir enväljare av urvalet kollapsar till spec (ingen död väljare)", async () => {
    const product = makeColorProduct({
      variants: [
        { supplierVariantId: "s1", options: { Size: "90x30 cm" }, costUsd: 8, included: true },
        { supplierVariantId: "s2", options: { Size: "120x40 cm" }, costUsd: 9, included: false },
      ],
    });
    await importProduct(product, RULES, undefined, { enableAI: false });

    const input = createdInput();
    // Inga options alls — den kvarvarande axeln har 1 värde → spec i stället.
    expect(input.options).toBeUndefined();
    expect(input.variants).toHaveLength(1);
    expect(input.variants[0].choices).toEqual({});
    // Värdet syns ändå — som spec-rad i beskrivningen.
    expect(input.plainDescription).toContain("90x30");
  });

  it("kastar när ALLA varianter är avbockade", async () => {
    const product = makeColorProduct();
    product.variants = product.variants.map((v) => ({ ...v, included: false }));
    await expect(importProduct(product, RULES, undefined, { enableAI: false })).rejects.toThrow(
      "Inga varianter valda",
    );
  });

  it("variant-trim utelämnar trimmade varianter helt (drop, inte dolda)", async () => {
    process.env.IMPORT_VARIANT_TRIM = "true";
    process.env.IMPORT_VARIANT_TRIM_MAX = "2";
    const product = makeColorProduct();
    product.variants = product.variants.map((v) => ({ ...v, included: true })); // 3 valda

    await importProduct(product, RULES, undefined, { enableAI: false });

    const input = createdInput();
    expect(input.variants).toHaveLength(2);
    expect(input.variants.every((v) => v.visible === true)).toBe(true);
  });
});

describe("importProduct — legacy-läget (IMPORT_KEEP_DESELECTED_VARIANTS=true)", () => {
  it("skapar avbockade varianter dolda med qty=0 (gamla beteendet)", async () => {
    process.env.IMPORT_KEEP_DESELECTED_VARIANTS = "true";
    await importProduct(makeColorProduct(), RULES, undefined, { enableAI: false });

    const input = createdInput();
    expect(input.variants).toHaveLength(3);
    const hidden = input.variants.filter((v) => v.visible === false);
    expect(hidden).toHaveLength(1);
    expect(hidden[0].inventoryQuantity).toBe(0);
    // Options omfattar även det avbockade valet i legacy-läget.
    expect(input.options).toHaveLength(1);
    expect(input.options![0].choices).toHaveLength(3);
  });
});
