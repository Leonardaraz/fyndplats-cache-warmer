// Seedens skyddsräcke räknar bara det som försvinner, inte det 30-dagarsspärren
// stoppar (2026-11-14). Se raknaForsvunna i ./seed och rutten app/api/cron/auction-seed.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { raknaForsvunna } from "./seed";

const rader = (ids: string[]) => ids.map((productId) => ({ productId }));

describe("raknaForsvunna", () => {
  it("räknar bara borttagningar utan spärrens skäl", () => {
    expect(raknaForsvunna(rader(["a", "b", "c", "d"]), new Set(["b", "d"]))).toBe(2);
    expect(raknaForsvunna(rader(["a", "b"]), new Set())).toBe(2);
    expect(raknaForsvunna(rader(["a", "b"]), new Set(["a", "b", "x"]))).toBe(0);
    expect(raknaForsvunna([], new Set(["a"]))).toBe(0);
  });

  it("natten 12–14/11: 393 borttagna, nästan alla av spärren, ger inget stopp", () => {
    const ids = Array.from({ length: 393 }, (_, i) => `p${i}`);
    const sparren = new Set(ids.slice(0, 380));
    const forsvunna = raknaForsvunna(rader(ids), sparren);
    const grans = Math.max(50, Math.ceil(845 * 0.2));
    expect(forsvunna).toBe(13);
    expect(forsvunna).toBeLessThanOrEqual(grans);
  });
});

describe("rutten väger räcket på det som försvann", () => {
  const rutt = readFileSync(new URL("../../app/api/cron/auction-seed/route.ts", import.meta.url), "utf8");

  it("räcket jämför forsvunna, inte alla borttagningar, med gränsen", () => {
    expect(rutt).toMatch(/const forsvunna = raknaForsvunna\(toRemove, sparrStoppade\);/);
    expect(rutt).toMatch(/if \(apply && !force && forsvunna > removeLimit\) \{/);
    expect(rutt).not.toMatch(/toRemove\.length > removeLimit/);
  });

  it("bara det spärren STOPPAR (spärren på) räknas som belagt, aldrig torrläget", () => {
    // Med spärren av står kandidaten kvar i urvalet och tas aldrig bort.
    expect(rutt).toMatch(/if \(!sparr\.pa\) urval\.push\(c\);\s*else sparrStoppade\.add\(c\.productId\);/);
    // En spärr som inte går att läsa stoppar före räcket, så inget räknas utan bevis.
    const iHistorikFel = rutt.indexOf("spärren är på, så inget skrevs");
    const iRacke = rutt.indexOf("forsvunna > removeLimit");
    expect(iHistorikFel).toBeGreaterThan(0);
    expect(iRacke).toBeGreaterThan(iHistorikFel);
  });

  it("rapporten visar båda talen", () => {
    expect(rutt).toMatch(/removeFromQueueSparren: toRemove\.length - forsvunna,/);
    expect(rutt).toMatch(/Skulle ta bort \$\{forsvunna\} av \$\{queuedBefore\} köade utan spärrens skäl/);
  });
});
