import { describe, expect, it } from "vitest";
import type { StoredReview } from "../store/reviews";
import { bristerIInitialer } from "./initialer";
import {
  FORBJUDNA,
  harForbjudenBokstav,
  kallaFor,
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

/** Giltiga nya initialer ur A–V utan Q, plus Å och Ö. */
const GILTIG_BOKSTAV = "[A-PR-VÅÖ]";

describe("harForbjudenBokstav", () => {
  it("hittar Q, W, X, Y och Z, oavsett plats och skiftläge", () => {
    expect([...FORBJUDNA]).toEqual(["Q", "W", "X", "Y", "Z"]);
    for (const i of ["Y.A.", "A.X.", "z.k.", "W.", "A.w.", "Q.K.", "K.q.", "S.Z."]) {
      expect(harForbjudenBokstav(i)).toBe(true);
    }
    for (const i of ["S.K.", "Å.Ö.", "A.B.", "", undefined, "Verifierad köpare"]) {
      expect(harForbjudenBokstav(i)).toBe(false);
    }
  });
});

describe("kallaFor", () => {
  it("skiljer Aosom, import och kund åt", () => {
    expect(kallaFor({ source: "aosom" })).toBe("aosom");
    expect(kallaFor({ source: "customer" })).toBe("kund");
    expect(kallaFor({ source: undefined })).toBe("import");
  });
});

describe("nyaInitialer", () => {
  it("byter bara den förbjudna bokstaven och behåller resten", () => {
    for (let i = 0; i < 300; i++) {
      const forsta = nyaInitialer(rad({ reviewIdAE: `id-${i}`, initials: "Z.K." }))!;
      // Den nya första bokstaven får inte vara J, för då vore J.K. i bokstavsordning.
      expect(forsta).toMatch(/^[A-IK-PR-VÅÖ]\.K\.$/u);
      const andra = nyaInitialer(rad({ reviewIdAE: `id-${i}`, initials: "K.W." }))!;
      // Och den nya andra får inte vara L (K.L.).
      expect(andra).toMatch(/^K\.[A-KM-PR-VÅÖ]\.$/u);
    }
  });

  it("byter Q som de andra", () => {
    const n = nyaInitialer(rad({ initials: "Q.K." }))!;
    expect(n).toMatch(new RegExp(`^${GILTIG_BOKSTAV}\\.K\\.$`, "u"));
    expect(n.startsWith("Q")).toBe(false);
  });

  it("byter båda bokstäverna när båda är förbjudna, i bokstavsordning eller inte", () => {
    for (const gamla of ["X.Y.", "W.Z.", "Z.Z.", "Q.W."]) {
      const n = nyaInitialer(rad({ initials: gamla }))!;
      expect(n).toMatch(new RegExp(`^${GILTIG_BOKSTAV}\\.${GILTIG_BOKSTAV}\\.$`, "u"));
      expect(bristerIInitialer(n)).toBeNull();
    }
  });

  it("slumpar om båda bokstäverna när de står i bokstavsordning", () => {
    for (const gamla of ["A.B.", "C.D.", "G.H.", "L.M.", "U.V.", "S.T."]) {
      const n = nyaInitialer(rad({ initials: gamla }))!;
      expect(n).not.toBeNull();
      expect(n).not.toBe(gamla);
      expect(bristerIInitialer(n)).toBeNull();
    }
    // Inte bara en av dem: över många rader byts den första bokstaven också.
    const forstaBokstaver = new Set<string>();
    for (let i = 0; i < 300; i++) forstaBokstaver.add(nyaInitialer(rad({ reviewIdAE: `id-${i}`, initials: "L.M." }))![0]);
    expect(forstaBokstaver.size).toBeGreaterThan(10);
    expect(forstaBokstaver.has("L") && forstaBokstaver.size === 1).toBe(false);
  });

  it("en bokstavsordning med små bokstäver och blanda skiftlägen räknas också", () => {
    expect(nyaInitialer(rad({ initials: "g.h." }))).not.toBeNull();
    expect(nyaInitialer(rad({ initials: "G.h." }))).not.toBeNull();
  });

  it("ger aldrig en förbjuden bokstav eller bokstavsordning, över många rader", () => {
    for (const gamla of ["Y.Z.", "W.X.", "Z.A.", "A.B.", "Q.R.", "K.L.", "U.V."]) {
      for (let i = 0; i < 1000; i++) {
        const n = nyaInitialer(rad({ reviewIdAE: `id-${i}`, initials: gamla }))!;
        expect(bristerIInitialer(n)).toBeNull();
      }
    }
  });

  it("ger Å och Ö ibland, men inte ofta", () => {
    let med = 0;
    const antal = 4000;
    for (let i = 0; i < antal; i++) {
      if (/[ÅÖ]/u.test(nyaInitialer(rad({ reviewIdAE: `id-${i}`, initials: "A.B." }))!)) med++;
    }
    // Förväntat ≈ 7,8 %.
    expect(med).toBeGreaterThan(antal * 0.04);
    expect(med).toBeLessThan(antal * 0.13);
  });

  it("är deterministisk men sprider sig över alfabetet", () => {
    expect(nyaInitialer(rad({}))).toBe(nyaInitialer(rad({})));
    const set = new Set<string>();
    for (let i = 0; i < 500; i++) set.add(nyaInitialer(rad({ reviewIdAE: `id-${i}` }))!);
    expect(set.size).toBeGreaterThan(15);
  });

  it("samma recensions-id i olika produkter ger olika slump", () => {
    const set = new Set<string>();
    for (let i = 0; i < 200; i++) set.add(nyaInitialer(rad({ productId: `prod-${i}`, initials: "A.B." }))!);
    expect(set.size).toBeGreaterThan(30);
  });

  it("rör inte rader i sin ordning eller med annan form", () => {
    for (const i of ["S.K.", "K.S.", "A.A.", "B.A.", "Å.Ö.", "S.", "Zara", "A.B.C.", "Verifierad köpare", ""]) {
      expect(nyaInitialer(rad({ initials: i }))).toBeNull();
    }
  });

  it("rättar en enda förbjuden bokstav, och tål blanksteg runt initialerna", () => {
    const n = nyaInitialer(rad({ initials: "W." }))!;
    expect(n).toMatch(new RegExp(`^${GILTIG_BOKSTAV}\\.$`, "u"));
    expect(nyaInitialer(rad({ initials: " Z.K. " }))).toMatch(/^[A-IK-PR-VÅÖ]\.K\.$/u);
  });
});

describe("planeraSlumpa", () => {
  const rader = [
    rad({ reviewIdAE: "a", initials: "Z.K." }), //                               bara en förbjuden bokstav
    rad({ reviewIdAE: "b", initials: "S.K." }), //                               i sin ordning
    rad({ reviewIdAE: "c", initials: "W.X.", status: "rejected" }), //            bokstavsordning och förbjudna
    rad({ reviewIdAE: "d", initials: "Y.A.", source: "customer" }), //            kundomdöme
    rad({ reviewIdAE: "e", initials: "Zara" }), //                               annan form
    rad({ reviewIdAE: "f", initials: "L.M.", source: "aosom" }), //              bokstavsordning, Aosom
    rad({ reviewIdAE: "g", initials: "Q.K." }), //                               Q
    rad({ reviewIdAE: "h", initials: "B.A." }), //                               fallande ordning: i sin ordning
  ];

  it("tar rader av alla statusar men lämnar kundomdömen och annan form", () => {
    const p = planeraSlumpa(rader, { medKundomdomen: false, hogst: 500 });
    expect(p.attAndra.map((x) => x.r.reviewIdAE)).toEqual(["a", "c", "f", "g"]);
    expect(p.totalt).toBe(4);
    expect(p.kundomdomenHoppade).toBe(1);
    expect(p.annanForm).toBe(1);
  });

  it("räknar förbjudna bokstäver, orsak och källa", () => {
    const p = planeraSlumpa(rader, { medKundomdomen: false, hogst: 500 });
    expect(p.perBokstav).toEqual({ Q: 1, W: 1, X: 1, Y: 0, Z: 1 });
    // W.X. räknas som bokstavsordning, inte som "bara förbjuden", fast den har båda.
    expect(p.perOrsak).toEqual({ bokstavsordning: 2, barForbjuden: 2 });
    expect(p.perKalla).toEqual({ aosom: 1, import: 3, kund: 0 });
    expect(p.perOrsak.bokstavsordning + p.perOrsak.barForbjuden).toBe(p.totalt);
    expect(p.perKalla.aosom + p.perKalla.import + p.perKalla.kund).toBe(p.totalt);
  });

  it("tar med kundomdömen när det uttryckligen begärs", () => {
    const p = planeraSlumpa(rader, { medKundomdomen: true, hogst: 500 });
    expect(p.attAndra.map((x) => x.r.reviewIdAE)).toEqual(["a", "c", "d", "f", "g"]);
    expect(p.kundomdomenHoppade).toBe(0);
    expect(p.perKalla.kund).toBe(1);
    expect(p.perBokstav.Y).toBe(1);
  });

  it("hogst kapar vad som skrivs men inte totalen", () => {
    const p = planeraSlumpa(rader, { medKundomdomen: false, hogst: 1 });
    expect(p.attAndra).toHaveLength(1);
    expect(p.totalt).toBe(4);
  });

  it("varje planerad rad får initialer som är i sin ordning", () => {
    const p = planeraSlumpa(rader, { medKundomdomen: true, hogst: 500 });
    for (const { r, nya } of p.attAndra) {
      expect(bristerIInitialer(r.initials)).not.toBeNull();
      expect(bristerIInitialer(nya)).toBeNull();
    }
  });

  it("räknar hur många nya initialer som fick Å eller Ö", () => {
    const manga = Array.from({ length: 2000 }, (_, i) => rad({ reviewIdAE: `id-${i}`, initials: "A.B." }));
    const p = planeraSlumpa(manga, { medKundomdomen: false, hogst: 500 });
    const faktiskt = planeraSlumpa(manga, { medKundomdomen: false, hogst: 5000 }).attAndra.filter(({ nya }) => /[ÅÖ]/u.test(nya)).length;
    expect(p.nyaMedAringEllerOumlaut).toBe(faktiskt);
    expect(p.nyaMedAringEllerOumlaut).toBeGreaterThan(100);
    expect(p.nyaMedAringEllerOumlaut).toBeLessThan(230);
  });

  it("en plan över en redan rättad lista är tom", () => {
    const rattade = rader.map((r) => {
      const nya = nyaInitialer(r);
      return nya ? { ...r, initials: nya } : r;
    });
    expect(planeraSlumpa(rattade, { medKundomdomen: true, hogst: 500 }).totalt).toBe(0);
  });
});

describe("skrivSlumpa", () => {
  function varld(rader: StoredReview[], opts: { tappa?: boolean } = {}) {
    let lager = structuredClone(rader);
    const skrivna: StoredReview[] = [];
    return {
      get lager() {
        return lager;
      },
      set lager(v: StoredReview[]) {
        lager = v;
      },
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
  const plan = (rader: StoredReview[]) => planeraSlumpa(rader, { medKundomdomen: false, hogst: 500 });

  it("skriver nya initialer, behåller status och text och räknar efter återläsning", async () => {
    const rader = [rad({ reviewIdAE: "a" }), rad({ reviewIdAE: "c", initials: "W.X.", status: "pending" })];
    const v = varld(rader);
    const svar = await skrivSlumpa(v.deps, plan(rader));
    expect(svar).toMatchObject({ andrade: 2, fel: 0, kvar: 0, sentOmLasta: 0, andratUnderTiden: 0 });
    expect(v.lager.every((r) => bristerIInitialer(r.initials) === null)).toBe(true);
    expect(v.lager[1]).toMatchObject({ status: "pending", textSwedish: "Bra produkt" });
  });

  it("säger vilka produkter som skrevs, en gång var", async () => {
    const rader = [
      rad({ productId: "p1", reviewIdAE: "a" }),
      rad({ productId: "p1", reviewIdAE: "b", initials: "A.B." }),
      rad({ productId: "p2", reviewIdAE: "c", initials: "Q.K." }),
      rad({ productId: "p3", reviewIdAE: "d", initials: "S.K." }),
    ];
    const v = varld(rader);
    const svar = await skrivSlumpa(v.deps, plan(rader));
    expect(svar.skrivnaProdukter.sort()).toEqual(["p1", "p2"]);
    expect(svar.andrade).toBe(3);
  });

  it("en skrivning som inte sitter räknas som fel, och produkten sägs ändå till butiken", async () => {
    const rader = [rad({})];
    const v = varld(rader, { tappa: true });
    const svar = await skrivSlumpa({ ...v.deps, vanta: async () => {} }, plan(rader));
    expect(svar).toMatchObject({ andrade: 0, fel: 1, kvar: 1, avvikelser: { initialer: 1, saknas: 0, status: 0, text: 0 } });
    // Skrivningen kan ha tagit delvis; butiken ska hämta om, hellre än att visa en gammal kopia.
    expect(svar.skrivnaProdukter).toEqual(["p1"]);
  });

  it("en omkörning efter en skarp körning hittar ingenting mer att ändra", async () => {
    const rader = [rad({ reviewIdAE: "a" }), rad({ reviewIdAE: "b", initials: "K.Y." }), rad({ reviewIdAE: "c", initials: "A.B." })];
    const v = varld(rader);
    await skrivSlumpa(v.deps, plan(rader));
    expect(plan(v.lager).totalt).toBe(0);
  });

  it("en rad som lagret visar sent räknas som ändrad, och som sent omläst", async () => {
    const rader = [rad({ reviewIdAE: "a" })];
    const v = varld(rader);
    let lasningar = 0;
    const svar = await skrivSlumpa(
      {
        ...v.deps,
        vanta: async () => {},
        // Läsning 0 är kontrollen före skrivningen; 1 och 2 är återläsningar som ännu visar den gamla raden.
        lasOm: async (p, id) => (lasningar++ < 3 ? structuredClone(rader[0]) : v.deps.lasOm(p, id)),
      },
      plan(rader),
    );
    expect(svar).toMatchObject({ andrade: 1, fel: 0, sentOmLasta: 1, andratUnderTiden: 0 });
  });

  it("skiljer på vilket fält som avviker", async () => {
    const rader = [rad({ reviewIdAE: "a" }), rad({ reviewIdAE: "b" }), rad({ reviewIdAE: "c" })];
    const v = varld(rader);
    const lasningar = new Map<string, number>();
    const svar = await skrivSlumpa(
      {
        ...v.deps,
        vanta: async () => {},
        lasOm: async (_p, id) => {
          const n = lasningar.get(id) ?? 0;
          lasningar.set(id, n + 1);
          const r = structuredClone(v.lager.find((x) => x.reviewIdAE === id)!);
          // Första läsningen är kontrollen före skrivningen: raden är orörd. Därefter avviker de.
          if (n === 0) return r;
          if (id === "a") return null;
          if (id === "b") return { ...r, status: "rejected" as const };
          return { ...r, textSwedish: "annan text" };
        },
      },
      plan(rader),
    );
    expect(svar.avvikelser).toEqual({ saknas: 1, initialer: 0, status: 1, text: 1 });
    expect(svar).toMatchObject({ andrade: 0, fel: 3, kvar: 3 });
  });

  it("stannar när tidsbudgeten är slut och säger hur många som är kvar", async () => {
    const rader = [rad({ reviewIdAE: "a" }), rad({ reviewIdAE: "b" })];
    const v = varld(rader);
    let n = 0;
    const svar = await skrivSlumpa({ ...v.deps, slut: () => n++ >= 1 }, plan(rader));
    expect(svar).toMatchObject({ andrade: 1, fel: 0, kvar: 1 });
  });

  it("rör inte en rad som ändrats sedan planen gjordes", async () => {
    const rader = [
      rad({ productId: "pa", reviewIdAE: "a" }),
      rad({ productId: "pb", reviewIdAE: "b", status: "pending" }),
      rad({ productId: "pc", reviewIdAE: "c" }),
      rad({ productId: "pd", reviewIdAE: "d" }),
      rad({ productId: "pe", reviewIdAE: "e" }),
    ];
    const v = varld(rader);
    const p = plan(rader);
    // Efter planen och före skrivningen: a får andra initialer för hand, b modereras,
    // c får redigerad text och d försvinner. e är orörd.
    v.lager = v.lager
      .filter((r) => r.reviewIdAE !== "d")
      .map((r) => {
        if (r.reviewIdAE === "a") return { ...r, initials: "S.K." };
        if (r.reviewIdAE === "b") return { ...r, status: "approved" as const };
        if (r.reviewIdAE === "c") return { ...r, textSwedish: "Redigerad av Leonard" };
        return r;
      });
    const svar = await skrivSlumpa(v.deps, p);
    expect(svar).toMatchObject({ andrade: 1, fel: 0, andratUnderTiden: 4, kvar: 4 });
    expect(v.skrivna.map((r) => r.reviewIdAE)).toEqual(["e"]);
    // Det som andra ändrat står kvar, inte det planen läste.
    expect(v.lager.find((r) => r.reviewIdAE === "a")!.initials).toBe("S.K.");
    expect(v.lager.find((r) => r.reviewIdAE === "b")!.status).toBe("approved");
    expect(v.lager.find((r) => r.reviewIdAE === "c")!.textSwedish).toBe("Redigerad av Leonard");
    // Butiken sägs bara till om det som faktiskt skrevs.
    expect(svar.skrivnaProdukter).toEqual(["pe"]);
    // b och c har fortfarande de gamla initialerna och planeras om i nästa körning, med sitt nya
    // läge. a har redan fått bra initialer för hand, d finns inte längre och e är rättad.
    expect(plan(v.lager).attAndra.map((x) => x.r.reviewIdAE)).toEqual(["b", "c"]);
  });

  it("skriver från den färska raden, så ett annat fält som ändrats under tiden följer med", async () => {
    const rader = [rad({ reviewIdAE: "a" })];
    const v = varld(rader);
    const p = plan(rader);
    v.lager[0] = { ...v.lager[0], hasImage: true, imageUrl: "https://bild.test/1.jpg", rating: 4 };
    const svar = await skrivSlumpa(v.deps, p);
    expect(svar).toMatchObject({ andrade: 1, fel: 0, andratUnderTiden: 0 });
    expect(v.skrivna[0]).toMatchObject({ hasImage: true, imageUrl: "https://bild.test/1.jpg", rating: 4 });
    expect(bristerIInitialer(v.skrivna[0].initials)).toBeNull();
  });

  it("ett kast vid skrivningen räknas som fel och stoppar inte resten", async () => {
    const rader = [rad({ reviewIdAE: "a" }), rad({ reviewIdAE: "b" })];
    const v = varld(rader);
    const svar = await skrivSlumpa(
      {
        ...v.deps,
        vanta: async () => {},
        upsert: async (r) => {
          if (r.reviewIdAE === "a") throw new Error("Wix nere");
          await v.deps.upsert(r);
        },
      },
      plan(rader),
    );
    expect(svar).toMatchObject({ andrade: 1, fel: 1, kvar: 1 });
    expect(svar.avvikelser.saknas).toBe(1);
  });

  it("ett kast vid kontrollläsningen skriver ingenting och räknas som fel", async () => {
    const rader = [rad({ reviewIdAE: "a" })];
    const v = varld(rader);
    const svar = await skrivSlumpa(
      {
        ...v.deps,
        lasOm: async () => {
          throw new Error("Wix nere");
        },
      },
      plan(rader),
    );
    expect(svar).toMatchObject({ andrade: 0, fel: 1, kvar: 1 });
    expect(v.skrivna).toHaveLength(0);
    expect(svar.skrivnaProdukter).toEqual([]);
  });
});
