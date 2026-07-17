import { describe, expect, it, vi } from "vitest";
import {
  runSupplierWatch,
  selectTermsForRun,
  supplierWatchConfigFromEnv,
  type SupplierWatchConfig,
  type SupplierWatchDeps,
} from "./supplier-watch";
import type { AliExpressDsProduct } from "../aliexpress/types";
import type { AliExpressSearchResult } from "../aliexpress/client";
import type { SupplierWatchSeenRecord } from "../store/supplier-watch-seen";

function hit(id: string): AliExpressSearchResult {
  return { productId: id, title: `Product ${id}` };
}

function detail(over: Partial<AliExpressDsProduct> & { productId: string }): AliExpressDsProduct {
  return {
    title: `Title ${over.productId}`,
    description: "",
    images: [],
    variants: [{ skuId: "s1", skuProps: {}, price: 50, stock: 5, shipFrom: "ES" }],
    hasEuWarehouse: true,
    storeId: "1104096404",
    ...over,
  };
}

function baseConfig(over: Partial<SupplierWatchConfig> = {}): SupplierWatchConfig {
  return {
    sellerIds: new Set(["1104096404", "912166334"]),
    terms: ["cat tree"],
    termsPerRun: 1,
    maxDetailCalls: 50,
    maxEnqueues: 10,
    maxCostUsd: 250,
    seenTtlDays: 45,
    dryRun: false,
    ...over,
  };
}

function makeDeps(over: Partial<SupplierWatchDeps> = {}): SupplierWatchDeps {
  return {
    search: async () => [],
    getDetail: async (id) => detail({ productId: id }),
    listExistingSupplierProductIds: async () => new Set<string>(),
    listSeen: async () => new Map(),
    saveSeen: async () => {},
    enqueue: async () => ({ jobId: "job-1", itemCount: 0 }),
    now: () => 1_700_000_000_000,
    ...over,
  };
}

describe("selectTermsForRun", () => {
  it("roterar över hela listan utan överlapp per cykel", () => {
    const terms = ["a", "b", "c", "d", "e"];
    const d0 = selectTermsForRun(terms, 2, 0);
    const d1 = selectTermsForRun(terms, 2, 1);
    const d2 = selectTermsForRun(terms, 2, 2);
    expect(d0).toEqual(["a", "b"]);
    expect(d1).toEqual(["c", "d"]);
    expect(d2).toEqual(["e"]);
    // wrap-around
    expect(selectTermsForRun(terms, 2, 3)).toEqual(["a", "b"]);
  });

  it("hanterar negativa dag-index (defensivt)", () => {
    expect(selectTermsForRun(["a", "b", "c", "d"], 2, -1)).toEqual(["c", "d"]);
  });

  it("tom lista → tomt", () => {
    expect(selectTermsForRun([], 3, 0)).toEqual([]);
  });
});

