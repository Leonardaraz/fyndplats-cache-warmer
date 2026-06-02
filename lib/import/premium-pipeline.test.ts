// Verifierar premium-orkestreringen (generatePremiumContent) med ALLA Claude-anrop
// mockade — inga riktiga API-anrop. Fokus: rätt sammansättning + judge-grinden
// (godkänd → klar; underkänd → en extra förfining + ny judge) + thin-input-skyddet.

import { afterEach, describe, expect, it, vi } from "vitest";
import type { AliExpressProduct } from "./types";
import type { SeoResult } from "./seo";

const {
  generatePremiumDescription,
  refinePremiumDescription,
  generatePremiumFaq,
  generateSeoMeta,
  judgeQuality,
  suggestCategory,
  generateTabs,
} = vi.hoisted(() => ({
  generatePremiumDescription: vi.fn(),
  refinePremiumDescription: vi.fn(),
  generatePremiumFaq: vi.fn(),
  generateSeoMeta: vi.fn(),
  judgeQuality: vi.fn(),
  suggestCategory: vi.fn(),
  generateTabs: vi.fn(),
}));

vi.mock("./generate-premium", () => ({ generatePremiumDescription, refinePremiumDescription }));
vi.mock("./faq-gen", () => ({ generatePremiumFaq }));
vi.mock("./seo-gen", () => ({ generateSeoMeta }));
vi.mock("./quality-judge", () => ({ judgeQuality }));
vi.mock("../claude/client", () => ({ suggestCategory }));
vi.mock("./tabs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./tabs")>();
  return { ...actual, generateTabs };
});

import { generatePremiumContent } from "./premium-pipeline";

const SEO: SeoResult = {
  title: "Premiumtitel",
  metaDescription: "preliminär meta",
  descriptionHtml: "<p>Rik beskrivning som målar upp ögonblicket.</p>",
  slug: "premiumtitel",
  suggestedCategory: "",
  imageAltTexts: ["alt1", "alt2"],
};

function product(over: Partial<AliExpressProduct> = {}): AliExpressProduct {
  return {
    supplierProductId: "AE-9",
    sourceUrl: "https://www.aliexpress.com/item/9.html",
    rawTitle: "Bärbar Bluetooth-högtalare vattentät med kraftig bas",
    rawDescription: "En liten högtalare med bra bas och lång batteritid för utomhusbruk.",
    imageUrls: ["https://img/1.jpg", "https://img/2.jpg"],
    variants: [{ supplierVariantId: "1", options: { Color: "Svart" }, costUsd: 5, included: true }],
    specifications: { Material: "ABS" },
    packageContents: ["1 x Speaker"],
    ...over,
  };
}

const COLLECTIONS = [{ slug: "elektronik", name: "Elektronik" }];

function wireDefaults() {
  generatePremiumDescription.mockResolvedValue({ seo: SEO, critique: "kritik" });
  refinePremiumDescription.mockResolvedValue({ ...SEO, descriptionHtml: "<p>Förbättrad.</p>" });
  generatePremiumFaq.mockResolvedValue([{ q: "Är den vattentät?", a: "Ja." }]);
  generateSeoMeta.mockResolvedValue({ chosen: "vald meta", variants: ["a", "b", "c"], reason: "ctr" });
  suggestCategory.mockResolvedValue({ collectionSlug: "elektronik", confidence: 0.9, reason: "" });
  generateTabs.mockResolvedValue({
    specs: [{ label: "Material", value: "ABS" }],
    packageContents: ["1 x Högtalare"],
    faq: [{ q: "Haiku-fråga?", a: "Haiku-svar." }],
    careHtml: null,
  });
}

afterEach(() => vi.clearAllMocks());

describe("generatePremiumContent", () => {
  it("godkänd judge → publiceras, ingen extra förfining, premium-FAQ används", async () => {
    wireDefaults();
    judgeQuality.mockResolvedValue({ score: 9.7, passed: true, feedback: "" });

    const r = await generatePremiumContent(product(), COLLECTIONS);

    expect(r.quality.passed).toBe(true);
    expect(r.refined).toBe(false);
    expect(refinePremiumDescription).not.toHaveBeenCalled();
    // Opus-FAQ vinner över Haiku-FAQ.
    expect(r.content.tabs.faq).toEqual([{ q: "Är den vattentät?", a: "Ja." }]);
    // SEO-meta från A/B-väljaren.
    expect(r.content.seo.metaDescription).toBe("vald meta");
    expect(r.seoMetaVariants).toEqual(["a", "b", "c"]);
    expect(r.content.category.collectionSlug).toBe("elektronik");
  });

  it("underkänd judge → en extra förfining + ny judge", async () => {
    wireDefaults();
    judgeQuality
      .mockResolvedValueOnce({ score: 8.5, passed: false, feedback: "höj hooken" })
      .mockResolvedValueOnce({ score: 9.6, passed: true, feedback: "" });

    const r = await generatePremiumContent(product(), COLLECTIONS);

    expect(refinePremiumDescription).toHaveBeenCalledTimes(1);
    expect(judgeQuality).toHaveBeenCalledTimes(2);
    expect(r.refined).toBe(true);
    expect(r.quality.passed).toBe(true);
    expect(r.content.seo.descriptionHtml).toContain("Förbättrad");
    // Meta behålls genom förfiningen.
    expect(r.content.seo.metaDescription).toBe("vald meta");
  });

  it("fortfarande underkänd efter förfining → passed=false (flaggas senare för polering)", async () => {
    wireDefaults();
    judgeQuality.mockResolvedValue({ score: 9.0, passed: false, feedback: "fortfarande svagt" });

    const r = await generatePremiumContent(product(), COLLECTIONS);
    expect(r.refined).toBe(true);
    expect(r.quality.passed).toBe(false);
  });

  it("tom premium-FAQ → faller tillbaka på Haiku-FAQ", async () => {
    wireDefaults();
    generatePremiumFaq.mockResolvedValue([]);
    judgeQuality.mockResolvedValue({ score: 9.7, passed: true, feedback: "" });

    const r = await generatePremiumContent(product(), COLLECTIONS);
    expect(r.content.tabs.faq).toEqual([{ q: "Haiku-fråga?", a: "Haiku-svar." }]);
  });

  it("thin input → ingen Opus, alltid underkänd dom (manuell polering)", async () => {
    wireDefaults();
    const r = await generatePremiumContent(product({ rawTitle: "x" }), COLLECTIONS);

    expect(generatePremiumDescription).not.toHaveBeenCalled();
    expect(judgeQuality).not.toHaveBeenCalled();
    expect(r.quality.passed).toBe(false);
    expect(r.content.tabs.faq).toEqual([]);
  });
});
