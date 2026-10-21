import { describe, it, expect } from "vitest";
import {
  mappingSupplier,
  isAliExpressMapping,
  isAosomMapping,
  aosomSkuOf,
  aliExpressIdOf,
  arKandLeverantor,
  frystLeverantor,
} from "./supplier";
import { LEVERANTORER, type MappingSupplier } from "./index";

describe("mappingSupplier", () => {
  it("läser det sparade fältet när det finns", () => {
    expect(mappingSupplier({ supplier: "aosom", supplierProductId: "vad-som-helst" })).toBe("aosom");
    expect(mappingSupplier({ supplier: "aliexpress", supplierProductId: "aosom:x" })).toBe("aliexpress");
  });

  it("faller tillbaka på id-prefixet när fältet saknas", () => {
    expect(mappingSupplier({ supplierProductId: "aosom:845-030CG" })).toBe("aosom");
    expect(mappingSupplier({ supplierProductId: "1005010804316400" })).toBe("aliexpress");
  });

  it("gamla rader utan fält räknas som AliExpress — det var allt som fanns före 2026-08-27", () => {
    expect(mappingSupplier({ supplierProductId: "" })).toBe("aliexpress");
    expect(mappingSupplier({ supplierProductId: undefined as unknown as string })).toBe("aliexpress");
  });
});

describe("isAliExpressMapping", () => {
  it("släpper igenom AE-rader och stoppar Aosom-rader", () => {
    expect(isAliExpressMapping({ supplierProductId: "1005010804316400" })).toBe(true);
    expect(isAliExpressMapping({ supplierProductId: "aosom:845-030CG" })).toBe(false);
    expect(isAliExpressMapping({ supplier: "aosom", supplierProductId: "845-030CG" })).toBe(false);
  });

  it("isAosomMapping är motsatsen för AE- och Aosom-rader", () => {
    for (const m of [
      { supplierProductId: "1005010804316400" },
      { supplierProductId: "aosom:845-030CG" },
      { supplier: "aosom" as const, supplierProductId: "845-030CG" },
    ]) {
      expect(isAosomMapping(m)).toBe(!isAliExpressMapping(m));
    }
  });
});

describe("aosomSkuOf", () => {
  it("skalar av prefixet", () => {
    expect(aosomSkuOf({ supplierProductId: "aosom:845-030CG" })).toBe("845-030CG");
  });

  it("ger null för AE-rader", () => {
    expect(aosomSkuOf({ supplierProductId: "1005010804316400" })).toBeNull();
  });

  it("ger null när fältet säger aosom men id:t saknar prefix — gissa inte", () => {
    expect(aosomSkuOf({ supplier: "aosom", supplierProductId: "845-030CG" })).toBeNull();
  });
});

describe("aliExpressIdOf", () => {
  it("ger id:t för AE-rader och null för Aosom-rader — samma dom som isAliExpressMapping", () => {
    for (const m of [
      { supplierProductId: "1005010804316400" },
      { supplierProductId: "aosom:845-030CG" },
      { supplier: "aosom" as const, supplierProductId: "845-030CG" },
      { supplier: "aliexpress" as const, supplierProductId: "1005012347030872" },
    ]) {
      expect(aliExpressIdOf(m) !== null).toBe(isAliExpressMapping(m));
    }
  });

  it("id:t ÄR strängen vid körning — loggning, jämförelser och Map-nycklar är oförändrade", () => {
    const id = aliExpressIdOf({ supplierProductId: "1005010804316400" });
    expect(id).toBe("1005010804316400");
    expect(`${id}`).toBe("1005010804316400");
    expect(new Map([["1005010804316400", 1]]).get(id as string)).toBe(1);
  });

  it("tomt id ger null — en rad utan leverantörs-id kan inte slås upp någonstans", () => {
    expect(aliExpressIdOf({ supplierProductId: "" })).toBeNull();
    expect(aliExpressIdOf({ supplierProductId: undefined as unknown as string })).toBeNull();
  });

  // Den här är regressionstestet för felet som hittades 2026-08-28: sju vägar
  // anropar AE per produkt, och /api/aliexpress/sync-all hade tappat spärren.
  // Testet kan inte se ett kompileringsfel — det låser i stället att domen
  // aliExpressIdOf fäller är EXAKT den spärren de sex andra vägarna använder,
  // så en väg som byter från isAliExpressMapping till aliExpressIdOf (eller
  // tvärtom) inte kan börja klassa rader olika.
  it("hela katalogens formvarianter klassas likadant av båda vägarna", () => {
    const rader = [
      { supplierProductId: "1005010804316400" },
      { supplierProductId: "aosom:24G58OVN9S001" },
      { supplier: "aosom" as const, supplierProductId: "aosom:845-030CG" },
      { supplier: "aliexpress" as const, supplierProductId: "aosom:felaktigt-prefix" },
      { supplierProductId: "845-030CG" },
    ];
    for (const m of rader) {
      const viaTyp = aliExpressIdOf(m);
      const viaBoolean = isAliExpressMapping(m) && Boolean(m.supplierProductId);
      expect(viaTyp !== null).toBe(viaBoolean);
    }
  });
});

