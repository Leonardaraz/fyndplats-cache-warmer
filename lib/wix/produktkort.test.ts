import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getV3ProduktKort } from "./v3-products";

// Formen är uppmätt mot skarpa V3 2026-09-30 (GET /stores/v3/products/slug/…
// på 3D-träpusslet): namn, slug, visible, media.main.image.url på wixstatic,
// actualPriceRange och variantsInfo.variants[].visible kommer utan `fields`.

const forut = process.env.WIX_API_TOKEN;
beforeEach(() => {
  process.env.WIX_API_TOKEN = "t";
});
afterEach(() => {
  if (forut === undefined) delete process.env.WIX_API_TOKEN;
  else process.env.WIX_API_TOKEN = forut;
  vi.unstubAllGlobals();
});

function svara(status: number, kropp: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(kropp), { status })),
  );
}

const PRODUKT = {
  id: "f9f0fc64",
  name: "3D-träpussel raket – mekanisk rymdfärja",
  slug: "3d-trapussel-raket-rymdfarja",
  visible: true,
  media: { main: { image: { url: "https://static.wixstatic.com/media/b379ce_b1c6~mv2.jpg" } } },
  actualPriceRange: { minValue: { amount: "1139" }, maxValue: { amount: "1139" } },
  variantsInfo: { variants: [{ id: "v1", visible: true, inventoryStatus: { inStock: false } }] },
};

describe("getV3ProduktKort", () => {
  it("läser det kunden ser: namn, adress, bild och pris", async () => {
    svara(200, { product: PRODUKT });
    expect(await getV3ProduktKort("f9f0fc64")).toEqual({
      id: "f9f0fc64",
      namn: "3D-träpussel raket – mekanisk rymdfärja",
      slug: "3d-trapussel-raket-rymdfarja",
      visible: true,
      bildUrl: "https://static.wixstatic.com/media/b379ce_b1c6~mv2.jpg",
      pris: { min: 1139, max: 1139 },
      varianter: [{ id: "v1", visible: true, namn: "", bildUrl: undefined, pris: undefined }],
      harSynligVariant: true,
    });
  });

  it("☠️ variantens namn, bild och pris läses ur valen — inte ur variantens egen media", async () => {
    // Formen uppmätt på det tvåfärgade sängbordet 2026-09-30: varianten bär
    // bara val-id, och dess `media` var ekdekorns bild även på den vita.
    svara(200, {
      product: {
        ...PRODUKT,
        options: [
          {
            id: "opt-farg",
            name: "Färg",
            choicesSettings: {
              choices: [
                { choiceId: "c-ek", name: "Ekdekor", linkedMedia: [{ image: { url: "https://static.wixstatic.com/media/ek.jpg" } }] },
                { choiceId: "c-vit", name: "Vit", linkedMedia: [{ image: { url: "https://static.wixstatic.com/media/vit.jpg" } }] },
              ],
            },
          },
        ],
        variantsInfo: {
          variants: [
            {
              id: "v-ek",
              visible: true,
              choices: [{ optionChoiceIds: { optionId: "opt-farg", choiceId: "c-ek" } }],
              price: { actualPrice: { amount: "1099" } },
              media: { image: { url: "https://static.wixstatic.com/media/ek.jpg" } },
            },
            {
              id: "v-vit",
              visible: true,
              choices: [{ optionChoiceIds: { optionId: "opt-farg", choiceId: "c-vit" } }],
              price: { actualPrice: { amount: "1149" } },
              media: { image: { url: "https://static.wixstatic.com/media/ek.jpg" } },
            },
          ],
        },
      },
    });
    expect((await getV3ProduktKort("s"))?.varianter).toEqual([
      { id: "v-ek", visible: true, namn: "Ekdekor", bildUrl: "https://static.wixstatic.com/media/ek.jpg", pris: 1099 },
      { id: "v-vit", visible: true, namn: "Vit", bildUrl: "https://static.wixstatic.com/media/vit.jpg", pris: 1149 },
    ]);
  });

  it("två axlar ger namnet i optionernas ordning", async () => {
    svara(200, {
      product: {
        ...PRODUKT,
        options: [
          { id: "farg", choicesSettings: { choices: [{ choiceId: "g", name: "Grå" }] } },
          { id: "storlek", choicesSettings: { choices: [{ choiceId: "s", name: "110 cm" }] } },
        ],
        variantsInfo: {
          variants: [
            {
              id: "v",
              choices: [
                { optionChoiceIds: { optionId: "storlek", choiceId: "s" } },
                { optionChoiceIds: { optionId: "farg", choiceId: "g" } },
              ],
            },
          ],
        },
      },
    });
    expect((await getV3ProduktKort("s"))?.varianter[0].namn).toBe("Grå / 110 cm");
  });

  it("☠️ en produkt vars enda variant är dold saknar synlig variant — butiken visar Slutsåld", async () => {
    svara(200, { product: { ...PRODUKT, variantsInfo: { variants: [{ id: "v1", visible: false }] } } });
    expect((await getV3ProduktKort("f9f0fc64"))?.harSynligVariant).toBe(false);
  });

  it("olika pris per variant blir ett spann", async () => {
    svara(200, {
      product: { ...PRODUKT, actualPriceRange: { minValue: { amount: "499" }, maxValue: { amount: "649" } } },
    });
    expect((await getV3ProduktKort("f9f0fc64"))?.pris).toEqual({ min: 499, max: 649 });
  });

  it("ett oläsbart pris utelämnas i stället för att bli noll", async () => {
    svara(200, { product: { ...PRODUKT, actualPriceRange: undefined } });
    expect((await getV3ProduktKort("f9f0fc64"))?.pris).toBeUndefined();
  });

  it("404 är en produkt som inte finns", async () => {
    svara(404, { message: "not found" });
    expect(await getV3ProduktKort("borta")).toBeNull();
  });

  it("☠️ ett läsfel kastar — det får aldrig se ut som en produkt som inte finns", async () => {
    svara(503, { message: "unavailable" });
    await expect(getV3ProduktKort("f9f0fc64")).rejects.toThrow(/503/);
  });
});
