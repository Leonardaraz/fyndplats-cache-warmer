import { describe, expect, it } from "vitest";
import {
  translateAxisName,
  translateValue,
  translateVariantOptions,
  translateOptionColorCodes,
  buildVariantTranslator,
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
    expect(translateValue("KID110")).toBe("KID110");
    expect(translateValue("Care Bear")).toBe("Care Bear"); // 'bear' översätts ej
  });

  it("full paritet med storefront-ordboken på sammansatta fraser", () => {
    expect(translateValue("Army Green")).toBe("Armégrön");
    expect(translateValue("Sky Blue")).toBe("Himmelsblå");
    expect(translateValue("Type-C to USB-A")).toBe("Type-C till USB-A");
    expect(translateValue("Gym with Tent")).toBe("Gym med tält");
    expect(translateValue("5pc Sets 3")).toBe("5-delars set 3");
    expect(translateValue("Squirrel Maracas")).toBe("Maracas, ekorre");
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

describe("buildVariantTranslator — kollisions-säker (dark/deep blue förblir distinkta)", () => {
  it("håller distinkta råvärden distinkta även när de annars översätts lika", () => {
    const variants = [
      { options: { Color: "Dark Blue" } },
      { options: { Color: "Deep Blue" } },
      { options: { Color: "Red" } },
    ];
    const t = buildVariantTranslator(variants);
    const a = t.options({ Color: "Dark Blue" }).Färg;
    const b = t.options({ Color: "Deep Blue" }).Färg;
    expect(a).not.toBe(b); // INTE samma → varianterna kollapsar inte i deriveOptions
    expect(a).toBe("Mörkblå"); // första behåller ren översättning
    expect(b).toContain("Mörkblå"); // andra särskiljs (råvärdet i suffix)
    expect(t.options({ Color: "Red" }).Färg).toBe("Röd");
  });

  it("axisKeyedMap remappar colorCodes med SAMMA distinkta nycklar (bägge hex överlever)", () => {
    const variants = [{ options: { Color: "Dark Blue" } }, { options: { Color: "Deep Blue" } }];
    const t = buildVariantTranslator(variants);
    const codes = t.axisKeyedMap({ Color: { "Dark Blue": "#001", "Deep Blue": "#002" } });
    expect(Object.keys(codes.Färg).length).toBe(2); // ingen "sista vinner"-kollaps
    expect(codes.Färg[t.options({ Color: "Dark Blue" }).Färg]).toBe("#001");
    expect(codes.Färg[t.options({ Color: "Deep Blue" }).Färg]).toBe("#002");
  });

  it("icke-kolliderande/okända värden översätts som vanligt", () => {
    const t = buildVariantTranslator([{ options: { Size: "XL" } }, { options: { Size: "S" } }]);
    expect(t.options({ Size: "XL" })).toEqual({ Storlek: "XL" });
    expect(t.options({ Size: "S" })).toEqual({ Storlek: "S" });
  });

  it("unik även när disambig-formen själv krockar (audit F1)", () => {
    const raws = ["Mörkblå 2", "dark blue", "deep blue", "deep blue "]; // sista två är distinkta råsträngar
    const t = buildVariantTranslator(raws.map((r) => ({ options: { Color: r } })));
    const out = raws.map((r) => t.options({ Color: r }).Färg);
    expect(new Set(out).size).toBe(4); // alla fyra distinkta → ingen variant-kollaps
  });
});
