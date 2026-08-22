// Titeln kapades mitt i ett ord (måleritältet 2026-08-18).
//
// Rå-importen namngav produkten "SucceBuy Inflatable Paint Booth Inflatable
// Spray Booth with Powerful B" — exakt 70 tecken, kapat mitt i "Blowers". Samma
// sträng hamnade i produktnamnet, seoTitle och og:title.

import { describe, expect, it } from "vitest";
import { truncateAtWord, clampSeo, buildFallbackSeo } from "./seo";
import type { AliExpressProduct } from "./types";

const RÅTITEL =
  "SucceBuy Inflatable Paint Booth Inflatable Spray Booth with Powerful Blowers and Air Filter System Portable Car Paint Booth";

describe("truncateAtWord", () => {
  it("kapar vid ordgräns i stället för mitt i ordet", () => {
    const ut = truncateAtWord(RÅTITEL, 70);
    expect(ut).toBe("SucceBuy Inflatable Paint Booth Inflatable Spray Booth with Powerful");
    expect(ut.length).toBeLessThanOrEqual(70);
    expect(ut.endsWith("Powerful B")).toBe(false);
  });

  it("lämnar korta strängar orörda", () => {
    expect(truncateAtWord("Kort titel", 70)).toBe("Kort titel");
    expect(truncateAtWord("Exakt", 5)).toBe("Exakt");
  });

  it("hängande skiljetecken följer inte med", () => {
    expect(truncateAtWord("Bänkugn 10 L, 750W, svart – med timer", 22)).toBe("Bänkugn 10 L, 750W");
    expect(truncateAtWord("Fläkt 100 mm - tyst modell", 14)).toBe("Fläkt 100 mm");
  });

  it("ett enda långt ord kapas hårt — hellre kort än tomt", () => {
    expect(truncateAtWord("Supercalifragilisticexpialidocious", 10)).toBe("Supercalif");
  });

  it("tål tom och saknad indata", () => {
    expect(truncateAtWord("", 70)).toBe("");
    expect(truncateAtWord(undefined as unknown as string, 70)).toBe("");
  });

  it("kapar aldrig bort mer än halva utrymmet för en ordgräns", () => {
    // "AAAA…" + " b": ordgränsen ligger på tecken 60 av 64 → använd den.
    // Ligger den för tidigt (t.ex. tecken 3 av 70) vore resultatet obrukbart.
    const s = "Ett " + "x".repeat(100);
    expect(truncateAtWord(s, 70).length).toBeGreaterThan(35);
  });
});

describe("rå-importens titel", () => {
  function produkt(): AliExpressProduct {
    return {
      supplierProductId: "1005007857803500",
      sourceUrl: "https://www.aliexpress.com/item/1005007857803500.html",
      rawTitle: RÅTITEL,
      rawDescription: "Uppblåsbar målerihall.",
      imageUrls: ["https://img.example/1.jpg"],
      variants: [],
    };
  }

  it("produktnamnet slutar inte mitt i ett ord", () => {
    const seo = buildFallbackSeo(produkt());
    expect(seo.title).toBe("SucceBuy Inflatable Paint Booth Inflatable Spray Booth with Powerful");
  });

  it("clampSeo kapar också vid ordgräns", () => {
    const ut = clampSeo(
      {
        title: RÅTITEL,
        metaDescription: RÅTITEL.repeat(3),
        descriptionHtml: "<p>x</p>",
        slug: "",
        suggestedCategory: "",
        imageAltTexts: [],
      },
      1,
    );
    expect(ut.title.endsWith("Powerful")).toBe(true);
    expect(ut.metaDescription.length).toBeLessThanOrEqual(160);
    expect(ut.metaDescription.endsWith(" ")).toBe(false);
  });
});
