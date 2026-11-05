import { describe, expect, it } from "vitest";
import type { KategoriNod } from "../wix/kategoritrad";
import { huvudfras, ordformer, saknadeTypkategorier, typkategorier } from "./typkategori";

const MOBLER = "m";
const trad: KategoriNod[] = [
  { id: MOBLER, namn: "Möbler", foralder: null, synlig: true },
  { id: "f", namn: "Fåtöljer", foralder: MOBLER, synlig: true },
  { id: "u", namn: "Uppresningsfåtöljer", foralder: MOBLER, synlig: true },
  { id: "o", namn: "Öronlappsfåtöljer", foralder: MOBLER, synlig: true },
  { id: "s", namn: "Massagestolar", foralder: MOBLER, synlig: true },
  { id: "p", namn: "Pallar", foralder: MOBLER, synlig: true },
  { id: "l", namn: "Odlingslådor", foralder: "t", synlig: true },
  { id: "x", namn: "Spritapparater", foralder: "k", synlig: false },
  { id: "a", namn: "Massage & Återhämtning", foralder: "h", synlig: true },
];

describe("ordformer", () => {
  it("plural och singular för de vanliga ändelserna", () => {
    expect(ordformer("Uppresningsfåtöljer")).toEqual(["uppresningsfåtöljer", "uppresningsfåtölj"]);
    expect(ordformer("Massagestolar")).toContain("massagestol");
    expect(ordformer("Odlingslådor")).toContain("odlingslåda");
  });
  it("namn med flera ord eller & kräver aldrig något", () => {
    expect(ordformer("Massage & Återhämtning")).toEqual([]);
    expect(ordformer("Soffor och bäddsoffor")).toEqual([]);
  });
});

describe("huvudfras", () => {
  it("slutar vid den första prepositionen eller tankstrecket", () => {
    expect(huvudfras("Elektrisk uppresningsfåtölj med liggfunktion – chenille, tål 150 kg")).toBe(
      "elektrisk uppresningsfåtölj",
    );
    expect(huvudfras("Uppresningsfåtölj i gräddvitt konstläder – massage")).toBe("uppresningsfåtölj");
    expect(huvudfras("Sminkbord med spegel och pall")).toBe("sminkbord");
  });
});

describe("typkategorier", () => {
  it("de tre stolarna från audit 2026-11-03 kräver Uppresningsfåtöljer", () => {
    for (const namn of [
      "Elektrisk uppresningsfåtölj med liggfunktion, massage och värme – tål 120 kg",
      "Eldriven uppresningsfåtölj med massage och värme – mörkgrå, tål 120 kg",
      "Elektrisk uppresningsfåtölj med liggfunktion – chenille, tål 150 kg",
    ]) {
      expect(typkategorier(namn, trad).map((k) => k.kategori)).toEqual(["Uppresningsfåtöljer"]);
    }
  });

  it("ett ord som bara börjar likadant kräver ingenting", () => {
    expect(typkategorier("Fåtöljskydd i fleece", trad)).toEqual([]);
  });

  it("det som står efter 'med' räknas inte", () => {
    expect(typkategorier("Sminkbord med spegel och pall", trad)).toEqual([]);
    expect(typkategorier("Fåtölj med pall i sammet", trad).map((k) => k.kategori)).toEqual(["Fåtöljer"]);
  });

  it("dolda kategorier och avdelningar kräver aldrig något", () => {
    expect(typkategorier("Spritapparat i koppar", trad)).toEqual([]);
    expect(typkategorier("Möbler för balkongen", trad)).toEqual([]);
  });

  it("singular på -a för en kategori på -or", () => {
    expect(typkategorier("Odlingslåda i konstrotting på stålben", trad).map((k) => k.kategori)).toEqual([
      "Odlingslådor",
    ]);
  });
});

describe("saknadeTypkategorier", () => {
  const stol = { namn: "Elektrisk uppresningsfåtölj med liggfunktion – chenille", kat: ["Möbler", "Fåtöljer"] };

  it("fäller planen när typkategorin saknas", () => {
    expect(saknadeTypkategorier(stol, trad)).toEqual([{ kategori: "Uppresningsfåtöljer", ord: "uppresningsfåtölj" }]);
  });

  it("släpper planen när kategorin finns", () => {
    expect(saknadeTypkategorier({ ...stol, kat: [...stol.kat, "Uppresningsfåtöljer"] }, trad)).toEqual([]);
  });

  it("släpper planen när kategorin är undantagen med ett skäl", () => {
    expect(
      saknadeTypkategorier(
        { ...stol, katUndantag: [{ kat: "Uppresningsfåtöljer", skal: "provet: undantaget ska släppa" }] },
        trad,
      ),
    ).toEqual([]);
  });
});
