import { describe, it, expect } from "vitest";
import { valPar, valPlats } from "./valordning";

/** Sätter in det nya valet på den plats funktionen anger, som sammanslagningen gör. */
function efter(axel: string, befintliga: string[], nytt: string): string[] {
  const i = valPlats(axel, befintliga, nytt);
  return [...befintliga.slice(0, i), nytt, ...befintliga.slice(i)];
}

describe("valPlats — storlekarna i storleksordning", () => {
  it("☠️ hantlarna: 2 × 6 kg hamnar mellan 5 och 10 kg, inte sist (Leonards skärmbild 2026-11-06)", () => {
    expect(efter("Storlek", ["2 × 4 kg", "2 × 5 kg", "2 × 10 kg"], "2 × 6 kg")).toEqual([
      "2 × 4 kg", "2 × 5 kg", "2 × 6 kg", "2 × 10 kg",
    ]);
  });

  it("☠️ växthuset: 180 cm hamnar före 270 cm när den nya optionen skapas med två val", () => {
    expect(valPar("Storlek", "270 × 90 × 90 cm", "180 × 90 × 90 cm")).toEqual(["180 × 90 × 90 cm", "270 × 90 × 90 cm"]);
    expect(valPar("Storlek", "180 × 90 × 90 cm", "270 × 90 × 90 cm")).toEqual(["180 × 90 × 90 cm", "270 × 90 × 90 cm"]);
  });

  it("en större storlek än alla andra hamnar sist, en mindre än alla först", () => {
    const val = ["90 × 70 cm", "110 × 85 cm"];
    expect(efter("Storlek", val, "150 × 100 cm")).toEqual([...val, "150 × 100 cm"]);
    expect(efter("Storlek", val, "60 × 40 cm")).toEqual(["60 × 40 cm", ...val]);
    expect(efter("Storlek", val, "100 × 80 cm")).toEqual(["90 × 70 cm", "100 × 80 cm", "110 × 85 cm"]);
  });

  it("jämför i samma enhet: 1,5 m är större än 120 cm men mindre än 200 cm", () => {
    expect(efter("Storlek", ["120 cm", "200 cm"], "1,5 m")).toEqual(["120 cm", "1,5 m", "200 cm"]);
    expect(efter("Storlek", ["90 cm", "1,2 m"], "100 cm")).toEqual(["90 cm", "100 cm", "1,2 m"]);
  });

  it("skriver tal med komma eller punkt likadant", () => {
    expect(efter("Storlek", ["2,5 m", "4 m"], "3 m")).toEqual(["2,5 m", "3 m", "4 m"]);
    expect(efter("Storlek", ["2.5 m", "4 m"], "3 m")).toEqual(["2.5 m", "3 m", "4 m"]);
  });

  it("rosenträdet: 1 träd hamnar före 2 träd (tal utan enhet)", () => {
    expect(efter("Antal", ["2 träd"], "1 träd")).toEqual(["1 träd", "2 träd"]);
  });

  it("samma area går efter måttens ordning, och lika mått hamnar efter det som redan finns", () => {
    expect(efter("Storlek", ["40 × 50 cm"], "50 × 40 cm")).toEqual(["40 × 50 cm", "50 × 40 cm"]);
    expect(efter("Storlek", ["50 × 40 cm"], "40 × 50 cm")).toEqual(["40 × 50 cm", "50 × 40 cm"]);
  });

  it("grupperna hålls isär: texten före första siffran avgör vilka val som jämförs", () => {
    const val = ["Metall 46 tum", "Metall 60 tum", "Trä 63 tum"];
    expect(efter("Storlek", val, "Metall 50 tum")).toEqual(["Metall 46 tum", "Metall 50 tum", "Metall 60 tum", "Trä 63 tum"]);
    // Större än gruppens sista: direkt efter gruppen, före nästa grupp.
    expect(efter("Storlek", val, "Metall 70 tum")).toEqual(["Metall 46 tum", "Metall 60 tum", "Metall 70 tum", "Trä 63 tum"]);
    // En ny grupp utan medlemmar hamnar sist, som förut.
    expect(efter("Storlek", val, "Glas 40 tum")).toEqual([...val, "Glas 40 tum"]);
  });
});

