import { describe, expect, it } from "vitest";
import {
  DAG_MS,
  MARGINAL_MS,
  SPAR_MS,
  auktionIFonstret,
  fonsterStartFor,
  fullstandigaDagar,
  laggTill,
  luckaIFonstret,
  reaFor,
  seedPunkter,
  slaIhopMedSeed,
  tillBelopp,
  tillOre,
  trimma,
  trimmaLuckor,
  type Prispunkt,
} from "./rea";

const NU = Date.parse("2026-11-01T12:40:00.000Z");
/** En tidpunkt `dagar` dygn före NU. */
const d = (dagar: number) => new Date(NU - dagar * DAG_MS).toISOString();
const pt = (dagar: number, p: number | null): Prispunkt => ({ t: d(dagar), p });

describe("reaFor — sänkningen", () => {
  it("en sänkning med 20 % efter 40 dagar på samma pris ger rea mot det priset", () => {
    const r = reaFor([pt(50, 100_000), pt(5, 80_000)], 80_000, NU);
    expect(r).toMatchObject({ rea: true, tidigareOre: 100_000, sankningar: 1 });
  });

  it("☠️ jämförpriset är det LÄGSTA priset i fönstret, inte det senaste före sänkningen", () => {
    // 1000 i 40 dagar, 900 i två dagar för 20 dagar sedan, sedan 1000 igen, sänkt till 800 för 5 dagar sedan.
    const r = reaFor([pt(60, 100_000), pt(20, 90_000), pt(18, 100_000), pt(5, 80_000)], 80_000, NU);
    expect(r).toMatchObject({ rea: true, tidigareOre: 90_000 });
  });

  it("en höjning är ingen sänkning", () => {
    expect(reaFor([pt(50, 80_000), pt(5, 100_000)], 100_000, NU)).toMatchObject({ rea: false, skal: "ingen_sankning" });
  });

  it("☠️ höjt i två dagar och sänkt tillbaka är ingen rea (det lägsta i fönstret är dagens pris)", () => {
    const r = reaFor([pt(60, 100_000), pt(7, 120_000), pt(5, 100_000)], 100_000, NU);
    expect(r).toMatchObject({ rea: false, skal: "under_grans" });
  });

  it("under 10 % ger ingen rea, 10 % precis gör det", () => {
    expect(reaFor([pt(50, 100_000), pt(5, 91_000)], 91_000, NU)).toMatchObject({ rea: false, skal: "under_grans" });
    expect(reaFor([pt(50, 100_000), pt(5, 90_000)], 90_000, NU)).toMatchObject({ rea: true, tidigareOre: 100_000 });
  });

  it("☠️ skylten försvinner 30 dagar efter den första sänkningen", () => {
    expect(reaFor([pt(80, 100_000), pt(29, 80_000)], 80_000, NU)).toMatchObject({ rea: true });
    expect(reaFor([pt(80, 100_000), pt(31, 80_000)], 80_000, NU)).toMatchObject({ rea: false, skal: "for_gammal" });
  });

  it("dagens pris som historiken inte känner till räknas från nu", () => {
    const r = reaFor([pt(50, 100_000)], 80_000, NU);
    expect(r).toMatchObject({ rea: true, tidigareOre: 100_000, forstaSankning: new Date(NU).toISOString() });
  });

  it("en variant som inte går att köpa har ingen rea", () => {
    expect(reaFor([pt(50, 100_000)], null, NU)).toMatchObject({ rea: false, skal: "inte_utbjuden" });
  });
});

