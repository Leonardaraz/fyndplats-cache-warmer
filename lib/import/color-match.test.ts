import { describe, it, expect } from "vitest";
import {
  matchesColorName,
  colorBasesIn,
  isColorAxis,
  nonColorValuesOnColorAxis,
} from "./color-match";

describe("matchesColorName — riktiga hundvagn-alt-texter (live-data)", () => {
  const alts = {
    grått: "Pawhut hopfällbar hundvagn i grått",
    blått: "Pawhut hopfällbar hundvagn i blått",
    beige: "Pawhut hopfällbar hundvagn i beige",
    neutral: "Hundvagn med svängbara hjul och stabil ram",
  };
  it("kopplar Grå → 'i grått'", () => {
    expect(matchesColorName(alts.grått, "Grå")).toBe(true);
    expect(matchesColorName(alts.blått, "Grå")).toBe(false);
    expect(matchesColorName(alts.beige, "Grå")).toBe(false);
  });
  it("kopplar Blå → 'i blått'", () => {
    expect(matchesColorName(alts.blått, "Blå")).toBe(true);
    expect(matchesColorName(alts.grått, "Blå")).toBe(false);
  });
  it("kopplar Beige → 'i beige'", () => {
    expect(matchesColorName(alts.beige, "Beige")).toBe(true);
  });
  it("kopplar Kräm (AE 'Cream') → kräm/cream/gräddvit-alt", () => {
    expect(colorBasesIn("Kräm")).toContain("creme");
    expect(matchesColorName("Paviljong i kräm", "Kräm")).toBe(true);
    expect(matchesColorName("Pavilion in cream", "Kräm")).toBe(true);
    expect(matchesColorName(alts.grått, "Kräm")).toBe(false);
    // En Färg-axel Grå/Kräm ska klassas som färg (annars text-läge + ingen swatch).
    expect(isColorAxis(["Grå", "Kräm"])).toBe(true);
  });
  it("matchar inte en neutral alt-text utan färgord", () => {
    expect(matchesColorName(alts.neutral, "Grå")).toBe(false);
    expect(matchesColorName(alts.neutral, "Blå")).toBe(false);
  });
});

describe("matchesColorName — robusthet", () => {
  it("Blå matchar INTE 'marinblå' (egen bas)", () => {
    expect(matchesColorName("Ryggsäck i marinblå", "Blå")).toBe(false);
    expect(matchesColorName("Ryggsäck i marinblå", "Marinblå")).toBe(true);
  });
  it("hanterar sammansatta valnamn (färg + modell)", () => {
    expect(matchesColorName("Gua Sha-sten i grönt", "Grön modell 1")).toBe(true);
  });
  it("engelska synonymer matchar svensk alt och vice versa", () => {
    expect(matchesColorName("Bottle in red", "Röd")).toBe(true);
    expect(matchesColorName("Flaska i rött", "Red")).toBe(true);
  });
  it("storleks-/icke-färgval ger ingen matchning", () => {
    expect(matchesColorName("Sportflaska i blått", "Large")).toBe(false);
    expect(matchesColorName("Sportflaska i blått", "XL")).toBe(false);
    expect(matchesColorName("Sportflaska i blått", "1-pack")).toBe(false);
  });
  it("matchar inte delsträngar inuti andra ord", () => {
    // "gult" finns inte i "kulturella" trots delsträngen "ul"
    expect(matchesColorName("En kulturell pryl", "Gul")).toBe(false);
  });
  it("beige och khaki korsmatchar INTE (distinkta färger)", () => {
    expect(matchesColorName("Väska i khaki", "Beige")).toBe(false);
    expect(matchesColorName("Väska i beige", "Khaki")).toBe(false);
    expect(matchesColorName("Väska i khaki", "Khaki")).toBe(true);
    expect(matchesColorName("Väska i beige", "Beige")).toBe(true);
  });
});

