import { describe, expect, it } from "vitest";
import {
  BANDS,
  TARGET_MARGIN_PCT,
  bandFor,
  biggestOpportunities,
  clusterByMultiple,
  gapToTargetSek,
  summarizeBands,
  toMarginRow,
  type MarginRow,
} from "./margin-bands";

const VAT = 25;
const rad = (o: Partial<Parameters<typeof toMarginRow>[0]> = {}) =>
  toMarginRow(
    { wixProductId: "p", title: "T", landedCostSek: 100, grossSek: 299, ...o },
    VAT,
  )!;

describe("toMarginRow", () => {
  it("räknar netto, vinst och marginal på nettot", () => {
    // 299 inkl 25 % moms → 239,20 netto. Vinst 139,20. Marginal 58,2 %.
    const r = rad();
    expect(r.netSek).toBeCloseTo(239.2, 2);
    expect(r.profitSek).toBeCloseTo(139.2, 2);
    expect(r.marginPct).toBeCloseTo(58.19, 1);
  });

  it("multipeln är pris genom landad kostnad", () => {
    expect(rad({ grossSek: 250, landedCostSek: 100 }).multiple).toBeCloseTo(2.5, 5);
  });

  it("negativ marginal när priset ligger under kostnaden", () => {
    const r = rad({ grossSek: 99, landedCostSek: 100 });
    expect(r.marginPct).toBeLessThan(0);
    expect(r.bandId).toBe("loss");
  });

  it("null när underlaget saknas — hellre okänd än påhittad", () => {
    // Sidan används för prisbeslut; en gissad marginal är värre än ingen.
    for (const trasig of [
      { grossSek: 0 },
      { landedCostSek: 0 },
      { grossSek: -5 },
      { landedCostSek: Number.NaN },
    ]) {
      expect(toMarginRow({ wixProductId: "p", title: "T", landedCostSek: 100, grossSek: 299, ...trasig }, VAT)).toBeNull();
    }
  });
});

describe("bandFor", () => {
  it("lägger varje marginal i rätt hink", () => {
    expect(bandFor(-3)).toBe("loss");
    expect(bandFor(0)).toBe("0-10");
    expect(bandFor(9.9)).toBe("0-10");
    expect(bandFor(10)).toBe("10-20");
    expect(bandFor(20)).toBe("20-25");
    expect(bandFor(24.9)).toBe("20-25");
    expect(bandFor(25)).toBe("25-35");
    expect(bandFor(50)).toBe("50+");
    expect(bandFor(null)).toBe("unknown");
    expect(bandFor(Number.NaN)).toBe("unknown");
  });

  it("banden täcker hela linjen utan hål eller överlapp", () => {
    // En produkt får aldrig hamna mellan två band.
    for (let p = -50; p <= 200; p += 0.5) {
      expect(bandFor(p)).not.toBe("unknown");
    }
  });

  it("exakt ett band är markerat som mål, och TARGET ligger i det", () => {
    const mål = BANDS.filter((b) => b.target);
    expect(mål).toHaveLength(1);
    expect(bandFor(TARGET_MARGIN_PCT)).toBe(mål[0].id);
  });
});

describe("gapToTargetSek", () => {
  it("noll när målet redan nås eller överskrids", () => {
    // Överskjutande marginal är utrymme att sänka — inte pengar att hämta.
    const landad = 100;
    const målvinst = (landad * 0.225) / (1 - 0.225);
    expect(gapToTargetSek(landad, målvinst)).toBeCloseTo(0, 6);
    expect(gapToTargetSek(landad, målvinst * 3)).toBe(0);
  });

  it("kronorna som saknas vid tunn marginal", () => {
    // 22,5 % mål på landad 100 → målvinst 29,03. Dagens vinst 10 → gap 19,03.
    expect(gapToTargetSek(100, 10)).toBeCloseTo(19.03, 1);
  });

  it("en förlust ger ett gap större än målvinsten", () => {
    expect(gapToTargetSek(100, -20)).toBeGreaterThan(29);
  });

  it("noll vid orimliga indata i stallet for oandligheter", () => {
    expect(gapToTargetSek(0, 10)).toBe(0);
    expect(gapToTargetSek(100, 10, 0)).toBe(0);
    expect(gapToTargetSek(100, 10, 100)).toBe(0);
  });
});

