import { describe, it, expect } from "vitest";
import {
  planeraOmlaggning,
  applicera,
  verifiera,
  MAX_FORDYRING_PCT,
} from "./remap-supplier";
import type { ProductMappingRecord } from "./index";

function rad(over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    supplierProductId: "1005008094106539",
    wixProductId: "13f60ff6-bfad-43a3-8b21-6a80f3b7407e",
    variants: [
      {
        supplierVariantId: "12000043",
        sku: "FP-katthus-utomhus-96-cm",
        wixVariantId: "wv-1",
        choices: {},
        costUsd: 168.5,
        landedCostSek: 1779.65,
        grossSek: 2319,
      },
    ],
    draftStatus: "published",
    createdAt: "2026-08-01T00:00:00.000Z",
    ...over,
  } as ProductMappingRecord;
}

function aosomRad(over: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return rad({
    supplier: "aosom",
    supplierProductId: "aosom:D30-670V00YL",
    wixProductId: "dbb7108e-8d4d-4576-9bc6-1885657322c3",
    sourceUrl: "https://www.aosom.de/exempel",
    aosomFreightShare: 0.31,
    draftStatus: "pending_review",
    variants: [
      {
        supplierVariantId: "aosom:D30-670V00YL",
        sku: "FP-katzenhaus",
        wixVariantId: "wv-2",
        choices: {},
        costUsd: 130.1,
        landedCostSek: 1374.17,
        grossSek: 1649,
      },
    ],
    ...over,
  });
}

describe("planeraOmlaggning", () => {
  it("lägger om en AE-rad till Aosom när det blir billigare", () => {
    const { plan, fel } = planeraOmlaggning(rad(), aosomRad());
    expect(fel).toBeUndefined();
    expect(plan!.tillSupplierProductId).toBe("aosom:D30-670V00YL");
    expect(plan!.patch.supplier).toBe("aosom");
    expect(plan!.deltaSek).toBeCloseTo(-405.48, 2);
    expect(plan!.deltaPct).toBeCloseTo(-22.8, 1);
  });

  it("☠️ RÖR ALDRIG grossSek — kundens pris är inte omläggningens sak", () => {
    const { plan } = planeraOmlaggning(rad(), aosomRad());
    expect(plan!.patch.variants![0].grossSek).toBe(2319);
    expect(plan!.patch.variants![0].landedCostSek).toBe(1374.17);
    expect(plan!.patch.variants![0].costUsd).toBe(130.1);
  });

  it("☠️ behåller wixVariantId — synk och fulfillment nycklar på det", () => {
    const { plan } = planeraOmlaggning(rad(), aosomRad());
    expect(plan!.patch.variants![0].wixVariantId).toBe("wv-1");
  });

  it("☠️ VÄGRAR en omläggning som gör inköpet dyrare än taket", () => {
    // agilityset: 521,25 → 657,50 = +26,1 %
    const live = rad({
      variants: [{ ...rad().variants[0], landedCostSek: 521.25, grossSek: 689 }],
    });
    const utkast = aosomRad({
      variants: [{ ...aosomRad().variants[0], landedCostSek: 657.5, grossSek: 789 }],
    });
    const { plan, fel } = planeraOmlaggning(live, utkast);
    expect(plan).toBeUndefined();
    expect(fel!.skal).toBe("fordyring");
    expect(fel!.detalj).toContain("26.1 %");
  });

  it("släpper igenom fördyringen med tvingaFordyring", () => {
    const live = rad({
      variants: [{ ...rad().variants[0], landedCostSek: 521.25, grossSek: 689 }],
    });
    const utkast = aosomRad({
      variants: [{ ...aosomRad().variants[0], landedCostSek: 657.5, grossSek: 789 }],
    });
    const { plan, fel } = planeraOmlaggning(live, utkast, { tvingaFordyring: true });
    expect(fel).toBeUndefined();
    expect(plan!.deltaPct).toBeCloseTo(26.1, 1);
  });

  it("släpper igenom brus under taket", () => {
    const live = rad();
    const utkast = aosomRad({
      variants: [{ ...aosomRad().variants[0], landedCostSek: 1779.65 * 1.05 }],
    });
    const { plan, fel } = planeraOmlaggning(live, utkast);
    expect(fel).toBeUndefined();
    expect(plan!.deltaPct).toBeLessThanOrEqual(MAX_FORDYRING_PCT);
  });

  it("☠️ vägrar när live-raden redan är Aosom", () => {
    const { fel } = planeraOmlaggning(rad({ supplier: "aosom" }), aosomRad());
    expect(fel!.skal).toBe("live_ar_inte_aliexpress");
  });

  it("☠️ vägrar när utkastet inte är en Aosom-rad", () => {
    // Både fältet OCH prefixet måste bort: en rad som tappat `supplier` men
    // bär "aosom:" i id:t klassas ändå rätt (lib/store/supplier.ts), och det
    // är avsiktligt — annars hade en tappad kolumn gjort hela katalogen till
    // AliExpress-rader.
    const { fel } = planeraOmlaggning(
      rad(),
      aosomRad({ supplier: undefined, supplierProductId: "1005099999999999" }),
    );
    expect(fel!.skal).toBe("utkast_ar_inte_aosom");
  });

  it("en Aosom-rad som tappat supplier-fältet klassas ändå på aosom:-prefixet", () => {
    const { plan, fel } = planeraOmlaggning(rad(), aosomRad({ supplier: undefined }));
    expect(fel).toBeUndefined();
    expect(plan!.patch.supplier).toBe("aosom");
  });

  it("☠️ vägrar när variantantalen skiljer sig", () => {
    const live = rad({
      variants: [rad().variants[0], { ...rad().variants[0], wixVariantId: "wv-1b" }],
    });
    const { fel } = planeraOmlaggning(live, aosomRad());
    expect(fel!.skal).toBe("olika_antal_varianter");
  });

  it("vägrar när utkastet saknar kostnad", () => {
    const utkast = aosomRad({
      variants: [{ ...aosomRad().variants[0], landedCostSek: 0 }],
    });
    const { fel } = planeraOmlaggning(rad(), utkast);
    expect(fel!.skal).toBe("utkast_saknar_kostnad");
  });

  it("vägrar när live och utkast är samma produkt", () => {
    const { fel } = planeraOmlaggning(rad(), aosomRad({ wixProductId: rad().wixProductId }));
    expect(fel!.skal).toBe("samma_produkt");
  });
});

