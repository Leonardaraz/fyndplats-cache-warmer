import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FALLBACK_SOCIAL_PROOF,
  GOOGLE_RATING,
  formatRating,
  resolveSocialProof,
} from "./social-proof.ts";

// Bakgrund (2026-08-19): live-datan från Business Profile-API:t nådde bara
// recensionskorten på /omdomen. Betyget i sidfoten, på startsidan och i
// /omdomen-rubriken satt kvar på det handavlästa värdet i den här filen — att
// sätta credentials hade alltså sett ut att fungera medan tre av fyra ytor
// visade en frusen siffra. resolveSocialProof är den grind som fixar det.
//
// Antalet omdömen visas inte längre någonstans (2026-09-05, se noten överst i
// social-proof.ts), men count läses fortfarande som GRIND — därav att fallen
// nedan fortsätter mata in det.

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
      live: true,
    });
  });

  it("faller tillbaka när env saknas — getGoogleReviews svarar då EMPTY", () => {
    // Exakt formen på EMPTY i lib/google-reviews.ts. Det får ALDRIG ge ett
    // tomt eller nollställt betyg på sidan.
    assert.deepEqual(resolveSocialProof({ count: 0, average: null }), FALLBACK_SOCIAL_PROOF);
    assert.equal(FALLBACK_SOCIAL_PROOF.live, false);
    assert.equal(FALLBACK_SOCIAL_PROOF.rating, GOOGLE_RATING);
  });

  it("faller tillbaka på null/undefined utan att kasta", () => {
    assert.deepEqual(resolveSocialProof(null), FALLBACK_SOCIAL_PROOF);
    assert.deepEqual(resolveSocialProof(undefined), FALLBACK_SOCIAL_PROOF);
    assert.deepEqual(resolveSocialProof({}), FALLBACK_SOCIAL_PROOF);
  });

  it("allt-eller-inget: ett halvt svar blandas aldrig med reserven", () => {
    // count är grinden: ett snittbetyg utan ett enda omdöme bakom sig, eller
    // omdömen utan snitt, är inget svar — då gäller reserven.
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

  it("ett enda omdöme räcker som grind", () => {
    assert.deepEqual(resolveSocialProof({ count: 1, average: 5 }), {
      rating: "5,0",
      ratingValue: 5,
      live: true,
    });
  });

  it("resultatet bär inget antal — det ska inte gå att visa av misstag", () => {
    // Skyddar det som den här ändringen handlar om: ett handavläst antal som
    // stod kvar medan Google tog bort nio omdömen ur profilen.
    assert.deepEqual(Object.keys(FALLBACK_SOCIAL_PROOF).sort(), ["live", "rating", "ratingValue"]);
    assert.deepEqual(
      Object.keys(resolveSocialProof({ count: 41, average: 4.8 })).sort(),
      ["live", "rating", "ratingValue"],
    );
  });

  it("reserven är intern konsistent — rating och ratingValue säger samma sak", () => {
    assert.equal(
      FALLBACK_SOCIAL_PROOF.rating,
      formatRating(FALLBACK_SOCIAL_PROOF.ratingValue),
    );
  });
});
