import { describe, it, expect } from "vitest";
import { sortedSizeChoices } from "./variant-sort";
import { deriveOptions } from "./pipeline";

describe("sortedSizeChoices — klädskala", () => {
  it("bokstavsskala S→M→L→XL→2XL", () => {
    expect(sortedSizeChoices(["XL", "S", "M", "2XL", "L"])).toEqual(["S", "M", "L", "XL", "2XL"]);
  });
  it("5XL sorteras som störst (inte som '5')", () => {
    expect(sortedSizeChoices(["5XL", "M", "XL", "S"])).toEqual(["S", "M", "XL", "5XL"]);
  });
  it("svenska ord Liten/Mellan/Stor (från translateValue)", () => {
    expect(sortedSizeChoices(["Stor", "Liten", "Mellan"])).toEqual(["Liten", "Mellan", "Stor"]);
  });
  it("XXS/XS/XXXL", () => {
    expect(sortedSizeChoices(["XXXL", "XS", "XXS", "M"])).toEqual(["XXS", "XS", "M", "XXXL"]);
  });
});

describe("sortedSizeChoices — numeriskt/mått (samma enhet)", () => {
  it("tum-dimensioner + antal (canvas-tavlorna)", () => {
    expect(
      sortedSizeChoices(["11x14 tum 12 st", "8x10 tum 40 st", "8x10 tum 24 st"]),
    ).toEqual(["8x10 tum 24 st", "8x10 tum 40 st", "11x14 tum 12 st"]);
  });
  it("effekt W", () => {
    expect(sortedSizeChoices(["260W", "10W", "120W"])).toEqual(["10W", "120W", "260W"]);
  });
  it("spänning V (icke-normaliserad familj → råa tal)", () => {
    expect(sortedSizeChoices(["220V", "12V", "110V"])).toEqual(["12V", "110V", "220V"]);
  });
  it("ström A (PWM-regulatorer)", () => {
    expect(sortedSizeChoices(["60A", "10A", "20A"])).toEqual(["10A", "20A", "60A"]);
  });
  it("rena tal (skostorlek)", () => {
    expect(sortedSizeChoices(["42", "36", "40", "38"])).toEqual(["36", "38", "40", "42"]);
  });
  it("decimalkomma (meter)", () => {
    expect(sortedSizeChoices(["3,6 x 3,6 m", "3 x 3 m"])).toEqual(["3 x 3 m", "3,6 x 3,6 m"]);
  });
});

describe("sortedSizeChoices — blandade enheter inom samma familj (normalisering)", () => {
  it("volym ml/l", () => {
    expect(sortedSizeChoices(["2 L", "500 ml", "1 L"])).toEqual(["500 ml", "1 L", "2 L"]);
  });
  it("vikt g/kg", () => {
    expect(sortedSizeChoices(["1 kg", "900 g"])).toEqual(["900 g", "1 kg"]);
  });
  it("längd cm/m", () => {
    expect(sortedSizeChoices(["1 m", "80 cm"])).toEqual(["80 cm", "1 m"]);
  });
  it("lagring GB/TB", () => {
    expect(sortedSizeChoices(["1TB", "256GB", "512GB"])).toEqual(["256GB", "512GB", "1TB"]);
  });
  it("utskriven enhet från rå AE-data blandad med förkortad (meter vs cm)", () => {
    // "1 meter" får INTE faktor 1 och hamna före "80 cm" — meter normaliseras.
    expect(sortedSizeChoices(["1 meter", "80 cm", "20 cm"])).toEqual([
      "20 cm",
      "80 cm",
      "1 meter",
    ]);
  });
  it("utskriven vikt (Gram/Kilogram) normaliseras", () => {
    expect(sortedSizeChoices(["1 Kilogram", "500 Gram", "900 Gram"])).toEqual([
      "500 Gram",
      "900 Gram",
      "1 Kilogram",
    ]);
  });
  it("fot konverteras inte i sorteringen men jämförs rätt mot meter", () => {
    // 6 fot = 1,83 m < 2 m; faktor 304,8 mm gör ordningen korrekt.
    expect(sortedSizeChoices(["2 m", "6 fot"])).toEqual(["6 fot", "2 m"]);
  });
});

describe("sortedSizeChoices — bail (returnerar null → axel lämnas orörd)", () => {
  it("blandning klädskala + tal", () => {
    expect(sortedSizeChoices(["S", "M", "40 cm"])).toBeNull();
  });
  it("otolkbart värde (inget tal)", () => {
    expect(sortedSizeChoices(["8x10 tum", "Slumpmässig"])).toBeNull();
  });
  it("korsfamilj (vikt + volym)", () => {
    expect(sortedSizeChoices(["1 kg", "1 L"])).toBeNull();
  });
  it("korsfamilj med utskrivna enheter (meter + gram) → orörd", () => {
    expect(sortedSizeChoices(["1 meter", "2 gram"])).toBeNull();
  });
  it("färger har inga tal → null (rörs aldrig)", () => {
    expect(sortedSizeChoices(["Röd", "Blå", "Svart"])).toBeNull();
  });
  it("ensamt värde → null", () => {
    expect(sortedSizeChoices(["M"])).toBeNull();
  });
});

describe("deriveOptions — integration", () => {
  const mk = (opts: Record<string, string>, id: string) =>
    ({ supplierVariantId: id, options: opts, costUsd: 1, included: true }) as any;

  it("storleksaxel sorteras minsta→största", () => {
    const variants = [
      mk({ Storlek: "XL" }, "1"),
      mk({ Storlek: "S" }, "2"),
      mk({ Storlek: "L" }, "3"),
      mk({ Storlek: "M" }, "4"),
    ];
    const opts = deriveOptions(variants);
    expect(opts[0].choices.map((c) => c.name)).toEqual(["S", "M", "L", "XL"]);
  });

  it("FÄRGAXEL lämnas i originalordning (regressionsvakt — färg är estetisk)", () => {
    const variants = [
      mk({ Färg: "Röd" }, "1"),
      mk({ Färg: "Blå" }, "2"),
      mk({ Färg: "Svart" }, "3"),
    ];
    const colorCodes = { Färg: { Röd: "#f00", Blå: "#00f", Svart: "#000" } };
    const opts = deriveOptions(variants, colorCodes);
    expect(opts[0].choices.map((c) => c.name)).toEqual(["Röd", "Blå", "Svart"]);
  });

  it("tum-axel under namnet 'Storlek' sorteras (canvas)", () => {
    const variants = [
      mk({ Storlek: "11x14 tum 12 st" }, "1"),
      mk({ Storlek: "8x10 tum 24 st" }, "2"),
    ];
    const opts = deriveOptions(variants);
    expect(opts[0].choices.map((c) => c.name)).toEqual(["8x10 tum 24 st", "11x14 tum 12 st"]);
  });
});
