import { afterEach, describe, expect, it } from "vitest";
import type { AliExpressVariant } from "./types";
import {
  dsPriceReconcileEnabled,
  isSyntheticVariantId,
  needsDsPriceReconcile,
  reconcileVariantsWithDs,
  type DsVariantLike,
} from "./variant-reconcile";

afterEach(() => {
  delete process.env.DS_PRICE_RECONCILE_ENABLED;
});

const sv = (
  id: string,
  options: Record<string, string>,
  costUsd: number,
  included = true,
): AliExpressVariant => ({ supplierVariantId: id, options, costUsd, included });

const dv = (
  skuId: string,
  skuProps: Record<string, string>,
  price: number,
  stock?: number,
  shipFrom?: string,
): DsVariantLike => ({ skuId, skuProps, price, stock, shipFrom });

describe("needsDsPriceReconcile", () => {
  it("dom-/idx-id → alltid avstämning (DOM-fallbackens signum)", () => {
    expect(isSyntheticVariantId("dom-0")).toBe(true);
    expect(isSyntheticVariantId("idx-3")).toBe(true);
    expect(isSyntheticVariantId("14559202839xxxx")).toBe(false);
    expect(needsDsPriceReconcile([sv("dom-0", { Color: "Red" }, 28.52)])).toBe(true);
  });

  it("flera varianter med IDENTISKT pris → avstämning även med riktiga id:n", () => {
    expect(
      needsDsPriceReconcile([sv("111", { Color: "A" }, 28.52), sv("222", { Color: "B" }, 28.52)]),
    ).toBe(true);
  });

  it("olika priser + riktiga id:n → ingen avstämning (skrapan fick per-SKU-data)", () => {
    expect(
      needsDsPriceReconcile([sv("111", { Color: "A" }, 28.52), sv("222", { Color: "B" }, 31.1)]),
    ).toBe(false);
  });

  it("ensam default-variant → ingen avstämning (enkel produkt, sidpriset ÄR priset)", () => {
    expect(needsDsPriceReconcile([sv("default", {}, 12.5)])).toBe(false);
  });
});

