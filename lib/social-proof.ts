// Enda sanningskälla för det SYNLIGA Google-betyget (sidfotens badge, startsidans
// trust-rader och /omdomen). Uppdatera HÄR när Google-betyget eller antalet
// omdömen ändras — hårdkoda det inte i komponenterna (det har drivit isär förr:
// "21" på 6 ställen som missades vid uppdatering).
//
// VIKTIGT: detta är ENDAST synlig text. Lägg INTE in det som `aggregateRating`
// i JSON-LD på butiks-/Organization-entiteten — det är ett "self-serving rating"
// som Googles riktlinjer förbjuder (kan ge manuell åtgärd). Äkta produktbetyg
// ligger på produktsidorna och byggs från riktig recensionsdata.
//
// Konstanterna nedan är RESERVEN. När Business Profile-API:t svarar tar de
// riktiga siffrorna över överallt via getSocialProof() i social-proof-live.ts.
// Det gjorde de INTE fram till 2026-08-19: live-datan nådde bara
// recensionskorten på /omdomen, medan antalet i sidfoten, på startsidan och i
// /omdomen-rubriken satt kvar på det handavlästa värdet. Att sätta credentials
// hade alltså sett ut att fungera medan tre av fyra ytor ljög.
//
// Den här filen hålls REN (inga fetch-anrop, inga next-beroenden) så urvals-
// regeln går att testa med `node --test`. Hämtningen bor i social-proof-live.ts.
export const GOOGLE_RATING = "4,9";
// Avläst på Google-profilen 2026-08-19: 4,9 · 33 recensioner.
export const GOOGLE_REVIEW_COUNT = 33;
export const GOOGLE_REVIEWS_LABEL = `${GOOGLE_REVIEW_COUNT} omdömen`;

export interface SocialProof {
  /** Betyget som text med svensk decimalkomma, t.ex. "4,9". */
  rating: string;
  /** Samma betyg som tal, för stjärnor och AnimatedRating. */
  ratingValue: number;
  /** Totalt antal omdömen på profilen, även de stjärn-bara. */
  count: number;
  /** Färdig etikett: "33 omdömen", "1 omdöme". */
  label: string;
  /** true = siffrorna kom från Google just nu, false = handavlästa reserven. */
  live: boolean;
}

/** 4.9 → "4,9". Ett värde utan decimaler får ändå en: 5 → "5,0". */
export function formatRating(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

/** Svensk pluralform — "1 omdöme" men "33 omdömen". */
export function reviewsLabel(count: number): string {
  return `${count} ${count === 1 ? "omdöme" : "omdömen"}`;
}

export const FALLBACK_SOCIAL_PROOF: SocialProof = {
  rating: GOOGLE_RATING,
  ratingValue: Number(GOOGLE_RATING.replace(",", ".")),
  count: GOOGLE_REVIEW_COUNT,
  label: GOOGLE_REVIEWS_LABEL,
  live: false,
};

/**
 * Väljer mellan Googles siffror och reserven.
 *
 * ALLT-ELLER-INGET med flit: ett live-antal ihop med ett handavläst snittbetyg
 * vore en siffra som inte finns någonstans. Saknas eller är någon av dem
 * orimlig faller hela paret tillbaka, så de två alltid hör ihop.
 *
 * Fail-open: getGoogleReviews svarar `{count: 0, average: null}` både när env
 * saknas och när anropet failar. Båda ska ge reserven, inte "0 omdömen".
 */
export function resolveSocialProof(
  live: { count?: number | null; average?: number | null } | null | undefined,
): SocialProof {
  const count = Number(live?.count);
  const average = Number(live?.average);
  const giltigt =
    Number.isFinite(count) && count > 0 && Number.isFinite(average) && average > 0 && average <= 5;
  if (!giltigt) return FALLBACK_SOCIAL_PROOF;
  return {
    rating: formatRating(average),
    ratingValue: average,
    count,
    label: reviewsLabel(count),
    live: true,
  };
}
