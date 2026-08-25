import { describe, expect, it } from "vitest";
import { REVIEW_FILTER, REVIEW_RESCUE_MIN_LENGTH, filterAndRankReviews } from "./review-import";

// Bakgrund (2026-08-25): 432 av 908 publicerade produktsidor visade noll
// recensioner. Mätt over nio verkliga AliExpress-listningar foll 38 % av allt
// ramaterial pa langdgolvet (50 tecken) — och for en produkt vars ENDA
// recensioner ar korta blev resultatet en tom sida. Raddningssvepet sanker
// golvet till 25, men BARA nar forsta svepet gav noll.

const nu = new Date("2026-08-25");

const rec = (id: string, text: string, extra: Record<string, unknown> = {}) => ({
  reviewIdAE: id,
  rating: 5,
  text,
  hasImage: false,
  customerCountry: "ES",
  date: "2026-08-01",
  ...extra,
});

// 30 tecken: under golvet 50, over raddningsgolvet 25.
const KORT = "Snygg och stadig, mycket bra";
// 60 tecken: klarar det vanliga golvet.
const LANG = "Mycket bra kvalitet for pengarna och gick snabbt att montera";

describe("raddningssvepet", () => {
  it("KORT ligger mellan raddningsgolvet och det vanliga golvet", () => {
    expect(KORT.length).toBeGreaterThanOrEqual(REVIEW_RESCUE_MIN_LENGTH);
    expect(KORT.length).toBeLessThan(REVIEW_FILTER.minLength);
    expect(LANG.length).toBeGreaterThanOrEqual(REVIEW_FILTER.minLength);
  });

  it("raddar korta recensioner nar alternativet ar en tom produktsida", () => {
    const ut = filterAndRankReviews([rec("a", KORT), rec("b", `${KORT} igen`)], nu);
    expect(ut).toHaveLength(2);
  });

  it("sanker INTE golvet nar nagot klarade 50 tecken", () => {
    const ut = filterAndRankReviews([rec("a", KORT), rec("b", LANG)], nu);
    expect(ut.map((r) => r.reviewIdAE)).toEqual(["b"]);
  });

  it("river inte ett golv anroparen valt sjalv", () => {
    // Ett uttryckligt golv ar ett beslut — svepet som letar upp det ett gammalt
    // filter slangde far inte tyst falla tillbaka till 25.
    const ut = filterAndRankReviews([rec("a", KORT)], nu, { minLength: 200 });
    expect(ut).toHaveLength(0);
  });

  it("raddar aldrig forbi de andra spärrarna", () => {
    const ut = filterAndRankReviews(
      [
        rec("lagt-betyg", KORT, { rating: 2 }),
        rec("for-kort", "Bra vara"),
        rec("utlandsleverans", "Kom snabbt till Tjeckien, allt bra"),
      ],
      nu,
    );
    expect(ut).toHaveLength(0);
  });

  it("respekterar taket aven i raddningssvepet", () => {
    const manga = Array.from({ length: 12 }, (_, i) => rec(`r${i}`, `${KORT} nummer ${i}`));
    expect(filterAndRankReviews(manga, nu, { max: 3 })).toHaveLength(3);
  });
});
