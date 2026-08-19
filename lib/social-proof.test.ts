import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FALLBACK_SOCIAL_PROOF,
  GOOGLE_RATING,
  GOOGLE_REVIEW_COUNT,
  formatRating,
  resolveSocialProof,
  reviewsLabel,
} from "./social-proof.ts";

// Bakgrund (2026-08-19): live-datan från Business Profile-API:t nådde bara
// recensionskorten på /omdomen. Antalet i sidfoten, på startsidan och i
// /omdomen-rubriken satt kvar på det handavlästa värdet i den här filen — att
// sätta credentials hade alltså sett ut att fungera medan tre av fyra ytor
// visade en frusen siffra. resolveSocialProof är den grind som fixar det.

describe("reviewsLabel", () => {
  it("böjer svenskan rätt i singular", () => {
    assert.equal(reviewsLabel(1), "1 omdöme");
  });

  it("plural för allt annat", () => {
    assert.equal(reviewsLabel(0), "0 omdömen");
    assert.equal(reviewsLabel(33), "33 omdömen");
  });
});

describe("formatRating", () => {
  it("svensk decimalkomma med exakt en decimal", () => {
    assert.equal(formatRating(4.9), "4,9");
    assert.equal(formatRating(5), "5,0");
  });

  it("avrundar till en decimal", () => {
    assert.equal(formatRating(4.86), "4,9");
    assert.equal(formatRating(4.84), "4,8");
  });
});

describe("resolveSocialProof", () => {
  it("använder Googles siffror när de finns", () => {
    const p = resolveSocialProof({ count: 41, average: 4.8 });
    assert.deepEqual(p, {
      rating: "4,8",
      ratingValue: 4.8,
      count: 41,
      label: "41 omdömen",
      live: true,
    });
  });

  it("faller tillbaka när env saknas — getGoogleReviews svarar då EMPTY", () => {
    // Exakt formen på EMPTY i lib/google-reviews.ts. Det får ALDRIG bli
    // "0 omdömen" på sidan; det ser ut som att butiken inte har några.
    assert.deepEqual(resolveSocialProof({ count: 0, average: null }), FALLBACK_SOCIAL_PROOF);
    assert.equal(FALLBACK_SOCIAL_PROOF.live, false);
    assert.equal(FALLBACK_SOCIAL_PROOF.count, GOOGLE_REVIEW_COUNT);
    assert.equal(FALLBACK_SOCIAL_PROOF.rating, GOOGLE_RATING);
  });

  it("faller tillbaka på null/undefined utan att kasta", () => {
    assert.deepEqual(resolveSocialProof(null), FALLBACK_SOCIAL_PROOF);
    assert.deepEqual(resolveSocialProof(undefined), FALLBACK_SOCIAL_PROOF);
    assert.deepEqual(resolveSocialProof({}), FALLBACK_SOCIAL_PROOF);
  });

  it("allt-eller-inget: ett halvt svar blandas aldrig med reserven", () => {
    // Ett live-ANTAL ihop med ett handavläst SNITT vore en siffra som inte
    // finns någonstans — varken hos oss eller hos Google.
    assert.deepEqual(resolveSocialProof({ count: 41, average: null }), FALLBACK_SOCIAL_PROOF);
    assert.deepEqual(resolveSocialProof({ count: 0, average: 4.8 }), FALLBACK_SOCIAL_PROOF);
  });

  it("avvisar orimliga betyg i stället för att visa dem", () => {
    assert.deepEqual(resolveSocialProof({ count: 10, average: 7 }), FALLBACK_SOCIAL_PROOF);
    assert.deepEqual(resolveSocialProof({ count: 10, average: -1 }), FALLBACK_SOCIAL_PROOF);
    assert.deepEqual(resolveSocialProof({ count: -5, average: 4.9 }), FALLBACK_SOCIAL_PROOF);
  });

  it("avvisar NaN från ett trasigt svar", () => {
    assert.deepEqual(
      resolveSocialProof({ count: Number("x"), average: 4.9 }),
      FALLBACK_SOCIAL_PROOF,
    );
  });

  it("ett enda live-omdöme böjs rätt", () => {
    assert.equal(resolveSocialProof({ count: 1, average: 5 }).label, "1 omdöme");
  });

  it("reserven är intern konsistent — rating och ratingValue säger samma sak", () => {
    assert.equal(
      FALLBACK_SOCIAL_PROOF.rating,
      formatRating(FALLBACK_SOCIAL_PROOF.ratingValue),
    );
    assert.equal(FALLBACK_SOCIAL_PROOF.label, reviewsLabel(FALLBACK_SOCIAL_PROOF.count));
  });
});
