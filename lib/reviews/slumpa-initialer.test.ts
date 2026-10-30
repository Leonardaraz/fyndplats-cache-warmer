import { describe, expect, it } from "vitest";
import type { StoredReview } from "../store/reviews";
import { GILTIGA_PAR, bristerIInitialer, nyckelForInitialer } from "./initialer";
import {
  FORBJUDNA,
  behallOrdning,
  harForbjudenBokstav,
  kallaFor,
  nyaInitialer,
  planeraSlumpa,
  skrivSlumpa,
  type SlumpaPlan,
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

const radId = (r: Pick<StoredReview, "productId" | "reviewIdAE">) => `${r.productId}__${r.reviewIdAE}`;

/** Tillämpar planen på raderna, som en skarp körning gör. */
function tillampa(rader: StoredReview[], plan: SlumpaPlan): StoredReview[] {
  const nya = new Map(plan.attAndra.map(({ r, nya }) => [radId(r), nya]));
  return rader.map((r) => {
    const n = nya.get(radId(r));
    return n ? { ...r, initials: n } : r;
  });
}

/** mulberry32: samma ström i alla Node-versioner, så simuleringarna går att köra om. */
function slumpgenerator(frö: number): () => number {
  let a = frö;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Raderna på en produkt som upptar en plats: inte avvisade, och i formen 'S.K.'. */
function levande(rader: StoredReview[]): StoredReview[] {
  return rader.filter((r) => r.status !== "rejected" && /^\p{L}\.(\p{L}\.)?$/u.test((r.initials ?? "").trim()));
}

/** Produkter där två levande rader delar plats, utom två kundomdömen (två riktiga kunder). */
function produkterMedDubblett(rader: StoredReview[]): string[] {
  const perProdukt = new Map<string, StoredReview[]>();
  for (const r of levande(rader)) perProdukt.set(r.productId, [...(perProdukt.get(r.productId) ?? []), r]);
  const ut: string[] = [];
  for (const [pid, lista] of perProdukt) {
    const sett = new Map<string, StoredReview>();
    for (const r of lista) {
      const plats = nyckelForInitialer(r.initials);
      const annan = sett.get(plats);
      if (annan && !(annan.source === "customer" && r.source === "customer")) ut.push(`${pid}:${plats}`);
      sett.set(plats, annan ?? r);
    }
  }
  return ut;
}

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
  it("skiljer Aosom, VEVOR, import och kund åt", () => {
    expect(kallaFor({ source: "aosom" })).toBe("aosom");
    expect(kallaFor({ source: "vevor" })).toBe("vevor");
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
    expect(p.perOrsak).toEqual({ bokstavsordning: 2, barForbjuden: 2, dubblett: 0 });
    expect(p.perKalla).toEqual({ aosom: 1, vevor: 0, import: 3, kund: 0 });
    expect(p.perOrsak.bokstavsordning + p.perOrsak.barForbjuden + p.perOrsak.dubblett).toBe(p.totalt);
    expect(p.perKalla.aosom + p.perKalla.vevor + p.perKalla.import + p.perKalla.kund).toBe(p.totalt);
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
    const forsta = planeraSlumpa(rader, { medKundomdomen: true, hogst: 500 });
    expect(forsta.totalt).toBeGreaterThan(0);
    expect(planeraSlumpa(tillampa(rader, forsta), { medKundomdomen: true, hogst: 500 }).totalt).toBe(0);
  });

  it("räknar produkterna som berörs, och har ingenting kvar att säga om en ren lista", () => {
    const p = planeraSlumpa(rader, { medKundomdomen: false, hogst: 500 });
    expect(p.produkter).toBe(1);
    expect(p.kundDubbletter).toBe(0);
    expect(p.ejUnika).toBe(0);
    const ren = planeraSlumpa([rad({ initials: "S.K." }), rad({ reviewIdAE: "r2", initials: "A.R." })], {
      medKundomdomen: false,
      hogst: 500,
    });
    expect(ren).toMatchObject({ totalt: 0, produkter: 0, kundDubbletter: 0, ejUnika: 0, annanForm: 0 });
  });
});

