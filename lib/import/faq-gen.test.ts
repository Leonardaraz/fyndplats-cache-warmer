import { describe, expect, it } from "vitest";
import { normalizeFaq } from "./faq-gen";

describe("faq-gen — normalizeFaq", () => {
  it("filtrerar bort ofullständiga poster och trimmar", () => {
    const r = normalizeFaq([
      { q: " Är den vattentät? ", a: " Ja. " },
      { q: "Saknar svar?" },
      { a: "Saknar fråga." },
      { q: "", a: "tom fråga" },
    ]);
    expect(r).toEqual([{ q: "Är den vattentät?", a: "Ja." }]);
  });

  it("kapar till max 7 FAQ", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ q: `Q${i}?`, a: `A${i}` }));
    expect(normalizeFaq(many)).toHaveLength(7);
  });

  it("tål undefined/icke-array", () => {
    expect(normalizeFaq(undefined)).toEqual([]);
  });
});