describe("summarizeBands", () => {
  it("räknar, summerar kronor och ger andelar i BANDS-ordning", () => {
    const rows = [
      rad({ wixProductId: "a", grossSek: 99, landedCostSek: 100 }), // loss
      rad({ wixProductId: "b", grossSek: 250, landedCostSek: 100 }), // 50+
      rad({ wixProductId: "c", grossSek: 250, landedCostSek: 100 }), // 50+
    ];
    const s = summarizeBands(rows, 1);
    expect(s.map((x) => x.band.id)).toEqual(BANDS.map((b) => b.id));
    expect(s.find((x) => x.band.id === "loss")!.count).toBe(1);
    expect(s.find((x) => x.band.id === "50+")!.count).toBe(2);
    expect(s.find((x) => x.band.id === "unknown")!.count).toBe(1);
    // Andelarna räknas på ALLA produkter, okända inräknade.
    expect(s.reduce((t, x) => t + x.sharePct, 0)).toBeCloseTo(100, 6);
  });

  it("tom katalog ger nollor, inte NaN", () => {
    const s = summarizeBands([], 0);
    expect(s.every((x) => x.count === 0 && x.sharePct === 0)).toBe(true);
  });
});

describe("clusterByMultiple", () => {
  it("hittar den systematiska klumpen — sidans egentliga poäng", () => {
    // Mätt 2026-08-19: ~85 % av katalogen låg på 1,31× i stället för 2,5×,
    // spårat till en sparad override i importtillägget. I en procentvy ser det
    // ut som brus; här ska det bli en stapel.
    const rows = [
      ...Array.from({ length: 8 }, (_, i) =>
        rad({ wixProductId: `fel${i}`, landedCostSek: 100, grossSek: 131 }),
      ),
      rad({ wixProductId: "ok1", landedCostSek: 100, grossSek: 250 }),
      rad({ wixProductId: "ok2", landedCostSek: 200, grossSek: 500 }),
    ];
    const k = clusterByMultiple(rows);
    expect(k[0].multiple).toBeCloseTo(1.31, 2);
    expect(k[0].count).toBe(8);
    expect(k[0].sharePct).toBeCloseTo(80, 0);
    expect(k[1].multiple).toBeCloseTo(2.5, 2);
  });

  it("grupperar över olika prisnivåer — det är multipeln som binder ihop dem", () => {
    const rows = [
      rad({ wixProductId: "a", landedCostSek: 50, grossSek: 125 }),
      rad({ wixProductId: "b", landedCostSek: 400, grossSek: 1000 }),
    ];
    expect(clusterByMultiple(rows)[0].count).toBe(2);
  });

  it("engangsforeteelser filtreras bort med minCount", () => {
    const rows = [
      rad({ wixProductId: "a", landedCostSek: 100, grossSek: 131 }),
      rad({ wixProductId: "b", landedCostSek: 100, grossSek: 250 }),
    ];
    expect(clusterByMultiple(rows, 2)).toHaveLength(0);
    expect(clusterByMultiple(rows, 1)).toHaveLength(2);
  });

  it("medianmarginalen beskriver vad multipeln motsvarar", () => {
    const rows = [
      rad({ wixProductId: "a", landedCostSek: 100, grossSek: 131 }),
      rad({ wixProductId: "b", landedCostSek: 100, grossSek: 131 }),
    ];
    const k = clusterByMultiple(rows);
    // 131 inkl moms → 104,80 netto, vinst 4,80 → 4,58 %.
    expect(k[0].medianMarginPct).toBeCloseTo(4.58, 1);
  });

  it("storst kluster forst", () => {
    const rows = [
      rad({ wixProductId: "a", landedCostSek: 100, grossSek: 250 }),
      rad({ wixProductId: "b", landedCostSek: 100, grossSek: 250 }),
      rad({ wixProductId: "c", landedCostSek: 100, grossSek: 250 }),
      rad({ wixProductId: "d", landedCostSek: 100, grossSek: 131 }),
      rad({ wixProductId: "e", landedCostSek: 100, grossSek: 131 }),
    ];
    expect(clusterByMultiple(rows).map((k) => k.count)).toEqual([3, 2]);
  });
});

describe("biggestOpportunities", () => {
  it("rankar pa KRONOR, inte procent — annars hamnar smaprylar overst", () => {
    // 8 % pa en 79-kronorspryl ar sex kronor. 12 % pa en soffa ar hundralappar.
    const pryl = rad({ wixProductId: "pryl", title: "Pryl", landedCostSek: 60, grossSek: 79 });
    const soffa = rad({ wixProductId: "soffa", title: "Soffa", landedCostSek: 2000, grossSek: 2999 });
    expect(pryl.marginPct).toBeLessThan(soffa.marginPct);
    expect(biggestOpportunities([pryl, soffa])[0].wixProductId).toBe("soffa");
  });

  it("respekterar limit och muterar inte inlistan", () => {
    const rows: MarginRow[] = [
      rad({ wixProductId: "a", landedCostSek: 100, grossSek: 131 }),
      rad({ wixProductId: "b", landedCostSek: 900, grossSek: 1100 }),
    ];
    const kopia = [...rows];
    expect(biggestOpportunities(rows, 1)).toHaveLength(1);
    expect(rows).toEqual(kopia);
  });
});
