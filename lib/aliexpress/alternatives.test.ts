import { describe, expect, it } from "vitest";
import {
  genericizeQuery,
  filterAndRank,
  buildImportUrl,
  rankDeterministic,
  priceWithinRange,
  isCategoryConfident,
  filterOutOfflineListings,
  type AlternativeSupplier,
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

describe("priceWithinRange", () => {
  it("true inom ±50%", () => {
    expect(priceWithinRange(15, 20)).toBe(true); // 20±50% = [10,30]
    expect(priceWithinRange(10, 20)).toBe(true);
    expect(priceWithinRange(30, 20)).toBe(true);
  });
  it("false utanför ±50%", () => {
    expect(priceWithinRange(9, 20)).toBe(false);
    expect(priceWithinRange(31, 20)).toBe(false);
  });
  it("okänt pris eller okänt original → true (filtrera inte bort)", () => {
    expect(priceWithinRange(undefined, 20)).toBe(true);
    expect(priceWithinRange(15, undefined)).toBe(true);
    expect(priceWithinRange(15, 0)).toBe(true);
  });
});

describe("rankDeterministic", () => {
  it("EU-lager först, sedan orders desc, exkluderar original", () => {
    const results = [
      result({ productId: "orig", orders: 9999, warehouseClass: "EU" }),
      result({ productId: "cn-hi", orders: 5000, warehouseClass: "CN", priceUsd: 20 }),
      result({ productId: "eu-lo", orders: 100, warehouseClass: "EU", priceUsd: 20 }),
      result({ productId: "eu-hi", orders: 800, warehouseClass: "EU", priceUsd: 20 }),
    ];
    const ranked = rankDeterministic(results, { excludeProductId: "orig", originalCostUsd: 20, topN: 3 });
    // EU först (eu-hi > eu-lo på orders), sedan CN.
    expect(ranked.map((r) => r.productId)).toEqual(["eu-hi", "eu-lo", "cn-hi"]);
  });

  it("filtrerar bort pris utanför ±50% av originalet", () => {
    const results = [
      result({ productId: "ok", orders: 10, warehouseClass: "CN", priceUsd: 22 }),
      result({ productId: "toohigh", orders: 9999, warehouseClass: "CN", priceUsd: 100 }),
    ];
    const ranked = rankDeterministic(results, { excludeProductId: "x", originalCostUsd: 20, topN: 3 });
    expect(ranked.map((r) => r.productId)).toEqual(["ok"]);
  });

  it("faller tillbaka till ofiltrerat om prisfiltret tömmer poolen", () => {
    const results = [
      result({ productId: "a", orders: 5, warehouseClass: "CN", priceUsd: 100 }),
      result({ productId: "b", orders: 9, warehouseClass: "CN", priceUsd: 200 }),
    ];
    const ranked = rankDeterministic(results, { excludeProductId: "x", originalCostUsd: 20, topN: 3 });
    expect(ranked.length).toBe(2); // inget inom ±50% → behåll alla hellre än inget
  });
});

describe("isCategoryConfident", () => {
  const orig = "Smart Body Fat Scale Bluetooth";
  it("true när ≥3 träffar delar kategori-tokens", () => {
    const cands = [
      result({ productId: "1", title: "Smart Body Fat Scale Wireless" }),
      result({ productId: "2", title: "Bluetooth Body Fat Scale Digital" }),
      result({ productId: "3", title: "Smart Scale Body Composition Fat" }),
    ];
    expect(isCategoryConfident(cands, orig)).toBe(true);
  });
  it("false vid <3 träffar", () => {
    expect(isCategoryConfident([result({ productId: "1", title: "Smart Body Fat Scale" })], orig)).toBe(false);
  });
  it("false när träffarna är annan kategori (lågt token-överlapp)", () => {
    const cands = [
      result({ productId: "1", title: "Kitchen Knife Set Stainless" }),
      result({ productId: "2", title: "Garden Hose Reel" }),
      result({ productId: "3", title: "Car Phone Holder Magnetic" }),
    ];
    expect(isCategoryConfident(cands, orig)).toBe(false);
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

// ── Nedtagna kandidater rekommenderas aldrig (audit 2026-08-24) ──────────────
//
// Kandidaterna kommer från textsökningen, som inte bär hyllstatus — statusen
// var aldrig hämtad. Förslagen går ut i OOS-mejlet med en ETT-KLICKS importlänk
// och cachas i 30 dygn, så en död listning kunde bli "ersättaren".

describe("filterOutOfflineListings", () => {
  const kandidat = (id: string): AlternativeSupplier => ({
    aliexpressId: id, title: `p-${id}`, productUrl: `https://ae/${id}`,
    shipsFromCountries: ["ES"], warehouseClass: "EU", score: 50,
    scoreReason: "", importUrl: `https://admin/${id}`,
  });

  it("släpper igenom levande och sållar bort nedtagna", async () => {
    const kvar = await filterOutOfflineListings(
      [kandidat("a"), kandidat("död"), kandidat("c")],
      async (id) => (id === "död" ? "offline" : "on_selling"),
    );
    expect(kvar.map((k) => k.aliexpressId)).toEqual(["a", "c"]);
  });

  it("fail-open per kandidat: ett trasigt uppslag behåller kandidaten", async () => {
    const kvar = await filterOutOfflineListings(
      [kandidat("a"), kandidat("b")],
      async (id) => { if (id === "a") throw new Error("nätfel"); return "on_selling"; },
    );
    expect(kvar.map((k) => k.aliexpressId)).toEqual(["a", "b"]);
  });

  it("'unknown' räknas aldrig som nedtagen", async () => {
    const kvar = await filterOutOfflineListings([kandidat("a")], async () => "unknown");
    expect(kvar).toHaveLength(1);
  });

  it("alla nedtagna → tom lista (hellre inga förslag än döda förslag)", async () => {
    const kvar = await filterOutOfflineListings(
      [kandidat("a"), kandidat("b")],
      async () => "offline",
    );
    expect(kvar).toEqual([]);
  });
});
