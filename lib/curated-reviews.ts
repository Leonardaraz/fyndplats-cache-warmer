// Handplockade, ORDAGRANNA Google-omdömen — visas på /omdomen tills det
// officiella Business Profile-API:t (lib/google-reviews.ts) är aktiverat med
// credentials. Då tar API-datan automatiskt över (se app/omdomen/page.tsx).
//
// REGLER: lägg ENDAST in äkta omdömen, ordagrant, med kundens publika namn från
// Google. Hitta aldrig på text eller betyg. Trimma bara ev. avhuggen mening till
// sista hela mening (ändra inte orden). Lägg till fler i takt med skärmdumpar.
//
// Snittbetyg + totalantal hämtas från lib/social-proof.ts (samma sanningskälla
// som sidfot/startsida) så rubriken "4,9 · 27 omdömen" alltid stämmer; korten
// nedan är ett urval som kompletteras tills API:t är på.

import type { GoogleReview, GoogleReviewsResult } from "./google-reviews";
import { GOOGLE_RATING, GOOGLE_REVIEW_COUNT } from "./social-proof";

export const CURATED_REVIEWS: GoogleReview[] = [
  {
    id: "curated-orlando",
    rating: 5,
    author: "Orlando",
    date: "2026-05-30",
    text: "Beställde en projektor från Fyndplats och är väldigt nöjd med köpet. Vi använder den hemma till filmkvällar med barnen och bildkvaliteten är riktigt bra.",
  },
  {
    id: "curated-jonathan-hawsho",
    rating: 5,
    author: "Jonathan Hawsho",
    date: "2026-05-30",
    text: "Tack för hjälpen! Otroligt bra bemötande",
  },
];

export const CURATED_RESULT: GoogleReviewsResult = {
  count: GOOGLE_REVIEW_COUNT,
  average: Number(GOOGLE_RATING.replace(",", ".")) || null,
  reviews: CURATED_REVIEWS,
};
