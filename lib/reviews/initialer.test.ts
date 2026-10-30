import { describe, expect, it } from "vitest";
import {
  ANDEL_A_RING,
  ANDEL_O_UMLAUT,
  FORBJUDNA,
  FORM_INITIALER,
  GILTIGA_PAR,
  SLUMPBOKSTAVER,
  arForbjuden,
  bokstaverIInitialer,
  bristerIInitialer,
  iBokstavsordning,
  nyckelForInitialer,
  platsPaProdukt,
  rattaInitialer,
  rattaInitialerUnika,
  slumpaAndra,
  slumpaInitialer,
  slumpaUnika,
  upptagnaPlatser,
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

// --- Unika initialer per produkt (Leonard 2026-10-30) --------------------------

describe("nyckelForInitialer", () => {
  it("är bokstäverna i versaler med punkt efter varje, så skiftläge och punkter inte spelar roll", () => {
    expect(nyckelForInitialer("S.K.")).toBe("S.K.");
    expect(nyckelForInitialer("s.k.")).toBe("S.K.");
    expect(nyckelForInitialer(" s. k ")).toBe("S.K.");
    expect(nyckelForInitialer("SK")).toBe("S.K.");
    expect(nyckelForInitialer("å.ö.")).toBe("Å.Ö.");
    expect(nyckelForInitialer("S.")).toBe("S.");
  });

  it("är tom när det inte finns några bokstäver", () => {
    expect(nyckelForInitialer("")).toBe("");
    expect(nyckelForInitialer(undefined)).toBe("");
    expect(nyckelForInitialer("..")).toBe("");
  });

  it("skiljer ett par från samma bokstäver i omvänd ordning", () => {
    expect(nyckelForInitialer("S.K.")).not.toBe(nyckelForInitialer("K.S."));
  });
});

describe("GILTIGA_PAR", () => {
  it("är de ~510 par slumpen kan ge: 23 bokstäver i kvadrat minus de 19 i bokstavsordning", () => {
    expect(DRAGBARA).toHaveLength(23);
    expect(GILTIGA_PAR).toHaveLength(23 * 23 - 19);
    expect(new Set(GILTIGA_PAR).size).toBe(GILTIGA_PAR.length);
  });

  it("består bara av par utan förbjuden bokstav och utan bokstavsordning, i nyckelform", () => {
    for (const par of GILTIGA_PAR) {
      expect(par).toMatch(GILTIG);
      expect(bristerIInitialer(par), par).toBeNull();
      expect(nyckelForInitialer(par)).toBe(par);
    }
  });

  it("innehåller varje par slumpaInitialer kan ge", () => {
    const par = new Set(GILTIGA_PAR);
    for (const frö of fron(3000)) expect(par.has(slumpaInitialer(frö)), frö).toBe(true);
  });

  it("räknar samma bokstav två gånger ('A.A.') men inte 'A.B.'", () => {
    expect(GILTIGA_PAR).toContain("A.A.");
    expect(GILTIGA_PAR).toContain("B.A.");
    expect(GILTIGA_PAR).not.toContain("A.B.");
    expect(GILTIGA_PAR).not.toContain("U.V.");
    expect(GILTIGA_PAR).toContain("V.U.");
  });
});

describe("FORM_INITIALER", () => {
  it("släpper igenom 'S.' och 'S.K.' men inte namn, etiketter eller längre rader", () => {
    for (const i of ["S.", "S.K.", "å.ö.", "Z.K."]) expect(FORM_INITIALER.test(i), i).toBe(true);
    for (const i of ["", "Zara", "A.B.C.", "Verifierad köpare", "S.K", "1.2.", " S.K."]) {
      expect(FORM_INITIALER.test(i), i).toBe(false);
    }
  });
});

describe("platsPaProdukt", () => {
  it("är nyckeln för en rad som syns eller väntar", () => {
    expect(platsPaProdukt({ initials: "S.K.", status: "approved" })).toBe("S.K.");
    expect(platsPaProdukt({ initials: "s.k.", status: "pending" })).toBe("S.K.");
    expect(platsPaProdukt({ initials: "S.K.", status: "edited" })).toBe("S.K.");
    expect(platsPaProdukt({ initials: "S.K." })).toBe("S.K.");
  });

  it("är null för en avvisad rad, som aldrig syns", () => {
    expect(platsPaProdukt({ initials: "S.K.", status: "rejected" })).toBeNull();
  });

  it("är null för initialer i annan form än 'S.K.'", () => {
    for (const initials of ["", undefined, "Zara", "Verifierad köpare", "A.B.C."]) {
      expect(platsPaProdukt({ initials, status: "approved" }), String(initials)).toBeNull();
    }
  });
});

describe("upptagnaPlatser", () => {
  it("samlar platserna och hoppar över avvisade och rader i annan form", () => {
    const platser = upptagnaPlatser([
      { initials: "S.K.", status: "approved" },
      { initials: "s.k.", status: "pending" },
      { initials: "A.R.", status: "edited" },
      { initials: "M.L.", status: "rejected" },
      { initials: "Zara", status: "approved" },
    ]);
    expect([...platser].sort()).toEqual(["A.R.", "S.K."]);
  });

  it("är tom för inga rader", () => {
    expect(upptagnaPlatser([]).size).toBe(0);
  });
});

describe("slumpaUnika", () => {
  it("ger samma initialer som slumpaInitialer när platsen är ledig, så en rad utan krock inte ändras", () => {
    for (const frö of fron(500)) expect(slumpaUnika(frö, new Set())).toBe(slumpaInitialer(frö));
  });

  it("undviker det som är upptaget", () => {
    for (const frö of fron(500)) {
      const forsta = slumpaInitialer(frö);
      const ut = slumpaUnika(frö, new Set([forsta]))!;
      expect(ut).not.toBe(forsta);
      expect(ut).toMatch(GILTIG);
      expect(bristerIInitialer(ut)).toBeNull();
    }
  });

  it("är deterministisk för samma frö och samma upptagna", () => {
    const upptagna = new Set(["S.K.", "A.R.", "M.L."]);
    for (const frö of fron(100)) expect(slumpaUnika(frö, upptagna)).toBe(slumpaUnika(frö, upptagna));
  });

  it("hittar det enda lediga paret när alla andra är upptagna", () => {
    for (let i = 0; i < GILTIGA_PAR.length; i += 37) {
      const ledigt = GILTIGA_PAR[i];
      const upptagna = new Set(GILTIGA_PAR.filter((p) => p !== ledigt));
      expect(upptagna.size).toBe(GILTIGA_PAR.length - 1);
      expect(slumpaUnika(`prod#${i}`, upptagna)).toBe(ledigt);
    }
  });

  it("ger null när varje par är upptaget", () => {
    expect(slumpaUnika("prod#1", new Set(GILTIGA_PAR))).toBeNull();
  });

  it("fyller en hel produkt utan en enda dubblett: 510 recensioner, 510 olika par", () => {
    const upptagna = new Set<string>();
    for (let i = 0; i < GILTIGA_PAR.length; i++) {
      const ut = slumpaUnika(`prod#rad-${i}`, upptagna);
      expect(ut, `rad ${i}`).not.toBeNull();
      expect(upptagna.has(ut!), `rad ${i}: ${ut}`).toBe(false);
      upptagna.add(ut!);
    }
    expect(upptagna.size).toBe(GILTIGA_PAR.length);
    expect(slumpaUnika("prod#en-till", upptagna)).toBeNull();
  });

  it("ger aldrig en annan bokstavsföljd än reglerna tillåter, ens när nästan allt är upptaget", () => {
    const upptagna = new Set(GILTIGA_PAR.slice(0, 480));
    for (const frö of fron(200)) {
      const ut = slumpaUnika(frö, upptagna)!;
      expect(GILTIGA_PAR).toContain(ut);
      expect(upptagna.has(ut)).toBe(false);
    }
  });

  it("håller Å/Ö-andelen som slumpaInitialer också när det mesta är upptaget (nya dragningar, inte en jämn reservdragning)", () => {
    // Reservvägen väljer jämnt bland ALLA lediga par, och där är Å och Ö nästan dubbelt så
    // vanliga som i dragningen (mätt: 3,8 % och 3,5 % mot 2 %). Den ska bara ta över när 64
    // nya dragningar i rad slagit i något upptaget. Två tredjedelar upptaget är långt över
    // en verklig produkt (flest i lagret: 66 recensioner), men det är där en reservväg som
    // tar över för tidigt syns i andelen. Leonard: Å och Ö får komma ibland, inte ofta.
    const upptagna = new Set(GILTIGA_PAR.filter((_, i) => i % 3 !== 0));
    expect(upptagna.size).toBe(340);
    const N = 20_000;
    let a = 0;
    let o = 0;
    let bokstaver = 0;
    for (const f of fron(N)) {
      for (const b of bokstaverIInitialer(slumpaUnika(f, upptagna)!)) {
        bokstaver++;
        if (b === "Å") a++;
        else if (b === "Ö") o++;
      }
    }
    expect(a / bokstaver).toBeGreaterThan(ANDEL_A_RING * 0.7);
    expect(a / bokstaver).toBeLessThan(ANDEL_A_RING * 1.3);
    expect(o / bokstaver).toBeGreaterThan(ANDEL_O_UMLAUT * 0.7);
    expect(o / bokstaver).toBeLessThan(ANDEL_O_UMLAUT * 1.3);
  });
});

describe("rattaInitialerUnika", () => {
  it("är null när initialerna redan är i sin ordning, som rattaInitialer", () => {
    for (const i of ["S.K.", "K.S.", "A.A.", "Å.Ö.", "S.", "Sara", ""]) {
      expect(rattaInitialerUnika(i, "prod#1", new Set(["S.K."])), i).toBeNull();
    }
  });

  it("ger samma rättning som rattaInitialer när platsen är ledig", () => {
    for (const frö of fron(300)) {
      for (const inn of ["Z.K.", "K.W.", "A.B.", "Q.", "X.Y."]) {
        expect(rattaInitialerUnika(inn, frö, new Set())).toBe(rattaInitialer(inn, frö));
      }
    }
  });

  it("undviker det som är upptaget och behåller den bokstav som inte behövde bytas", () => {
    for (const frö of fron(500)) {
      const forsta = rattaInitialer("Z.K.", frö)!;
      const ut = rattaInitialerUnika("Z.K.", frö, new Set([forsta]))!;
      expect(ut).not.toBe(forsta);
      expect(bristerIInitialer(ut)).toBeNull();
      // Så länge det finns ett ledigt par med K kvar behålls K.
      expect(ut).toMatch(/^[A-IK-PR-VÅÖ]\.K\.$/u);
    }
  });

  it("slumpar två nya bokstäver när varje rättning med den bevarade bokstaven är upptagen", () => {
    const upptagna = new Set(GILTIGA_PAR.filter((p) => p.endsWith(".K.")));
    for (const frö of fron(200)) {
      const ut = rattaInitialerUnika("Z.K.", frö, upptagna)!;
      expect(upptagna.has(ut), ut).toBe(false);
      expect(bristerIInitialer(ut)).toBeNull();
      expect(GILTIGA_PAR).toContain(ut);
    }
  });

  it("ger reglerna företräde framför unikheten när inget par alls är ledigt", () => {
    const ut = rattaInitialerUnika("Z.K.", "prod#1", new Set(GILTIGA_PAR))!;
    expect(bristerIInitialer(ut)).toBeNull();
    expect(ut).toBe(rattaInitialer("Z.K.", "prod#1"));
  });

  it("rättar även bokstavsordning till en ledig plats", () => {
    for (const frö of fron(300)) {
      const forsta = rattaInitialer("L.M.", frö)!;
      const ut = rattaInitialerUnika("L.M.", frö, new Set([forsta]))!;
      expect(ut).not.toBe(forsta);
      expect(bristerIInitialer(ut)).toBeNull();
    }
  });
});

