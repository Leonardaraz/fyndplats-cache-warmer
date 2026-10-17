import { describe, expect, it } from "vitest";
import { delaSparningsnummer, sparningsLank } from "./tracking-link";

// Order 10095 (2026-10-17): ett hantelset som Aosom skickade i två DPD-paket.
// Wix tar en fulfillment per artikelantal, så båda numren står i samma fält.
// Numren här är påhittade, i samma form.
const FALT_10095 = "01234567890123, 01234567890125";

describe("delaSparningsnummer", () => {
  it("'A, B' ger [A, B]", () => {
    expect(delaSparningsnummer("A, B")).toEqual(["A", "B"]);
    expect(delaSparningsnummer(FALT_10095)).toEqual(["01234567890123", "01234567890125"]);
  });

  it("ett enskilt nummer ger exakt samma nummer, trimmat", () => {
    expect(delaSparningsnummer("A")).toEqual(["A"]);
    expect(delaSparningsnummer(" 07434005149850 ")).toEqual(["07434005149850"]);
  });

  it("'A,,B ; A' ger [A, B]: tomma och dubbletter bort, ordningen kvar", () => {
    expect(delaSparningsnummer("A,,B ; A")).toEqual(["A", "B"]);
    expect(delaSparningsnummer("B, A")).toEqual(["B", "A"]);
  });

  it("ett nummer med mellanslag delas inte", () => {
    expect(delaSparningsnummer("JJD 0001 2345 6789")).toEqual(["JJD 0001 2345 6789"]);
  });

  it("semikolon och radbrytningar delar också", () => {
    expect(delaSparningsnummer("A;B\nC\r\nD")).toEqual(["A", "B", "C", "D"]);
  });

  it("tomt eller saknat fält ger inga nummer", () => {
    expect(delaSparningsnummer("")).toEqual([]);
    expect(delaSparningsnummer(" , ; ")).toEqual([]);
    expect(delaSparningsnummer(null)).toEqual([]);
    expect(delaSparningsnummer(undefined)).toEqual([]);
  });
});

describe("sparningsLank", () => {
  it("bygger länken till vår egen spårsida", () => {
    expect(sparningsLank("07434005149850")).toBe("https://www.fyndplats.se/sparning?tn=07434005149850");
  });

  it("URL-kodar nummer med tecken som annars bryter query-strängen", () => {
    expect(sparningsLank("AB 12&34")).toBe("https://www.fyndplats.se/sparning?tn=AB%2012%2634");
  });

  it("flera nummer i fältet: länken pekar på det första, inte på hela strängen", () => {
    expect(sparningsLank(FALT_10095)).toBe("https://www.fyndplats.se/sparning?tn=01234567890123");
    expect(sparningsLank("01234567890123;01234567890125")).toBe("https://www.fyndplats.se/sparning?tn=01234567890123");
  });

  it("tomt eller saknat nummer ger undefined — fältet ska utelämnas, inte skickas tomt", () => {
    expect(sparningsLank("")).toBeUndefined();
    expect(sparningsLank("   ")).toBeUndefined();
    expect(sparningsLank(null)).toBeUndefined();
    expect(sparningsLank(undefined)).toBeUndefined();
  });
});
