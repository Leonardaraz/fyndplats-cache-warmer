import { describe, expect, it } from "vitest";
import { classifyConfidence, scoreTitleMatch, tokenize } from "./auto-map";

describe("tokenize", () => {
  it("tar bort svensk fluff och diakriter", () => {
    const t = tokenize("Trådlös Ergonomisk Mus – 4000 DPI, 99 % Tysta Klick");
    expect(t).toContain("ergonomisk");
    expect(t).toContain("mus");
    expect(t).toContain("dpi");
    // stopword + ren siffra ska bort
    expect(t).not.toContain("och");
    expect(t).not.toContain("99");
  });

  it("släpper för korta tokens och stopwords", () => {
    expect(tokenize("en och i på")).toEqual([]);
  });
});

describe("scoreTitleMatch", () => {
  it("ger 1.0 när alla sökord finns i titeln", () => {
    const q = tokenize("wireless ergonomic mouse");
    // "wireless" är stopword → kvar: ergonomic, mouse
    expect(scoreTitleMatch(q, "Ergonomic Gaming Mouse 4000DPI")).toBe(1);
  });

  it("ger partiell poäng vid delvis överlapp", () => {
    const q = ["ergonomic", "mouse", "bluetooth"];
    expect(scoreTitleMatch(q, "Ergonomic Mouse")).toBeCloseTo(2 / 3, 5);
  });

  it("ger 0 utan överlapp", () => {
    expect(scoreTitleMatch(["mouse"], "Stainless Steel Whiskey Stones")).toBe(0);
  });

  it("matchar som substring (delord)", () => {
    expect(scoreTitleMatch(["mouse"], "gaming-mouse-pad")).toBe(1);
  });

  it("returnerar 0 för tom query", () => {
    expect(scoreTitleMatch([], "vad som helst")).toBe(0);
  });
});

describe("classifyConfidence", () => {
  it("klassar trösklarna korrekt", () => {
    expect(classifyConfidence(0.9)).toBe("high");
    expect(classifyConfidence(0.6)).toBe("high");
    expect(classifyConfidence(0.59)).toBe("medium");
    expect(classifyConfidence(0.35)).toBe("medium");
    expect(classifyConfidence(0.34)).toBe("low");
    expect(classifyConfidence(0)).toBe("low");
  });
});
