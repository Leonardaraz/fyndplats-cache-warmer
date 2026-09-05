// Enda sanningskälla för det SYNLIGA Google-betyget (sidfotens badge, startsidans
// trust-rader och /omdomen). Uppdatera HÄR när Google-betyget ändras — hårdkoda
// det inte i komponenterna (det har drivit isär förr: "21" på 6 ställen som
// missades vid uppdatering).
//
// ANTALET OMDÖMEN VISAS INTE NÅGONSTANS, med flit. Det var handavläst, och det
// betyder att det var sant precis den dagen någon läste av det. 2026-09-05 tog
// Google bort nio omdömen från profilen i ett av sina policysvep, och sajten
// stod kvar och påstod 38 tills Leonard råkade titta. Ett tal om den egna
// verksamheten som bara är sant mellan avläsningarna ska inte stå på sidan.
// Betyget stannar (det rör sig långsamt och länken till profilen gör det
// granskbart); räkneverket är borta. Vill vi ha tillbaka antalet är vägen att
// ge Business Profile-API:t sina credentials — inte att skriva in en ny siffra.
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
// Avläst på Google-profilen 2026-09-04. Handavläst tills Business Profile-API:t
// får credentials (lib/google-reviews.ts) — då tar det riktiga betyget över
// automatiskt och den här konstanten blir reserv.
export const GOOGLE_RATING = "4,9";

export interface SocialProof {
  /** Betyget som text med svensk decimalkomma, t.ex. "4,9". */
  rating: string;
  /** Samma betyg som tal, för stjärnor och AnimatedRating. */
  ratingValue: number;
  /** true = betyget kom från Google just nu, false = handavlästa reserven. */
  live: boolean;
}

/** 4.9 → "4,9". Ett värde utan decimaler får ändå en: 5 → "5,0". */
export function formatRating(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

export const FALLBACK_SOCIAL_PROOF: SocialProof = {
  rating: GOOGLE_RATING,
  ratingValue: Number(GOOGLE_RATING.replace(",", ".")),
  live: false,
};

/**
 * Väljer mellan Googles siffror och reserven.
 *
 * Antalet VISAS inte längre (se noten överst), men det läses fortfarande — som
 * grind. `count > 0` är kvittot på att profilen faktiskt svarade med data; ett
 * snittbetyg utan ett enda omdöme bakom sig är inget betyg.
 *
 * Fail-open: getGoogleReviews svarar `{count: 0, average: null}` både när env
 * saknas och när anropet failar. Båda ska ge reserven, inte ett tomt betyg.
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
    live: true,
  };
}
