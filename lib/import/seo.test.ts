import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SeoResult } from "./seo";
import type { AliExpressProduct } from "./types";

// Mocka LLM-lagret så testet inte gör nätverksanrop. completeJson är den enda
// utgående beroendet i seo.ts.
const completeJson = vi.fn();
vi.mock("../ai/claude", () => ({
  completeJson: (opts: unknown) => completeJson(opts),
}));

// Importeras EFTER mock så att mocken är på plats.
const { generateSeo } = await import("./seo");

function product(overrides: Partial<AliExpressProduct> = {}): AliExpressProduct {
  return {
    supplierProductId: "1005012298192440",
    sourceUrl: "https://www.aliexpress.com/item/1005012298192440.html",
    rawTitle: "Smart Body Fat Scale Bluetooth Digital Bathroom Weighing Scale",
    rawDescription: "Material: ABS\nDisplay: LED\nConnectivity: Bluetooth",
    imageUrls: ["https://ae01.alicdn.com/a.jpg", "https://ae01.alicdn.com/b.jpg"],
    variants: [
      { supplierVariantId: "v1", options: { Color: "White" }, costUsd: 20, included: true },
    ],
    ...overrides,
  };
}

const goodSeo: SeoResult = {
  title: "Smart Kroppsfettsvåg med Bluetooth",
  metaDescription: "Digital badrumsvåg som mäter vikt och kroppsfett, synkar via app.",
  descriptionHtml: "<p>Mät vikt, kroppsfett och BMI med denna smarta digitala våg.</p>",
  slug: "smart-kroppsfettsvag-bluetooth",
  suggestedCategory: "Hälsa",
  imageAltTexts: ["Kroppsfettsvåg vit framifrån", "Kroppsfettsvåg display"],
};

const contaminatedSeo: SeoResult = {
  title: "Fyndplats – Bästa Deals & Fynd Online",
  metaDescription: "Välkommen till Fyndplats – din destination för de bästa fynden på nätet!",
  descriptionHtml: "<p>Välkommen till Fyndplats – din destination för de bästa fynden på nätet!</p>",
  slug: "fyndplats",
  suggestedCategory: "",
  imageAltTexts: [],
};

beforeEach(() => {
  completeJson.mockReset();
});

describe("generateSeo — contamination guards", () => {
  it("passes a normal product's SEO straight through", async () => {
    completeJson.mockResolvedValue(goodSeo);
    const result = await generateSeo(product());
    expect(result.title).toBe("Smart Kroppsfettsvåg med Bluetooth");
    expect(completeJson).toHaveBeenCalledOnce();
  });

  it("never ships store/homepage copy even if the LLM returns it (uses fail-open)", async () => {
    completeJson.mockResolvedValue(contaminatedSeo);
    const p = product();
    const result = await generateSeo(p);
    // Måste FALLA TILLBAKA till råtiteln, aldrig returnera Fyndplats-copy.
    expect(result.title).not.toMatch(/fyndplats/i);
    expect(result.descriptionHtml).not.toMatch(/välkommen till fyndplats/i);
    expect(result.title).toBe(p.rawTitle.slice(0, 70));
  });

  it("skips the LLM entirely for thin/failed-scrape input", async () => {
    const result = await generateSeo(product({ rawTitle: "Våg", rawDescription: "" }));
    expect(completeJson).not.toHaveBeenCalled();
    // Fail-open: titeln blir råtiteln, aldrig påhittad butikscopy.
    expect(result.title).not.toMatch(/fyndplats/i);
    expect(result.title).toBe("Våg");
  });
});
