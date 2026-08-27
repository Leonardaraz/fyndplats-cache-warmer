import { describe, it, expect } from "vitest";
import {
  toImportProduct,
  buildSpecifications,
  bulletsToFeatures,
  cleanText,
  aosomSupplierProductId,
  isAosomSupplierProductId,
  valjBilder,
  RENA_BILDPOSITIONER,
  AOSOM_WAREHOUSE,
} from "./to-product";
import { computePriceWithRules } from "../import/pricing";
import type { AosomRow } from "./feed";
import type { PricingRules } from "../import/types";

const FX = { eurToSek: 11.1, usdToSek: 10.5 };

function rad(over: Partial<AosomRow> = {}): AosomRow {
  return {
    sku: "350-219V00PK",
    name: "Schminktisch Kinder, 2 in 1 mit Hocker",
    url: "https://www.aosom.de/item/x~350-219V00PK.html",
    imageUrls: ["https://img.aosomcdn.com/a.jpg", "https://img.aosomcdn.com/b.jpg"],
    category: "Baby & Kind > Spielzeug > Kinderrollenspiele",
    color: "Rosa",
    material: "Holzwerkstoff/Acryl",
    size: "79,5L x 33B x 90,7H cm",
    packageSize: "93.00x59.00x17.00 cm",
    weightKg: 18.55,
    descriptionHtml: "<p>Der [BRAND NAME] Kinder Schminktisch bietet Stauraum.</p>",
    bulletsHtml: "<ul><li>2-in-1-Design</li><li>Sicherer Dreifachspiegel</li></ul>",
    qty: 168,
    normalPriceEur: 103.9,
    wholesaleEur: 57.18,
    seFreightEur: 31.28,
    rowIndex: 1,
    ...over,
  };
}

describe("supplierProductId", () => {
  it("prefixar så ett Aosom-SKU aldrig kan förväxlas med ett AE-id", () => {
    expect(aosomSupplierProductId("845-030CG")).toBe("aosom:845-030CG");
    expect(isAosomSupplierProductId("aosom:845-030CG")).toBe(true);
    expect(isAosomSupplierProductId("1005010804316400")).toBe(false);
    expect(isAosomSupplierProductId(undefined)).toBe(false);
  });
});

describe("toImportProduct", () => {
  it("bär över identitet, källa och bilder", () => {
    const p = toImportProduct(rad(), FX);
    expect(p.supplierProductId).toBe("aosom:350-219V00PK");
    expect(p.sourceUrl).toBe("https://www.aosom.de/item/x~350-219V00PK.html");
    expect(p.imageUrls).toHaveLength(2);
    expect(p.shipsFrom).toEqual([AOSOM_WAREHOUSE]);
    expect(p.inStock).toBe(true);
  });

  it("ger EN variant utan valaxlar — Psin är ingen variantgrupp", () => {
    const p = toImportProduct(rad(), FX);
    expect(p.variants).toHaveLength(1);
    expect(p.variants[0].options).toEqual({});
    expect(p.variants[0].supplierVariantId).toBe("350-219V00PK");
    expect(p.variants[0].stock).toBe(168);
    expect(p.variants[0].included).toBe(true);
  });

  it("räknar costUsd så att landedCostSek blir varan PLUS frakten hit", () => {
    const r = rad();
    const p = toImportProduct(r, FX);
    // (57,18 + 31,28) × 11,10 = 981,91 kr landat.
    const rules = reglerMed(FX.usdToSek);
    const pris = computePriceWithRules(p.variants[0].costUsd, rules, null);
    expect(pris.costSek).toBeCloseTo(981.91, 1);
  });

  it("frakten får inte tappas — utan den blir marginalen fel åt samma håll", () => {
    const utan = toImportProduct(rad({ seFreightEur: 0 }), FX);
    const med = toImportProduct(rad(), FX);
    expect(med.variants[0].costUsd).toBeGreaterThan(utan.variants[0].costUsd);
    // 31,28 € frakt ÷ 10,5 kr/USD × 11,10 kr/EUR ≈ 33,07 USD.
    expect(med.variants[0].costUsd - utan.variants[0].costUsd).toBeCloseTo(33.07, 1);
  });

  it("slutsåld rad ger stock 0 och inStock false", () => {
    const p = toImportProduct(rad({ qty: 0 }), FX);
    expect(p.inStock).toBe(false);
    expect(p.variants[0].stock).toBe(0);
  });
});

describe("[BRAND NAME]-platshållaren", () => {
  it("stryks ur titel, brödtext och HTML", () => {
    const p = toImportProduct(
      rad({
        name: "[BRAND NAME] Schminktisch",
        descriptionHtml: "<p>Der [BRAND NAME] Tisch</p>",
        bulletsHtml: "<ul><li>[BRAND NAME] Qualität</li></ul>",
      }),
      FX,
    );
    expect(p.rawTitle).toBe("Schminktisch");
    expect(p.descriptionHtml).not.toMatch(/BRAND NAME/);
    expect(p.rawDescription).not.toMatch(/BRAND NAME/);
    expect(p.features?.join(" ")).not.toMatch(/BRAND NAME/);
  });

  it("cleanText kollapsar mellanrummet platshållaren lämnar efter sig", () => {
    expect(cleanText("Der [BRAND NAME] Tisch")).toBe("Der Tisch");
  });
});

