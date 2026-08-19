import { describe, expect, it } from "vitest";
import { REVIEW_FILTER, filterAndRankReviews, scoreReview } from "./review-import";

// Bakgrund (2026-08-19): Leonard hittade en femstjarnig recension med TVA foton
// och utforlig text som aldrig kom med. Orsaken var langdtaket pa 300 tecken —
// recensionen var 331. Den hade fatt 6,0 i rankningspoang, nara max, men
// kastades innan rankningen ens korde.

const LEONARDS =
  "Super satisfied! Big enough...very beautiful and in very good condition, " +
  "received very quickly! I can't really assess the quality yet since I just " +
  "received it, but I hope to have this house for a few years. Also very easy " +
  "to assemble by yourself. You don't need to be two people to build it. I was " +
  "able to make it all by myself. :-";

const nu = new Date("2026-08-19");
const rec = (text: string, extra: Record<string, unknown> = {}) => ({
  reviewIdAE: `id-${text.length}-${JSON.stringify(extra)}`,
  rating: 5,
  text,
  hasImage: true,
  customerCountry: "ES",
  date: "2026-05-30",
  ...extra,
});

describe("langdtaket", () => {
  it("slapper igenom recensionen som forut foll pa 31 tecken", () => {
    expect(LEONARDS.length).toBeGreaterThan(300);
    expect(LEONARDS.length).toBeLessThan(REVIEW_FILTER.maxLength);
    expect(filterAndRankReviews([rec(LEONARDS)], nu)).toHaveLength(1);
  });

  it("den ar hogt rankad — det var kvaliteten som fallde den", () => {
    // +3 foto, +1 Europa, +2 maxad textlangd.
    expect(scoreReview(rec(LEONARDS), nu)).toBeGreaterThanOrEqual(6);
  });

  it("taket ar hogre an det butikens EGNA kunder skriver i snitt", () => {
    // Inkonsekvensen som var mest talande: egna kunder far 2000 tecken
    // (TEXT_MAX), importerade kapades vid 300 — samma produktsida.
    expect(REVIEW_FILTER.maxLength).toBeGreaterThanOrEqual(1000);
  });

  it("men ett tak finns kvar mot vaggar av text", () => {
    const vagg = "a".repeat(REVIEW_FILTER.maxLength + 1);
    expect(filterAndRankReviews([rec(vagg)], nu)).toHaveLength(0);
  });

  it("undre gransen ar orord — enradiga 'bra!' slipper fortfarande inte in", () => {
    expect(filterAndRankReviews([rec("Bra vara!")], nu)).toHaveLength(0);
    expect(REVIEW_FILTER.minLength).toBe(50);
  });

  it("en lang recension rankas over en kort, allt annat lika", () => {
    const kort = rec("Bra produkt, fungerar precis som beskrivet och kom snabbt hem.");
    const lang = rec(LEONARDS);
    const ut = filterAndRankReviews([kort, lang], nu);
    expect(ut[0].text).toBe(LEONARDS);
  });
});
