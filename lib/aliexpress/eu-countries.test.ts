import { describe, expect, it } from "vitest";
import { classifySellerOrigin, classifyWarehouses } from "./eu-countries";

// Seller-origin = säljarens REGISTRERINGSLAND (skild från warehouse). Detta är
// kärnan i "äkta EU-butik vs kinesisk säljare med EU-lager"-filtret.
describe("classifySellerOrigin (säljarens registreringsland)", () => {
  it("EU-säljare: ISO-koder ES/IT/FR/DE", () => {
    expect(classifySellerOrigin("ES")).toBe("EU_SELLER");
    expect(classifySellerOrigin("IT")).toBe("EU_SELLER");
    expect(classifySellerOrigin("FR")).toBe("EU_SELLER");
    expect(classifySellerOrigin("DE")).toBe("EU_SELLER");
  });

  it("EU-säljare: fritext/landsnamn (store-profilens 'Location')", () => {
    expect(classifySellerOrigin("France")).toBe("EU_SELLER");
    expect(classifySellerOrigin("Spain")).toBe("EU_SELLER");
    expect(classifySellerOrigin("ITALIA")).toBe("EU_SELLER");
    expect(classifySellerOrigin("Madrid")).toBe("EU_SELLER"); // stad → ES
  });

  it("NON-EU-säljare: Kina + övriga registreringsländer (RU/TR/US)", () => {
    // Server-klassificeraren tar ISO-2 + engelska namn (extensionen pre-normaliserar
    // svenska "Kina"→"CN" via FP_EU innan den skickar, så servern ser ISO-2).
    expect(classifySellerOrigin("CN")).toBe("NON_EU_SELLER");
    expect(classifySellerOrigin("China")).toBe("NON_EU_SELLER");
    expect(classifySellerOrigin("RU")).toBe("NON_EU_SELLER");
    expect(classifySellerOrigin("Turkey")).toBe("NON_EU_SELLER");
    expect(classifySellerOrigin("US")).toBe("NON_EU_SELLER");
  });

  it("UNKNOWN: tomt, null, eller oigenkänd text (gissar ALDRIG)", () => {
    expect(classifySellerOrigin("")).toBe("UNKNOWN");
    expect(classifySellerOrigin(null)).toBe("UNKNOWN");
    expect(classifySellerOrigin(undefined)).toBe("UNKNOWN");
    expect(classifySellerOrigin("???")).toBe("UNKNOWN");
    expect(classifySellerOrigin("Sold by Some Store")).toBe("UNKNOWN");
  });

  it("är OBEROENDE av warehouse: samma land klassas lika oavsett ship-from", () => {
    // En kinesisk säljare med EU-lager: warehouse=EU men säljaren=NON_EU.
    expect(classifyWarehouses(["ES"])).toBe("EU"); // warehouse-signalen (gameable)
    expect(classifySellerOrigin("CN")).toBe("NON_EU_SELLER"); // säljar-signalen (sann)
  });
});
