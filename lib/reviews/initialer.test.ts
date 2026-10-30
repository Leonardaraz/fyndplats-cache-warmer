import { describe, expect, it } from "vitest";
import {
  ANDEL_A_RING,
  ANDEL_O_UMLAUT,
  FORBJUDNA,
  SLUMPBOKSTAVER,
  arForbjuden,
  bokstaverIInitialer,
  bristerIInitialer,
  iBokstavsordning,
  rattaInitialer,
  slumpaAndra,
  slumpaInitialer,
} from "./initialer";

const ALLA = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ"];
/** Allt en dragning kan ge: A–V utan Q, samt Å och Ö. */
const DRAGBARA = [...SLUMPBOKSTAVER, "Å", "Ö"];
/** Två dragbara bokstäver med punkt efter var och en. */
const GILTIG = /^[A-PR-VÅÖ]\.[A-PR-VÅÖ]\.$/u;
/** Frön som skiljer sig på sista tecknet, som de gamla id:na gjorde. */
const fron = (n: number) => Array.from({ length: n }, (_, i) => `prod-1#gen-${i.toString(36)}`);

describe("reglerna", () => {
  it("Q, W, X, Y och Z är förbjudna, i alla skiftlägen", () => {
    expect([...FORBJUDNA].sort()).toEqual(["Q", "W", "X", "Y", "Z"]);
    for (const b of ["Q", "w", "X", "y", "Z"]) expect(arForbjuden(b)).toBe(true);
    for (const b of ["A", "V", "Å", "Ö", "K", ""]) expect(arForbjuden(b)).toBe(false);
  });

  it("slumpbokstäverna innehåller ingen förbjuden bokstav och inte Å eller Ö (de dras för sig)", () => {
    expect(SLUMPBOKSTAVER).toHaveLength(21);
    expect(SLUMPBOKSTAVER.some(arForbjuden)).toBe(false);
    expect(SLUMPBOKSTAVER).not.toContain("Å");
    expect(SLUMPBOKSTAVER).not.toContain("Ö");
  });
});

describe("iBokstavsordning", () => {
  it("är sann när andra bokstaven står direkt efter den första", () => {
    for (const [a, b] of [["A", "B"], ["L", "M"], ["U", "V"], ["Y", "Z"], ["a", "b"], ["Å", "Ä"], ["Ä", "Ö"]]) {
      expect(iBokstavsordning(a, b)).toBe(true);
    }
  });
  it("är falsk för allt annat", () => {
    for (const [a, b] of [["B", "A"], ["A", "A"], ["A", "C"], ["Z", "A"], ["Ö", "A"], ["Å", "Ö"], ["", "B"], ["A", ""], ["AB", "C"]]) {
      expect(iBokstavsordning(a, b)).toBe(false);
    }
  });
});

describe("bristerIInitialer", () => {
  it("hittar bokstavsordning", () => {
    expect(bristerIInitialer("A.B.")).toEqual({ forbjudna: [], bokstavsordning: true });
    expect(bristerIInitialer("L.M.")).toEqual({ forbjudna: [], bokstavsordning: true });
    expect(bristerIInitialer("g.h.")).toEqual({ forbjudna: [], bokstavsordning: true });
  });
  it("hittar förbjudna bokstäver, även Q", () => {
    expect(bristerIInitialer("Z.A.")).toEqual({ forbjudna: ["Z"], bokstavsordning: false });
    expect(bristerIInitialer("K.W.")).toEqual({ forbjudna: ["W"], bokstavsordning: false });
    expect(bristerIInitialer("Q.")).toEqual({ forbjudna: ["Q"], bokstavsordning: false });
    expect(bristerIInitialer("w.x.")).toEqual({ forbjudna: ["W", "X"], bokstavsordning: true });
  });
  it("släpper igenom initialer som är i sin ordning", () => {
    for (const i of ["S.K.", "K.S.", "B.A.", "A.A.", "Å.Ö.", "Ö.Å.", "É.M.", "S.", "", undefined]) {
      expect(bristerIInitialer(i)).toBeNull();
    }
  });
});

describe("slumpaInitialer", () => {
  it("är deterministisk per frö och ger olika initialer för olika frön", () => {
    expect(slumpaInitialer("a#b")).toBe(slumpaInitialer("a#b"));
    expect(new Set(fron(300).map(slumpaInitialer)).size).toBeGreaterThan(150);
  });

  it("ger aldrig en förbjuden bokstav och aldrig bokstavsordning, över 20 000 frön", () => {
    for (const f of fron(20_000)) {
      const i = slumpaInitialer(f);
      expect(i).toMatch(GILTIG);
      expect(bristerIInitialer(i)).toBeNull();
    }
  });

  it("andra bokstaven är ett eget slumpval, inte en funktion av den första (felet som fanns)", () => {
    // Det gamla felet: andra = första + 1 för 100 % av id:na. Frön som skiljer sig
    // på sista tecknet är precis vad som utlöste det.
    const par = new Map<string, number>();
    let vanliga = 0;
    for (const f of fron(20_000)) {
      const i = slumpaInitialer(f);
      if (/[ÅÖ]/.test(i)) continue;
      vanliga++;
      par.set(i, (par.get(i) ?? 0) + 1);
    }
    // 21 × 21 par minus de 19 som står i bokstavsordning (Q saknas i listan, så
    // O–P, P–R, R–S … räknas efter alfabetet): 422 tillåtna par.
    expect(par.size).toBeGreaterThanOrEqual(415);
    expect(Math.max(...par.values())).toBeLessThan((vanliga / 422) * 2);
  });

  it("Å och Ö kommer ibland, ungefär som andelen säger", () => {
    const N = 20_000;
    let a = 0;
    let o = 0;
    let bokstaver = 0;
    const antal = new Map<string, number>();
    for (const f of fron(N)) {
      for (const b of bokstaverIInitialer(slumpaInitialer(f))) {
        bokstaver++;
        if (b === "Å") a++;
        else if (b === "Ö") o++;
        else antal.set(b, (antal.get(b) ?? 0) + 1);
      }
    }
    expect(a / bokstaver).toBeGreaterThan(ANDEL_A_RING * 0.7);
    expect(a / bokstaver).toBeLessThan(ANDEL_A_RING * 1.3);
    expect(o / bokstaver).toBeGreaterThan(ANDEL_O_UMLAUT * 0.7);
    expect(o / bokstaver).toBeLessThan(ANDEL_O_UMLAUT * 1.3);
    // Varje vanlig bokstav förekommer, och ingen dominerar.
    expect(antal.size).toBe(21);
    const vantat = (bokstaver - a - o) / 21;
    for (const n of antal.values()) {
      expect(n).toBeGreaterThan(vantat * 0.8);
      expect(n).toBeLessThan(vantat * 1.2);
    }
  });
});

