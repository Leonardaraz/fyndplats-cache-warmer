import { describe, expect, it, vi } from "vitest";
import {
  createApiSearchExtendSource,
  createStorefrontSource,
  extractProductIds,
  gatherSellerCandidates,
} from "./seller-catalog";

describe("extractProductIds", () => {
  it("plockar id ur /item/{id}.html-länkar", () => {
    const html = `<a href="https://www.aliexpress.com/item/1005010209353164.html">x</a>
                  <a href="/item/1005008079900702.html">y</a>`;
    expect(extractProductIds(html)).toEqual(["1005010209353164", "1005008079900702"]);
  });

  it("plockar id ur inbäddad SSR-JSON (productId/itemId)", () => {
    const json = `{"products":[{"productId":"1005009029570309","x":1},{"itemId":1005010167549228}]}`;
    expect(extractProductIds(json)).toEqual(["1005009029570309", "1005010167549228"]);
  });

  it("deduperar och bevarar ordning", () => {
    const t = `/item/1005010209353164.html ... "productId":"1005010209353164" ... /item/1005008079900702.html`;
    expect(extractProductIds(t)).toEqual(["1005010209353164", "1005008079900702"]);
  });

  it("cap:ar antalet", () => {
    const many = Array.from({ length: 50 }, (_, i) => `/item/10050000000000${(i + 10).toString().padStart(2, "0")}.html`).join(" ");
    expect(extractProductIds(many, 5)).toHaveLength(5);
  });

  it("ignorerar för korta tal (inte produkt-id)", () => {
    expect(extractProductIds(`price 1299 qty 5 /item/12345.html`)).toEqual([]);
  });

  it("tomt/skräp → tom lista", () => {
    expect(extractProductIds("")).toEqual([]);
    expect(extractProductIds("no ids here at all")).toEqual([]);
  });
});

describe("createStorefrontSource", () => {
  it("hämtar och extraherar id, ok=true", async () => {
    const src = createStorefrontSource({
      fetchStorefront: async (storeId) => {
        expect(storeId).toBe("111");
        return `/item/1005010209353164.html /item/1005008079900702.html`;
      },
    });
    const res = await src.listProductIds("111");
    expect(res.ok).toBe(true);
    expect(res.productIds).toHaveLength(2);
    expect(res.source).toBe("storefront");
  });

  it("fetch-fel → ok=false, inga id (fäller inte)", async () => {
    const src = createStorefrontSource({
      fetchStorefront: async () => {
        throw new Error("storefront 403");
      },
    });
    const res = await src.listProductIds("111");
    expect(res.ok).toBe(false);
    expect(res.productIds).toEqual([]);
    expect(res.note).toMatch(/403/);
  });

  it("0 id → ok=true men not:erar möjlig blockering", async () => {
    const src = createStorefrontSource({ fetchStorefront: async () => "<html>captcha</html>" });
    const res = await src.listProductIds("111");
    expect(res.ok).toBe(true);
    expect(res.productIds).toEqual([]);
    expect(res.note).toMatch(/blockerad|tomt/i);
  });
});

describe("createApiSearchExtendSource", () => {
  it("söker per term (cap:at) och unionerar id", async () => {
    const searchSellerScoped = vi.fn(async (_storeId: string, term: string) =>
      term === "cat tree" ? ["1", "2"] : ["2", "3"],
    );
    const src = createApiSearchExtendSource({
      searchSellerScoped,
      terms: ["cat tree", "dog cage", "IGNORED"],
      perStoreTermCap: 2,
    });
    const res = await src.listProductIds("s1");
    expect(searchSellerScoped).toHaveBeenCalledTimes(2); // cap
    expect(res.productIds.sort()).toEqual(["1", "2", "3"]);
    expect(res.ok).toBe(true);
  });

  it("delvis fel → ok=true; allt fel → ok=false", async () => {
    const src = createApiSearchExtendSource({
      searchSellerScoped: async (_s, term) => {
        if (term === "bad") throw new Error("boom");
        return ["9"];
      },
      terms: ["bad", "good"],
      perStoreTermCap: 2,
    });
    const res = await src.listProductIds("s1");
    expect(res.ok).toBe(true);
    expect(res.productIds).toEqual(["9"]);

    const allBad = createApiSearchExtendSource({
      searchSellerScoped: async () => {
        throw new Error("boom");
      },
      terms: ["a", "b"],
      perStoreTermCap: 2,
    });
    const res2 = await allBad.listProductIds("s1");
    expect(res2.ok).toBe(false);
  });
});

describe("gatherSellerCandidates", () => {
  it("kombinerar källor över butiker, deduperar id, sätter foundBy", async () => {
    const storefront = createStorefrontSource({
      fetchStorefront: async (id) => (id === "A" ? "/item/1000000000001.html" : "/item/1000000000002.html"),
    });
    const api = createApiSearchExtendSource({
      searchSellerScoped: async (id) => (id === "A" ? ["1000000000001", "1000000000003"] : []),
      terms: ["t"],
      perStoreTermCap: 1,
    });
    const disc = await gatherSellerCandidates([storefront, api], ["A", "B"]);
    const ids = disc.candidates.map((c) => c.aeProductId);
    expect(ids).toEqual(["1000000000001", "1000000000003", "1000000000002"]); // dedup över källor
    expect(disc.candidates[0].foundBy).toBe("storefront:A");
    expect(disc.candidates[1].foundBy).toBe("api-search-extend:A");
    expect(disc.sourceStats["storefront:A"]).toBe(1);
  });

  it("cap:ar totalen", async () => {
    const src = createStorefrontSource({
      fetchStorefront: async () => "/item/1000000000001.html /item/1000000000002.html /item/1000000000003.html",
    });
    const disc = await gatherSellerCandidates([src], ["A"], { totalCap: 2 });
    expect(disc.candidates).toHaveLength(2);
  });

  it("en trasig källa loggas i errors men fäller inte", async () => {
    const bad = createStorefrontSource({
      fetchStorefront: async () => {
        throw new Error("403");
      },
    });
    const good = createApiSearchExtendSource({
      searchSellerScoped: async () => ["1000000000009"],
      terms: ["t"],
      perStoreTermCap: 1,
    });
    const disc = await gatherSellerCandidates([bad, good], ["A"]);
    expect(disc.candidates.map((c) => c.aeProductId)).toEqual(["1000000000009"]);
    expect(disc.errors.length).toBeGreaterThan(0);
  });
});
