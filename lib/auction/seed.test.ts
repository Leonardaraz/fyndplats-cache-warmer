import { describe, expect, it } from "vitest";
import { LADDER_STEPS } from "./engine";
import { assignQueueOrder, evaluateCandidate, fnv1a, MIN_AUCTION_DISCOUNT, type SeedInput } from "./seed";

const base: SeedInput = {
  productId: "p1",
  slug: "test-produkt",
  name: "Testprodukt",
  visible: true,
  inStock: true,
  priceMin: 1549,
  priceMax: 1549,
  hasCompareAt: false,
  landedCostSek: 696,
};

describe("evaluateCandidate", () => {
  it("kvalificerar en frisk produkt och bygger golv + stege", () => {
    const v = evaluateCandidate(base);
    if (!v.ok) throw new Error(`oväntat avslag: ${v.reason}`);
    expect(v.doc.listPrice).toBe(1549);
    expect(v.doc.floorPrice).toBe(819); // 696×1,25/1,07 → 819 (9-slut)
    expect(v.doc.ladder).toHaveLength(LADDER_STEPS + 1);
    expect(v.doc.stepMinutes).toBe(60);
  });

  it.each([
    ["hidden", { visible: false }],
    ["outOfStock", { inStock: false }],
    ["noPrice", { priceMin: Number.NaN, priceMax: Number.NaN }],
    ["variantPriceSpread", { priceMax: 1949 }],
    ["existingSale", { hasCompareAt: true }],
    ["noCost", { landedCostSek: null }],
  ] as const)("avvisar %s", (reason, patch) => {
    const v = evaluateCandidate({ ...base, ...patch });
    expect(v).toEqual({ ok: false, reason });
  });

  it("avvisar thinMargin när golvet ger under 10 % rabatt", () => {
    // kostnad 1200 → golv up9(1401,87)=1409; 1409/1549 ⇒ ~9 % rabatt < 10 %
    const v = evaluateCandidate({ ...base, landedCostSek: 1200 });
    expect(v).toEqual({ ok: false, reason: "thinMargin" });
    expect(MIN_AUCTION_DISCOUNT).toBe(0.1);
  });
});

describe("assignQueueOrder", () => {
  const mk = (id: string, list: number, floor: number) => ({
    productId: id,
    slug: id,
    name: id,
    listPrice: list,
    floorPrice: floor,
    ladder: [list, floor],
    stepMinutes: 60,
  });

  it("lanseringsfemman = de 5 största rabatterna, resten FNV-blandade", () => {
    const cands = [
      mk("a", 1000, 900), // -10%
      mk("b", 1000, 500), // -50%
      mk("c", 1000, 700), // -30%
      mk("d", 1000, 600), // -40%
      mk("e", 1000, 800), // -20%
      mk("f", 1000, 550), // -45%
      mk("g", 1000, 890), // -11%
    ];
    const order = assignQueueOrder(cands);
    // topp-5 rabatter: b(-50) f(-45) d(-40) c(-30) e(-20)
    expect(order.get("b")).toBe(1);
    expect(order.get("f")).toBe(2);
    expect(order.get("d")).toBe(3);
    expect(order.get("c")).toBe(4);
    expect(order.get("e")).toBe(5);
    // resten (a, g) får 6–7 i FNV-ordning — deterministiskt mellan körningar
    const rest = [
      { id: "a", h: fnv1a("a") },
      { id: "g", h: fnv1a("g") },
    ].sort((x, y) => x.h - y.h);
    expect(order.get(rest[0].id)).toBe(6);
    expect(order.get(rest[1].id)).toBe(7);
    expect(order.size).toBe(7);
  });

  it("är deterministisk (samma input ⇒ samma ordning)", () => {
    const cands = Array.from({ length: 50 }, (_, i) => mk(`prod-${i}`, 1000, 700 - i));
    const a = assignQueueOrder(cands);
    const b = assignQueueOrder(cands);
    expect([...a.entries()]).toEqual([...b.entries()]);
  });
});
