import { describe, expect, it } from "vitest";
import {
  DEFAULT_MIN_MARGIN_PCT,
  marginPct,
  planPriceRepair,
  sharesOneCost,
  variantLabel,
  type RepairableVariant,
} from "./price-repair";
import type { PricingRules } from "./types";
import type { AliExpressDsVariant } from "../aliexpress/types";

const REGLER: PricingRules = {
  usdToSek: 10,
  vatRatePercent: 25,
  defaultMultiplier: 2.5,
  categoryMultipliers: {},
  fixedSurchargeSek: 0,
  rounding: "charm9",
  tiersEnabled: false,
  tiers: [],
};

const mv = (
  id: string,
  costUsd: number,
  grossSek: number,
  choices: Record<string, string> = {},
): RepairableVariant => ({
  supplierVariantId: id,
  sku: `AE-${id}`,
  wixVariantId: `wix-${id}`,
  choices,
  costUsd,
  landedCostSek: costUsd * 10,
  grossSek,
});

const dv = (skuId: string, price: number): AliExpressDsVariant => ({
  skuId,
  skuProps: {},
  price,
});

describe("sharesOneCost", () => {
  it("två varianter med samma inköpspris är kandidat", () => {
    expect(sharesOneCost([mv("1", 22.9, 589), mv("2", 22.9, 589)])).toBe(true);
  });

  it("olika inköpspris är ingen kandidat", () => {
    expect(sharesOneCost([mv("1", 22.9, 589), mv("2", 31.5, 799)])).toBe(false);
  });

  it("en ensam variant kan inte dela pris", () => {
    expect(sharesOneCost([mv("1", 22.9, 589)])).toBe(false);
  });

  it("varianter utan pris räknas inte", () => {
    expect(sharesOneCost([mv("1", 0, 0), mv("2", 0, 0)])).toBe(false);
  });
});

describe("variantLabel", () => {
  it("använder valen när de finns", () => {
    expect(variantLabel(mv("1", 5, 99, { Antal: "6-pack", Färg: "Vit" }))).toBe("6-pack · Vit");
  });

  it("faller tillbaka på SKU och sedan id", () => {
    expect(variantLabel({ supplierVariantId: "x", sku: "AE-x" })).toBe("AE-x");
    expect(variantLabel({ supplierVariantId: "x" })).toBe("x");
  });
});

describe("marginPct", () => {
  // NETTO MOT NETTO — båda talen bär moms. Räknas kostnaden med moms mot
  // nettointäkten underskattas varje marginal (buggen som gav 208 falska
  // prislarm 2026-08-19).
  it("räknar netto mot netto", () => {
    expect(marginPct(1000, 400, 25)).toBe(60);
  });

  it("noll pris ger noll marginal i stället för delning med noll", () => {
    expect(marginPct(0, 400, 25)).toBe(0);
  });
});

