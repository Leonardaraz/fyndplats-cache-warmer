import { describe, expect, it } from "vitest";
import { LADDER_STEPS, MAX_DISCOUNT, type AuctionDoc } from "./engine";
import {
  assignQueueOrder,
  evaluateCandidate,
  fnv1a,
  headlineDiscount,
  MIN_AUCTION_DISCOUNT,
  planSeed,
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
    // Golvet är det HÖGSTA av marginalgolv och rabattgolv (engine.buildFloor).
    // Marginalgolv ur NETTOkostnad: 696/1,25 = 556,8 → ×1,25/1,07 → 659.
    // Rabattgolv: up9(1549 × 0,85) = 1319. Taket binder → 1319, dvs −14,8 %.
    expect(v.doc.floorPrice).toBe(1319);
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
    // Netto 1500/1,25 = 1200 → golv 1409, list 1549 ⇒ ~9 % rabatt < 10 %.
    const v = evaluateCandidate({ ...single, variants: [{ wixVariantId: "v1", listPrice: 1549, landedCostSek: 1500 }] });
    expect(v).toEqual({ ok: false, reason: "thinMargin" });
    expect(MIN_AUCTION_DISCOUNT).toBe(0.1);
  });

  it("avvisar thinMargin när VISNINGSPRISET är platt trots djup rabatt på dyr variant", () => {
    // Solpanel-fallet 13 juli: billigaste varianten (kortets pris) utan
    // marginalutrymme → platt visningsstege, medan dyra varianten faller −50 %+.
    // Bäst-variant-rabatt räcker INTE — kortet skulle stå stilla hela dagen.
    const v = evaluateCandidate({
      ...single,
      variants: [
        { wixVariantId: "billig-platt", listPrice: 369, landedCostSek: 460 }, // netto 368 → golv ≈ list → platt
        { wixVariantId: "dyr-fallande", listPrice: 2859, landedCostSek: 1000 }, // faller djupt
      ],
    });
    expect(v).toEqual({ ok: false, reason: "thinMargin" });
  });
});

describe("evaluateCandidate — per variant (prisspann)", () => {
  // destillationssats-liknande: billig 13-delars + dyr 32-delars variant
  const multi: SeedInput = {
    ...single,
    productId: "p2",
    variants: [
      { wixVariantId: "billig", listPrice: 1049, landedCostSek: 471 }, // netto → golv 449 → −57 %
      { wixVariantId: "dyr", listPrice: 1549, landedCostSek: 1028 }, // netto → golv 969 → −37 %
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
    const visningsrabatt = 1 - v.doc.floorPrice / v.doc.listPrice;
    // Headline tar den BÄSTA varianten, som inte behöver vara visningsspårets.
    expect(headlineDiscount(v.doc)).toBeGreaterThanOrEqual(visningsrabatt);
  });

  it("ingen variant går under rabattaket — inte ens den med störst påslag", () => {
    // Före taket föll billig-varianten ~47 % eftersom dess kostnad tillät det.
    // Det var precis den sortens djup som gjorde auktionen till en förlustaffär.
    const v = evaluateCandidate(multi);
    if (!v.ok) throw new Error("avslag");
    for (const t of v.doc.variantPrices) {
      expect(1 - t.floorPrice / t.listPrice).toBeLessThanOrEqual(MAX_DISCOUNT);
    }
    expect(headlineDiscount(v.doc)).toBeLessThanOrEqual(MAX_DISCOUNT);
  });

  it("kvalar in om MINST en variant ger ≥10 % även när en annan är tunn", () => {
    const v = evaluateCandidate({
      ...single,
      variants: [
        { wixVariantId: "tunn", listPrice: 1549, landedCostSek: 1500 }, // netto → <10 %
        { wixVariantId: "bra", listPrice: 1049, landedCostSek: 471 }, // netto → −57 %
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

describe("planSeed — vad seeden skriver", () => {
  const NOW = Date.parse("2026-09-28T02:00:00Z"); // 04:00 i Stockholm
  const cand = (id: string, list: number) => {
    const v = evaluateCandidate({ ...single, productId: id, slug: `s-${id}`, variants: [{ wixVariantId: `v-${id}`, listPrice: list, landedCostSek: 400 }] });
    if (!v.ok) throw new Error(v.reason);
    return v.doc;
  };
  const doc = (id: string, over: Partial<AuctionDoc>): AuctionDoc => ({
    _id: `auction-${id}`,
    ...cand(id, 2199),
    slot: 0,
    status: "queued",
    queueOrder: 7,
    ...over,
  });

  it("live som väntar på 07:00 får dagens pris men behåller slot och start", () => {
    const start = "2026-09-28T05:00:00.000Z";
    const prev = doc("a", { status: "live", slot: 3, startAt: start, lastPatchedPrice: 2199, lastPatchedStep: 0 });
    const fresh = cand("a", 2419);
    const plan = planSeed([fresh], [prev], new Map([["a", 1]]), NOW);
    expect(plan.refreshedLive).toEqual(["s-a"]);
    const saved = plan.toSave[0];
    expect(saved.status).toBe("live");
    expect(saved.slot).toBe(3);
    expect(saved.startAt).toBe(start);
    expect(saved.queueOrder).toBe(7);
    expect(saved.listPrice).toBe(2419);
    expect(saved.ladder[0]).toBe(2419);
    expect(saved.lastPatchedPrice).toBe(2419);
    expect(saved.lastPatchedStep).toBe(0);
  });

  it("startad live-dag rörs aldrig", () => {
    const prev = doc("a", { status: "live", slot: 1, startAt: "2026-09-28T01:00:00.000Z" });
    const plan = planSeed([cand("a", 2419)], [prev], new Map(), NOW);
    expect(plan.toSave).toHaveLength(0);
    expect(plan.skippedLive).toEqual(["s-a"]);
  });

  it("väntande live som inte längre kvalar lämnas, köade tas bort", () => {
    const live = doc("a", { status: "live", slot: 2, startAt: "2026-09-28T05:00:00.000Z" });
    const queued = doc("b", {});
    const plan = planSeed([], [live, queued], new Map(), NOW);
    expect(plan.liveNotRefreshed).toEqual(["s-a"]);
    expect(plan.toRemove.map((d) => d.productId)).toEqual(["b"]);
    expect(plan.toSave).toHaveLength(0);
  });

  it("köade och nya får status queued och köordning, avslutade behåller historiken", () => {
    const sold = doc("c", { status: "sold", endedAt: "2026-09-01T10:00:00Z", soldPrice: 1999 });
    const plan = planSeed([cand("c", 2419), cand("d", 999)], [sold], new Map([["c", 2], ["d", 1]]), NOW);
    const byId = new Map(plan.toSave.map((d) => [d.productId, d]));
    expect(byId.get("c")).toMatchObject({ status: "sold", soldPrice: 1999, queueOrder: 2, listPrice: 2419 });
    expect(byId.get("d")).toMatchObject({ status: "queued", slot: 0, queueOrder: 1, _id: "auction-d" });
  });
});
