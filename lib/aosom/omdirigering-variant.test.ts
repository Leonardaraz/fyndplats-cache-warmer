import { describe, expect, it } from "vitest";
import type { ProductMappingRecord } from "../store";
import { AOSOM_ID_PREFIX } from "./to-product";
import { arSammanslagenUtanVariant, givarensArtikel, planeraVariantmal } from "./omdirigering-variant";

const RAD = { fromSlug: "knastol-kram", toPath: "/produkt/knastol-gra", reason: "Sammanslagen: sidan är nu ett val på en annan sida" };

function mappning(o: Partial<ProductMappingRecord>): ProductMappingRecord {
  return { wixProductId: "x", variants: [], ...o } as ProductMappingRecord;
}
const variant = (supplierVariantId: string, sku: string, wixVariantId?: string) =>
  ({ supplierVariantId, sku, wixVariantId, choices: {}, costUsd: 0, landedCostSek: 0, grossSek: 0 });

/** En pensionerad givare: artikeln står bara kvar på varianten. */
const GIVARE = mappning({ wixProductId: "g", supplierProductId: "", variants: [variant("A-2", "FP-kram")] });
const BEHALL = mappning({
  wixProductId: "b",
  variants: [variant("A-1", "FP-gra", "v-gra"), variant("A-2", "FP-gra-kram", "v-kram")],
});
const WIX = [{ id: "v-gra", sku: "FP-gra" }, { id: "v-kram", sku: "FP-gra-kram" }];

describe("arSammanslagenUtanVariant", () => {
  it("bara sammanslagningens rader, och bara de utan fråga", () => {
    expect(arSammanslagenUtanVariant(RAD)).toBe(true);
    expect(arSammanslagenUtanVariant({ ...RAD, toPath: "/produkt/knastol-gra?variant=v" })).toBe(false);
    expect(arSammanslagenUtanVariant({ ...RAD, reason: "Borttagen hos leverantören" })).toBe(false);
  });
});

describe("givarensArtikel", () => {
  it("radens artikel före varianten, utan prefix och i versaler", () => {
    expect(givarensArtikel(mappning({ supplierProductId: `${AOSOM_ID_PREFIX}a-9`, variants: [variant("A-2", "s")] }))).toBe("A-9");
    expect(givarensArtikel(GIVARE)).toBe("A-2");
  });
});

describe("planeraVariantmal", () => {
  it("givarens artikel ger dess variant på sidan", () => {
    expect(planeraVariantmal({ rad: RAD, givare: GIVARE, behall: BEHALL, behallVarianter: WIX })).toEqual({
      status: "nytt_mal",
      variantId: "v-kram",
      toPath: "/produkt/knastol-gra?variant=v-kram",
    });
  });

  it("utan variant-id i mappningen avgör en ensam SKU-träff", () => {
    const behall = mappning({ variants: [variant("A-1", "FP-gra", "v-gra"), variant("A-2", "FP-gra-kram")] });
    expect(planeraVariantmal({ rad: RAD, givare: GIVARE, behall, behallVarianter: WIX })).toMatchObject({ variantId: "v-kram" });
  });

  it("en rad som redan pekar på en variant rörs inte", () => {
    const rad = { ...RAD, toPath: "/produkt/knastol-gra?variant=v-gra" };
    expect(planeraVariantmal({ rad, givare: GIVARE, behall: BEHALL, behallVarianter: WIX })).toEqual({ status: "redan_variant" });
  });

  it.each([
    ["givaren_hittas_inte", { givare: null }],
    ["givarens_artikel_saknas", { givare: mappning({ supplierProductId: "", variants: [] }) }],
    ["sidan_hittas_inte", { behall: null }],
    ["sidan_hittas_inte", { behallVarianter: null }],
    ["artikeln_inte_pa_sidan", { givare: mappning({ variants: [variant("Z-9", "s")] }) }],
    ["artikeln_pa_flera_varianter", {
      behall: mappning({ variants: [variant("A-2", "a", "v-gra"), variant("a-2 ", "b", "v-kram")] }),
    }],
    ["varianten_inte_i_wix", { behallVarianter: [{ id: "v-gra", sku: "FP-gra" }] }],
  ])("☠️ hellre ingen ändring än fel färg: %s", (skal, over) => {
    const inp = { rad: RAD, givare: GIVARE, behall: BEHALL, behallVarianter: WIX, ...over };
    expect(planeraVariantmal(inp as Parameters<typeof planeraVariantmal>[0])).toEqual({ status: "hoppad", skal });
  });

  it("☠️ två Wix-varianter med samma SKU räknas inte som en träff", () => {
    const behall = mappning({ variants: [variant("A-2", "FP-dubbel")] });
    const wix = [{ id: "v1", sku: "FP-dubbel" }, { id: "v2", sku: "FP-dubbel" }];
    expect(planeraVariantmal({ rad: RAD, givare: GIVARE, behall, behallVarianter: wix })).toEqual({
      status: "hoppad",
      skal: "varianten_inte_i_wix",
    });
  });
});
