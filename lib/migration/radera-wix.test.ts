import { describe, expect, it } from "vitest";
import { ALDRIG_RADERA, beslutaSida, fårRaderas } from "./radera-wix";
import { ATT_KOPIERA, LLM_SAMLINGAR } from "@/lib/db/tabeller";

describe("fårRaderas — spärrlistan", () => {
  it("☠️ de tre kollektioner butiken läser direkt är fredade", () => {
    expect(fårRaderas("FyndplatsImportedReviews")).toBe(false);
    expect(fårRaderas("FyndplatsAuctions")).toBe(false);
    expect(fårRaderas("FyndplatsRedirects")).toBe(false);
  });

  it("☠️ tokenraden är fredad — den går inte att läsa tillbaka", () => {
    expect(fårRaderas("FyndplatsAliExpressTokens")).toBe(false);
  });

  it("☠️ spärrlistan vinner ÖVER kopielistan", () => {
    // Skulle någon lägga in en fredad kollektion i ATT_KOPIERA ska den ändå
    // inte gå att radera. Det är hela poängen med två lås.
    for (const namn of ALDRIG_RADERA) {
      expect(fårRaderas(namn)).toBe(false);
    }
  });

  it("de flyttade kollektionerna får raderas", () => {
    for (const spec of ATT_KOPIERA) {
      if ((ALDRIG_RADERA as readonly string[]).includes(spec.kollektion)) continue;
      expect(fårRaderas(spec.kollektion)).toBe(true);
    }
    for (const k of LLM_SAMLINGAR) expect(fårRaderas(k)).toBe(true);
  });

  it("☠️ en okänd kollektion får ALDRIG raderas — bara uppräknade", () => {
    expect(fårRaderas("FyndplatsNågotHeltAnnat")).toBe(false);
    expect(fårRaderas("")).toBe(false);
    expect(fårRaderas("Members/PrivateMembersData")).toBe(false);
  });
});

describe("beslutaSida — varje rad slås upp innan den raderas", () => {
  it("raderar sidan när varje id finns i kopian", () => {
    const b = beslutaSida(["a", "b", "c"], new Set(["a", "b", "c", "z"]));
    expect(b).toEqual({ sort: "radera", ids: ["a", "b", "c"] });
  });

  it("☠️ EN saknad rad avbryter HELA sidan — inte bara den raden", () => {
    const b = beslutaSida(["a", "b", "c"], new Set(["a", "c"]));
    expect(b.sort).toBe("avbryt");
    if (b.sort !== "avbryt") throw new Error("fel gren");
    expect(b.saknade).toEqual(["b"]);
    expect(b.av).toBe(3);
  });

  it("☠️ en tom kopia raderar ingenting — det är utplåningsfallet", () => {
    const b = beslutaSida(["a", "b"], new Set());
    expect(b.sort).toBe("avbryt");
    if (b.sort !== "avbryt") throw new Error("fel gren");
    expect(b.saknade).toEqual(["a", "b"]);
  });

  it("en tom sida är inget fel — kollektionen är slut", () => {
    expect(beslutaSida([], new Set())).toEqual({ sort: "radera", ids: [] });
  });

  it("rapporterar ALLA saknade, inte bara den första", () => {
    const b = beslutaSida(["a", "b", "c", "d"], new Set(["c"]));
    if (b.sort !== "avbryt") throw new Error("fel gren");
    expect(b.saknade).toEqual(["a", "b", "d"]);
  });
});
