import { describe, expect, it } from "vitest";
import {
  translateAxisName,
  translateValue,
  translateVariantOptions,
  translateOptionColorCodes,
} from "./variant-translations";

describe("translateAxisName", () => {
  it("översätter kända axlar", () => {
    expect(translateAxisName("Color")).toBe("Färg");
    expect(translateAxisName("Colour")).toBe("Färg");
    expect(translateAxisName("Size")).toBe("Storlek");
    expect(translateAxisName("Material")).toBe("Material");
  });

  it("strippar kolon-suffix före uppslag", () => {
    // AE skickar ibland axeln som "name: value" — vi vill bara axeln.
    expect(translateAxisName("Color: F2025-Sverige")).toBe("Färg");
    expect(translateAxisName("Size：XL")).toBe("Storlek"); // fullbredds-kolon
  });

  it("är skiftlägesokänslig och trimmar", () => {
    expect(translateAxisName("  COLOR  ")).toBe("Färg");
  });

  it("faller tillbaka på råvärdet för okänd axel", () => {
    expect(translateAxisName("Sparkle Level")).toBe("Sparkle Level");
  });
});

describe("translateValue", () => {
  it("översätter kända färger och material (fullt match)", () => {
    expect(translateValue("Red")).toBe("Röd");
    expect(translateValue("Black")).toBe("Svart");
    expect(translateValue("Light Blue")).toBe("Ljusblå");
    expect(translateValue("Stainless Steel")).toBe("Rostfritt stål");
  });

  it("lämnar universella storlekar oförändrade", () => {
    expect(translateValue("5XL")).toBe("5XL");
    expect(translateValue("M")).toBe("M");
    expect(translateValue("XXL")).toBe("XXL");
  });

  it("översätter bara första ordet vid partiellt match", () => {
    // "Pink Diamond" → "Rosa Diamond" (första ordet matchar, resten orört).
    expect(translateValue("Pink Diamond")).toBe("Rosa Diamond");
    expect(translateValue("Blue Edition")).toBe("Blå Edition");
  });

  it("faller tillbaka på råvärdet utan match", () => {
    expect(translateValue("F2025-Sverige")).toBe("F2025-Sverige");
    expect(translateValue("Unicorn")).toBe("Unicorn");
  });

  it("översätter ALLA kända ord token-vis, inte bara det första", () => {
    expect(translateValue("Black with LED")).toBe("Svart med LED");
    expect(translateValue("Black without LED")).toBe("Svart utan LED");
    expect(translateValue("33-Grey")).toBe("33-Grå"); // bindestreck bevaras
    expect(translateValue("B6AC Blue")).toBe("B6AC Blå"); // kod-prefix orört
  });

  it("översätter djur, instrument och kontakttyper", () => {
    expect(translateValue("Lion")).toBe("Lejon");
    expect(translateValue("Rabbit")).toBe("Kanin");
    expect(translateValue("EU Plug")).toBe("EU-kontakt");
    expect(translateValue("Touchscreen model")).toBe("Pekskärmsmodell");
  });

  it("lämnar modellnamn, berlock-text och koder orörda", () => {
    expect(translateValue("iPhone 15 Pro")).toBe("iPhone 15 Pro");
    expect(translateValue("LOVE")).toBe("LOVE");
    expect(translateValue("KM-6631")).toBe("KM-6631");
  });
});

describe("translateVariantOptions", () => {
  it("översätter både axelnamn och värden i ett record", () => {
    expect(
      translateVariantOptions({ Color: "Red", Size: "5XL" }),
    ).toEqual({ Färg: "Röd", Storlek: "5XL" });
  });
});

describe("translateOptionColorCodes", () => {
  it("remappar färgkods-tabellen till översatta nycklar", () => {
    expect(
      translateOptionColorCodes({ Color: { Red: "#ff0000", Black: "#000000" } }),
    ).toEqual({ Färg: { Röd: "#ff0000", Svart: "#000000" } });
  });
});
