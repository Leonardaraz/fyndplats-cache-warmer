import { describe, expect, it } from "vitest";
import {
  genericizeQuery,
  filterAndRank,
  buildImportUrl,
} from "./alternatives";
import type { AliExpressSearchResult } from "./client";

function result(overrides: Partial<AliExpressSearchResult>): AliExpressSearchResult {
  return {
    productId: "1",
    title: "Produkt",
    shipsFromCountries: [],
    ...overrides,
  };
}

describe("genericizeQuery", () => {
  it("strippar reklamfluff, emoji och årtal till en generisk fråga", () => {
    const q = genericizeQuery("🔥HOT 2024 New Smart Body Fat Scale Wireless Bluetooth Free Shipping");
    expect(q).toBe("Smart Body Fat Scale Wireless Bluetooth");
  });

  it("behåller beskrivande ord men tar bort dubbletter", () => {
    const q = genericizeQuery("Wireless Wireless Earbuds Bluetooth Earbuds");
    expect(q).toBe("Wireless Earbuds Bluetooth");
  });

  it("kapar till maxWords ord", () => {
    const q = genericizeQuery("alpha beta gamma delta epsilon zeta eta theta iota", 3);
    expect(q.split(" ")).toHaveLength(3);
  });

  it("faller tillbaka till råa ord om allt ströks bort", () => {
    const q = genericizeQuery("New Hot Sale 2024 Free");
    // Alla orden är stopord/siffror → fallback ger något icke-tomt.
    expect(q.length).toBeGreaterThan(0);
  });

  it("kapar till 80 tecken", () => {
    const long = Array.from({ length: 30 }, (_, i) => `word${i}`).join(" ");
    expect(genericizeQuery(long, 30).length).toBeLessThanOrEqual(80);
  });
});

describe("filterAndRank", () => {
  it("exkluderar originalprodukten och sorterar på orders desc", () => {
    const results = [
      result({ productId: "orig", orders: 999 }),
      result({ productId: "a", orders: 10 }),
      result({ productId: "b", orders: 500 }),
      result({ productId: "c", orders: 100 }),
    ];
    const ranked = filterAndRank(results, { excludeProductId: "orig", topN: 5 });
    expect(ranked.map((r) => r.productId)).toEqual(["b", "c", "a"]);
  });

  it("tar bort dubbletter och tomma id:n", () => {
    const results = [
      result({ productId: "a", orders: 5 }),
      result({ productId: "a", orders: 5 }),
      result({ productId: "", orders: 9 }),
    ];
    const ranked = filterAndRank(results, { excludeProductId: "x" });
    expect(ranked.map((r) => r.productId)).toEqual(["a"]);
  });

  it("respekterar topN", () => {
    const results = Array.from({ length: 10 }, (_, i) =>
      result({ productId: `p${i}`, orders: i }),
    );
    const ranked = filterAndRank(results, { excludeProductId: "x", topN: 3 });
    expect(ranked).toHaveLength(3);
    expect(ranked[0].productId).toBe("p9");
  });
});

describe("buildImportUrl", () => {
  it("bygger admin-import-länken med source, aliexpressUrl och replacesProductId", () => {
    const url = buildImportUrl(
      "https://app.vercel.app/",
      "https://www.aliexpress.com/item/123.html",
      "wix-old",
    );
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/admin/import");
    expect(parsed.searchParams.get("source")).toBe("alternative");
    expect(parsed.searchParams.get("aliexpressUrl")).toBe(
      "https://www.aliexpress.com/item/123.html",
    );
    expect(parsed.searchParams.get("replacesProductId")).toBe("wix-old");
  });
});