describe("reaFor — gradvis sänkning", () => {
  it("två sänkningar inom 30 dagar: jämförpriset är det före den första, och skylten räknas från den", () => {
    const r = reaFor([pt(70, 100_000), pt(20, 90_000), pt(5, 80_000)], 80_000, NU);
    expect(r).toMatchObject({ rea: true, tidigareOre: 100_000, sankningar: 2, forstaSankning: d(20) });
  });

  it("☠️ en följd sänkningar håller inte skylten uppe längre än 30 dagar från den första", () => {
    const r = reaFor([pt(90, 100_000), pt(28, 95_000), pt(15, 90_000), pt(2, 85_000)], 85_000, NU);
    expect(r).toMatchObject({ rea: true, forstaSankning: d(28), tidigareOre: 100_000 });
    const senare = NU + 3 * DAG_MS;
    expect(reaFor([pt(90, 100_000), pt(28, 95_000), pt(15, 90_000), pt(2, 85_000)], 85_000, senare)).toMatchObject({
      rea: false,
      skal: "for_gammal",
    });
  });

  it("☠️ en tidigare sänkning som kanske låg mer än 30 dagar bak räknas INTE till följden", () => {
    // 29,5 dagar mellan sänkningarna: med upp till ett dygns fördröjning kan de verkligen ligga 30,5 isär.
    const r = reaFor([pt(80, 100_000), pt(34.5, 90_000), pt(5, 80_000)], 80_000, NU);
    // Utan följden: det lägsta i fönstret före sänkningen vid dag 5 är 90 000 (och 100 000 en kort stund).
    expect(r).toMatchObject({ rea: true, tidigareOre: 90_000, sankningar: 1, forstaSankning: d(5) });
  });
});

describe("reaFor — den strängaste läsningen av en gradvis sänkning", () => {
  it("☠️ en sänkning som kan ha legat inom 30 dagar flyttar fönstret bakåt, även när skylten räknas från en senare", () => {
    // 52 716 kr i 13 dygn för 53–66 dygn sedan, 115 712, 104 991 (36), 87 759 (33,5), 60 086 (15), 54 041 (4).
    // Sänkningen vid 33,5 dygn kan ha legat inom 30 dagar före den vid 4 dygn (den sågs upp till ett dygn sent),
    // och då är det lägsta de 30 dagarna före den 52 716: lägre än dagens pris, alltså ingen rea alls.
    const r = reaFor(
      [pt(90, 100_000), pt(66, 52_716), pt(52.5, 115_712), pt(36, 104_991), pt(33.5, 87_759), pt(15, 60_086), pt(4, 54_041)],
      54_041,
      NU,
    );
    expect(r).toMatchObject({ rea: false, skal: "under_grans" });
  });
});

describe("reaFor — historiken måste täcka fönstret", () => {
  it("☠️ en historik som börjar efter fönstrets start ger ingen rea", () => {
    expect(reaFor([pt(20, 100_000), pt(5, 80_000)], 80_000, NU)).toMatchObject({ rea: false, skal: "ofullstandig" });
  });

  it("☠️ fönstret är ett dygn längre än lagens 30 dagar (marginalen)", () => {
    // Historiken börjar 30,5 dygn före sänkningen: inom lagens 30 men inte inom 31.
    expect(reaFor([pt(35.5, 100_000), pt(5, 80_000)], 80_000, NU)).toMatchObject({ rea: false, skal: "ofullstandig" });
    expect(reaFor([pt(36.5, 100_000), pt(5, 80_000)], 80_000, NU)).toMatchObject({ rea: true });
    expect(fonsterStartFor(1_000_000_000_000)).toBe(1_000_000_000_000 - 30 * DAG_MS - MARGINAL_MS);
  });

  it("☠️ en ny produkt (inte till salu när fönstret började) har ingen rea", () => {
    const r = reaFor([pt(60, null), pt(32, 100_000), pt(5, 80_000)], 80_000, NU);
    expect(r).toMatchObject({ rea: false, skal: "ny" });
  });

  it("☠️ en tid då varianten inte gick att köpa räknas inte som ett pris", () => {
    // 700 kr fanns bara som dolt utkast; till salu 1000 kr i 40 dagar, sedan 800.
    const r = reaFor([pt(70, 70_000), pt(69, null), pt(60, 100_000), pt(5, 80_000)], 80_000, NU);
    expect(r).toMatchObject({ rea: true, tidigareOre: 100_000 });
  });

  it("en paus mitt i fönstret hindrar inte en rea: tiden räknas bara inte som ett pris", () => {
    const r = reaFor([pt(60, 100_000), pt(20, null), pt(18, 100_000), pt(5, 80_000)], 80_000, NU);
    expect(r).toMatchObject({ rea: true, tidigareOre: 100_000 });
  });

  it("☠️ en paus i försäljningen med samma pris efteråt är ingen sänkning", () => {
    const r = reaFor([pt(60, 100_000), pt(10, null), pt(5, 100_000)], 100_000, NU);
    expect(r).toMatchObject({ rea: false, skal: "ingen_sankning" });
  });
});