describe("slumpaAndra", () => {
  it("behåller första bokstaven och väljer en andra som inte följer efter den", () => {
    for (const f of fron(2_000)) {
      const i = slumpaAndra("u", f);
      expect(i).toMatch(/^U\.[A-PR-VÅÖ]\.$/u);
      expect(i).not.toBe("U.V.");
    }
  });
  it("är deterministisk", () => {
    expect(slumpaAndra("M", "frö")).toBe(slumpaAndra("M", "frö"));
  });
});

describe("rattaInitialer", () => {
  it("byter bara den förbjudna bokstaven och behåller den andra", () => {
    const z = rattaInitialer("Z.K.", "p#r")!;
    expect(z).toMatch(/^[A-PR-VÅÖ]\.K\.$/u);
    const w = rattaInitialer("K.W.", "p#r")!;
    expect(w).toMatch(/^K\.[A-PR-VÅÖ]\.$/u);
    expect(rattaInitialer("Q.", "p#r")).toMatch(/^[A-PR-VÅÖ]\.$/u);
  });

  it("slumpar om BÅDA bokstäverna när de står i bokstavsordning", () => {
    let bytteBada = 0;
    for (const f of fron(500)) {
      const ut = rattaInitialer("K.L.", f)!;
      expect(ut).toMatch(GILTIG);
      expect(ut).not.toBe("K.L.");
      expect(bristerIInitialer(ut)).toBeNull();
      const [a, b] = bokstaverIInitialer(ut);
      if (a !== "K" && b !== "L") bytteBada++;
    }
    // Slumpen kan träffa en av de gamla bokstäverna, men sällan båda.
    expect(bytteBada).toBeGreaterThan(400);
  });

  it("rättar W.X., Z.A., Q.R., X.Y. och D.E. i en och samma regel", () => {
    for (const gamla of ["W.X.", "Z.A.", "Q.R.", "X.Y.", "D.E.", "P.Q."]) {
      const ut = rattaInitialer(gamla, "p#r")!;
      expect(ut, gamla).not.toBeNull();
      expect(bristerIInitialer(ut), gamla).toBeNull();
      expect(ut).not.toBe(gamla);
    }
  });

  it("rör inte initialer som är i sin ordning", () => {
    for (const i of ["S.K.", "K.S.", "B.A.", "A.A.", "Å.Ö.", "É.M.", "S.", "", undefined]) {
      expect(rattaInitialer(i, "p#r")).toBeNull();
    }
  });

  it("är deterministisk", () => {
    expect(rattaInitialer("A.B.", "p#r")).toBe(rattaInitialer("A.B.", "p#r"));
    expect(new Set(fron(300).map((f) => rattaInitialer("A.B.", f))).size).toBeGreaterThan(150);
  });

  it("klarar varje tänkbart par, och en rättad rad behöver aldrig rättas igen", () => {
    for (const x of ALLA) {
      for (const y of ALLA) {
        for (const frö of ["a", "prod#gen-1", "prod#gen-xyz9", "🙂"]) {
          const inn = `${x}.${y}.`;
          const brist = bristerIInitialer(inn);
          const ut = rattaInitialer(inn, frö);
          if (!brist) {
            expect(ut, inn).toBeNull();
            continue;
          }
          expect(ut, inn).not.toBeNull();
          expect(bristerIInitialer(ut!), `${inn} → ${ut}`).toBeNull();
          expect(rattaInitialer(ut!, "ett-annat-frö"), `${inn} → ${ut}`).toBeNull();
          const nya = bokstaverIInitialer(ut!);
          expect(nya).toHaveLength(2);
          // En bokstav som ändrades är alltid en dragbar; en som är kvar var okej från början.
          [x, y].forEach((gammal, i) => {
            if (nya[i] !== gammal) expect(DRAGBARA).toContain(nya[i]);
          });
          if (!brist.bokstavsordning) {
            if (!arForbjuden(x)) expect(nya[0], inn).toBe(x);
            if (!arForbjuden(y)) expect(nya[1], inn).toBe(y);
          }
        }
      }
    }
  });
});