describe("VEVOR och okända värden (2026-10-21)", () => {
  it("prefixet vevor: och fältet ger vevor", () => {
    expect(mappingSupplier({ supplierProductId: "vevor:TEST-0001" })).toBe("vevor");
    expect(mappingSupplier({ supplier: "vevor", supplierProductId: "TEST-0001" })).toBe("vevor");
  });

  it("☠️ en VEVOR-rad är varken AliExpress eller Aosom — inte för någon spärr", () => {
    for (const m of [
      { supplierProductId: "vevor:TEST-0001" },
      { supplier: "vevor" as const, supplierProductId: "TEST-0001" },
    ]) {
      expect(isAliExpressMapping(m)).toBe(false);
      expect(isAosomMapping(m)).toBe(false);
      expect(aliExpressIdOf(m)).toBeNull();
      expect(aosomSkuOf(m)).toBeNull();
    }
  });

  it("☠️ ett sparat värde utanför listan blir okand, aldrig AliExpress", () => {
    // Fältet är fri text i databasen. Ett sådant värde var redan förut varken
    // AE eller Aosom för spärrarna; svaret gör det bara synligt.
    const m = { supplier: "Aosom " as unknown as MappingSupplier, supplierProductId: "1005010804316400" };
    expect(mappingSupplier(m)).toBe("okand");
    expect(isAliExpressMapping(m)).toBe(false);
    expect(isAosomMapping(m)).toBe(false);
    expect(aliExpressIdOf(m)).toBeNull();
  });

  it("ingen befintlig rad byter klass: utan fält och utan känt prefix är det fortfarande AliExpress", () => {
    expect(mappingSupplier({ supplierProductId: "1005010804316400" })).toBe("aliexpress");
    expect(mappingSupplier({ supplierProductId: "" })).toBe("aliexpress");
    expect(mappingSupplier({ supplierProductId: "aosom:845-030CG" })).toBe("aosom");
    // Fältet vinner över prefixet, som förut.
    expect(mappingSupplier({ supplier: "aosom", supplierProductId: "vevor:TEST-0001" })).toBe("aosom");
  });

  it("arKandLeverantor följer LEVERANTORER", () => {
    for (const l of LEVERANTORER) expect(arKandLeverantor(l)).toBe(true);
    for (const x of ["", "okand", "Aosom", "AliExpress", 7, null, undefined]) expect(arKandLeverantor(x)).toBe(false);
  });
});

describe("frystLeverantor", () => {
  it("fryser klassningen innan artikeln töms, så raden inte faller tillbaka på AliExpress", () => {
    expect(frystLeverantor({ supplierProductId: "aosom:845-030CG" })).toBe("aosom");
    expect(frystLeverantor({ supplierProductId: "vevor:TEST-0001" })).toBe("vevor");
    expect(frystLeverantor({ supplierProductId: "1005010804316400" })).toBe("aliexpress");
  });

  it("☠️ ett okänt sparat värde skrivs inte om till okand — raden behåller det", () => {
    const okant = "Aosom " as unknown as MappingSupplier;
    expect(frystLeverantor({ supplier: okant, supplierProductId: "x" })).toBe(okant);
  });
});
