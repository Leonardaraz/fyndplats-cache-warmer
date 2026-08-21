import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EU_CUSTOMS_UNION,
  getEuCountries,
  isEuCountry,
  isEuCustomsUnion,
} from "./eu-countries";

// SKILLNADEN MELLAN DE TVÅ LISTORNA ÄR HELA POÄNGEN.
//
// isEuCountry  = "kommer paketet fram snabbt?" → GB och NO räknas in.
// isEuCustomsUnion = "kan vi köpa in därifrån utan tull?" → gör de inte.
//
// Blandas de ihop köper man in från Storbritannien i tron att det är inrikes
// EU-handel. Det var precis vad importen gjorde fram till 2026-08-21.

describe("EU_CUSTOMS_UNION", () => {
  it("innehåller exakt EU:s 27 medlemsstater", () => {
    expect(EU_CUSTOMS_UNION.size).toBe(27);
  });

  it("utesluter GB och NO — de ligger utanför tullen", () => {
    expect(isEuCustomsUnion("GB")).toBe(false);
    expect(isEuCustomsUnion("NO")).toBe(false);
  });

  it("...men de räknas fortfarande som snabb leverans", () => {
    // Om den här raden går sönder har någon ändrat EU-badgen i stället för
    // lagervalet. GB-lager levererar snabbt — det är inköpet som är problemet.
    expect(isEuCountry("GB")).toBe(true);
    expect(isEuCountry("NO")).toBe(true);
  });

  it("innehåller CY och MT, som saknas i snabb-leverans-listan", () => {
    expect(isEuCustomsUnion("CY")).toBe(true);
    expect(isEuCustomsUnion("MT")).toBe(true);
    expect(getEuCountries()).not.toContain("CY");
  });

  it("utesluter uppenbara icke-medlemmar", () => {
    for (const c of ["CN", "US", "TR", "RU", "CH", "AU", "CA", "MX"]) {
      expect(isEuCustomsUnion(c), c).toBe(false);
    }
  });

  it("är skiftlägesokänslig och tål skräp", () => {
    expect(isEuCustomsUnion("es")).toBe(true);
    expect(isEuCustomsUnion("")).toBe(false);
    expect(isEuCustomsUnion(undefined as unknown as string)).toBe(false);
  });

  // Tillägget kan inte importera TS (browser-global vs modul), så listan finns
  // i två filer. Den här spärren gör det dyrt att ändra bara den ena — samma
  // lärdom som SHIP_AXIS_RE, som drev isär två gånger på två veckor.
  it("är identisk med tilläggets EU_TULL_CODES", () => {
    const js = readFileSync(join(process.cwd(), "extension/eu-countries.js"), "utf8");
    const block = js.match(/const EU_TULL_CODES = new Set\(\[([\s\S]*?)\]\)/);
    expect(block, "EU_TULL_CODES hittades inte i extension/eu-countries.js").toBeTruthy();
    const koder = [...block![1].matchAll(/"([A-Z]{2})"/g)].map((m) => m[1]);
    expect([...koder].sort()).toEqual([...EU_CUSTOMS_UNION].sort());
  });
});