describe("applicera", () => {
  it("☠️ lämnar SEO, slug, draftStatus och wixProductId orörda", () => {
    const live = rad({ seoTitle: "Katthus utomhus 96 cm", slugSuffix: undefined });
    const { plan } = planeraOmlaggning(live, aosomRad());
    const efter = applicera(live, plan!);
    expect(efter.seoTitle).toBe("Katthus utomhus 96 cm");
    expect(efter.draftStatus).toBe("published");
    expect(efter.wixProductId).toBe(live.wixProductId);
    expect(efter.supplier).toBe("aosom");
  });
});

describe("verifiera", () => {
  it("godkänner en rad som faktiskt lades om", () => {
    const live = rad();
    const { plan } = planeraOmlaggning(live, aosomRad());
    expect(verifiera(applicera(live, plan!), plan!)).toEqual({ ok: true, avvikelser: [] });
  });

  it("☠️ fäller en skrivning som inte tog — svaret är inget kvitto", () => {
    const live = rad();
    const { plan } = planeraOmlaggning(live, aosomRad());
    const v = verifiera(live, plan!); // oförändrad rad
    expect(v.ok).toBe(false);
    expect(v.avvikelser.join(" ")).toContain("AliExpress");
  });

  it("fäller en halv skrivning: supplier bytt men kostnaden kvar", () => {
    const live = rad();
    const { plan } = planeraOmlaggning(live, aosomRad());
    const halv = { ...live, supplier: "aosom" as const, supplierProductId: plan!.tillSupplierProductId };
    const v = verifiera(halv, plan!);
    expect(v.ok).toBe(false);
    expect(v.avvikelser.join(" ")).toContain("landedCostSek");
  });
});
