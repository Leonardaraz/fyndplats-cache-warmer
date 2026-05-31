import { describe, expect, it } from "vitest";
import {
  hasFyndplatsImageUrl,
  hasUsablePrice,
  isAliExpressSourceUrl,
  isThinProductInput,
  looksLikeStoreCopy,
} from "./guard";

describe("looksLikeStoreCopy", () => {
  it("flags the exact contaminated homepage title from the 2026-05-31 bug", () => {
    expect(looksLikeStoreCopy("Fyndplats – Bästa Deals & Fynd Online")).toBe(true);
  });

  it("flags the contaminated homepage description", () => {
    expect(
      looksLikeStoreCopy(
        "Välkommen till Fyndplats – din destination för de bästa fynden på nätet!",
      ),
    ).toBe(true);
  });

  it("flags any text that mentions the store brand", () => {
    expect(looksLikeStoreCopy("<p>Köp hos Fyndplats idag</p>")).toBe(true);
  });

  it("does NOT flag a genuine product title/description", () => {
    expect(looksLikeStoreCopy("Smart Kroppsfettsvåg med Bluetooth och app")).toBe(false);
    expect(
      looksLikeStoreCopy(
        "<p>Mät vikt, kroppsfett och BMI med denna digitala badrumsvåg. Synkar via app.</p>",
      ),
    ).toBe(false);
  });

  it("treats empty/nullish as not store copy", () => {
    expect(looksLikeStoreCopy("")).toBe(false);
    expect(looksLikeStoreCopy(null)).toBe(false);
    expect(looksLikeStoreCopy(undefined)).toBe(false);
  });
});

describe("isThinProductInput", () => {
  it("flags empty and trivial titles (failed scrape)", () => {
    expect(isThinProductInput("")).toBe(true);
    expect(isThinProductInput("   ")).toBe(true);
    expect(isThinProductInput("AliExpress")).toBe(false); // 10 chars — boundary, not thin
    expect(isThinProductInput("Body Fat")).toBe(true); // 8 chars
  });

  it("does not flag a real product title", () => {
    expect(isThinProductInput("Smart Body Fat Scale Bluetooth Digital")).toBe(false);
  });
});

describe("hasFyndplatsImageUrl", () => {
  it("flags a fyndplats.se image (store logo leaked in)", () => {
    expect(hasFyndplatsImageUrl(["https://www.fyndplats.se/logo.png"])).toBe(true);
  });
  it("does not flag genuine alicdn images", () => {
    expect(hasFyndplatsImageUrl(["https://ae01.alicdn.com/a.jpg"])).toBe(false);
    expect(hasFyndplatsImageUrl([])).toBe(false);
    expect(hasFyndplatsImageUrl(undefined)).toBe(false);
  });
});

describe("hasUsablePrice", () => {
  it("true when an included variant has cost > 0", () => {
    expect(hasUsablePrice([{ costUsd: 20, included: true }])).toBe(true);
  });
  it("false when all included variants are zero-priced (failed scrape)", () => {
    expect(hasUsablePrice([{ costUsd: 0, included: true }])).toBe(false);
    expect(hasUsablePrice([{ costUsd: 0, included: true }, { costUsd: 5, included: false }])).toBe(false);
  });
  it("falls back to all variants when none are explicitly included", () => {
    expect(hasUsablePrice([{ costUsd: 12 }])).toBe(true);
    expect(hasUsablePrice([])).toBe(false);
    expect(hasUsablePrice(undefined)).toBe(false);
  });
});

describe("isAliExpressSourceUrl", () => {
  it("accepts a valid AliExpress product URL", () => {
    expect(isAliExpressSourceUrl("https://www.aliexpress.com/item/1005012298192440.html").ok).toBe(true);
  });

  it("rejects the store's own site", () => {
    expect(isAliExpressSourceUrl("https://www.fyndplats.se/").ok).toBe(false);
  });

  it("rejects empty/missing url", () => {
    expect(isAliExpressSourceUrl("").ok).toBe(false);
    expect(isAliExpressSourceUrl(undefined).ok).toBe(false);
  });
});
