import { describe, expect, it } from "vitest";
import type { ProductMappingRecord } from "@/lib/store";
import { golvAvKostnad, golvFor, kostnadExklMoms, lasFragor, MAX_RADER } from "./golv";

function mappning(over: Partial<ProductMappingRecord> & { kostnader?: (number | undefined)[] } = {}): ProductMappingRecord {
  const { kostnader = [115], ...rest } = over;
  return {
    supplierProductId: "aosom:prov",
    supplier: "aosom",
    wixProductId: "p1",
    variants: kostnader.map((k, i) => ({
      supplierVariantId: `v${i}`,
      sku: `s${i}`,
      wixVariantId: `w${i}`,
      choices: {},
      costUsd: 0,
      landedCostSek: k as number,
      grossSek: 0,
    })),
    ...rest,
  } as ProductMappingRecord;
}

const ingaAuktioner = new Set<string>();

describe("golvet för medlemspriset", () => {
  it("G = C × 1,10 × 1,25, uppåt till hela kronor så att kostnaden inte syns på öret", () => {
    // 115 kr: 158,125 kr exakt, 158,13 kr på öret, 159 kr efter avrundningen.
    expect(golvAvKostnad(11_500)).toBe(15_900);
    // 100 kr: 137,50 kr, 138 kr.
    expect(golvAvKostnad(10_000)).toBe(13_800);
    // Jämna kronor stannar.
    expect(golvAvKostnad(8_000)).toBe(11_000);
    expect(() => golvAvKostnad(0)).toThrow();
    expect(() => golvAvKostnad(12.5)).toThrow();
  });

  it("☠️ husets landedCostSek är inklusive moms: golvet är landedCostSek × 1,10, inte × 1,375", () => {
    // 100 kr landat inkl. moms = 80 kr exkl. moms; G = 80 × 1,10 × 1,25 = 110 kr.
    expect(kostnadExklMoms(10_000)).toBe(8_000);
    const m = new Map([["p1", mappning({ kostnader: [100] })]]);
    const [rad] = golvFor([{ produktId: "p1" }], m, ingaAuktioner);
    expect(rad.kostnadOre).toBe(8_000);
    expect(rad.golvOre).toBe(11_000);
    // Uppåt till öre: golvet blir aldrig lägre än 1,10 × den landade kostnaden.
    for (const inkl of [1, 99, 12_345, 99_999, 123_457, 1_000_001]) {
      const g = golvAvKostnad(kostnadExklMoms(inkl));
      expect(g).toBeGreaterThanOrEqual(Math.ceil((inkl * 110) / 100));
      expect(g).toBeLessThanOrEqual(Math.ceil((inkl * 110) / 100 / 100) * 100 + 100);
    }
    expect(() => kostnadExklMoms(0)).toThrow();
  });

  it("Aosom och VEVOR får golv; varianten matchas på Wix-id", () => {
    const m = new Map([
      ["p1", mappning({ kostnader: [100, 200] })],
      ["p2", mappning({ wixProductId: "p2", supplier: "vevor", supplierProductId: "vevor:x" })],
    ]);
    const svar = golvFor(
      [
        { produktId: "p1", variantId: "w1" },
        { produktId: "p2", variantId: "w0" },
      ],
      m,
      ingaAuktioner,
    );
    expect(svar[0]).toEqual({ produktId: "p1", variantId: "w1", golvOre: golvAvKostnad(16_000), kostnadOre: 16_000 });
    expect(svar[1].golvOre).toBe(golvAvKostnad(9_200));
  });

  it("utan träff på varianten används den dyraste, och bara om alla har en kostnad", () => {
    const m = new Map([["p1", mappning({ kostnader: [100, 300, 200] })]]);
    expect(golvFor([{ produktId: "p1", variantId: "okand" }], m, ingaAuktioner)[0]).toEqual({
      produktId: "p1",
      variantId: "okand",
      golvOre: golvAvKostnad(24_000),
      kostnadOre: 24_000,
      hogstaVariant: true,
    });
    const lucka = new Map([["p1", mappning({ kostnader: [100, undefined] })]]);
    expect(golvFor([{ produktId: "p1" }], lucka, ingaAuktioner)[0].utan).toBe("saknar-kostnad");
    // En produkt med en enda variant: standardvarianten och inget id fungerar.
    const en = new Map([["p1", mappning({ kostnader: [100] })]]);
    expect(golvFor([{ produktId: "p1", variantId: "00000000-0000-0000-0000-000000000000" }], en, ingaAuktioner)[0].kostnadOre).toBe(8_000);
    expect(golvFor([{ produktId: "p1" }], en, ingaAuktioner)[0].kostnadOre).toBe(8_000);
  });

  it("AliExpress, okänd leverantör, fyndauktion, flagga och saknad mappning ger inget golv", () => {
    const m = new Map<string, ProductMappingRecord>([
      ["ae", mappning({ wixProductId: "ae", supplier: undefined, supplierProductId: "1005001" })],
      ["ok", mappning({ wixProductId: "ok", supplier: "hittepa" as never })],
      ["auk", mappning({ wixProductId: "auk" })],
      ["flagg", mappning({ wixProductId: "flagg", ejMedlemspris: true })],
      ["noll", mappning({ wixProductId: "noll", kostnader: [0] })],
    ]);
    const svar = golvFor(
      ["ae", "ok", "auk", "flagg", "noll", "finns-inte"].map((produktId) => ({ produktId })),
      m,
      new Set(["auk"]),
    );
    expect(svar.map((r) => r.utan)).toEqual([
      "aliexpress",
      "okand-leverantor",
      "auktion",
      "flaggad",
      "saknar-kostnad",
      "saknar-mappning",
    ]);
    for (const r of svar) {
      expect(r.golvOre).toBeNull();
      expect(r.kostnadOre).toBeNull();
    }
  });

  it("butikens fråga prövas: id-form, antal och variant", () => {
    expect(lasFragor({ rader: [{ produktId: "a-1", variantId: "b-2" }] })).toEqual([{ produktId: "a-1", variantId: "b-2" }]);
    expect(lasFragor({ rader: [{ produktId: "a-1" }] })).toEqual([{ produktId: "a-1", variantId: null }]);
    expect(lasFragor({ rader: [] })).toBeNull();
    expect(lasFragor({ rader: [{ produktId: "a b" }] })).toBeNull();
    expect(lasFragor({ rader: [{ produktId: "a", variantId: "<x>" }] })).toBeNull();
    expect(lasFragor({ rader: Array.from({ length: MAX_RADER + 1 }, () => ({ produktId: "a" })) })).toBeNull();
    expect(lasFragor(null)).toBeNull();
  });
});
