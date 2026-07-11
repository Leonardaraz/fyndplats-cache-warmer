import { describe, expect, it } from "vitest";
import { LADDER_STEPS } from "./engine";
import {
  assignQueueOrder,
  evaluateCandidate,
  fnv1a,
  headlineDiscount,
  MIN_AUCTION_DISCOUNT,
  type SeedInput,
  type SeedRejection,
} from "./seed";

const single: SeedInput = {
  productId: "p1",
  slug: "test-produkt",
  name: "Testprodukt",
  visible: true,
  inStock: true,
  hasCompareAt: false,
  variants: [{ wixVariantId: "v1", listPrice: 1549, landedCostSek: 696 }],
};

describe("evaluateCandidate — enkel variant", () => {
  it("kvalificerar och bygger track + visningsspår", () => {
    const v = evaluateCandidate(single);
    if (!v.ok) throw new Error(`oväntat avslag: ${v.reason}`);
    expect(v.doc.listPrice).toBe(1549);
    expect(v.doc.floorPrice).toBe(819);
    expect(v.doc.variantPrices).toHaveLength(1);
    expect(v.doc.variantPrices[0].wixVariantId).toBe("v1");
    expect(v.doc.variantPrices[0].ladder).toHaveLength(LADDER_STEPS + 1);
  });

  it.each([
    ["hidden", { visible: false }],
    ["outOfStock", { inStock: false }],
    ["existingSale", { hasCompareAt: true }],
    ["noVariants", { variants: [{ wixVariantId: "v1", listPrice: 0, landedCostSek: 696 }] }],
    ["noCost", { variants: [{ wixVariantId: "v1", listPrice: 1549, landedCostSek: null }] }],
  ] as Array<[SeedRejection, Partial<SeedInput>]>)("avvisar %s", (reason, patch) => {
    expect(evaluateCandidate({ ...single, ...patch })).toEqual({ ok: false, reason });
  });

  it("avvisar thinMargin när golvet ger under 10 % rabatt", () => {
    const v = evaluateCandidate({ ...single, variants: [{ wixVariantId: "v1", listPrice: 1549, landedCostSek: 1200 }] });
    expect(v).toEqual({ ok: false, reason: "thinMargin" });
    expect(MIN_AUCTION_DISCOUNT).toBe(0.1);
  });
});

describe("evaluateCandidate — per variant (prisspann)", () => {
  // destillationssats-liknande: billig 13-delars + dyr 32-delars variant
  const multi: SeedInput = {
    ...single,
    productId: "p2",
    variants: [
      { wixVariantId: "billig", listPrice: 1049, landedCostSek: 471 }, // golv 559 → −47 %
      { wixVariantId: "dyr", listPrice: 1549, landedCostSek: 1028 }, // golv 1209 → −22 %
    ],
  };

  it("bygger en track per variant med egna golv", () => {
    const v = evaluateCandidate(multi);
    if (!v.ok) throw new Error(`oväntat avslag: ${v.reason}`);
    expect(v.doc.variantPrices).toHaveLength(2);
    const billig = v.doc.variantPrices.find((t) => t.wixVariantId === "billig")!;
    const dyr = v.doc.variantPrices.find((t) => t.wixVariantId === "dyr")!;
    expect(billig.listPrice).toBe(1049);
    expect(dyr.listPrice).toBe(1549);
    // varje variant faller till SITT golv (olika botten)
    expect(billig.floorPrice).toBeLessThan(dyr.floorPrice);
  });

  it("visningsspåret är element-vis min (från-priset)", () => {
    const v = evaluateCandidate(multi);
    if (!v.ok) throw new Error("avslag");
    expect(v.doc.listPrice).toBe(1049); // min av listpriserna
    expect(v.doc.floorPrice).toBe(v.doc.variantPrices.find((t) => t.wixVariantId === "billig")!.floorPrice);
  });

  it("headline-rabatt = bästa variantens rabatt (inte visningsspårets)", () => {
    const v = evaluateCandidate(multi);
    if (!v.ok) throw new Error("avslag");
    expect(headlineDiscount(v.doc)).toBeGreaterThan(0.4); // billig-varianten ~−47 %
  });

  it("kvalar in om MINST en variant ger ≥10 % även när en annan är tunn", () => {
    const v = evaluateCandidate({
      ...single,
      variants: [
        { wixVariantId: "tunn", listPrice: 1549, landedCostSek: 1200 }, // <10 %
        { wixVariantId: "bra", listPrice: 1049, landedCostSek: 471 }, // −47 %
      ],
    });
    expect(v.ok).toBe(true);
  });

  it("avvisar noCost om NÅGON prissatt variant saknar kostnad", () => {
    const v = evaluateCandidate({
      ...single,
      variants: [
        { wixVariantId: "a", listPrice: 1049, landedCostSek: 471 },
        { wixVariantId: "b", listPrice: 1549, landedCostSek: null },
      ],
    });
    expect(v).toEqual({ ok: false, reason: "noCost" });
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
    variantPrices: [{ wixVariantId: `${id}-v`, listPrice: list, floorPrice: floor, ladder: [list, floor] }],
    stepMinutes: 60,
  });

  it("lanseringsfemman = de 5 största headline-rabatterna", () => {
    const cands = [
      mk("a", 1000, 900),
      mk("b", 1000, 500),
      mk("c", 1000, 700),
      mk("d", 1000, 600),
      mk("e", 1000, 800),
      mk("f", 1000, 550),
      mk("g", 1000, 890),
    ];
    const order = assignQueueOrder(cands);
    expect(order.get("b")).toBe(1);
    expect(order.get("f")).toBe(2);
    expect(order.get("d")).toBe(3);
    expect(order.get("c")).toBe(4);
    expect(order.get("e")).toBe(5);
    expect(order.size).toBe(7);
  });

  it("är deterministisk", () => {
    const cands = Array.from({ length: 30 }, (_, i) => mk(`prod-${i}`, 1000, 700 - i));
    expect([...assignQueueOrder(cands).entries()]).toEqual([...assignQueueOrder(cands).entries()]);
    expect(fnv1a("prod-0")).toBe(fnv1a("prod-0"));
  });
});