describe("valPlats — bokstavsstorlekar", () => {
  it("S, M, XL och L: L hamnar före XL", () => {
    expect(efter("Storlek", ["S", "M", "XL"], "L")).toEqual(["S", "M", "L", "XL"]);
  });

  it("XL efter M hamnar sist, och XS först", () => {
    expect(efter("Storlek", ["S", "M"], "XL")).toEqual(["S", "M", "XL"]);
    expect(efter("Storlek", ["S", "M"], "XS")).toEqual(["XS", "S", "M"]);
    expect(efter("Storlek", ["S", "M", "XXL"], "XL")).toEqual(["S", "M", "XL", "XXL"]);
  });

  it("☠️ bokstäverna bedöms bara när ALLA val, också det nya, är bokstavsstorlekar", () => {
    expect(valPlats("Storlek", ["S", "M", "L"], "One size")).toBe(3);
    expect(valPlats("Storlek", ["S", "M", "L"], "42")).toBe(3);
  });
});

describe("valPlats — det som inte går att bedöma hamnar sist, som förut", () => {
  it("färg bedöms aldrig, inte ens när namnen bär tal", () => {
    expect(valPlats("Färg", ["Svart", "Grå"], "Blå")).toBe(2);
    expect(valPlats("Färg", ["Mörkgrå 2", "Mörkgrå 5"], "Mörkgrå 3")).toBe(2);
    expect(valPlats("färg", ["Svart"], "Vit")).toBe(1);
  });

  it("val utan tal: Liten – Mellan – Stor", () => {
    expect(valPlats("Storlek", ["Liten", "Stor"], "Mellan")).toBe(2);
  });

  it("olika antal tal i valen", () => {
    expect(valPlats("Storlek", ["90 × 70 cm", "110 × 85 cm"], "100 cm")).toBe(2);
  });

  it("blandade enheter: längd och vikt i samma option", () => {
    expect(valPlats("Storlek", ["90 cm", "110 cm"], "5 kg")).toBe(2);
  });

  it("ett val med enhet och ett utan", () => {
    expect(valPlats("Storlek", ["90 cm", "110 cm"], "100")).toBe(2);
  });

  it("dubblettnamn rörs inte (samma val stavat olika versaler)", () => {
    expect(valPlats("Storlek", ["90 cm", "110 cm"], "90 CM")).toBe(2);
  });

  it("en tom option: det nya valet är det enda", () => {
    expect(valPlats("Storlek", [], "90 cm")).toBe(0);
  });

  it("ett val utan namn kraschar inte och hamnar sist", () => {
    expect(valPlats("Storlek", ["90 cm", ""], "100 cm")).toBe(2);
    expect(valPlats("Storlek", [undefined as unknown as string], "100 cm")).toBe(1);
    // Två val där sidans eget saknas: ordningen ändras inte (sidans först, det nya sist).
    expect(valPar("Storlek", undefined as unknown as string, "100 cm")[1]).toBe("100 cm");
  });
});

describe("valPlats — en option som redan ligger fel", () => {
  it("☠️ de befintliga valen flyttas aldrig: det nya sätts före det första som ska komma efter det", () => {
    // 2 × 10 kg låg före 2 × 6 kg (felet svepet rättar). 2 × 8 kg ska före 2 × 10 kg, och de andra står kvar.
    const val = ["2 × 4 kg", "2 × 10 kg", "2 × 6 kg"];
    const ut = efter("Storlek", val, "2 × 8 kg");
    expect(ut).toEqual(["2 × 4 kg", "2 × 8 kg", "2 × 10 kg", "2 × 6 kg"]);
    expect(ut.filter((x) => x !== "2 × 8 kg")).toEqual(val);
  });

  it("en option som redan ligger rätt blir sorterad efter insättningen, för varje plats det nya valet kan få", () => {
    const sorterad = ["30 cm", "45 cm", "60 cm", "90 cm", "120 cm"];
    for (const nytt of ["20 cm", "40 cm", "50 cm", "75 cm", "100 cm", "150 cm"]) {
      const ut = efter("Storlek", sorterad, nytt);
      const tal = ut.map((x) => parseFloat(x));
      expect(tal).toEqual([...tal].sort((a, b) => a - b));
    }
  });
});