describe("runSupplierWatch", () => {
  it("köar en produkt från rätt säljare med EU-lager och i lager", async () => {
    const enqueue = vi.fn(async () => ({ jobId: "job-9", itemCount: 1 }));
    const summary = await runSupplierWatch(
      makeDeps({
        search: async () => [hit("111")],
        getDetail: async () => detail({ productId: "111", storeId: "1104096404" }),
        enqueue,
      }),
      baseConfig(),
    );
    expect(summary.matches).toHaveLength(1);
    expect(summary.matches[0].aeProductId).toBe("111");
    expect(summary.matches[0].sourceUrl).toContain("/item/111.html");
    expect(enqueue).toHaveBeenCalledOnce();
    expect(summary.enqueue).toEqual({ jobId: "job-9", itemCount: 1 });
  });

  it("hoppar över redan importerade (FyndplatsMappings)", async () => {
    const enqueue = vi.fn(async () => ({ jobId: "x", itemCount: 0 }));
    const getDetail = vi.fn(async (id: string) => detail({ productId: id }));
    const summary = await runSupplierWatch(
      makeDeps({
        search: async () => [hit("dup")],
        listExistingSupplierProductIds: async () => new Set(["dup"]),
        getDetail,
        enqueue,
      }),
      baseConfig(),
    );
    expect(summary.skipped.alreadyImported).toBe(1);
    expect(getDetail).not.toHaveBeenCalled(); // ingen dyr detalj-koll
    expect(summary.matches).toHaveLength(0);
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("hoppar över träffar i negativ-cachen utan detalj-koll", async () => {
    const getDetail = vi.fn(async (id: string) => detail({ productId: id }));
    const summary = await runSupplierWatch(
      makeDeps({
        search: async () => [hit("seen1")],
        listSeen: async () =>
          new Map([["seen1", { aeProductId: "seen1", reason: "no_eu", checkedAt: "x" }]]),
        getDetail,
      }),
      baseConfig(),
    );
    expect(summary.skipped.seenCache).toBe(1);
    expect(getDetail).not.toHaveBeenCalled();
  });

  it("förkastar fel säljare och skriver till negativ-cachen", async () => {
    const saved: SupplierWatchSeenRecord[] = [];
    const summary = await runSupplierWatch(
      makeDeps({
        search: async () => [hit("222")],
        getDetail: async () => detail({ productId: "222", storeId: "999999" }),
        saveSeen: async (records) => {
          saved.push(...records);
        },
      }),
      baseConfig(),
    );
    expect(summary.skipped.wrongSeller).toBe(1);
    expect(summary.matches).toHaveLength(0);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ aeProductId: "222", reason: "wrong_seller" });
  });

  it("förkastar produkter utan EU-lager", async () => {
    const summary = await runSupplierWatch(
      makeDeps({
        search: async () => [hit("333")],
        getDetail: async () => detail({ productId: "333", hasEuWarehouse: false }),
      }),
      baseConfig(),
    );
    expect(summary.skipped.noEu).toBe(1);
    expect(summary.matches).toHaveLength(0);
  });

  it("förkastar produkter utan lagerförd variant", async () => {
    const summary = await runSupplierWatch(
      makeDeps({
        search: async () => [hit("444")],
        getDetail: async () =>
          detail({ productId: "444", variants: [{ skuId: "s", skuProps: {}, price: 20, stock: 0, shipFrom: "ES" }] }),
      }),
      baseConfig(),
    );
    expect(summary.skipped.noStock).toBe(1);
  });

  it("förkastar för dyra produkter (kostnadstak)", async () => {
    const summary = await runSupplierWatch(
      makeDeps({
        search: async () => [hit("555")],
        getDetail: async () =>
          detail({ productId: "555", variants: [{ skuId: "s", skuProps: {}, price: 999, stock: 3, shipFrom: "ES" }] }),
      }),
      baseConfig({ maxCostUsd: 250 }),
    );
    expect(summary.skipped.tooExpensive).toBe(1);
  });

  it("dedupar samma produkt över flera termer inom en körning", async () => {
    const getDetail = vi.fn(async (id: string) => detail({ productId: id }));
    const summary = await runSupplierWatch(
      makeDeps({
        search: async () => [hit("same")],
        getDetail,
      }),
      baseConfig({ terms: ["t1", "t2", "t3"], termsPerRun: 3 }),
    );
    // "same" träffas av alla tre termerna men detalj-kollas bara en gång
    expect(getDetail).toHaveBeenCalledOnce();
    expect(summary.matches).toHaveLength(1);
  });

  it("respekterar maxEnqueues (slutar detalj-kolla när kön är full)", async () => {
    const getDetail = vi.fn(async (id: string) => detail({ productId: id }));
    const summary = await runSupplierWatch(
      makeDeps({
        search: async () => [hit("a"), hit("b"), hit("c"), hit("d")],
        getDetail,
      }),
      baseConfig({ maxEnqueues: 2 }),
    );
    expect(summary.matches).toHaveLength(2);
    expect(getDetail).toHaveBeenCalledTimes(2);
  });

  it("respekterar maxDetailCalls", async () => {
    const getDetail = vi.fn(async () => detail({ productId: "x", storeId: "nope" }));
    const summary = await runSupplierWatch(
      makeDeps({
        search: async () => [hit("a"), hit("b"), hit("c"), hit("d"), hit("e")],
        getDetail,
      }),
      baseConfig({ maxDetailCalls: 3, maxEnqueues: 100 }),
    );
    expect(getDetail).toHaveBeenCalledTimes(3);
    expect(summary.detailCalls).toBe(3);
  });

  it("dry-run rapporterar men köar inte", async () => {
    const enqueue = vi.fn(async () => ({ jobId: "no", itemCount: 0 }));
    const summary = await runSupplierWatch(
      makeDeps({ search: async () => [hit("dr")], enqueue }),
      baseConfig({ dryRun: true }),
    );
    expect(summary.matches).toHaveLength(1);
    expect(enqueue).not.toHaveBeenCalled();
    expect(summary.enqueue).toEqual({ dryRun: true });
  });

  it("transient detalj-fel cachas INTE (kan retrya nästa körning)", async () => {
    const saveSeen = vi.fn(async () => {});
    const summary = await runSupplierWatch(
      makeDeps({
        search: async () => [hit("boom")],
        getDetail: async () => {
          throw new Error("AliExpress 500");
        },
        saveSeen,
      }),
      baseConfig(),
    );
    expect(summary.detailErrors).toBe(1);
    expect(summary.matches).toHaveLength(0);
    expect(saveSeen).not.toHaveBeenCalled(); // inget cachat
  });

  it("en trasig sökterm fäller inte hela körningen", async () => {
    const summary = await runSupplierWatch(
      makeDeps({
        search: async (term: string) => {
          if (term === "bad") throw new Error("rate limited");
          return [hit("ok1")];
        },
      }),
      baseConfig({ terms: ["bad", "good"], termsPerRun: 2 }),
    );
    expect(summary.searchErrors).toHaveLength(1);
    expect(summary.matches).toHaveLength(1);
  });

  it("enqueue-fel rapporteras utan att kasta", async () => {
    const summary = await runSupplierWatch(
      makeDeps({
        search: async () => [hit("e1")],
        enqueue: async () => ({ error: "concurrent_job: pågår redan" }),
      }),
      baseConfig(),
    );
    expect(summary.enqueue).toEqual({ error: "concurrent_job: pågår redan" });
  });
});

