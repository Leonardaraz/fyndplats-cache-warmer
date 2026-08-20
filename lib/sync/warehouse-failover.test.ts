import { describe, expect, it } from "vitest";
import { planWarehouseFailover, marginEfterByte, MIN_FAILOVER_MARGIN_PCT } from "./warehouse-failover";

// Leonards fall 2026-08-20: samma rosa garderob ligger som separata SKU:er i
// DE/FR/ES/GB/CZ/PL. Mappningen pekar på DE. När DE tar slut blir varan
// slutsåld i butiken trots att ES har 42 kvar och skickar till Sverige.
//
// sku_attr bär valen som id:n; 200007763 är lager-axeln (Ships From).
const DE = "14:350852;200007763:201336106";
const ES = "14:350852;200007763:201336104";
const US = "14:350852;200007763:201336100";
const GB = "14:350852;200007763:201336103";
/** Annan färg — får ALDRIG räknas som syskon. */
const BLÅ_ES = "14:999999;200007763:201336104";

function ds(över: Partial<Parameters<typeof planWarehouseFailover>[1][number]> = {}) {
  return {
    skuId: "s-de",
    skuAttr: DE,
    stock: 0,
    price: 119.99,
    shipFrom: "DE",
    ...över,
  };
}

function variant(över: Partial<Parameters<typeof planWarehouseFailover>[0][number]> = {}) {
  return {
    supplierVariantId: "s-de",
    sku: "ROSA-GARDEROB",
    costUsd: 119.99,
    // 2,5× markup på inköpet, momsat pris i butiken.
    landedCostSek: 1300,
    grossSek: 2999,
    ...över,
  };
}

const NU = "2026-08-20T06:00:00.000Z";