describe("behallOrdning", () => {
  const sortera = (rader: StoredReview[]) => [...rader].sort(behallOrdning).map((r) => r.reviewIdAE);

  it("ger kundomdömen först, sedan synliga före väntande", () => {
    const rader = [
      rad({ reviewIdAE: "vantande", status: "pending" }),
      rad({ reviewIdAE: "godkand", status: "approved" }),
      rad({ reviewIdAE: "kund", status: "pending", source: "customer" }),
      rad({ reviewIdAE: "redigerad", status: "edited" }),
    ];
    expect(sortera(rader)).toEqual(["kund", "godkand", "redigerad", "vantande"]);
  });

  it("ger den äldsta före den nyaste, och sist id", () => {
    const rader = [
      rad({ reviewIdAE: "c", date: "2026-03-01T00:00:00.000Z" }),
      rad({ reviewIdAE: "b", date: "2026-01-01T00:00:00.000Z" }),
      rad({ reviewIdAE: "a", date: "2026-03-01T00:00:00.000Z" }),
    ];
    expect(sortera(rader)).toEqual(["b", "a", "c"]);
  });

  it("använder importtiden när datum saknas, och lägger rader utan någon tid sist", () => {
    const rader = [
      rad({ reviewIdAE: "utan", date: undefined, importedAt: undefined }),
      rad({ reviewIdAE: "importerad", date: undefined, importedAt: "2026-02-01T00:00:00.000Z" }),
      rad({ reviewIdAE: "daterad", date: "2026-06-01T00:00:00.000Z", importedAt: "2025-01-01T00:00:00.000Z" }),
    ];
    // Datumet går före importtiden: "daterad" skrevs 2026-06, "importerad" kom in 2026-02.
    expect(sortera(rader)).toEqual(["importerad", "daterad", "utan"]);
  });

  it("är oberoende av i vilken ordning raderna kommer", () => {
    const rader = Array.from({ length: 30 }, (_, i) =>
      rad({
        reviewIdAE: `id-${i}`,
        status: i % 3 === 0 ? "pending" : "approved",
        source: i % 11 === 0 ? "customer" : undefined,
        date: i % 4 === 0 ? undefined : `2026-0${1 + (i % 9)}-15T00:00:00.000Z`,
      }),
    );
    const slump = slumpgenerator(7);
    const blandad = [...rader].sort(() => slump() - 0.5);
    expect(sortera(blandad)).toEqual(sortera(rader));
  });
});