describe("supplierWatchConfigFromEnv", () => {
  it("dry-run är default PÅ (kräver explicit false)", () => {
    expect(supplierWatchConfigFromEnv({} as NodeJS.ProcessEnv).dryRun).toBe(true);
    expect(supplierWatchConfigFromEnv({ SUPPLIER_WATCH_DRY_RUN: "false" } as unknown as NodeJS.ProcessEnv).dryRun).toBe(false);
    expect(supplierWatchConfigFromEnv({ SUPPLIER_WATCH_DRY_RUN: "true" } as unknown as NodeJS.ProcessEnv).dryRun).toBe(true);
  });

  it("override av säljar-id och termer via env", () => {
    const cfg = supplierWatchConfigFromEnv({
      SUPPLIER_WATCH_SELLER_IDS: "111, 222",
      SUPPLIER_WATCH_TERMS: "foo, bar",
    } as unknown as NodeJS.ProcessEnv);
    expect(cfg.sellerIds).toEqual(new Set(["111", "222"]));
    expect(cfg.terms).toEqual(["foo", "bar"]);
  });

  it("faller tillbaka till defaults när env saknas", () => {
    const cfg = supplierWatchConfigFromEnv({} as NodeJS.ProcessEnv);
    expect(cfg.sellerIds.has("1104096404")).toBe(true); // Aosom
    expect(cfg.terms.length).toBeGreaterThan(10);
  });
});