describe("colorBasesIn", () => {
  it("plockar ut bas-färgen ur ett valnamn", () => {
    expect(colorBasesIn("Grön modell 1")).toEqual(["grön"]);
    expect(colorBasesIn("Marinblå")).toEqual(["marinblå"]);
    expect(colorBasesIn("Large")).toEqual([]);
  });
});

describe("isColorAxis — skilj äkta färgaxel från storlek-under-Color", () => {
  it("storlekar/volymer är INTE en färgaxel (gazebo-fallet)", () => {
    expect(isColorAxis(["2 L", "3 L", "6 L", "10 L", "15 L"])).toBe(false);
    expect(isColorAxis(["S", "M", "L", "XL"])).toBe(false);
    expect(isColorAxis(["1-pack", "2-pack"])).toBe(false);
    expect(isColorAxis(["EU-kontakt", "USA-kontakt"])).toBe(false);
  });
  it("riktiga färgvärden ÄR en färgaxel (sv + eng)", () => {
    expect(isColorAxis(["Blå", "Svart", "Röd"])).toBe(true);
    expect(isColorAxis(["Red", "Blue"])).toBe(true);
    expect(isColorAxis(["Marinblå", "Vinröd", "Khaki"])).toBe(true);
  });
  it("majoritet färger räcker (toleranta mot enstaka okänd färg)", () => {
    expect(isColorAxis(["Blå", "Svart", "Teal"])).toBe(true); // 2/3 kända → färgaxel
    expect(isColorAxis(["Blå", "2 L", "3 L"])).toBe(false); // 1/3 → ej färgaxel
  });
  it("tomt → false (säkrare som text)", () => {
    expect(isColorAxis([])).toBe(false);
    expect(isColorAxis(["", "  "])).toBe(false);
  });
});

describe("nonColorValuesOnColorAxis — fångar rätt svenska, fel betydelse", () => {
  it("flaggar 'Nät' bland äkta färger (åkbilen 2026-08-08)", () => {
    // Haikus svenskhets-grind godkände "Nät" — ordet ÄR svenska. Bilen var röd.
    expect(nonColorValuesOnColorAxis(["Rosa", "Vit", "Nät"])).toEqual(["Nät"]);
  });
  it("flaggar oöversatt spanska som saknar engelska tokens (paviljongtaket)", () => {
    expect(nonColorValuesOnColorAxis(["Naranja", "Ljusgrå", "Grön"])).toEqual(["Naranja"]);
  });
  it("släpper igenom äkta färger, även böjda och sammansatta", () => {
    expect(nonColorValuesOnColorAxis(["Svart", "Vit", "Ljusgrå"])).toEqual([]);
    expect(nonColorValuesOnColorAxis(["Kräm", "Vinröd", "Marinblå"])).toEqual([]);
  });
  it("släpper igenom ytor och material på färgaxeln", () => {
    expect(nonColorValuesOnColorAxis(["Ekdekor", "Svart", "Vit"])).toEqual([]);
    expect(nonColorValuesOnColorAxis(["Naturligt trä", "Grå", "Vit"])).toEqual([]);
    expect(nonColorValuesOnColorAxis(["Krom", "Svart", "Guld"])).toEqual([]);
  });
  it("rör INTE en axel där värdena inte är färger (storlek under Color)", () => {
    // Annars skulle varje värde på en felmärkt axel flaggas.
    expect(nonColorValuesOnColorAxis(["2 L", "3 L", "6 L"])).toEqual([]);
    expect(nonColorValuesOnColorAxis(["S", "M", "L", "XL"])).toEqual([]);
    expect(nonColorValuesOnColorAxis(["Blå", "2 L", "3 L"])).toEqual([]);
  });
  it("språkneutrala värden bedöms inte (mått och modellkoder)", () => {
    expect(nonColorValuesOnColorAxis(["Svart", "Vit", "KM-6631"])).toEqual([]);
    expect(nonColorValuesOnColorAxis(["Svart", "Vit", "5XL"])).toEqual([]);
  });
  it("tom axel ger inget", () => {
    expect(nonColorValuesOnColorAxis([])).toEqual([]);
  });
});
