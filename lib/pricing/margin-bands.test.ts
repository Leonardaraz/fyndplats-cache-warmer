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
  it("jämför NETTO mot NETTO — kostnaden är momsad", () => {
    // Granskning 2026-08-19: första versionen drog av den MOMSADE kostnaden
    // från nettointäkten och underskattade varje marginal med ~20 % av
    // kostnaden. Mappningens landedCostSek är inkl. moms (AliExpress EU-lager
    // prissätter "Price includes VAT" — se lib/import/pricing.ts, och
    // lib/auction/seed.ts räknar netSupplierCost = landad / 1,25).
    //
    // 299 inkl moms → 239,20 netto. 100 inkl moms → 80 netto.
    // Vinst 159,20, marginal 66,6 % — inte 58,2 % som den momsade jämförelsen gav.
    const r = rad();
    expect(r.netSek).toBeCloseTo(239.2, 2);
    expect(r.netCostSek).toBeCloseTo(80, 2);
    expect(r.profitSek).toBeCloseTo(159.2, 2);
    expect(r.marginPct).toBeCloseTo(66.55, 1);
  });

  it("felet som fanns: 149/100 var 16 %, ska vara 33 %", () => {
    // Exakt granskningens exempel. Skillnaden flyttar produkten två band och
    // tar bort den ur "Störst att hämta" helt.
    const r = rad({ grossSek: 149, landedCostSek: 100 });
    expect(r.marginPct).toBeCloseTo(32.89, 1);
    expect(r.bandId).toBe("25-35");
    expect(r.gapSek).toBe(0);
  });

  it("multipeln är pris genom landad kostnad", () => {
    expect(rad({ grossSek: 250, landedCostSek: 100 }).multiple).toBeCloseTo(2.5, 5);
  });

  it("negativ marginal när priset ligger under kostnaden", () => {
    // Bada momsade → jamforelsen ar ren.
    const r = rad({ grossSek: 79, landedCostSek: 100 });
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
    // Argumentet är NETTOkostnaden: 22,5 % mål på 100 netto → målvinst 29,03.
    // Dagens vinst 10 → gap 19,03.
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
      rad({ wixProductId: "a", grossSek: 79, landedCostSek: 100 }), // loss
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
      // Charm9 rundar UPP till narmaste ...9, sa samma 1,31-installning ger
      // olika exakta multiplar. Toleransen ska ANDA halla ihop dem.
      rad({ wixProductId: "fel0", landedCostSek: 380, grossSek: 499 }),
      rad({ wixProductId: "fel1", landedCostSek: 395, grossSek: 519 }),
      rad({ wixProductId: "fel2", landedCostSek: 410, grossSek: 539 }),
      rad({ wixProductId: "fel3", landedCostSek: 300, grossSek: 399 }),
      rad({ wixProductId: "ok1", landedCostSek: 400, grossSek: 999 }),
      rad({ wixProductId: "ok2", landedCostSek: 380, grossSek: 949 }),
    ];
    const k = clusterByMultiple(rows);
    // Storsta klustret ar de fyra felprissatta runt 1,3x — trots att deras
    // exakta multiplar skiljer sig at pa andra decimalen.
    expect(k[0].count).toBe(4);
    expect(k[0].multiple).toBeGreaterThan(1.28);
    expect(k[0].multiple).toBeLessThan(1.35);
    // ...och de tva korrekta runt 2,5x hamnar i ett eget.
    expect(k[1].count).toBe(2);
    expect(k[1].multiple).toBeGreaterThan(2.4);
  });

  it("haller isar tva OLIKA installningar — toleransen slar inte ihop allt", () => {
    // Tva par pa ~1,30x respektive ~2,50x, med olika kostnader sa att
    // charm9-jittret ar realistiskt. Toleransen ska binda ihop paren men
    // aldrig bygga en bro mellan installningarna.
    const rows = [
      rad({ wixProductId: "a", landedCostSek: 1000, grossSek: 1299 }),
      rad({ wixProductId: "b", landedCostSek: 1010, grossSek: 1319 }),
      rad({ wixProductId: "c", landedCostSek: 1000, grossSek: 2499 }),
      rad({ wixProductId: "d", landedCostSek: 1010, grossSek: 2529 }),
    ];
    const k = clusterByMultiple(rows);
    expect(k).toHaveLength(2);
    expect(k.map((x) => x.count)).toEqual([2, 2]);
    expect(k[0].multiple).toBeLessThan(1.35);
    expect(k[1].multiple).toBeGreaterThan(2.4);
  });

  it("grupperar över olika prisnivåer — det är multipeln som binder ihop dem", () => {
    const rows = [
      rad({ wixProductId: "a", landedCostSek: 50, grossSek: 125 }),
      rad({ wixProductId: "b", landedCostSek: 400, grossSek: 1000 }),
    ];
    expect(clusterByMultiple(rows)[0].count).toBe(2);
  });

  it("drar bort det fasta paslaget innan multipeln raknas", () => {
    // gross/cost blir annars multiplikator + paslag/kostnad, som varierar med
    // kostnaden och sprider ut en gemensam installning.
    const rows = [
      rad({ wixProductId: "a", landedCostSek: 1000, grossSek: 2549 }),
      rad({ wixProductId: "b", landedCostSek: 2000, grossSek: 5049 }),
    ];
    expect(clusterByMultiple(rows, 2, 49)[0].count).toBe(2);
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
    // Bada momsade: 131 -> 104,80 netto, 100 -> 80 netto. Vinst 24,80 -> 23,7 %.
    expect(k[0].medianMarginPct).toBeCloseTo(23.66, 1);
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
    // Prylen har SAMRE procent men soffan mer pengar att hamta.
    const pryl = rad({ wixProductId: "pryl", title: "Pryl", landedCostSek: 70, grossSek: 79 });
    const soffa = rad({ wixProductId: "soffa", title: "Soffa", landedCostSek: 2400, grossSek: 2999 });
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