describe("☠️ jämförpriset blir aldrig högre än lagens, i den strängaste läsningen", () => {
  // Egenskapen lagen kräver, prövad på slumpade förlopp. Varje prisändring syns
  // 0–24 timmar sent (timavläsning, och dygnsavläsningen som fyllts bakåt), och
  // regeln ser bara det den har sett. Facit räknas på det VERKLIGA förloppet:
  //
  //   lagens följd   = de sänkningar i en obruten följd ned till dagens pris
  //                    som verkligen låg inom 30 dagar före den sista
  //   högsta tillåtna = det lägsta pris som tillämpades de 30 dagarna före den
  //                    FÖRSTA sänkningen i lagens följd
  //
  // Det är strängare än lagens ordalydelse ("det pris som gällde före den första
  // prissänkningen") och lika med den när följden bara är en sänkning.
  function slump(fro: number) {
    let s = fro;
    return () => {
      s = (s * 1_103_515_245 + 12_345) % 2_147_483_648;
      return s / 2_147_483_648;
    };
  }
  function kor(fall: number, sanknMax: number) {
    const r = slump(fall + 1);
    const verkligt: { start: number; p: number | null }[] = [];
    let t = NU - 90 * DAG_MS;
    let p: number | null = 100_000;
    while (t < NU) {
      verkligt.push({ start: t, p });
      t += (0.2 + r() * 12) * DAG_MS;
      const x = r();
      p = x < 0.08 ? null : x < 0.5 && p !== null ? Math.round(p * (1 - r() * sanknMax)) : Math.round(50_000 + r() * 100_000);
    }
    const aktuellt = verkligt[verkligt.length - 1].p;
    const sett: Prispunkt[] = [];
    let forra = -Infinity;
    for (const s of verkligt) {
      const sen = Math.max(forra + 1, Math.min(NU, s.start + r() * DAG_MS));
      forra = sen;
      sett.push({ t: new Date(sen).toISOString(), p: s.p });
    }
    return { verkligt, aktuellt, b: reaFor(sett, aktuellt, NU) };
  }
  function hogstaTillatna(verkligt: { start: number; p: number | null }[]): number {
    const erbjudna: { start: number; p: number }[] = [];
    for (const s of verkligt) {
      if (s.p === null) continue;
      if (erbjudna.length > 0 && erbjudna[erbjudna.length - 1].p === s.p) continue;
      erbjudna.push({ start: s.start, p: s.p });
    }
    const k = erbjudna.length - 1;
    const t = erbjudna[k].start;
    let forsta = k;
    while (forsta - 2 >= 0 && erbjudna[forsta - 2].p > erbjudna[forsta - 1].p && erbjudna[forsta - 1].start >= t - 30 * DAG_MS) forsta--;
    const tForsta = erbjudna[forsta].start;
    let lagsta = Infinity;
    for (let j = 0; j < verkligt.length; j++) {
      const s = verkligt[j];
      const slut = j + 1 < verkligt.length ? verkligt[j + 1].start : Infinity;
      if (s.p !== null && slut > tForsta - 30 * DAG_MS && s.start < tForsta && s.p < lagsta) lagsta = s.p;
    }
    return lagsta;
  }
  it("20 000 slumpade förlopp, med och utan gradvisa sänkningar", () => {
    let medRea = 0;
    let gradvisa = 0;
    for (let fall = 0; fall < 20_000; fall++) {
      const { verkligt, b } = kor(fall, fall % 2 === 0 ? 0.3 : 0.12);
      if (!b.rea) continue;
      medRea++;
      if (b.sankningar > 1) gradvisa++;
      expect(b.tidigareOre, `fall ${fall}`).toBeLessThanOrEqual(hogstaTillatna(verkligt));
    }
    // Provet ska pröva något: många fall med rea, och gradvisa bland dem.
    expect(medRea).toBeGreaterThan(500);
    expect(gradvisa).toBeGreaterThan(50);
  });
});

