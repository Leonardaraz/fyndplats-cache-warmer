import { describe, it, expect } from "vitest";
import { matchesColorName, colorBasesIn } from "./color-match";

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
});

describe("colorBasesIn", () => {
  it("plockar ut bas-färgen ur ett valnamn", () => {
    expect(colorBasesIn("Grön modell 1")).toEqual(["grön"]);
    expect(colorBasesIn("Marinblå")).toEqual(["marinblå"]);
    expect(colorBasesIn("Large")).toEqual([]);
  });
});