describe("reconcileVariantsWithDs", () => {
  it("korrigerar uniforma DOM-priser per värdesignatur + reparerar id:n (Leonards fall)", () => {
    const scraped = [
      sv("dom-0", { Color: "Polar Night Black" }, 28.52),
      sv("dom-1", { Color: "chameleon" }, 28.52),
      sv("dom-2", { Color: "Tungsten steel color" }, 28.52),
    ];
    const ds = [
      dv("9001", { Color: "Polar Night Black" }, 28.52, 14),
      dv("9002", { Color: "Chameleon" }, 41.3, 3, "CN"),
      dv("9003", { Color: "Tungsten steel color" }, 33.9, 0),
    ];
    const r = reconcileVariantsWithDs(scraped, ds);
    expect(r.aborted).toBe(false);
    expect(r.matched).toBe(3); // skiftlägesokänslig match ("chameleon" ↔ "Chameleon")
    expect(r.pricesCorrected).toBe(2);
    expect(r.idsRepaired).toBe(3);
    expect(r.variants.map((v) => v.costUsd)).toEqual([28.52, 41.3, 33.9]);
    expect(r.variants.map((v) => v.supplierVariantId)).toEqual(["9001", "9002", "9003"]);
    expect(r.variants.map((v) => v.stock)).toEqual([14, 3, 0]);
    expect(r.variants[1].shipFrom).toBe("CN");
  });

  it("matchar på skuId när skrapan har riktiga id:n (uniformt pris-fall)", () => {
    const scraped = [sv("111", { Color: "A" }, 10), sv("222", { Color: "B" }, 10)];
    const ds = [dv("111", { Color: "A" }, 10), dv("222", { Color: "B" }, 19.9)];
    const r = reconcileVariantsWithDs(scraped, ds);
    expect(r.aborted).toBe(false);
    expect(r.pricesCorrected).toBe(1);
    expect(r.idsRepaired).toBe(0);
    expect(r.variants[1].costUsd).toBe(19.9);
  });

  it("släpper kartesiska spökvarianter som saknar DS-motsvarighet", () => {
    // DOM byggde 2×2-kombon men bara 3 SKU:er finns på riktigt.
    const scraped = [
      sv("dom-0", { Color: "Svart", Size: "S" }, 10),
      sv("dom-1", { Color: "Svart", Size: "L" }, 10),
      sv("dom-2", { Color: "Vit", Size: "S" }, 10),
      sv("dom-3", { Color: "Vit", Size: "L" }, 10),
    ];
    const ds = [
      dv("1", { Color: "Svart", Size: "S" }, 10),
      dv("2", { Color: "Svart", Size: "L" }, 12),
      dv("3", { Color: "Vit", Size: "S" }, 10),
    ];
    const r = reconcileVariantsWithDs(scraped, ds);
    expect(r.aborted).toBe(false);
    expect(r.ghostsDropped).toBe(1);
    expect(r.variants).toHaveLength(3);
    expect(r.variants.some((v) => v.options.Size === "L" && v.options.Color === "Vit")).toBe(false);
  });

  it("frakt-axeln i DS-skuProps ignoreras i signaturen", () => {
    const scraped = [sv("dom-0", { Color: "Röd" }, 5)];
    const ds = [dv("1", { Color: "Röd", "Ships From": "CHINA" }, 8.4)];
    const r = reconcileVariantsWithDs(scraped, ds);
    expect(r.aborted).toBe(false);
    expect(r.variants[0].costUsd).toBe(8.4);
  });

  it("ABORT när färre än hälften matchar — hellre orört än gissat", () => {
    const scraped = [
      sv("dom-0", { Color: "Alpha" }, 10),
      sv("dom-1", { Color: "Beta" }, 10),
      sv("dom-2", { Color: "Gamma" }, 10),
    ];
    const ds = [dv("1", { Color: "Helt Annat" }, 20), dv("2", { Color: "Beta" }, 12)];
    const r = reconcileVariantsWithDs(scraped, ds);
    expect(r.aborted).toBe(true);
    expect(r.variants.map((v) => v.costUsd)).toEqual([10, 10, 10]); // orört
  });

  it("ABORT när DS-listan är tom/prislös och när alla valda skulle försvinna", () => {
    expect(reconcileVariantsWithDs([sv("dom-0", { C: "x" }, 5)], []).aborted).toBe(true);
    expect(
      reconcileVariantsWithDs([sv("dom-0", { C: "x" }, 5)], [dv("1", { C: "x" }, 0)]).aborted,
    ).toBe(true);
    // Enda matchade varianten är avbockad → behåll originalen.
    const r = reconcileVariantsWithDs(
      [sv("dom-0", { C: "x" }, 5, false), sv("dom-1", { C: "spöke" }, 5, true)],
      [dv("1", { C: "x" }, 7)],
    );
    expect(r.aborted).toBe(true);
  });

  it("dubblerad signatur på någon sida → den signaturen används inte för match", () => {
    // Två DS-SKU:er med samma värden (olika lager) → signaturen är tvetydig.
    const scraped = [sv("dom-0", { Color: "Blå" }, 10), sv("dom-1", { Color: "Grön" }, 10)];
    const ds = [
      dv("1", { Color: "Blå" }, 15),
      dv("2", { Color: "Blå" }, 18),
      dv("3", { Color: "Grön" }, 11),
    ];
    const r = reconcileVariantsWithDs(scraped, ds);
    // "Blå" är tvetydig → bara "Grön" matchar → 1 av 2 = 50 % → ingen abort,
    // men Blå-varianten behålls som spök-kandidat? Nej — omatchad droppas BARA
    // om avstämningen fullföljs; 1×2 >= 2 → fullföljs, Blå droppas som spöke.
    // Det är medvetet: hellre färre men KORREKTA varianter än en gissad Blå.
    expect(r.aborted).toBe(false);
    expect(r.variants).toHaveLength(1);
    expect(r.variants[0].options.Color).toBe("Grön");
    expect(r.variants[0].costUsd).toBe(11);
  });

  it("ensam variant på båda sidor matchas direkt (enkel produkt via DOM-fallback)", () => {
    const r = reconcileVariantsWithDs([sv("dom-0", {}, 9.9)], [dv("77", { Color: "Standard" }, 14.2, 6)]);
    expect(r.aborted).toBe(false);
    expect(r.variants[0].costUsd).toBe(14.2);
    expect(r.variants[0].supplierVariantId).toBe("77");
  });

  it("muterar aldrig indata", () => {
    const scraped = [sv("dom-0", { C: "x" }, 5)];
    reconcileVariantsWithDs(scraped, [dv("1", { C: "x" }, 9)]);
    expect(scraped[0].costUsd).toBe(5);
    expect(scraped[0].supplierVariantId).toBe("dom-0");
  });
});

describe("dsPriceReconcileEnabled", () => {
  it("default PÅ; env=false stänger av", () => {
    expect(dsPriceReconcileEnabled()).toBe(true);
    process.env.DS_PRICE_RECONCILE_ENABLED = "false";
    expect(dsPriceReconcileEnabled()).toBe(false);
  });
});
