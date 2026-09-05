import { describe, expect, it } from "vitest";
import { applicera, prisgrind, TILLÅTNA_FÄLT, validera } from "./mapping-access";
import type { ProductMappingRecord } from "@/lib/store";

function rad(över: Partial<ProductMappingRecord> = {}): ProductMappingRecord {
  return {
    wixProductId: "p1",
    supplierProductId: "aosom:845-030CG",
    supplier: "aosom",
    aosomFreightShare: 0.4,
    needsAiPolish: true,
    variants: [
      {
        supplierVariantId: "sv1",
        sku: "FP-schlafsofa-2er",
        wixVariantId: "wv1",
        choices: {},
        costUsd: 100,
        landedCostSek: 2869.76,
        grossSek: 3449,
      },
    ],
    ...över,
  } as ProductMappingRecord;
}

describe("validera — allowlist, inte tyst filtrering", () => {
  it("släpper igenom de tre fälten poleringen äger", () => {
    expect(validera({ needsAiPolish: false, draftStatus: "published" })).toEqual([]);
    expect(validera({ variantSkus: { wv1: "FP-baddsoffa" } })).toEqual([]);
  });

  it("☠️ ett okänt fält är ett FEL, inte något som hoppas över", () => {
    const fel = validera({ visible: true });
    expect(fel).toHaveLength(1);
    expect(fel[0].fält).toBe("visible");
  });

  it("☠️ kostnadsfälten går INTE att skriva härifrån", () => {
    for (const f of ["landedCostSek", "grossSek", "costUsd", "supplierProductId"]) {
      expect(validera({ [f]: 1 })).toHaveLength(1);
    }
  });

  it("fel typ avvisas", () => {
    expect(validera({ needsAiPolish: "nej" })).toHaveLength(1);
    expect(validera({ variantSkus: ["FP-x"] })).toHaveLength(1);
    expect(validera({ variantSkus: { wv1: "" } })).toHaveLength(1);
  });

  it("allowlistan är exakt tre fält — växer den ska någon tänka efter", () => {
    expect([...TILLÅTNA_FÄLT]).toEqual(["needsAiPolish", "draftStatus", "variantSkus"]);
  });
});

describe("applicera — rör bara det som namngavs", () => {
  it("sätter stämpeln", () => {
    const { ny } = applicera(rad(), { needsAiPolish: false, draftStatus: "published" });
    expect(ny.needsAiPolish).toBe(false);
    expect(ny.draftStatus).toBe("published");
  });

  it("☠️ bär kostnadsfälten vidare OFÖRÄNDRADE", () => {
    const { ny } = applicera(rad(), { needsAiPolish: false });
    expect(ny.variants[0].landedCostSek).toBe(2869.76);
    expect(ny.variants[0].grossSek).toBe(3449);
    expect(ny.variants[0].costUsd).toBe(100);
    expect(ny.variants[0].supplierVariantId).toBe("sv1");
    expect(ny.supplierProductId).toBe("aosom:845-030CG");
    expect(ny.aosomFreightShare).toBe(0.4);
  });

  it("☠️ SKU matchas på wixVariantId, aldrig på position", () => {
    const två = rad({
      variants: [
        { ...rad().variants[0], wixVariantId: "wv1", sku: "gammal-1" },
        { ...rad().variants[0], wixVariantId: "wv2", sku: "gammal-2" },
      ],
    });
    const { ny } = applicera(två, { variantSkus: { wv2: "ny-2" } });
    expect(ny.variants[0].sku).toBe("gammal-1");
    expect(ny.variants[1].sku).toBe("ny-2");
  });

  it("☠️ ett okänt wixVariantId rapporteras — det skrivs inte tyst till ingen", () => {
    const { ny, okändaVariantIds } = applicera(rad(), { variantSkus: { finns_inte: "x" } });
    expect(okändaVariantIds).toEqual(["finns_inte"]);
    expect(ny.variants[0].sku).toBe("FP-schlafsofa-2er");
  });

  it("en tom patch lämnar raden orörd", () => {
    expect(applicera(rad(), {}).ny).toEqual(rad());
  });
});

