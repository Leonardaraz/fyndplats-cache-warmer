import { describe, expect, it } from "vitest";
import { filterAndRankReviews, type AERReview } from "./review-import";

const NU = new Date("2026-09-23T12:00:00Z");
const TEXT = "Mycket bra produkt som motsvarar beskrivningen, lätt att montera och stabil.";

function rec(date: string | undefined, text = TEXT): AERReview {
  return { rating: 5, text, language: "de", hasImage: false, date };
}

describe("husets filter: datumgräns 2021", () => {
  it("slänger omdömen daterade före 2021", () => {
    const ut = filterAndRankReviews([rec("2020-12-31", `${TEXT} A`), rec("2019-01-01", `${TEXT} B`)], NU);
    expect(ut).toEqual([]);
  });

  it("behåller omdömen från 2021 och senare", () => {
    const ut = filterAndRankReviews([rec("2021-01-01", `${TEXT} A`), rec("2026-08-01", `${TEXT} B`)], NU);
    expect(ut).toHaveLength(2);
  });

  it("behåller omdömen utan datum", () => {
    expect(filterAndRankReviews([rec(undefined)], NU)).toHaveLength(1);
  });

  it("räddningssvepet för korta texter släpper inte heller in gamla omdömen", () => {
    const kort = "Sehr gut, gerne wieder, alles top!";
    expect(kort.length).toBeLessThan(50);
    expect(filterAndRankReviews([rec("2020-06-01", kort)], NU)).toEqual([]);
    expect(filterAndRankReviews([rec("2022-06-01", kort)], NU)).toHaveLength(1);
  });
});
