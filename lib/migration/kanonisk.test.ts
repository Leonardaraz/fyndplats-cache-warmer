import { describe, expect, it } from "vitest";
import { kanonisk } from "./kanonisk";

describe("kanonisk", () => {
  it("☠️ samma innehåll i olika nyckelordning är LIKA — det var hela buggen", () => {
    // Källraden ur Wix, ordagrant (mappning 7c81fcbe…):
    const källa = {
      sku: "FP-sybord-hopfallbart",
      supplierVariantId: "L10-007V90WT",
      choices: {},
      shipFrom: "DE",
      landedCostSek: 1502.76,
      wixVariantId: "50840dc2-809b-4a6a-ad2a-5ea049bc56d1",
      grossSek: 1809,
      costUsd: 143.12,
    };
    // Samma rad tillbaka ur JSONB, med nycklarna i annan ordning:
    const kopia = {
      choices: {},
      costUsd: 143.12,
      grossSek: 1809,
      landedCostSek: 1502.76,
      shipFrom: "DE",
      sku: "FP-sybord-hopfallbart",
      supplierVariantId: "L10-007V90WT",
      wixVariantId: "50840dc2-809b-4a6a-ad2a-5ea049bc56d1",
    };

    // Så här såg den trasiga jämförelsen ut — den flaggade 10 av 10 rader:
    expect(JSON.stringify(källa)).not.toBe(JSON.stringify(kopia));
    // Och så här ser den rättade ut:
    expect(kanonisk(källa)).toBe(kanonisk(kopia));
  });

  it("nästlade objekt sorteras hela vägen ner", () => {
    const a = { yttre: { b: 1, a: { z: 1, y: 2 } } };
    const b = { yttre: { a: { y: 2, z: 1 }, b: 1 } };
    expect(kanonisk(a)).toBe(kanonisk(b));
  });

  it("☠️ arrayers ORDNING bevaras — den betyder något", () => {
    // Variantlistan är sorterad. Att sortera bort ordningen hade dolt en
    // verklig skillnad, vilket är precis motsatt problem mot det vi lagar.
    expect(kanonisk([1, 2])).not.toBe(kanonisk([2, 1]));
  });

  it("en VERKLIG skillnad fångas fortfarande", () => {
    expect(kanonisk({ a: 1 })).not.toBe(kanonisk({ a: 2 }));
    expect(kanonisk({ a: 1 })).not.toBe(kanonisk({ a: 1, b: 2 }));
  });

  it("hanterar null, tomt och primitiver", () => {
    expect(kanonisk(null)).toBe("null");
    expect(kanonisk({})).toBe("{}");
    expect(kanonisk([])).toBe("[]");
    expect(kanonisk("x")).toBe('"x"');
  });
});