describe("bildvalet", () => {
  const nio = Array.from({ length: 9 }, (_, i) => `https://img.aosomcdn.com/${i + 1}.jpg`);

  it("tar 1, 2, 3, 8 och 9 — de positioner där bilden mätbart sällan är tysk", () => {
    expect(RENA_BILDPOSITIONER).toEqual([1, 2, 3, 8, 9]);
    expect(valjBilder(nio)).toEqual([nio[0], nio[1], nio[2], nio[7], nio[8]]);
  });

  it("hoppar över 4-7 — 87 av 90 av dem bar tysk text i granskningen", () => {
    const valda = valjBilder(nio);
    for (const i of [3, 4, 5, 6]) expect(valda).not.toContain(nio[i]);
  });

  it("behåller feedens egen ordning", () => {
    expect(valjBilder(nio)).toEqual([...valjBilder(nio)].sort(
      (a, b) => nio.indexOf(a) - nio.indexOf(b),
    ));
  });

  it("klarar en produkt med färre än nio bilder", () => {
    expect(valjBilder(nio.slice(0, 8))).toEqual([nio[0], nio[1], nio[2], nio[7]]);
    expect(valjBilder(nio.slice(0, 3))).toEqual([nio[0], nio[1], nio[2]]);
  });

  it("släpper igenom ALLT hellre än att lämna produkten utan bilder", () => {
    // Positioner som inte finns → hellre nio tyska bilder än noll.
    expect(valjBilder(nio, [50, 60])).toEqual(nio);
    expect(valjBilder(nio, [])).toEqual(nio);
    expect(valjBilder([], [1, 2])).toEqual([]);
  });

  it("går att köra med egna positioner", () => {
    expect(valjBilder(nio, [1, 9])).toEqual([nio[0], nio[8]]);
    expect(valjBilder(nio, [1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual(nio);
  });

  it("toImportProduct använder regeln", () => {
    const p = toImportProduct(rad({ imageUrls: nio }), FX);
    expect(p.imageUrls).toHaveLength(5);
    expect(toImportProduct(rad({ imageUrls: nio }), FX, { positioner: [1] }).imageUrls).toEqual([nio[0]]);
  });
});

describe("buildSpecifications", () => {
  it("byggs ur de strukturerade kolumnerna — Specification-fältet är tomt i feeden", () => {
    expect(buildSpecifications(rad())).toEqual({
      "Mått": "79,5L x 33B x 90,7H cm",
      "Färg": "Rosa",
      "Material": "Holzwerkstoff/Acryl",
      "Vikt": "18,55 kg",
      "Paketmått": "93 × 59 × 17 cm",
    });
  });

  it("hoppar över tomma fält i stället för att skriva tomma rader", () => {
    const spec = buildSpecifications(rad({ color: "", material: "", weightKg: null, packageSize: "" }));
    expect(Object.keys(spec)).toEqual(["Mått"]);
  });

  it("skriver ALDRIG lagerlandet — Leonards regel 2026-08-15", () => {
    const spec = buildSpecifications(rad());
    const text = JSON.stringify(spec);
    for (const land of ["Tyskland", "Deutschland", "DE", "Neu Wulmstorf", "Schwanewede"]) {
      expect(text).not.toContain(land);
    }
  });

  it("skriver ALDRIG Aosoms artikelnummer — det är ett sökbart fingeravtryck", () => {
    // Koden står i Aosoms egen produkt-URL, så strängen kopplar ihop vår sida
    // med deras. Hela den publicerade katalogen är fri från leverantörsspår.
    expect(JSON.stringify(buildSpecifications(rad()))).not.toContain("350-219V00PK");
  });

  it("inget leverantörsspår når produkttexten över huvud taget", () => {
    const p = toImportProduct(rad(), FX);
    const kundtext = [
      p.rawTitle,
      p.rawDescription,
      p.descriptionHtml ?? "",
      (p.features ?? []).join(" "),
      JSON.stringify(p.specifications ?? {}),
    ].join(" ").toLowerCase();
    for (const spar of ["aosom", "homcom", "outsunny", "pawhut", "aiyaplay", "350-219v00pk"]) {
      expect(kundtext).not.toContain(spar);
    }
  });
});

describe("bulletsToFeatures", () => {
  it("plockar ut li-posterna som ren text", () => {
    expect(bulletsToFeatures("<ul><li>Ett</li><li>Två</li></ul>")).toEqual(["Ett", "Två"]);
  });

  it("avduplicerar och släpper skräpposter", () => {
    expect(bulletsToFeatures("<ul><li>Ett</li><li>ETT</li><li> </li><li>ab</li></ul>")).toEqual(["Ett"]);
  });

  it("avkodar entiteter och tyska omljud", () => {
    expect(bulletsToFeatures("<ul><li>Gr&ouml;&szlig;e &amp; Qualit&auml;t</li></ul>"))
      .toEqual(["Größe & Qualität"]);
  });

  it("klarar text utan li-taggar", () => {
    expect(bulletsToFeatures("Bara en mening")).toEqual(["Bara en mening"]);
    expect(bulletsToFeatures("")).toEqual([]);
  });
});

function reglerMed(usdToSek: number): PricingRules {
  return {
    usdToSek,
    vatRatePercent: 25,
    defaultMultiplier: 2.5,
    categoryMultipliers: {},
    tiersEnabled: false,
    tiers: [],
    fixedSurchargeSek: 0,
    rounding: "charm9",
  } as PricingRules;
}
