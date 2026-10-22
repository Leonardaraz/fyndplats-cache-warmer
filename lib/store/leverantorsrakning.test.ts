import { describe, expect, it } from "vitest";
import type { MappingSupplier, ProductMappingRecord } from "./index";
import { idForm, raknaLeverantorer } from "./leverantorsrakning";

// ☠️ Påhittade id. Inga riktiga artikelnummer i ett publikt repo.
function rad(over: Partial<ProductMappingRecord>): ProductMappingRecord {
  return { supplierProductId: "", wixProductId: "wix-1", variants: [], ...over } as ProductMappingRecord;
}

describe("idForm", () => {
  it("skiljer prefix, siffror, tomt och annat", () => {
    expect(idForm("aosom:TEST-0001")).toBe("aosomPrefix");
    expect(idForm("vevor:TEST-0001")).toBe("vevorPrefix");
    expect(idForm("1005000000000001")).toBe("siffror");
    expect(idForm("")).toBe("tomt");
    expect(idForm("  ")).toBe("tomt");
    expect(idForm(undefined)).toBe("tomt");
    expect(idForm("TEST-0001")).toBe("annat");
  });

  it("☠️ testar prefixet som klassningen gör, utan trim", () => {
    // Ett blanksteg först gör att mappingSupplier() inte ser prefixet, och
    // raden är då fortfarande AliExpress. Räkningen får inte påstå något annat.
    const r = raknaLeverantorer([rad({ supplierProductId: " vevor:TEST-0001" })]);
    expect(r.perLeverantor.aliexpress).toBe(1);
    expect(r.utanFalt.vevorPrefix).toBe(0);
    expect(idForm(" vevor:TEST-0001")).toBe("annat");
  });
});

describe("raknaLeverantorer", () => {
  const rader = [
    rad({ supplier: "aosom", supplierProductId: "aosom:TEST-0001", wixProductId: "a1" }),
    rad({ supplierProductId: "aosom:TEST-0002", wixProductId: "a2" }), // tappat fältet
    rad({ supplier: "aliexpress", supplierProductId: "1005000000000001", wixProductId: "e1" }),
    rad({ supplierProductId: "1005000000000002", wixProductId: "e2" }),
    rad({ supplierProductId: "", wixProductId: "e3" }), // tomt id, default AE
    rad({ supplier: "vevor", supplierProductId: "vevor:TEST-0001", wixProductId: "v1" }),
    rad({ supplier: "Aosom " as unknown as MappingSupplier, supplierProductId: "x", wixProductId: "o1" }),
    rad({ supplier: "aosom", supplierProductId: "1005000000000003", wixProductId: "a3" }), // motsägelse
    rad({ supplier: "aliexpress", supplierProductId: "1005000000000004", wixProductId: "e4", draftStatus: "rejected" }),
  ];
  const r = raknaLeverantorer(rader);

  it("räknar per klassning, och ett okänt värde blir okand", () => {
    expect(r.totalt).toBe(9);
    expect(r.perLeverantor).toEqual({ aliexpress: 4, aosom: 3, vevor: 1, okand: 1 });
  });

  it("räknar det sparade fältet för sig", () => {
    expect(r.sparatFalt).toEqual({ aliexpress: 2, aosom: 2, vevor: 1, saknas: 3, okantVarde: 1 });
  });

  it("räknar id-formen bara för rader utan fält", () => {
    expect(r.utanFalt).toEqual({ aosomPrefix: 1, vevorPrefix: 0, siffror: 1, tomt: 1, annat: 0 });
  });

  it("räknar rader där fältet och id:t säger olika leverantörer", () => {
    expect(r.faltOchIdOense).toBe(1);
  });

  it("räknar synkernas urval med samma predikat som synkerna", () => {
    // AE: e1, e2 (tomt id räknas inte, pensionerade räknas inte). Aosom: a1, a2 (a3 bär inget prefix).
    expect(r.aeSynkensUrval).toBe(2);
    expect(r.aosomSynkensUrval).toBe(2);
  });

  it("☠️ svaret bär bara antal — inga id och inga artikelnummer", () => {
    const text = JSON.stringify(r);
    for (const id of ["TEST-0001", "TEST-0002", "1005000000000001", "a1", "e1", "v1", "Aosom "]) {
      expect(text).not.toContain(id);
    }
  });
});