describe("prisgrind — samma regel som prissättningen", () => {
  const cfg = { rounding: "charm9" as const };

  it("räknar runbookens eget exempel: 2 869,76 × 1,20 → 3 449", () => {
    const g = prisgrind(rad(), cfg, 1.2);
    expect(g).not.toBeNull();
    expect(g!.förväntatSek).toBe(3449);
    expect(g!.faktisktSek).toBe(3449);
    expect(g!.stämmer).toBe(true);
  });

  it("☠️ fäller när kostnaden ändrats sedan importen", () => {
    // Kostnaden har stigit; priset i Wix är kvar på det gamla.
    const g = prisgrind(rad({ variants: [{ ...rad().variants[0], landedCostSek: 3200 }] }), cfg, 1.2);
    expect(g!.stämmer).toBe(false);
    expect(g!.förväntatSek).toBe(3849);
    expect(g!.faktisktSek).toBe(3449);
  });

  it("☠️ saknat underlag ger null, aldrig 'stämmer'", () => {
    expect(prisgrind(rad({ variants: [] }), cfg, 1.2)).toBeNull();
    expect(prisgrind(rad({ variants: [{ ...rad().variants[0], landedCostSek: 0 }] }), cfg, 1.2)).toBeNull();
    expect(prisgrind(rad({ variants: [{ ...rad().variants[0], grossSek: 0 }] }), cfg, 1.2)).toBeNull();
    expect(prisgrind(rad(), cfg, 0)).toBeNull();
  });

  it("ärver avrundningen ur konfigen i stället för att koda in charm9", () => {
    const g = prisgrind(rad(), { rounding: "integer" }, 1.2);
    expect(g!.förväntatSek).toBe(3444); // 2869.76 × 1.2 = 3443.7 → 3444
  });
});

describe("regelGäller — skiljer drift från en äldre prisregel", () => {
  const cfg = { rounding: "charm9" as const };

  it("☠️ Aosom-raden ur körningen 2026-09-01: verklig drift", () => {
    // 2861bf83…: kostnad 2 843,40 → regeln säger 3 419, Wix har 3 699.
    const g = prisgrind(
      rad({
        supplier: "aosom",
        variants: [{ ...rad().variants[0], landedCostSek: 2843.4, grossSek: 3699 }],
      }),
      cfg,
      1.2,
    );
    expect(g!.stämmer).toBe(false);
    expect(g!.förväntatSek).toBe(3419);
    expect(g!.regelGäller).toBe(true); // → verklig drift, blockera
  });

  it("☠️ AE-raden ur samma körning: regeln gäller inte, alltså inget driftbevis", () => {
    // 61d84189…: kostnad 860,37 → dagens regel säger 1 039, Wix har 1 119.
    // Raden importerades före 2026-08-27 och följer den GAMLA regeln.
    const g = prisgrind(
      rad({
        supplier: "aliexpress",
        variants: [{ ...rad().variants[0], landedCostSek: 860.37, grossSek: 1119 }],
      }),
      cfg,
      1.2,
    );
    expect(g!.stämmer).toBe(false);
    expect(g!.förväntatSek).toBe(1039);
    expect(g!.regelGäller).toBe(false); // → ej avgörbar, inte drift
  });

  it("☠️ en rad UTAN supplier räknas som AliExpress — regeln gäller inte", () => {
    // Back-compat: äldre rader saknar fältet helt (lib/store/index.ts).
    const utan = rad();
    delete (utan as { supplier?: unknown }).supplier;
    expect(prisgrind(utan, cfg, 1.2)!.regelGäller).toBe(false);
  });

  it("☠️ en LÅST rad bär prisLast — skillnaden är vald, inte drift", () => {
    // Utan fältet fäller grinden varje låst Aosom-rad med "kostnaden har
    // ändrats och priset i Wix är gammalt". Det är fel skäl: priset är inte
    // gammalt, det är valt — och ett rött jobb på ett medvetet beslut är
    // samma falsklarm som "EJ AVGÖRBAR" hade varit på varje AE-rad.
    const låst = prisgrind(rad({ prisLast: true }), cfg, 1.2)!;
    expect(låst.prisLast).toBe(true);
    // Grinden räknar ÄNDÅ som förut — låset ändrar rapporteringen, inte matten.
    expect(låst.regelGäller).toBe(true);
    expect(låst.förväntatSek).toBe(prisgrind(rad(), cfg, 1.2)!.förväntatSek);
  });

  it("en olåst rad bär prisLast:false — även när fältet saknas helt", () => {
    // Back-compat, samma riktning som `supplier` ovan: en rad från före låset
    // fanns ska aldrig råka se låst ut.
    expect(prisgrind(rad(), cfg, 1.2)!.prisLast).toBe(false);
    expect(prisgrind(rad({ prisLast: false }), cfg, 1.2)!.prisLast).toBe(false);
  });
});
