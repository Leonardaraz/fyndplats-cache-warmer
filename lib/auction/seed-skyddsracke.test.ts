// Seedens skyddsräcke räknar bara det som försvinner, inte det 30-dagarsspärren
// stoppar (2026-11-14) och inte det pristaket stoppar (2026-11-18). Se
// raknaForsvunna i ./seed och rutten app/api/cron/auction-seed.
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

  it("natten pristaket infördes: 118 av 773 över taket ger inget stopp", () => {
    // Mätt 2026-11-18 i FyndplatsAuctions. Utan undantaget hade 118 + nattens
    // vanliga bortfall legat nära gränsen 155, och efter en priskörning som
    // lyfter många varor över taket hade seeden stått still igen.
    const ids = Array.from({ length: 130 }, (_, i) => `p${i}`);
    const taket = new Set(ids.slice(0, 118));
    const forsvunna = raknaForsvunna(rader(ids), taket);
    expect(forsvunna).toBe(12);
    expect(forsvunna).toBeLessThanOrEqual(Math.max(50, Math.ceil(773 * 0.2)));
  });

  it("☠️ men 200 som försvinner utan skäl stoppar fortfarande, också när taket tar 118 till", () => {
    const ids = Array.from({ length: 318 }, (_, i) => `p${i}`);
    const taket = new Set(ids.slice(0, 118));
    expect(raknaForsvunna(rader(ids), taket)).toBe(200);
    expect(200).toBeGreaterThan(Math.max(50, Math.ceil(773 * 0.2)));
  });
});

describe("rutten väger räcket på det som försvann", () => {
  const rutt = readFileSync(new URL("../../app/api/cron/auction-seed/route.ts", import.meta.url), "utf8");

  it("räcket jämför forsvunna, inte alla borttagningar, med gränsen", () => {
    expect(rutt).toMatch(/const forsvunna = raknaForsvunna\(toRemove, new Set\(\[\.\.\.sparrStoppade, \.\.\.takStoppade\]\)\);/);
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

  it("bara det pristaket AVVISAR räknas som belagt: skälet kommer ur seedens eget avslag", () => {
    expect(rutt).toMatch(/if \(verdict\.reason === "overPristak"\) takStoppade\.add\(row\.id\);/);
    // Inget annat lägger något i mängden.
    expect(rutt.match(/takStoppade\.add\(/g)).toHaveLength(1);
    expect(rutt).toMatch(/overPristak: 0,/);
  });

  it("rapporten visar talen var för sig", () => {
    expect(rutt).toMatch(/const borttagnaPristak = toRemove\.filter\(\(x\) => takStoppade\.has\(x\.productId\)\)\.length;/);
    expect(rutt).toMatch(/removeFromQueueSparren: toRemove\.length - forsvunna - borttagnaPristak,/);
    expect(rutt).toMatch(/removeFromQueuePristak: borttagnaPristak,/);
    expect(rutt).toMatch(/Skulle ta bort \$\{forsvunna\} av \$\{queuedBefore\} köade utan spärrens eller pristakets skäl/);
  });
});
