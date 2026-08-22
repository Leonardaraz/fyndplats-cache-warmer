import { describe, expect, it } from "vitest";
import { stripMarketplaceSuffix } from "./guard";

// De HÄR strängarna är hämtade ur en skarp export 2026-08-20 (mappningarnas
// seoTitle). 70-teckenkapningen slår mitt i "AliExpress", så suffixet dyker upp
// avhugget i flera former — regexen måste tåla alla.
describe("stripMarketplaceSuffix — verkliga titlar ur katalogen", () => {
  const fall: [string, string][] = [
    [
      "Pawhut Folding Aluminum Dog Ramp for Car 158X43.5X2.5 cm Black - AliEx",
      "Pawhut Folding Aluminum Dog Ramp for Car 158X43.5X2.5 cm Black",
    ],
    [
      "DURHAND foldable workbench with clamps home use MDF iron 70 kg - AliEx",
      "DURHAND foldable workbench with clamps home use MDF iron 70 kg",
    ],
    [
      "Pawhut Wooden Cat House 75.5X75X137 cm with Gray Asphalt Roof - AliExp",
      "Pawhut Wooden Cat House 75.5X75X137 cm with Gray Asphalt Roof",
    ],
    [
      "Outsunny Extendable Aluminum Garden Table Glass Top 80-160X80X75 cm -",
      "Outsunny Extendable Aluminum Garden Table Glass Top 80-160X80X75 cm",
    ],
  ];

  for (const [smutsig, ren] of fall) {
    it(`tvättar: ${smutsig.slice(-22)}`, () => {
      expect(stripMarketplaceSuffix(smutsig)).toBe(ren);
    });
  }

  it("rör inte en redan ren svensk titel", () => {
    const t = "Hopfällbar hundramp till bil 158 cm – viks till 45 cm";
    expect(stripMarketplaceSuffix(t)).toBe(t);
  });
});

describe("stripMarketplaceSuffix — hängande separator", () => {
  it("tar bort ett ensamt bindestreck i slutet", () => {
    expect(stripMarketplaceSuffix("Trädgårdsbord i aluminium 160 cm -")).toBe(
      "Trädgårdsbord i aluminium 160 cm",
    );
  });

  it("rör inte en avslutande punkt — den kan vara avsiktlig", () => {
    expect(stripMarketplaceSuffix("Monteras på 20 min.")).toBe("Monteras på 20 min.");
  });

  it("lämnar titeln orörd om det inte finns text kvar", () => {
    expect(stripMarketplaceSuffix("- -")).toBe("- -");
  });

  it("bindestreck INUTI titeln lämnas i fred", () => {
    expect(stripMarketplaceSuffix("Bord 80-160 cm i aluminium")).toBe("Bord 80-160 cm i aluminium");
  });
});
