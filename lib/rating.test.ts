import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatAverage,
  ratingSummary,
  reviewCountLabel,
  mapAggregateRows,
  applyRatings,
  ownReviewsHidden,
} from "./rating.ts";
import type { Product } from "./products.ts";

describe("formatAverage", () => {
  it("skriver svenskt decimalkomma", () => {
    assert.equal(formatAverage(4.72), "4,7");
    assert.equal(formatAverage(5), "5,0");
    assert.equal(formatAverage(3), "3,0");
  });

  it("klampar utanför skalan", () => {
    assert.equal(formatAverage(7), "5,0");
    assert.equal(formatAverage(-1), "0,0");
  });
});

describe("reviewCountLabel", () => {
  it("böjer räkneordet", () => {
    assert.equal(reviewCountLabel(1), "1 omdöme");
    assert.equal(reviewCountLabel(2), "2 omdömen");
    assert.equal(reviewCountLabel(0), "0 omdömen");
  });
});

describe("ratingSummary", () => {
  it("ger stjärnor, siffra och etikett", () => {
    assert.deepEqual(ratingSummary(14, 4.64), { stars: 5, value: "4,6", label: "14 omdömen" });
    assert.deepEqual(ratingSummary(1, 3.2), { stars: 3, value: "3,2", label: "1 omdöme" });
  });

  // Utan omdömen finns inget att visa — varken i pdp-huvudet eller i sektionen.
  it("returnerar null när det inte finns omdömen", () => {
    assert.equal(ratingSummary(0, null), null);
    assert.equal(ratingSummary(0, 4.5), null);
  });

  // Regressionsskydd: gamla koden föll tillbaka på 5 stjärnor när snittet
  // saknades, alltså toppbetyg utan täckning.
  it("hittar inte på ett betyg när snittet saknas", () => {
    assert.equal(ratingSummary(3, null), null);
    assert.equal(ratingSummary(3, Number.NaN), null);
  });
});

// --- Betyg på produktkorten -------------------------------------------------

function produkt(id: string): Product {
  return { id, slug: id, name: id } as unknown as Product;
}

describe("betyg på produktkorten", () => {
  it("mapAggregateRows ger stjärnor, svenskt komma och antal", () => {
    const m = mapAggregateRows([{ productId: "a", antal: 14, snitt: 4.71 }]);
    assert.deepEqual(m.a, { stars: 5, value: "4,7", count: 14 });
  });

  it("mapAggregateRows avrundar stjärnorna till närmaste heltal", () => {
    const m = mapAggregateRows([{ productId: "a", antal: 3, snitt: 4.4 }]);
    assert.equal(m.a.stars, 4);
    assert.equal(m.a.value, "4,4");
  });

  // Det viktiga fallet: aldrig ett betyg vi inte har täckning för.
  it("mapAggregateRows hoppar över rader utan snitt, utan omdömen eller utan id", () => {
    const m = mapAggregateRows([
      { productId: "utan-snitt", antal: 5 },
      { productId: "noll", antal: 0, snitt: 5 },
      { antal: 3, snitt: 5 },
    ]);
    assert.deepEqual(m, {});
  });

  it("mapAggregateRows klampar orimliga snitt till 0–5", () => {
    const m = mapAggregateRows([{ productId: "a", antal: 2, snitt: 9 }]);
    assert.equal(m.a.stars, 5);
    assert.equal(m.a.value, "5,0");
  });

  it("applyRatings rör inte produkter utan betyg", () => {
    const lista = [produkt("a"), produkt("b")];
    const ut = applyRatings(lista, { a: { stars: 5, value: "4,8", count: 9 } });
    assert.deepEqual(ut[0].rating, { stars: 5, value: "4,8", count: 9 });
    assert.equal(ut[1].rating, undefined);
    // Oförändrade produkter behåller sin referens.
    assert.equal(ut[1], lista[1]);
  });

  it("ownReviewsHidden följer Trustpilot-flaggan", () => {
    assert.equal(ownReviewsHidden({}), false);
    assert.equal(ownReviewsHidden({ TRUSTPILOT_BUSINESS_UNIT_ID: "  " }), false);
    assert.equal(ownReviewsHidden({ TRUSTPILOT_BUSINESS_UNIT_ID: "abc123" }), true);
  });
});
