import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatAverage, ratingSummary, reviewCountLabel } from "./rating.ts";

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