describe("planWarehouseFailover", () => {
  it("pekar om till EU-syskonet när vårt lager är tomt", () => {
    const r = planWarehouseFailover(
      [variant()],
      [ds(), ds({ skuId: "s-es", skuAttr: ES, stock: 42, shipFrom: "ES" })],
      { nowIso: NU },
    );

    expect(r.changed).toBe(true);
    expect(r.variants[0].supplierVariantId).toBe(ES);
    expect(r.variants[0].previousSupplierVariantId).toBe("s-de");
    expect(r.variants[0].shipFromSwitchedAt).toBe(NU);
    expect(r.switches[0]).toMatchObject({ from: "s-de", to: ES, shipFrom: "ES", toStock: 42 });
  });

  it("rör inte varianter vars eget lager har saldo", () => {
    const r = planWarehouseFailover(
      [variant()],
      [ds({ stock: 7 }), ds({ skuId: "s-es", skuAttr: ES, stock: 42, shipFrom: "ES" })],
      { nowIso: NU },
    );
    expect(r.changed).toBe(false);
    expect(r.variants[0].supplierVariantId).toBe("s-de");
  });

  it("gissar aldrig när vår SKU saknas i DS-svaret", () => {
    // Okänt saldo är inte samma sak som tomt. Utan den regeln hade en
    // inaktuell mappning pekats om på lös grund.
    const r = planWarehouseFailover(
      [variant({ supplierVariantId: "s-borta" })],
      [ds({ skuId: "s-es", skuAttr: ES, stock: 42, shipFrom: "ES" })],
      { nowIso: NU },
    );
    expect(r.changed).toBe(false);
    expect(r.skipped).toHaveLength(0);
  });

  it("saknat saldo-fält räknas som i lager, inte som tomt", () => {
    const r = planWarehouseFailover(
      [variant()],
      [
        ds({ stock: undefined }),
        ds({ skuId: "s-es", skuAttr: ES, stock: 42, shipFrom: "ES" }),
      ],
      { nowIso: NU },
    );
    expect(r.changed).toBe(false);
  });

  // Spärr 1: tullunionen, inte "snabb leverans".
  it("byter ALDRIG till ett lager utanför EU:s tullunion", () => {
    const r = planWarehouseFailover(
      [variant()],
      [
        ds(),
        ds({ skuId: "s-us", skuAttr: US, stock: 500, price: 113.74, shipFrom: "US" }),
      ],
      { nowIso: NU },
    );
    expect(r.changed).toBe(false);
    expect(r.skipped[0]).toMatchObject({ reason: "inget-eu-syskon" });
  });

  it("Storbritannien räknas inte som EU här — utanför tullunionen", () => {
    const r = planWarehouseFailover(
      [variant()],
      [ds(), ds({ skuId: "s-gb", skuAttr: GB, stock: 30, shipFrom: "GB" })],
      { nowIso: NU },
    );
    expect(r.changed).toBe(false);
    expect(r.skipped[0].reason).toBe("inget-eu-syskon");
  });

  // Spärr 2: utan pris vet vi inte vad varan kostar oss efter bytet.
  it("byter inte när syskonets pris är okänt", () => {
    const r = planWarehouseFailover(
      [variant()],
      [ds(), ds({ skuId: "s-es", skuAttr: ES, stock: 42, price: undefined, shipFrom: "ES" })],
      { nowIso: NU },
    );
    expect(r.changed).toBe(false);
    expect(r.skipped[0]).toMatchObject({ reason: "pris-okänt", toStock: 42 });
  });

  // Spärr 3: hellre slutsåld än sålt med förlust.
  it("byter inte när det nya lagret äter upp marginalen", () => {
    // Trippelt inköpspris → landad kostnad 3900 mot ett butikspris på 2999.
    // Marginalen blir negativ; att sälja med förlust är ett sämre utfall än
    // att vara slutsåld en vecka.
    const r = planWarehouseFailover(
      [variant()],
      [ds(), ds({ skuId: "s-es", skuAttr: ES, stock: 42, price: 359.97, shipFrom: "ES" })],
      { nowIso: NU },
    );
    expect(r.changed).toBe(false);
    expect(r.skipped[0].reason).toBe("marginal-för-låg");
    expect(r.skipped[0].marginPct).toBeLessThan(MIN_FAILOVER_MARGIN_PCT);
  });

  it("räknar om inköpspriset så marginalen inte ljuger efteråt", () => {
    // Syskonet är 10 % dyrare → landad kostnad ska följa med upp.
    const r = planWarehouseFailover(
      [variant()],
      [ds(), ds({ skuId: "s-es", skuAttr: ES, stock: 42, price: 131.99, shipFrom: "ES" })],
      { nowIso: NU },
    );
    expect(r.changed).toBe(true);
    expect(r.variants[0].costUsd).toBe(131.99);
    // 1300 × (131,99 / 119,99) ≈ 1430
    expect(r.variants[0].landedCostSek).toBeCloseTo(1430, 0);
    expect(r.switches[0].newLandedCostSek).toBeCloseTo(1430, 0);
  });

  it("byter aldrig till en annan FÄRG som råkar ha saldo", () => {
    const r = planWarehouseFailover(
      [variant()],
      [ds(), ds({ skuId: "s-bla", skuAttr: BLÅ_ES, stock: 99, shipFrom: "ES" })],
      { nowIso: NU },
    );
    expect(r.changed).toBe(false);
    expect(r.variants[0].supplierVariantId).toBe("s-de");
  });

  it("tomt DS-svar lämnar allt orört", () => {
    const r = planWarehouseFailover([variant()], [], { nowIso: NU });
    expect(r.changed).toBe(false);
    expect(r.variants[0].supplierVariantId).toBe("s-de");
  });

  it("hanterar flera varianter oberoende av varandra", () => {
    const r = planWarehouseFailover(
      [variant({ sku: "A" }), variant({ sku: "B", supplierVariantId: "s-b-de" })],
      [
        ds(),
        ds({ skuId: "s-es", skuAttr: ES, stock: 42, shipFrom: "ES" }),
        ds({ skuId: "s-b-de", skuAttr: "14:111;200007763:201336106", stock: 5 }),
      ],
      { nowIso: NU },
    );
    // A byts (tomt + syskon), B har saldo och lämnas.
    expect(r.switches).toHaveLength(1);
    expect(r.switches[0].sku).toBe("A");
    expect(r.variants[1].supplierVariantId).toBe("s-b-de");
  });
});

describe("marginEfterByte", () => {
  it("räknar netto mot netto — momsen på inköpet är ingen kostnad", () => {
    // 2999 inkl moms → 2399,20 netto. 1300 inkl moms → 1040 netto.
    expect(marginEfterByte(2999, 1300)).toBeCloseTo(56.65, 1);
  });

  it("negativ marginal när kostnaden passerar priset", () => {
    expect(marginEfterByte(1000, 1500)!).toBeLessThan(0);
  });

  it("orimlig indata ger null i stället för ett tal", () => {
    expect(marginEfterByte(0, 100)).toBeNull();
    expect(marginEfterByte(-5, 100)).toBeNull();
  });
});
