import { describe, expect, it } from "vitest";
import { isProductGone } from "./store";

// Felsträngarna nedan är TAGNA UR VERKLIGA tick-rapporter (aug 2026) när tre
// raderade produkter höll sina slots som live-zombies — matchningen får inte
// driva ifrån vad applyVariantPatch/patchProductVariants faktiskt kastar.
describe("isProductGone", () => {
  it("känner igen 404 från patch-GET:en (enkel-pris-läget)", () => {
    expect(
      isProductGone(new Error('patch GET 404: {"message":"Entity not found","details":{"applicationError":{"code":"NOT_FOUND"}}}')),
    ).toBe(true);
  });

  it("känner igen 404 genom patchProductVariants-omslaget (per-variant-läget)", () => {
    expect(
      isProductGone(new Error('patchProductVariants patch GET 404: {"message":"Entity not found"}')),
    ).toBe(true);
  });

  it("släpper igenom transienta fel (5xx, rate limit, nätverk)", () => {
    expect(isProductGone(new Error("patch GET 500: internal error"))).toBe(false);
    expect(isProductGone(new Error("patch PATCH 428: precondition required"))).toBe(false);
    expect(isProductGone(new Error("saveAuction(x) 429: WDE0014"))).toBe(false);
    expect(isProductGone(new Error("fetch failed"))).toBe(false);
  });

  it("tål icke-Error-värden", () => {
    expect(isProductGone("patch GET 404: borta")).toBe(true);
    expect(isProductGone(undefined)).toBe(false);
  });
});