describe("planPriceRepair", () => {
  // LEONARDS FALL: 4-pack och 6-pack båda 589 kr fast 6-packet kostar mer.
  it("rättar bara varianten vars inköpspris faktiskt skiljer", () => {
    const plan = planPriceRepair(
      [mv("1", 22.9, 589, { Antal: "4-pack" }), mv("2", 22.9, 589, { Antal: "6-pack" })],
      [dv("1", 22.9), dv("2", 31.5)],
      { rules: REGLER },
    );
    expect(plan.blockers).toEqual([]);
    expect(plan.unchanged).toBe(1);
    expect(plan.changes).toHaveLength(1);
    const c = plan.changes[0];
    expect(c.label).toBe("6-pack");
    expect(c.fromCostUsd).toBe(22.9);
    expect(c.toCostUsd).toBe(31.5);
    // 31,5 × 10 = 315 kr landat × 2,5 = 787,5 → charm9 uppåt = 789.
    expect(c.toLandedCostSek).toBe(315);
    expect(c.toGrossSek).toBe(789);
    expect(c.wixVariantId).toBe("wix-2");
  });

  // Hela poängen med att avgränsa på FÖRÄNDRAT inköpspris: en produkt vars
  // varianter verkligen kostar lika mycket (färger gör nästan alltid det) ger
  // en tom plan, så en bred kandidatsökning inte kan göra skada.
  it("äkta delat pris ger en TOM plan", () => {
    const plan = planPriceRepair(
      [mv("1", 22.9, 589), mv("2", 22.9, 589)],
      [dv("1", 22.9), dv("2", 22.9)],
      { rules: REGLER },
    );
    expect(plan.changes).toEqual([]);
    expect(plan.unchanged).toBe(2);
    expect(plan.blockers).toEqual([]);
  });

  it("landedCostSek räknas alltid om — den föder marginalen och auktionsgolvet", () => {
    const plan = planPriceRepair([mv("1", 10, 249)], [dv("1", 20)], { rules: REGLER });
    expect(plan.changes[0].toLandedCostSek).toBe(200);
    // Utan omräkningen hade den legat kvar på 100 och marginalen sett dubbelt
    // så bra ut som den är.
    expect(plan.changes[0].newMarginPct).toBe(marginPct(plan.changes[0].toGrossSek, 200, 25));
  });

  it("varianter utan matchande DS-SKU rörs aldrig", () => {
    const plan = planPriceRepair(
      [mv("1", 22.9, 589), mv("dom-3", 22.9, 589)],
      [dv("1", 31.5)],
      { rules: REGLER },
    );
    expect(plan.unmatched).toEqual(["dom-3"]);
    expect(plan.changes.map((c) => c.supplierVariantId)).toEqual(["1"]);
  });

  // Gissad matchning skriver ett pris till kund. Den risken tas inte här —
  // syntetiska id rapporteras omatchade, kör mappnings-reparationen först.
  it("syntetiska id gissas ALDRIG ihop med en DS-SKU", () => {
    const plan = planPriceRepair([mv("dom-0", 22.9, 589)], [dv("12000041", 31.5)], {
      rules: REGLER,
    });
    expect(plan.changes).toEqual([]);
    expect(plan.unmatched).toEqual(["dom-0"]);
  });

  it("tomt DS-svar blockerar i stället för att nolla priser", () => {
    const plan = planPriceRepair([mv("1", 22.9, 589)], [], { rules: REGLER });
    expect(plan.blockers[0]).toMatch(/inga prissatta SKU/);
    expect(plan.changes).toEqual([]);
  });

  it("DS-SKU:er utan pris räknas som frånvarande", () => {
    const plan = planPriceRepair([mv("1", 22.9, 589)], [dv("1", 0)], { rules: REGLER });
    expect(plan.blockers[0]).toMatch(/inga prissatta SKU/);
  });

  it("blockerar när det nya priset ger för tunn marginal", () => {
    // Multiplikator 1,0 → priset täcker knappt inköpet.
    const plan = planPriceRepair([mv("1", 10, 249)], [dv("1", 20)], {
      rules: { ...REGLER, defaultMultiplier: 1.0 },
    });
    expect(plan.changes).toEqual([]);
    expect(plan.blockers[0]).toMatch(/marginal/);
    expect(plan.blockers[0]).toMatch(new RegExp(String(DEFAULT_MIN_MARGIN_PCT)));
  });

  it("blockerar orimligt stora hopp — troligare felmatchning än prisfel", () => {
    const plan = planPriceRepair([mv("1", 5, 129)], [dv("1", 500)], { rules: REGLER });
    expect(plan.changes).toEqual([]);
    expect(plan.blockers[0]).toMatch(/felmatchad SKU/);
  });

  it("en blockerad variant stoppar inte de övriga från att listas", () => {
    const plan = planPriceRepair(
      [mv("1", 5, 129), mv("2", 22.9, 589)],
      [dv("1", 500), dv("2", 31.5)],
      { rules: REGLER },
    );
    expect(plan.blockers).toHaveLength(1);
    expect(plan.changes).toHaveLength(1);
    expect(plan.changes[0].supplierVariantId).toBe("2");
  });

  // Rapporten ska säga ifrån när de rättade varianterna får ett annat påslag
  // än de orörda — annars upptäcks det först när priserna ser konstiga ut.
  it("varnar när prisreglerna hunnit ändras sedan importen", () => {
    const plan = planPriceRepair(
      // 22,9 × 10 × 2,5 = 572,5 → charm9 = 579. Raden står på 489 → drift.
      [mv("1", 22.9, 489), mv("2", 22.9, 489)],
      [dv("1", 22.9), dv("2", 31.5)],
      { rules: REGLER },
    );
    expect(plan.warnings).toHaveLength(1);
    expect(plan.warnings[0]).toMatch(/Prisreglerna har ändrats/);
    expect(plan.changes).toHaveLength(1);
  });

  it("varnar INTE när reglerna stämmer med det sparade priset", () => {
    const plan = planPriceRepair(
      [mv("1", 22.9, 579), mv("2", 22.9, 579)],
      [dv("1", 22.9), dv("2", 31.5)],
      { rules: REGLER },
    );
    expect(plan.warnings).toEqual([]);
  });

  it("kategorins multiplikator används när produkten har en", () => {
    const plan = planPriceRepair([mv("1", 10, 249)], [dv("1", 20)], {
      rules: { ...REGLER, categoryMultipliers: { Möbler: 3 } },
      category: "möbler", // matchas skiftlägesokänsligt
    });
    // 20 × 10 = 200 landat × 3 = 600 → charm9 = 609.
    expect(plan.changes[0].toGrossSek).toBe(609);
  });

  it("tom variantlista ger en tom plan utan att krascha", () => {
    const plan = planPriceRepair([], [dv("1", 31.5)], { rules: REGLER });
    expect(plan.changes).toEqual([]);
    expect(plan.unchanged).toBe(0);
    expect(plan.unmatched).toEqual([]);
  });
});
