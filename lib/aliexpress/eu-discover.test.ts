import { describe, it, expect, vi } from "vitest";
import { filterEuWarehouses } from "./eu-discover";
import type { AliExpressSearchResult } from "./client";

function mk(id: string, codes?: string[]): AliExpressSearchResult {
  return {
    productId: id,
    title: id,
    shipsFromCountries: codes ?? [],
    hasEuWarehouse: false,
    warehouseClass: "UNKNOWN",
  } as AliExpressSearchResult;
}

describe("filterEuWarehouses", () => {
  it("berikar okänd ship-from och behåller bara EU (fail-closed)", async () => {
    const detail: Record<string, string[]> = { a: ["ES"], b: ["CN"], c: [] };
    const getShipFrom = vi.fn(async (id: string) => detail[id] ?? []);
    const res = await filterEuWarehouses([mk("a"), mk("b"), mk("c")], {
      getShipFrom,
      cache: new Map(),
    });
    // b = icke-EU droppas, c = okänd droppas, bara a kvar.
    expect(res.map((r) => r.productId)).toEqual(["a"]);
    expect(getShipFrom).toHaveBeenCalledTimes(3);
    expect(res[0].warehouseClass).toBe("EU");
    expect(res[0].shipsFromCountries).toEqual(["ES"]);
    expect(res[0].hasEuWarehouse).toBe(true);
  });

  it("använder ship-from som redan finns från sök utan att berika", async () => {
    const getShipFrom = vi.fn(async () => []);
    const res = await filterEuWarehouses([mk("a", ["PL"]), mk("b", ["CN"])], {
      getShipFrom,
      cache: new Map(),
    });
    expect(res.map((r) => r.productId)).toEqual(["a"]);
    expect(getShipFrom).not.toHaveBeenCalled();
  });

  it("cachar icke-tomma svar mellan anrop (berikar inte om)", async () => {
    const cache = new Map();
    const getShipFrom = vi.fn(async (id: string) => (id === "a" ? ["DE"] : []));
    await filterEuWarehouses([mk("a")], { getShipFrom, cache });
    await filterEuWarehouses([mk("a")], { getShipFrom, cache });
    expect(getShipFrom).toHaveBeenCalledTimes(1);
  });

  it("cachar INTE tomma svar (försöker igen nästa gång)", async () => {
    const cache = new Map();
    const getShipFrom = vi.fn(async () => []);
    await filterEuWarehouses([mk("x")], { getShipFrom, cache });
    await filterEuWarehouses([mk("x")], { getShipFrom, cache });
    expect(getShipFrom).toHaveBeenCalledTimes(2);
  });

  it("behandlar detalj-fel som okänd (utesluts), kastar aldrig", async () => {
    const getShipFrom = vi.fn(async () => {
      throw new Error("AE 429");
    });
    const res = await filterEuWarehouses([mk("a"), mk("b")], { getShipFrom, cache: new Map() });
    expect(res).toEqual([]);
  });

  it("respekterar cache-TTL", async () => {
    const cache = new Map();
    let t = 1000;
    const getShipFrom = vi.fn(async () => ["ES"]);
    await filterEuWarehouses([mk("a")], { getShipFrom, cache, cacheTtlMs: 100, now: () => t });
    t = 1201; // förbi utgång (1000 + 100)
    await filterEuWarehouses([mk("a")], { getShipFrom, cache, cacheTtlMs: 100, now: () => t });
    expect(getShipFrom).toHaveBeenCalledTimes(2);
  });

  it("bevarar sökordningen", async () => {
    const detail: Record<string, string[]> = { a: ["ES"], b: ["DE"], c: ["PL"] };
    const getShipFrom = async (id: string) => detail[id];
    const res = await filterEuWarehouses([mk("a"), mk("b"), mk("c")], {
      getShipFrom,
      cache: new Map(),
    });
    expect(res.map((r) => r.productId)).toEqual(["a", "b", "c"]);
  });

  it("berikar varje productId bara en gång även vid dubbletter på sidan", async () => {
    const getShipFrom = vi.fn(async () => ["ES"]);
    const res = await filterEuWarehouses([mk("a"), mk("a"), mk("b")], {
      getShipFrom,
      cache: new Map(),
    });
    expect(getShipFrom).toHaveBeenCalledTimes(2); // a en gång (inte två), b en gång
    expect(res.map((r) => r.productId)).toEqual(["a", "a", "b"]); // båda a-raderna kvar, ordning bevarad
  });

  it("respekterar concurrency-gränsen", async () => {
    let active = 0;
    let peak = 0;
    const getShipFrom = vi.fn(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return ["ES"];
    });
    const items = Array.from({ length: 10 }, (_, i) => mk(`p${i}`));
    await filterEuWarehouses(items, { getShipFrom, concurrency: 3, cache: new Map() });
    expect(peak).toBeLessThanOrEqual(3);
    expect(getShipFrom).toHaveBeenCalledTimes(10);
  });
});
