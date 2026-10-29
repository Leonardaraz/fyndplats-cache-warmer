import { describe, expect, it } from "vitest";
import type { StoredReview } from "../store/reviews";
import {
  ERSATTNINGAR,
  FORBJUDNA,
  harForbjudenBokstav,
  nyaInitialer,
  planeraSlumpa,
  skrivSlumpa,
} from "./slumpa-initialer";

function rad(p: Partial<StoredReview>): StoredReview {
  return {
    productId: "p1",
    reviewIdAE: "r1",
    rating: 5,
    textOriginal: "Great",
    textSwedish: "Bra produkt",
    initials: "Z.K.",
    hasImage: false,
    status: "approved",
    ...p,
  };
}

describe("harForbjudenBokstav", () => {
  it("hittar Y, X, Z och W, oavsett skiftläge", () => {
    for (const i of ["Y.A.", "A.X.", "z.k.", "W.", "A.w."]) expect(harForbjudenBokstav(i)).toBe(true);
    for (const i of ["S.K.", "Å.Ö.", "", undefined, "Verifierad köpare"]) expect(harForbjudenBokstav(i)).toBe(false);
  });
});

describe("nyaInitialer", () => {
  it("byter bara den förbjudna bokstaven och behåller resten", () => {
    const n = nyaInitialer(rad({ initials: "Z.K." }))!;
    expect(n).toMatch(/^[A-V]\.K\.$/);
    expect(n.startsWith("Z")).toBe(false);
    expect(nyaInitialer(rad({ initials: "K.W." }))).toMatch(/^K\.[A-V]\.$/);
  });
  it("byter båda när båda är förbjudna", () => {
    expect(nyaInitialer(rad({ initials: "X.Y." }))).toMatch(/^[A-V]\.[A-V]\.$/);
  });
  it("ger aldrig en förbjuden bokstav, över många rader", () => {
    for (let i = 0; i < 2000; i++) {
      const n = nyaInitialer(rad({ reviewIdAE: `id-${i}`, initials: "Y.Z." }))!;
      expect(harForbjudenBokstav(n)).toBe(false);
    }
    expect(ERSATTNINGAR.some((b) => (FORBJUDNA as readonly string[]).includes(b))).toBe(false);
  });
  it("är deterministisk men sprider sig över alfabetet", () => {
    expect(nyaInitialer(rad({}))).toBe(nyaInitialer(rad({})));
    const set = new Set<string>();
    for (let i = 0; i < 500; i++) set.add(nyaInitialer(rad({ reviewIdAE: `id-${i}` }))!);
    expect(set.size).toBeGreaterThan(15);
  });
  it("rör inte rader utan förbjuden bokstav eller med annan form", () => {
    expect(nyaInitialer(rad({ initials: "S.K." }))).toBeNull();
    expect(nyaInitialer(rad({ initials: "Zara" }))).toBeNull();
    expect(nyaInitialer(rad({ initials: "Verifierad köpare" }))).toBeNull();
    expect(nyaInitialer(rad({ initials: "" }))).toBeNull();
  });
});

describe("planeraSlumpa", () => {
  const rader = [
    rad({ reviewIdAE: "a", initials: "Z.K." }),
    rad({ reviewIdAE: "b", initials: "S.K." }),
    rad({ reviewIdAE: "c", initials: "W.X.", status: "rejected" }),
    rad({ reviewIdAE: "d", initials: "Y.A.", source: "customer" }),
    rad({ reviewIdAE: "e", initials: "Zara" }),
  ];
  it("tar rader av alla statusar men lämnar kundomdömen och annan form", () => {
    const p = planeraSlumpa(rader, { medKundomdomen: false, hogst: 500 });
    expect(p.attAndra.map((x) => x.r.reviewIdAE)).toEqual(["a", "c"]);
    expect(p.totalt).toBe(2);
    expect(p.kundomdomenHoppade).toBe(1);
    expect(p.annanForm).toBe(1);
    expect(p.perBokstav).toMatchObject({ Z: 1, W: 1, X: 1, Y: 0 });
  });
  it("tar med kundomdömen när det uttryckligen begärs", () => {
    const p = planeraSlumpa(rader, { medKundomdomen: true, hogst: 500 });
    expect(p.attAndra.map((x) => x.r.reviewIdAE)).toEqual(["a", "c", "d"]);
  });
  it("hogst kapar vad som skrivs men inte totalen", () => {
    const p = planeraSlumpa(rader, { medKundomdomen: false, hogst: 1 });
    expect(p.attAndra).toHaveLength(1);
    expect(p.totalt).toBe(2);
  });
});

describe("skrivSlumpa", () => {
  function varld(rader: StoredReview[], opts: { tappa?: boolean } = {}) {
    const lager = structuredClone(rader);
    const skrivna: StoredReview[] = [];
    return {
      lager,
      skrivna,
      deps: {
        rader,
        upsert: async (r: StoredReview) => {
          skrivna.push(structuredClone(r));
          if (opts.tappa) return;
          const i = lager.findIndex((x) => x.reviewIdAE === r.reviewIdAE);
          lager[i] = structuredClone(r);
        },
        lasOm: async (_p: string, id: string) => structuredClone(lager.find((x) => x.reviewIdAE === id) ?? null),
      },
    };
  }
  it("skriver nya initialer, behåller status och text och räknar efter återläsning", async () => {
    const rader = [rad({ reviewIdAE: "a" }), rad({ reviewIdAE: "c", initials: "W.X.", status: "pending" })];
    const v = varld(rader);
    const plan = planeraSlumpa(rader, { medKundomdomen: false, hogst: 500 });
    const svar = await skrivSlumpa(v.deps, plan);
    expect(svar).toEqual({ andrade: 2, fel: 0, kvar: 0 });
    expect(v.lager.every((r) => !harForbjudenBokstav(r.initials))).toBe(true);
    expect(v.lager[1]).toMatchObject({ status: "pending", textSwedish: "Bra produkt" });
  });
  it("en skrivning som inte sitter räknas som fel", async () => {
    const rader = [rad({})];
    const v = varld(rader, { tappa: true });
    const svar = await skrivSlumpa(v.deps, planeraSlumpa(rader, { medKundomdomen: false, hogst: 500 }));
    expect(svar).toEqual({ andrade: 0, fel: 1, kvar: 1 });
  });
  it("en omkörning efter en skarp körning hittar ingenting mer att ändra", async () => {
    const rader = [rad({ reviewIdAE: "a" }), rad({ reviewIdAE: "b", initials: "K.Y." })];
    const v = varld(rader);
    await skrivSlumpa(v.deps, planeraSlumpa(rader, { medKundomdomen: false, hogst: 500 }));
    expect(planeraSlumpa(v.lager, { medKundomdomen: false, hogst: 500 }).totalt).toBe(0);
  });
  it("stannar när tidsbudgeten är slut och säger hur många som är kvar", async () => {
    const rader = [rad({ reviewIdAE: "a" }), rad({ reviewIdAE: "b" })];
    const v = varld(rader);
    let n = 0;
    const svar = await skrivSlumpa({ ...v.deps, slut: () => n++ >= 1 }, planeraSlumpa(rader, { medKundomdomen: false, hogst: 500 }));
    expect(svar).toEqual({ andrade: 1, fel: 0, kvar: 1 });
  });
});
