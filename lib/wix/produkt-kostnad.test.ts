import { describe, expect, it } from "vitest";
import type { WixAnrop } from "../polish/skrivplan";
import {
  arKostnadNekad,
  kostnadAv,
  lasMedKostnad,
  likaKostnad,
  variantMedKostnad,
  variantsInfoMedKostnad,
} from "./produkt-kostnad";

const MED_KOSTNAD = {
  id: "v1",
  sku: "FP-bord",
  visible: true,
  revenueDetails: {
    cost: { amount: "850.00", formattedAmount: "850,00 kr" },
    profit: { amount: "150.00", formattedAmount: "150,00 kr" },
    profitMargin: 15,
  },
};

describe("lasMedKostnad", () => {
  it("lägger MERCHANT_DATA på en sökväg med fråga och på en utan", async () => {
    const sokvagar: string[] = [];
    const wix: WixAnrop = async (_m, sokvag) => {
      sokvagar.push(sokvag);
      return { product: {} };
    };
    const a = await lasMedKostnad(wix, "/stores/v3/products/p1?fields=MEDIA_ITEMS_INFO");
    const b = await lasMedKostnad(wix, "/stores/v3/products/p1");
    expect(sokvagar).toEqual([
      "/stores/v3/products/p1?fields=MEDIA_ITEMS_INFO&fields=MERCHANT_DATA",
      "/stores/v3/products/p1?fields=MERCHANT_DATA",
    ]);
    expect(a.kostnadLasbar).toBe(true);
    expect(b.kostnadLasbar).toBe(true);
  });

  it("☠️ läser om utan fältet när nyckeln inte får läsa kostnaden, och säger det", async () => {
    const sokvagar: string[] = [];
    const wix: WixAnrop = async (_m, sokvag) => {
      sokvagar.push(sokvag);
      if (sokvag.includes("MERCHANT_DATA")) {
        throw new Error('Wix 403: {"message":"NO_PERMISSION_TO_READ_MERCHANT_DATA"}');
      }
      return { product: { id: "p1" } };
    };
    const u = await lasMedKostnad(wix, "/stores/v3/products/p1?fields=VARIANT_OPTION_CHOICE_NAMES");
    expect(u.kostnadLasbar).toBe(false);
    expect(u.svar).toEqual({ product: { id: "p1" } });
    expect(sokvagar).toEqual([
      "/stores/v3/products/p1?fields=VARIANT_OPTION_CHOICE_NAMES&fields=MERCHANT_DATA",
      "/stores/v3/products/p1?fields=VARIANT_OPTION_CHOICE_NAMES",
    ]);
  });

  it("andra fel än ett nekat kostnadsfält kastas, utan en andra läsning", async () => {
    for (const fel of ["Wix 404: finns inte", "Wix 500: serverfel", "nätverksfel: reset"]) {
      let anrop = 0;
      const wix: WixAnrop = async () => {
        anrop++;
        throw new Error(fel);
      };
      await expect(lasMedKostnad(wix, "/stores/v3/products/p1")).rejects.toThrow(fel);
      expect(anrop).toBe(1);
    }
  });

  it("känner igen ett nekat kostnadsfält på 403 och på felkoden", () => {
    expect(arKostnadNekad(new Error("Wix 403: nej"))).toBe(true);
    expect(arKostnadNekad(new Error("Wix 400: NO_PERMISSION_TO_READ_MERCHANT_DATA"))).toBe(true);
    expect(arKostnadNekad(new Error("Wix 404: nej"))).toBe(false);
    expect(arKostnadNekad("Wix 403")).toBe(true);
  });
});

describe("variantMedKostnad", () => {
  it("behåller kostnaden, tar bort profit och profitMargin och rör inget annat", () => {
    const u = variantMedKostnad(MED_KOSTNAD);
    expect(u).toEqual({
      id: "v1",
      sku: "FP-bord",
      visible: true,
      revenueDetails: { cost: { amount: "850.00", formattedAmount: "850,00 kr" } },
    });
    // Originalet är orört.
    expect(MED_KOSTNAD.revenueDetails.profitMargin).toBe(15);
  });

  it("en variant utan kostnad skickas utan revenueDetails", () => {
    expect(variantMedKostnad({ id: "v2", revenueDetails: { profit: { amount: "1" } } })).toEqual({ id: "v2" });
    expect(variantMedKostnad({ id: "v3" })).toEqual({ id: "v3" });
  });
});

describe("variantsInfoMedKostnad", () => {
  it("går genom varje variant och lämnar resten av variantsInfo", () => {
    const u = variantsInfoMedKostnad({ variants: [MED_KOSTNAD, { id: "v2" }], annat: 1 });
    expect(u).toEqual({
      variants: [{ id: "v1", sku: "FP-bord", visible: true, revenueDetails: { cost: MED_KOSTNAD.revenueDetails.cost } }, { id: "v2" }],
      annat: 1,
    });
  });

  it("tål en variantsInfo utan varianter", () => {
    expect(variantsInfoMedKostnad(undefined)).toBeUndefined();
    expect(variantsInfoMedKostnad({ a: 1 })).toEqual({ a: 1 });
  });
});

describe("kostnadAv och likaKostnad", () => {
  it("läser kostnaden som text", () => {
    expect(kostnadAv(MED_KOSTNAD)).toBe("850.00");
    expect(kostnadAv({ revenueDetails: { cost: { amount: 50 } } })).toBe("50");
    expect(kostnadAv({ revenueDetails: { cost: { amount: "" } } })).toBeNull();
    expect(kostnadAv({ id: "v" })).toBeNull();
    expect(kostnadAv(null)).toBeNull();
  });

  it("50 och 50.00 är samma kostnad, en försvunnen kostnad är det aldrig", () => {
    expect(likaKostnad("50", "50.00")).toBe(true);
    expect(likaKostnad(null, undefined)).toBe(true);
    expect(likaKostnad("50.00", null)).toBe(false);
    expect(likaKostnad(null, "50.00")).toBe(false);
    expect(likaKostnad("50.00", "51.00")).toBe(false);
    expect(likaKostnad("abc", "abc")).toBe(true);
    expect(likaKostnad("abc", "abd")).toBe(false);
  });
});