describe("planeraSlumpa: unika initialer per produkt", () => {
  const plan = (rader: StoredReview[], opts: { medKundomdomen?: boolean; hogst?: number } = {}) =>
    planeraSlumpa(rader, { medKundomdomen: opts.medKundomdomen ?? false, hogst: opts.hogst ?? 100_000 });

  it("låter den äldsta av två synliga med samma initialer vara kvar och byter den nyare", () => {
    const rader = [
      rad({ reviewIdAE: "ny", initials: "S.K.", date: "2026-05-01T00:00:00.000Z" }),
      rad({ reviewIdAE: "gammal", initials: "S.K.", date: "2026-01-01T00:00:00.000Z" }),
    ];
    const p = plan(rader);
    expect(p.attAndra.map((x) => x.r.reviewIdAE)).toEqual(["ny"]);
    expect(p.attAndra[0].orsak).toBe("dubblett");
    expect(p.perOrsak).toEqual({ bokstavsordning: 0, barForbjuden: 0, dubblett: 1 });
    expect(p).toMatchObject({ totalt: 1, produkter: 1, kundDubbletter: 0, ejUnika: 0 });
    const nya = p.attAndra[0].nya;
    expect(nya).not.toBe("S.K.");
    expect(bristerIInitialer(nya)).toBeNull();
  });

  it("rör inte samma initialer på olika produkter", () => {
    const rader = [
      rad({ productId: "p1", reviewIdAE: "a", initials: "S.K." }),
      rad({ productId: "p2", reviewIdAE: "b", initials: "S.K." }),
      rad({ productId: "p3", reviewIdAE: "c", initials: "S.K." }),
    ];
    expect(plan(rader).totalt).toBe(0);
  });

  it("en väntande rad viker för en synlig, hur gammal den än är", () => {
    const rader = [
      rad({ reviewIdAE: "vantande", initials: "S.K.", status: "pending", date: "2020-01-01T00:00:00.000Z" }),
      rad({ reviewIdAE: "synlig", initials: "S.K.", status: "approved", date: "2026-09-01T00:00:00.000Z" }),
    ];
    expect(plan(rader).attAndra.map((x) => x.r.reviewIdAE)).toEqual(["vantande"]);
    const redigerad = [
      rad({ reviewIdAE: "godkand", initials: "S.K.", status: "approved", date: "2026-09-01T00:00:00.000Z" }),
      rad({ reviewIdAE: "redigerad", initials: "S.K.", status: "edited", date: "2020-01-01T00:00:00.000Z" }),
    ];
    // Två synliga: den äldsta (redigerad) får vara kvar.
    expect(plan(redigerad).attAndra.map((x) => x.r.reviewIdAE)).toEqual(["godkand"]);
  });

  it("ett kundomdöme behåller sina initialer; en vanlig recension viker, också en äldre", () => {
    const rader = [
      rad({ reviewIdAE: "vanlig", initials: "S.K.", date: "2020-01-01T00:00:00.000Z" }),
      rad({ reviewIdAE: "kund", initials: "S.K.", source: "customer", date: "2026-09-01T00:00:00.000Z" }),
    ];
    const p = plan(rader);
    expect(p.attAndra.map((x) => x.r.reviewIdAE)).toEqual(["vanlig"]);
    expect(p.kundDubbletter).toBe(0);
  });

  it("två kundomdömen med samma initialer rörs aldrig, de räknas bara", () => {
    const rader = [
      rad({ reviewIdAE: "k1", initials: "S.K.", source: "customer" }),
      rad({ reviewIdAE: "k2", initials: "S.K.", source: "customer" }),
    ];
    for (const medKundomdomen of [false, true]) {
      const p = plan(rader, { medKundomdomen });
      expect(p).toMatchObject({ totalt: 0, kundDubbletter: 1 });
    }
  });

  it("en vanlig recension med samma initialer som två kunder byts, kunderna rörs inte", () => {
    const rader = [
      rad({ reviewIdAE: "k1", initials: "S.K.", source: "customer" }),
      rad({ reviewIdAE: "k2", initials: "S.K.", source: "customer" }),
      rad({ reviewIdAE: "v", initials: "S.K." }),
    ];
    const p = plan(rader, { medKundomdomen: true });
    expect(p.attAndra.map((x) => x.r.reviewIdAE)).toEqual(["v"]);
    expect(p.kundDubbletter).toBe(1);
  });

  it("en avvisad recension upptar ingen plats och byts inte för att den delar en", () => {
    const rader = [
      rad({ reviewIdAE: "avvisad", initials: "S.K.", status: "rejected", date: "2020-01-01T00:00:00.000Z" }),
      rad({ reviewIdAE: "synlig", initials: "S.K." }),
    ];
    expect(plan(rader).totalt).toBe(0);
  });

  it("skiftläge och punkter spelar ingen roll för vad som är samma initialer", () => {
    const rader = [
      rad({ reviewIdAE: "a", initials: "S.K.", date: "2026-01-01T00:00:00.000Z" }),
      rad({ reviewIdAE: "b", initials: "s.k.", date: "2026-02-01T00:00:00.000Z" }),
    ];
    const p = plan(rader);
    expect(p.attAndra.map((x) => x.r.reviewIdAE)).toEqual(["b"]);
    expect(nyckelForInitialer(p.attAndra[0].nya)).not.toBe("S.K.");
  });

  it("tre med samma initialer: en är kvar, två får olika nya", () => {
    const rader = ["a", "b", "c"].map((id, i) =>
      rad({ reviewIdAE: id, initials: "M.L.", date: `2026-0${i + 1}-01T00:00:00.000Z` }),
    );
    const p = plan(rader);
    expect(p.attAndra.map((x) => x.r.reviewIdAE)).toEqual(["b", "c"]);
    const efter = tillampa(rader, p);
    expect(new Set(efter.map((r) => nyckelForInitialer(r.initials))).size).toBe(3);
    expect(efter.find((r) => r.reviewIdAE === "a")!.initials).toBe("M.L.");
    expect(produkterMedDubblett(efter)).toEqual([]);
  });

  it("en rad som rättas hamnar aldrig på en plats en annan rad har", () => {
    // Utan hänsyn till produkten blir ungefär var tjugonde "Z.K." ett "S.K." och krockar med den som redan finns.
    const rader: StoredReview[] = [];
    for (let i = 0; i < 2000; i++) {
      rader.push(rad({ productId: `p${i}`, reviewIdAE: "behaller", initials: "S.K." }));
      rader.push(rad({ productId: `p${i}`, reviewIdAE: "rattas", initials: "Z.K." }));
    }
    const utanHansyn = rader.filter((r) => r.initials === "Z.K.").filter((r) => nyaInitialer(r) === "S.K.").length;
    expect(utanHansyn).toBeGreaterThan(30); // förutsättningen: utan regeln hade krockarna varit många
    const efter = tillampa(rader, plan(rader));
    expect(produkterMedDubblett(efter)).toEqual([]);
    expect(efter.every((r) => bristerIInitialer(r.initials) === null)).toBe(true);
    // De som behåller sin plats är orörda.
    expect(efter.filter((r) => r.reviewIdAE === "behaller").every((r) => r.initials === "S.K.")).toBe(true);
  });

  it("två rader som rättas till samma initialer får olika, och delar inte med dem som är kvar", () => {
    const rader: StoredReview[] = [];
    for (let i = 0; i < 1000; i++) {
      rader.push(rad({ productId: `p${i}`, reviewIdAE: "a", initials: "Z.K." }));
      rader.push(rad({ productId: `p${i}`, reviewIdAE: "b", initials: "Q.K." }));
      rader.push(rad({ productId: `p${i}`, reviewIdAE: "c", initials: "W.K." }));
      rader.push(rad({ productId: `p${i}`, reviewIdAE: "d", initials: "R.K." }));
    }
    const efter = tillampa(rader, plan(rader));
    expect(produkterMedDubblett(efter)).toEqual([]);
    expect(efter.filter((r) => r.reviewIdAE === "d").every((r) => r.initials === "R.K.")).toBe(true);
  });

  it("räknar orsaken efter vad som är fel, och en dubblett bara när inget annat är fel", () => {
    const rader = [
      rad({ reviewIdAE: "a", initials: "Z.K.", date: "2026-01-01T00:00:00.000Z" }), // bara förbjuden
      rad({ reviewIdAE: "b", initials: "L.M.", date: "2026-01-02T00:00:00.000Z" }), // bokstavsordning
      rad({ reviewIdAE: "c", initials: "S.K.", date: "2026-01-03T00:00:00.000Z" }), // kvar
      rad({ reviewIdAE: "d", initials: "S.K.", date: "2026-01-04T00:00:00.000Z" }), // dubblett
    ];
    const p = plan(rader);
    expect(Object.fromEntries(p.attAndra.map((x) => [x.r.reviewIdAE, x.orsak]))).toEqual({
      a: "barForbjuden",
      b: "bokstavsordning",
      d: "dubblett",
    });
    expect(p.perOrsak).toEqual({ bokstavsordning: 1, barForbjuden: 1, dubblett: 1 });
    // Förbjudna bokstäver räknas bara för raderna som har dem, inte för dubbletterna.
    expect(p.perBokstav).toEqual({ Q: 0, W: 0, X: 0, Y: 0, Z: 1 });
  });

  it("räknar källan även för VEVOR, och produkterna som berörs", () => {
    const rader = [
      rad({ productId: "p1", reviewIdAE: "a", initials: "S.K.", source: "vevor", date: "2026-01-01T00:00:00.000Z" }),
      rad({ productId: "p1", reviewIdAE: "b", initials: "S.K.", source: "vevor", date: "2026-01-02T00:00:00.000Z" }),
      rad({ productId: "p2", reviewIdAE: "c", initials: "A.R.", source: "aosom", date: "2026-01-01T00:00:00.000Z" }),
      rad({ productId: "p2", reviewIdAE: "d", initials: "A.R.", source: "aosom", date: "2026-01-02T00:00:00.000Z" }),
      rad({ productId: "p2", reviewIdAE: "e", initials: "A.R.", date: "2026-01-03T00:00:00.000Z" }),
      rad({ productId: "p3", reviewIdAE: "f", initials: "M.L." }),
    ];
    const p = plan(rader);
    expect(p.perKalla).toEqual({ aosom: 1, vevor: 1, import: 1, kund: 0 });
    expect(p).toMatchObject({ totalt: 3, produkter: 2 });
  });

  it("rader med annan form tar ingen plats och rörs inte, och en etikett är ingen dubblett", () => {
    const rader = [
      rad({ reviewIdAE: "a", initials: "Verifierad köpare" }),
      rad({ reviewIdAE: "b", initials: "Verifierad köpare" }),
      rad({ reviewIdAE: "c", initials: "" }),
      rad({ reviewIdAE: "d", initials: "" }),
      rad({ reviewIdAE: "e", initials: "Sara" }),
      rad({ reviewIdAE: "f", initials: "Sara" }),
    ];
    expect(plan(rader)).toMatchObject({ totalt: 0, annanForm: 0 });
  });

  it("en enda bokstav ('S.') delar plats med en annan 'S.' men inte med 'S.K.'", () => {
    const rader = [
      rad({ reviewIdAE: "a", initials: "S.", date: "2026-01-01T00:00:00.000Z" }),
      rad({ reviewIdAE: "b", initials: "S.K.", date: "2026-01-02T00:00:00.000Z" }),
      rad({ reviewIdAE: "c", initials: "S.", date: "2026-01-03T00:00:00.000Z" }),
    ];
    const p = plan(rader);
    expect(p.attAndra.map((x) => x.r.reviewIdAE)).toEqual(["c"]);
    expect(bristerIInitialer(p.attAndra[0].nya)).toBeNull();
  });

  it("kundomdöme med förbjuden bokstav: orört som standard, rättat med kundomdomen=ja, utan att krocka", () => {
    const rader = [
      rad({ reviewIdAE: "kund", initials: "Z.K.", source: "customer" }),
      rad({ reviewIdAE: "v", initials: "S.K." }),
    ];
    expect(plan(rader)).toMatchObject({ totalt: 0, kundomdomenHoppade: 1 });
    const med = plan(rader, { medKundomdomen: true });
    expect(med.attAndra.map((x) => x.r.reviewIdAE)).toEqual(["kund"]);
    expect(med.attAndra[0].orsak).toBe("barForbjuden");
    expect(med.attAndra[0].nya).not.toBe("S.K.");
  });

  it("ett orört kundomdöme upptar sin plats även när det har en förbjuden bokstav", () => {
    // "Z.K." står kvar som det är, så en vanlig rad som skulle rättas till exakt det kan inte få det.
    const rader: StoredReview[] = [];
    for (let i = 0; i < 300; i++) {
      rader.push(rad({ productId: `p${i}`, reviewIdAE: "kund", initials: "Z.K.", source: "customer" }));
      rader.push(rad({ productId: `p${i}`, reviewIdAE: "dubbel", initials: "Z.K." }));
    }
    // Den vanliga raden har förbjuden bokstav och byts; den nya får aldrig bli kundens "Z.K." (omöjligt: Z är förbjuden).
    const efter = tillampa(rader, plan(rader));
    expect(efter.filter((r) => r.reviewIdAE === "kund").every((r) => r.initials === "Z.K.")).toBe(true);
    expect(efter.filter((r) => r.reviewIdAE === "dubbel").every((r) => bristerIInitialer(r.initials) === null)).toBe(true);
  });

  it("en avvisad rad som bryter mot reglerna rättas ändå, utan att ta en plats", () => {
    const rader = [
      rad({ reviewIdAE: "avvisad", initials: "Z.K.", status: "rejected" }),
      rad({ reviewIdAE: "synlig", initials: "R.K." }),
    ];
    const p = plan(rader);
    expect(p.attAndra.map((x) => x.r.reviewIdAE)).toEqual(["avvisad"]);
    expect(p.attAndra[0].orsak).toBe("barForbjuden");
    expect(p.attAndra[0].nya).toBe(nyaInitialer(rader[0]));
  });

  it("planen är oberoende av i vilken ordning lagret lämnar raderna", () => {
    const slump = slumpgenerator(99);
    const rader: StoredReview[] = [];
    for (let p = 0; p < 40; p++) {
      for (let i = 0; i < 25; i++) {
        const par = ["S.K.", "A.R.", "M.L.", "J.H.", "Z.K.", "U.V."][Math.floor(slump() * 6)];
        rader.push(
          rad({
            productId: `p${p}`,
            reviewIdAE: `r${i}`,
            initials: par,
            status: (["pending", "approved", "edited", "rejected"] as const)[Math.floor(slump() * 4)],
            date: slump() < 0.8 ? `2026-0${1 + Math.floor(slump() * 9)}-1${Math.floor(slump() * 9)}T00:00:00.000Z` : undefined,
            source: slump() < 0.05 ? "customer" : slump() < 0.5 ? "vevor" : undefined,
          }),
        );
      }
    }
    const blandad = [...rader].sort(() => slump() - 0.5);
    const tolka = (pl: SlumpaPlan) => pl.attAndra.map((x) => `${radId(x.r)}=${x.nya}/${x.orsak}`);
    const a = plan(rader, { medKundomdomen: true });
    const b = plan(blandad, { medKundomdomen: true });
    expect(a.totalt).toBeGreaterThan(100);
    expect(tolka(b)).toEqual(tolka(a));
    expect(b).toMatchObject({ kundDubbletter: a.kundDubbletter, produkter: a.produkter, ejUnika: 0 });
  });

  it("hogst tar de första raderna i en fast ordning, och totalen är densamma", () => {
    const rader: StoredReview[] = [];
    for (let p = 0; p < 20; p++) {
      for (let i = 0; i < 4; i++) rader.push(rad({ productId: `p${p}`, reviewIdAE: `r${i}`, initials: "S.K." }));
    }
    const hel = plan(rader);
    const kapad = plan(rader, { hogst: 7 });
    expect(hel.totalt).toBe(60);
    expect(kapad.totalt).toBe(60);
    expect(kapad.attAndra).toHaveLength(7);
    expect(kapad.attAndra.map((x) => radId(x.r))).toEqual(hel.attAndra.slice(0, 7).map((x) => radId(x.r)));
    expect(kapad.attAndra.map((x) => x.nya)).toEqual(hel.attAndra.slice(0, 7).map((x) => x.nya));
  });

  it("en produkt där varje par är upptaget lämnar dubbletten orörd och räknar den", () => {
    const rader: StoredReview[] = GILTIGA_PAR.map((par, i) =>
      rad({
        productId: "full",
        reviewIdAE: `p${String(i).padStart(3, "0")}`,
        initials: par,
        date: `2026-01-01T00:00:00.${String(i % 1000).padStart(3, "0")}Z`,
      }),
    );
    rader.push(rad({ productId: "full", reviewIdAE: "zz-dubblett", initials: "A.A.", status: "pending" }));
    const p = plan(rader);
    expect(GILTIGA_PAR.length).toBe(510);
    expect(p).toMatchObject({ totalt: 0, ejUnika: 1 });
  });

  it("en produkt där varje par är upptaget rättar ändå en förbjuden bokstav (reglerna går före unikheten)", () => {
    const rader: StoredReview[] = GILTIGA_PAR.map((par, i) =>
      rad({ productId: "full", reviewIdAE: `p${String(i).padStart(3, "0")}`, initials: par }),
    );
    rader.push(rad({ productId: "full", reviewIdAE: "zz-fel", initials: "Z.K.", status: "pending" }));
    const p = plan(rader);
    expect(p).toMatchObject({ totalt: 1, ejUnika: 1 });
    expect(bristerIInitialer(p.attAndra[0].nya)).toBeNull();
  });

  it("slumpsimulering: efter planen delar inga två rader plats, bara det som måste ändras ändras, och en ny plan är tom", () => {
    // 300 produkter, 1–90 recensioner var, initialer ur en skev fördelning (några få vanliga par, som i
    // importen) blandat med slumpade par ur hela alfabetet (förbjudna bokstäver och bokstavsordning ingår).
    const vanliga = ["A.R.", "M.K.", "S.L.", "J.B.", "E.N.", "L.S.", "D.P.", "C.H.", "T.A.", "O.G."];
    const alfabet = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ"];
    const status = ["pending", "pending", "pending", "approved", "edited", "rejected"] as const;
    const kallor = [undefined, "aosom", "vevor", "vevor", "vevor"];
    for (const frö of [1, 2, 3, 4, 5]) {
      const slump = slumpgenerator(frö);
      const val = <T,>(lista: readonly T[]): T => lista[Math.floor(slump() * lista.length)];
      const rader: StoredReview[] = [];
      for (let p = 0; p < 300; p++) {
        const antal = 1 + Math.floor(slump() * slump() * 90);
        for (let i = 0; i < antal; i++) {
          const initials = slump() < 0.35 ? val(vanliga) : `${val(alfabet)}.${val(alfabet)}.`;
          const kund = slump() < 0.02;
          rader.push(
            rad({
              productId: `p${p}`,
              reviewIdAE: `r${i}`,
              initials: slump() < 0.02 ? val(["Zara", "", "Verifierad köpare"]) : initials,
              status: val(status),
              source: kund ? "customer" : val(kallor),
              date: slump() < 0.9 ? `2026-0${1 + Math.floor(slump() * 9)}-${10 + Math.floor(slump() * 18)}T00:00:00.000Z` : undefined,
              importedAt: "2026-10-01T00:00:00.000Z",
            }),
          );
        }
      }
      const medKund = frö % 2 === 0;
      const p = plan(rader, { medKundomdomen: medKund });

      // Facit, utan att använda planeraren: vad MÅSTE ändras?
      const fel = (r: StoredReview) => bristerIInitialer(r.initials) !== null;
      const iForm = (r: StoredReview) => /^\p{L}\.(\p{L}\.)?$/u.test((r.initials ?? "").trim());
      let måste = 0;
      const perProdukt = new Map<string, StoredReview[]>();
      for (const r of rader) perProdukt.set(r.productId, [...(perProdukt.get(r.productId) ?? []), r]);
      for (const lista of perProdukt.values()) {
        for (const r of lista) {
          if (iForm(r) && fel(r) && (medKund || r.source !== "customer")) måste++; // regelbrott (alla statusar)
        }
        const grupper = new Map<string, StoredReview[]>();
        for (const r of levande(lista)) {
          if (fel(r)) continue;
          grupper.set(nyckelForInitialer(r.initials), [...(grupper.get(nyckelForInitialer(r.initials)) ?? []), r]);
        }
        for (const g of grupper.values()) {
          const kunder = g.filter((r) => r.source === "customer").length;
          const vanliga = g.length - kunder;
          måste += kunder > 0 ? vanliga : Math.max(0, vanliga - 1);
        }
      }
      expect(p.totalt, `frö ${frö}`).toBe(måste);
      expect(p.ejUnika).toBe(0);
      expect(p.perOrsak.bokstavsordning + p.perOrsak.barForbjuden + p.perOrsak.dubblett).toBe(p.totalt);
      expect(p.perKalla.aosom + p.perKalla.vevor + p.perKalla.import + p.perKalla.kund).toBe(p.totalt);

      const efter = tillampa(rader, p);
      // 1. Ingen produkt har två levande rader med samma plats (utom två kunder).
      expect(produkterMedDubblett(efter), `frö ${frö}`).toEqual([]);
      // 2. Allt som ändrats är i sin ordning; kunder bara om det begärdes.
      for (const r of efter) {
        if (iForm(r) && (medKund || r.source !== "customer")) expect(bristerIInitialer(r.initials), radId(r)).toBeNull();
      }
      // 3. Det som inte stod i planen är orört.
      const andrade = new Set(p.attAndra.map((x) => radId(x.r)));
      rader.forEach((r, i) => {
        if (!andrade.has(radId(r))) expect(efter[i].initials).toBe(r.initials);
      });
      // 4. En ny plan över resultatet har inget att göra.
      expect(plan(efter, { medKundomdomen: medKund }).totalt, `frö ${frö}`).toBe(0);
    }
  });

  it("flera körningar med hogst konvergerar till en lista utan dubbletter, och ändrar varje rad högst en gång", () => {
    const slump = slumpgenerator(2026);
    const vanliga = ["A.R.", "M.K.", "S.L.", "J.B."];
    const rader: StoredReview[] = [];
    for (let p = 0; p < 120; p++) {
      for (let i = 0; i < 1 + Math.floor(slump() * 40); i++) {
        rader.push(
          rad({
            productId: `p${p}`,
            reviewIdAE: `r${i}`,
            initials: slump() < 0.5 ? vanliga[Math.floor(slump() * vanliga.length)] : "Z.K.",
            status: slump() < 0.4 ? "approved" : "pending",
            date: `2026-0${1 + Math.floor(slump() * 9)}-15T00:00:00.000Z`,
          }),
        );
      }
    }
    const hel = plan(rader, { medKundomdomen: true });
    let lager = rader;
    let andrade = 0;
    let varv = 0;
    const sedda = new Set<string>();
    for (; varv < 500; varv++) {
      const p = plan(lager, { medKundomdomen: true, hogst: 37 });
      if (p.attAndra.length === 0) break;
      for (const { r } of p.attAndra) {
        expect(sedda.has(radId(r)), `${radId(r)} planeras en andra gång`).toBe(false);
        sedda.add(radId(r));
      }
      andrade += p.attAndra.length;
      lager = tillampa(lager, p);
    }
    expect(varv).toBeLessThan(500);
    expect(andrade).toBe(hel.totalt);
    expect(varv).toBe(Math.ceil(hel.totalt / 37));
    expect(produkterMedDubblett(lager)).toEqual([]);
    expect(plan(lager, { medKundomdomen: true }).totalt).toBe(0);
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
