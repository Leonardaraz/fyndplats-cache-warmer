import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mocka @anthropic-ai/sdk så vi styr messages.create per-test (samma mönster som
// lib/claude/client.test.ts). completeJsonRouted, generateSeo, suggestCategory och
// generateTabs går alla genom denna stub.
const mockCreate = vi.fn();
vi.mock("@anthropic-ai/sdk", () => {
  return { default: class { messages = { create: mockCreate }; } };
});

import { generateProductContent } from "./generate";
import { __resetLlmMemoryStore } from "../llm/storage";
import { __clearMemCache } from "../llm/cache";
import type { CollectionOption } from "../claude/types";
import type { AliExpressProduct } from "./types";

function textMessage(text: string) {
  return { content: [{ type: "text", text }], usage: { input_tokens: 10, output_tokens: 20 } };
}

const COLLECTIONS: CollectionOption[] = [
  { slug: "kok", name: "Kök & Husgeråd", description: "Köksredskap" },
  { slug: "leksaker", name: "Leksaker" },
];

function product(overrides: Partial<AliExpressProduct> = {}): AliExpressProduct {
  return {
    supplierProductId: "AE123",
    sourceUrl: "https://www.aliexpress.com/item/123.html",
    rawTitle: "Stainless steel kitchen scale 5kg digital",
    rawDescription: "Digital kitchen scale with LCD display, 5kg capacity, tare function.",
    imageUrls: ["https://x.com/1.jpg", "https://x.com/2.jpg"],
    variants: [{ supplierVariantId: "v1", options: { Color: "Black" }, costUsd: 4, included: true }],
    specifications: { Material: "Stainless steel", Capacity: "5kg" },
    features: ["LCD display", "Tare function"],
    packageContents: ["1 x Scale", "1 x Manual"],
    ...overrides,
  };
}

const MERGED_JSON = JSON.stringify({
  seo: {
    title: "Digital köksvåg i rostfritt stål 5 kg",
    metaDescription: "Precis köksvåg med LCD och tara-funktion, 5 kg kapacitet.",
    descriptionHtml: "<p>Väg ingredienser exakt med denna digitala köksvåg.</p>",
    slug: "digital-koksvag-rostfritt-stal",
    imageAltTexts: ["Köksvåg framifrån", "Köksvåg med skål"],
  },
  category: { collection_slug: "kok", confidence: 0.9, reason: "produkten är en köksvåg" },
  tabs: {
    specs: [
      { label: "Material", value: "Rostfritt stål" },
      { label: "Kapacitet", value: "5 kg" },
    ],
    packageContents: ["1 x Våg", "1 x Manual"],
    faq: [
      { q: "Är vågen vattentät?", a: "Tål stänk men sänk inte ned i vatten." },
      { q: "Vilket batteri används?", a: "2x AAA, medföljer." },
      { q: "Kan den nollställas?", a: "Ja, tara-funktion finns." },
    ],
    careHtml: "<p>Torka av med en fuktig trasa efter användning.</p>",
  },
});

beforeEach(() => {
  mockCreate.mockReset();
  process.env.ANTHROPIC_API_KEY = "sk-ant-test";
  delete process.env.GEMINI_API_KEY;
  delete process.env.LLM_PROVIDER_DEFAULT;
  delete process.env.ANTHROPIC_DAILY_BUDGET_USD;
  delete process.env.CLAUDE_BATCH_MODEL;
  delete process.env.CLAUDE_AUTO_CATEGORIZATION;
  __resetLlmMemoryStore();
  __clearMemCache();
});

afterEach(() => vi.clearAllMocks());

describe("generateProductContent — sammanslaget anrop", () => {
  it("gör EN Claude-anrop och mappar seo/kategori/flikar", async () => {
    mockCreate.mockResolvedValueOnce(textMessage(MERGED_JSON));
    const content = await generateProductContent(product(), COLLECTIONS);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(content.seo.title).toBe("Digital köksvåg i rostfritt stål 5 kg");
    expect(content.seo.imageAltTexts).toHaveLength(2);
    expect(content.category.collectionSlug).toBe("kok");
    expect(content.category.confidence).toBe(0.9);
    expect(content.tabs.faq).toHaveLength(3);
    expect(content.tabs.specs[0]).toEqual({ label: "Material", value: "Rostfritt stål" });
    // careHtml behålls eftersom "Kök & Husgeråd" är care-relevant.
    expect(content.tabs.careHtml).toContain("fuktig trasa");
  });

  it("använder default Haiku-modell och respekterar CLAUDE_BATCH_MODEL", async () => {
    mockCreate.mockResolvedValueOnce(textMessage(MERGED_JSON));
    await generateProductContent(product(), COLLECTIONS);
    expect(mockCreate.mock.calls[0][0].model).toBe("claude-haiku-4-5-20251001");

    __clearMemCache();
    __resetLlmMemoryStore();
    mockCreate.mockReset();
    process.env.CLAUDE_BATCH_MODEL = "claude-sonnet-4-6";
    mockCreate.mockResolvedValueOnce(textMessage(MERGED_JSON));
    await generateProductContent(product({ supplierProductId: "AE999" }), COLLECTIONS);
    expect(mockCreate.mock.calls[0][0].model).toBe("claude-sonnet-4-6");
  });

  it("nollar careHtml när kategorin INTE är care-relevant", async () => {
    const json = JSON.parse(MERGED_JSON);
    json.category = { collection_slug: "leksaker", confidence: 0.8, reason: "leksak" };
    mockCreate.mockResolvedValueOnce(textMessage(JSON.stringify(json)));
    const content = await generateProductContent(product(), COLLECTIONS);
    expect(content.category.collectionSlug).toBe("leksaker");
    expect(content.tabs.careHtml).toBeNull();
  });

  it("avvisar ogiltig kategori-slug (inte i listan) → null", async () => {
    const json = JSON.parse(MERGED_JSON);
    json.category = { collection_slug: "påhittad", confidence: 0.95, reason: "x" };
    mockCreate.mockResolvedValueOnce(textMessage(JSON.stringify(json)));
    const content = await generateProductContent(product(), COLLECTIONS);
    expect(content.category.collectionSlug).toBeNull();
    expect(content.category.confidence).toBe(0);
  });

  it("faller tillbaka på de tre separata anropen vid ogiltig JSON (trunkering)", async () => {
    // 1:a anropet (sammanslaget) → trasig JSON → kastar → fallback gör 3 anrop:
    //   generateSeo, suggestCategory, generateTabs.
    mockCreate
      .mockResolvedValueOnce(textMessage('{"seo": {"title": "avhugget'))
      .mockResolvedValueOnce(
        textMessage(
          JSON.stringify({
            title: "Reservtitel",
            metaDescription: "m",
            descriptionHtml: "<p>d</p>",
            slug: "reserv",
            imageAltTexts: ["a", "b"],
          }),
        ),
      )
      .mockResolvedValueOnce(
        textMessage(JSON.stringify({ collection_slug: "kok", confidence: 0.7, reason: "köksvåg" })),
      )
      .mockResolvedValueOnce(
        textMessage(
          JSON.stringify({ specs: [], packageContents: [], faq: [{ q: "f?", a: "s." }], careHtml: null }),
        ),
      );

    const content = await generateProductContent(product(), COLLECTIONS);
    expect(mockCreate).toHaveBeenCalledTimes(4); // 1 misslyckat + 3 fallback
    expect(content.seo.title).toBe("Reservtitel");
    expect(content.category.collectionSlug).toBe("kok");
    expect(content.tabs.faq).toHaveLength(1);
  });

  it("använder fallback-SEO om outputen ser ut som butikscopy", async () => {
    const json = JSON.parse(MERGED_JSON);
    json.seo.title = "Välkommen till Fyndplats – bästa deals online";
    mockCreate.mockResolvedValueOnce(textMessage(JSON.stringify(json)));
    const content = await generateProductContent(product(), COLLECTIONS);
    // Fallback-SEO härleds ur råtiteln, inte butikscopyn.
    expect(content.seo.title).not.toMatch(/fyndplats/i);
    expect(content.seo.title).toContain("Stainless steel");
  });

  it("hoppar över LLM helt vid tunn produktdata", async () => {
    const content = await generateProductContent(
      product({ rawTitle: "x", specifications: {}, features: [], packageContents: [] }),
      [],
    );
    expect(mockCreate).not.toHaveBeenCalled();
    expect(content.category.collectionSlug).toBeNull();
  });
});
