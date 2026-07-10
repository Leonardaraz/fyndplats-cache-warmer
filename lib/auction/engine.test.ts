import { describe, expect, it } from "vitest";
import { buildFloor, buildLadder, isExpired, nextDropAt, priceAt, stepIndexAt, up9 } from "./engine";

describe("up9", () => {
  it("avrundar UPPÅT till 9-slut", () => {
    expect(up9(890)).toBe(899);
    expect(up9(899)).toBe(899);
    expect(up9(900)).toBe(909);
    expect(up9(1)).toBe(9);
  });
});

describe("buildFloor", () => {
  it("skyddar marginalen: golv ≈ landad kostnad × 1,29, 9-slut", () => {
    // 696 kr landad kostnad (destillationssatsen) → 696×1,29 = 897,84 → 899
    expect(buildFloor(1549, 696)).toBe(899);
  });
  it("klampar till listpriset när kostnaden är för hög för rabatt", () => {
    // garagedomkraften: landad 685 → 883,65 → 889 < list 929? Nej: 889 ≤ 929 → 889.
    expect(buildFloor(929, 685)).toBe(889);
    // extremfall: kostnad nära list → golvet blir aldrig HÖGRE än list
    expect(buildFloor(929, 800)).toBe(929);
  });
});

describe("buildLadder", () => {
  it("fallande stege list → floor, alla 9-slut, inga dubbletter", () => {
    const l = buildLadder(1549, 899, 16);
    expect(l[0]).toBe(1549);
    expect(l[l.length - 1]).toBe(899);
    for (const p of l) expect(p % 10).toBe(9);
    for (let i = 1; i < l.length; i++) expect(l[i]).toBeLessThan(l[i - 1]);
  });
  it("golv = list ger en en-stegs-stege (ingen rabatt möjlig)", () => {
    expect(buildLadder(929, 929, 16)).toEqual([929]);
  });
});

describe("priceAt / stepIndexAt / nextDropAt", () => {
  const doc = { startAt: "2026-07-10T12:00:00.000Z", stepMinutes: 120, ladder: [999, 949, 899] };
  const t0 = Date.parse(doc.startAt);

  it("före start och i första intervallet: listpris", () => {
    expect(priceAt(doc, t0 - 1000)).toBe(999);
    expect(priceAt(doc, t0 + 60 * 60_000)).toBe(999);
  });
  it("kliver ett steg per stepMinutes", () => {
    expect(priceAt(doc, t0 + 120 * 60_000)).toBe(949);
    expect(priceAt(doc, t0 + 240 * 60_000)).toBe(899);
  });
  it("stannar på golvet", () => {
    expect(priceAt(doc, t0 + 100 * 3_600_000)).toBe(899);
    expect(stepIndexAt(doc, t0 + 100 * 3_600_000)).toBe(2);
  });
  it("nextDropAt pekar på nästa steggräns och null vid golv", () => {
    expect(nextDropAt(doc, t0 + 60 * 60_000)).toBe(new Date(t0 + 120 * 60_000).toISOString());
    expect(nextDropAt(doc, t0 + 240 * 60_000)).toBeNull();
  });
});

describe("isExpired", () => {
  const doc = { startAt: "2026-07-10T12:00:00.000Z", stepMinutes: 120, ladder: [999, 949, 899] };
  const t0 = Date.parse(doc.startAt);
  const floorReached = t0 + 2 * 120 * 60_000;

  it("inte förfallen före golv + frist", () => {
    expect(isExpired(doc, floorReached + 23 * 3_600_000)).toBe(false);
  });
  it("förfallen efter golv + 24h frist", () => {
    expect(isExpired(doc, floorReached + 25 * 3_600_000)).toBe(true);
  });
});