describe("luckor och auktioner i fönstret", () => {
  it("☠️ en lucka i fönstret, eller efter det, räknas", () => {
    const fran = d(36);
    expect(luckaIFonstret([{ fran: d(20), till: d(19) }], fran, NU)).toBe(true);
    expect(luckaIFonstret([{ fran: d(40), till: d(39) }], fran, NU)).toBe(false);
    expect(luckaIFonstret([{ fran: d(2), till: d(1) }], fran, NU)).toBe(true);
    expect(luckaIFonstret([{ fran: "trasig", till: d(1) }], fran, NU)).toBe(true);
  });

  it("en auktion i fönstret räknas, en före fönstret gör det inte", () => {
    const fran = d(36);
    expect(auktionIFonstret([{ start: NU - 20 * DAG_MS, slut: NU - 19.5 * DAG_MS }], fran, NU)).toBe(true);
    expect(auktionIFonstret([{ start: NU - 50 * DAG_MS, slut: NU - 49.5 * DAG_MS }], fran, NU)).toBe(false);
    expect(auktionIFonstret([{ start: NU - 2 * DAG_MS, slut: null }], fran, NU)).toBe(true);
  });

  it("fönstret som reaFor svarar med börjar 31 dygn före den tidigaste möjliga sänkningen", () => {
    const r = reaFor([pt(80, 100_000), pt(20, 90_000), pt(5, 80_000)], 80_000, NU);
    expect(r).toMatchObject({ rea: true, fonsterFran: d(51) });
  });

  it("gamla luckor glöms efter historiens längd", () => {
    const l = [{ fran: new Date(NU - SPAR_MS - 2 * DAG_MS).toISOString(), till: new Date(NU - SPAR_MS - DAG_MS).toISOString() }, { fran: d(3), till: d(2) }];
    expect(trimmaLuckor(l, NU)).toEqual([{ fran: d(3), till: d(2) }]);
  });
});

describe("historiken", () => {
  it("samma pris som senast lägger inte till någon punkt", () => {
    expect(laggTill([pt(5, 100)], d(0), 100)).toEqual({ punkter: [pt(5, 100)], andrad: false });
    expect(laggTill([pt(5, 100)], d(0), 90).andrad).toBe(true);
  });

  it("trimningen behåller den sista punkten före gränsen", () => {
    const p = [pt(80, 100), pt(70, 90), pt(10, 80)];
    expect(trimma(p, NU)).toEqual({ punkter: [pt(70, 90), pt(10, 80)], andrad: true });
    expect(trimma([pt(10, 80)], NU).andrad).toBe(false);
  });

  it("öre och belopp", () => {
    expect(tillOre("1669.00")).toBe(166_900);
    expect(tillOre(1599.5)).toBe(159_950);
    expect(tillOre("0")).toBeNull();
    expect(tillOre(undefined)).toBeNull();
    expect(tillBelopp(166_900)).toBe("1669");
    expect(tillBelopp(159_950)).toBe("1599.5");
  });
});

describe("bakåtfyllningen ur butikens dagliga avläsning", () => {
  it("en dag med få rader är ofullständig och hoppas över", () => {
    const f = fullstandigaDagar(new Map([["2026-10-01", 5000], ["2026-10-02", 2400], ["2026-10-03", 2600]]));
    expect([...f].sort()).toEqual(["2026-10-01", "2026-10-03"]);
  });

  it("☠️ en fullständig dag utan rad betyder att produkten inte gick att köpa", () => {
    const full = new Set(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"]);
    const p = seedPunkter([{ datum: "2026-10-01", prisOre: 100 }, { datum: "2026-10-02", prisOre: 100 }, { datum: "2026-10-04", prisOre: 90 }], full);
    expect(p).toEqual([
      { t: "2026-10-01T02:30:00.000Z", p: 100 },
      { t: "2026-10-03T02:30:00.000Z", p: null },
      { t: "2026-10-04T02:30:00.000Z", p: 90 },
    ]);
  });

  it("☠️ bara punkter före förloppets första punkt läggs till: timavläsningen skrivs aldrig över", () => {
    const seed = [{ t: "2026-10-01T02:30:00.000Z", p: 100 }, { t: "2026-10-05T02:30:00.000Z", p: 90 }, { t: "2026-10-10T02:30:00.000Z", p: 80 }];
    const fore = [{ t: "2026-10-06T10:40:00.000Z", p: 95 }];
    expect(slaIhopMedSeed(fore, seed)).toEqual({
      punkter: [{ t: "2026-10-01T02:30:00.000Z", p: 100 }, { t: "2026-10-05T02:30:00.000Z", p: 90 }, { t: "2026-10-06T10:40:00.000Z", p: 95 }],
      tillagda: 2,
    });
  });
});
