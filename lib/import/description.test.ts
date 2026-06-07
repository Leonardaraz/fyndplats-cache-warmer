import { describe, it, expect } from "vitest";
import {
  needsDescriptionBackfill,
  sanitizeDescriptionHtml,
  descriptionToText,
  visibleDescriptionLength,
} from "./description";
import type { AliExpressProduct } from "./types";

function product(over: Partial<AliExpressProduct>): AliExpressProduct {
  return {
    supplierProductId: "1",
    sourceUrl: "https://www.aliexpress.com/item/1.html",
    rawTitle: "Test",
    rawDescription: "",
    imageUrls: [],
    variants: [],
    ...over,
  };
}

describe("needsDescriptionBackfill", () => {
  it("true när beskrivningen är tunn/tom", () => {
    expect(needsDescriptionBackfill(product({ rawDescription: "" }))).toBe(true);
    expect(needsDescriptionBackfill(product({ rawDescription: "Kort." }))).toBe(true);
    expect(needsDescriptionBackfill(product({ descriptionHtml: "<p>Liten</p>" }))).toBe(true);
  });
  it("false när det redan finns en rik beskrivning (≥200 synliga tecken)", () => {
    const rich = "A".repeat(250);
    expect(needsDescriptionBackfill(product({ descriptionHtml: `<p>${rich}</p>` }))).toBe(false);
    expect(visibleDescriptionLength(product({ rawDescription: rich }))).toBe(250);
  });
});

describe("sanitizeDescriptionHtml", () => {
  it("tar bort script/style/iframe + on*-handlers + javascript:", () => {
    const out = sanitizeDescriptionHtml(
      `<p onclick="x()">Hej</p><script>evil()</script><iframe src="x"></iframe><a href="javascript:alert(1)">l</a>`,
    );
    expect(out).not.toMatch(/script|iframe|onclick|javascript:/i);
    expect(out).toContain("Hej");
  });

  it("tar bort dropship-läckande ord men behåller resten + bilder", () => {
    const out = sanitizeDescriptionHtml(
      `<p>Tål vatten. Shipped from China by AliExpress (Shenzhen).</p><img src="https://x.alicdn.com/a.jpg">`,
    );
    expect(out).not.toMatch(/china|aliexpress|shenzhen/i);
    expect(out).toContain("Tål vatten.");
    expect(out).toContain("<img"); // bilden (den faktiska beskrivningen) följer med
  });

  it("kapar till maxLen", () => {
    const big = "<p>" + "x".repeat(20000) + "</p>";
    expect(sanitizeDescriptionHtml(big, 5000).length).toBe(5000);
  });

  it("returnerar tomt när inget meningsfullt blir kvar", () => {
    expect(sanitizeDescriptionHtml("")).toBe("");
    expect(sanitizeDescriptionHtml("<div>   </div>")).toBe("");
    expect(sanitizeDescriptionHtml("<script>only()</script>")).toBe("");
  });
});

describe("descriptionToText", () => {
  it("strippar taggar och normaliserar whitespace", () => {
    expect(descriptionToText("<p>Hej   <b>där</b></p>\n<p>igen</p>")).toBe("Hej där igen");
    expect(descriptionToText("a&nbsp;b")).toBe("a b");
  });
});
