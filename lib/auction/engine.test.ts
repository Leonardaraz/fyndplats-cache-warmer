import { describe, expect, it } from "vitest";
import {
  AUCTION_DAY_HOURS,
  LADDER_STEPS,
  buildFloor,
  buildLadder,
  isExpired,
  nextDropAt,
  nextStartAt,
  priceAt,
  stepIndexAt,
  up9,
} from "./engine";

describe("up9", () => {
  it("avrundar UPPÅT till 9-slut", () => {
    expect(up9(890)).toBe(899);
    expect(up9(899)).toBe(899);
    expect(up9(900)).toBe(909);
    expect(up9(1)).toBe(9);
  });
});

describe("buildFloor (max −7 % marginal)", () => {
  it("golv = kostnad × 1,25 / 1,07 uppåt till 9-slut", () => {
    // 696 kr landad kostnad (destillationssatsen): 696×1,25/1,07 = 813,08 → 819
    expect(buildFloor(1549, 696)).toBe(819);
    // 223 kr (glassvagnen): 223×1,25/1,07 = 260,51 → 269
    expect(buildFloor(339, 223)).toBe(269);
  });
  it("verklig förlust vid golvet är högst 7 % av nettot", () => {
    const floor = buildFloor(1549, 696);
    const net = floor / 1.25;
    expect((net - 696) / net).toBeGreaterThanOrEqual(-0.07);
  });
  it("klampar till listpriset när kostnaden är för hög för rabatt", () => {
    // kostnad 800 → 934,58 → 939 > list 929 ⇒ golv = list (ingen rabatt möjlig)
    expect(buildFloor(929, 800)).toBe(929);
  });
});

describe("buildLadder (timindexerad, 07:00–18:00)", () => {
  it("exakt LADDER_STEPS+1 rungor: [0]=list, sista=floor, alla 9-slut", () => {
    const l = buildLadder(1549, 819);
    expect(l).toHaveLength(LADDER_STEPS + 1);
    expect(l[0]).toBe(1549);
    expect(l[l.length - 1]).toBe(819);
    for (const p of l) expect(p % 10).toBe(9);
  });
  it("strikt fallande när prisspannet är stort", () => {
    const l = buildLadder(1549, 819);
    for (let i = 1; i < l.length; i++) expect(l[i]).toBeLessThan(l[i - 1]);
  });
  it("litet prisspann ger dubblettrungor (ingen sänkning den timmen), aldrig stigande", () => {
    const l = buildLadder(339, 269);
    expect(l).toHaveLength(LADDER_STEPS + 1);
    expect(l[0]).toBe(339);
    expect(l[l.length - 1]).toBe(269);
    for (let i = 1; i < l.length; i++) expect(l[i]).toBeLessThanOrEqual(l[i - 1]);
    expect(new Set(l).size).toBeLessThan(l.length); // minst en dubblett
  });
  it("golv = list ger en helt platt stege (ingen rabatt möjlig)", () => {
    const l = buildLadder(929, 929);
    expect(l).toHaveLength(LADDER_STEPS + 1);
    for (const p of l) expect(p).toBe(929);
  });
});

describe("priceAt / stepIndexAt / nextDropAt", () => {
  // 07:00 svensk sommartid = 05:00 UTC
  const doc = { startAt: "2026-07-12T05:00:00.000Z", stepMinutes: 60, ladder: buildLadder(1549, 819) };
  const t0 = Date.parse(doc.startAt);
  const h = 3_600_000;

  it("före start och under första timmen: ordinarie pris", () => {
    expect(priceAt(doc, t0 - 12 * h)).toBe(1549); // schemalagd i förväg
    expect(priceAt(doc, t0 + 0.5 * h)).toBe(1549);
  });
  it("kliver ett steg per timme", () => {
    expect(priceAt(doc, t0 + 1 * h)).toBe(doc.ladder[1]);
    expect(priceAt(doc, t0 + 5 * h)).toBe(doc.ladder[5]);
  });
  it("golvet nås 18:00 (index 11) och håller sista timmen", () => {
    expect(stepIndexAt(doc, t0 + 11 * h)).toBe(11);
    expect(priceAt(doc, t0 + 11 * h)).toBe(819);
    expect(priceAt(doc, t0 + 11.9 * h)).toBe(819);
  });
  it("nextDropAt pekar på nästa hela timme och null vid golv", () => {
    expect(nextDropAt(doc, t0 + 0.5 * h)).toBe(new Date(t0 + 1 * h).toISOString());
    expect(nextDropAt(doc, t0 + 11 * h)).toBeNull();
  });
  it("nextDropAt hoppar över dubblettrungor (ingen falsk nedräkning)", () => {
    const flat = { startAt: doc.startAt, stepMinutes: 60, ladder: buildLadder(339, 269) };
    // ladder[1] === ladder[0] (339) ⇒ nästa FAKTISKA sänkning är rungan med lägre pris
    expect(flat.ladder[1]).toBe(flat.ladder[0]);
    const expectIdx = flat.ladder.findIndex((p) => p < flat.ladder[0]);
    expect(nextDropAt(flat, t0)).toBe(new Date(t0 + expectIdx * h).toISOString());
  });
});

describe("isExpired (dagen slutar 19:00 = start + 12 h)", () => {
  const doc = { startAt: "2026-07-12T05:00:00.000Z", stepMinutes: 60, ladder: buildLadder(1549, 819) };
  const t0 = Date.parse(doc.startAt);
  const h = 3_600_000;

  it("inte förfallen under dagen, inte heller med framtida start", () => {
    expect(isExpired(doc, t0 + AUCTION_DAY_HOURS * h - 1)).toBe(false);
    expect(isExpired(doc, t0 - 5 * h)).toBe(false);
  });
  it("förfallen exakt vid dagens slut (19:00)", () => {
    expect(isExpired(doc, t0 + AUCTION_DAY_HOURS * h)).toBe(true);
  });
});

describe("nextStartAt (nästa 07:00 svensk tid, DST-säkert)", () => {
  it("sommartid (CEST = UTC+2): 07:00 = 05:00 UTC", () => {
    // 2026-07-11 12:00 svensk tid → nästa 07:00 är 12 juli
    expect(nextStartAt(Date.parse("2026-07-11T10:00:00.000Z"))).toBe("2026-07-12T05:00:00.000Z");
  });
  it("vintertid (CET = UTC+1): 07:00 = 06:00 UTC", () => {
    // 2026-01-15 11:00 svensk tid → nästa 07:00 är 16 januari
    expect(nextStartAt(Date.parse("2026-01-15T10:00:00.000Z"))).toBe("2026-01-16T06:00:00.000Z");
  });
  it("över DST-omställningen (sommartid slutar 25 okt 2026)", () => {
    // 24 okt 12:00 CEST → nästa 07:00 är 25 okt i CET = 06:00 UTC
    expect(nextStartAt(Date.parse("2026-10-24T10:00:00.000Z"))).toBe("2026-10-25T06:00:00.000Z");
  });
  it("exakt 07:00 räknas som nu; en sekund senare blir det i morgon", () => {
    expect(nextStartAt(Date.parse("2026-07-12T05:00:00.000Z"))).toBe("2026-07-12T05:00:00.000Z");
    expect(nextStartAt(Date.parse("2026-07-12T05:00:01.000Z"))).toBe("2026-07-13T05:00:00.000Z");
  });
});
