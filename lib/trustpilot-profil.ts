// lib/trustpilot-profil.ts
//
// Fyndplats profil på Trustpilot och widgetarnas mall-ID. LÖVMODUL utan
// "use client", testad i lib/trustpilot-profil.test.ts.
//
// Uppgifterna är publika: ID:t står i varje Trustpilot-widget. Det lästes ur
// Trustpilots egen widgetserver 2026-10-22
// (widget.trustpilot.com/trustbox-data/<mall>?businessUnitId=<id>), som svarade
// med fyndplats.se och tio omdömen.
//
// Gratisdelen (insamlingsknappen och länken på /omdomen) läser ID:t HÄRIFRÅN,
// inte ur TRUSTPILOT_BUSINESS_UNIT_ID. Den variabeln slår på de betalda
// widgetarna: med den satt döljer produktsidorna och listningarnas kort våra
// egna omdömen (lib/rating.ts, ownReviewsHidden), och sidfoten och produktsidan
// visar widgetar som gratiskontot inte har tillgång till. Sätt den bara med en
// betald plan.
//
// Mall-ID:na bor här och inte i components/trustpilot.tsx. Den filen är en
// klientmodul, och i en serverkomponent är en export från en klientmodul en
// klientreferens, inte värdet. SiteFooter läste TRUSTBOX_TEMPLATES.mini
// därifrån, så sidfotens widget hade fått fel mall-ID (eller kastat fel,
// beroende på hur modulen kompileras) så snart variabeln satts.

export const TRUSTPILOT_PROFIL_ID = "6a96aff0aab12caba2586a70";

/** Profilen, där omdömena går att läsa. Samma adress som Trustpilots widgetdata anger. */
export const TRUSTPILOT_PROFIL_URL = "https://se.trustpilot.com/review/fyndplats.se";

/** Sidan där kunden skriver sitt omdöme. */
export const TRUSTPILOT_OMDOME_URL = "https://se.trustpilot.com/evaluate/fyndplats.se";

// Publika mall-ID:n, samma för alla konton: de anger widgetens typ, och vårt
// konto pekas ut av TRUSTPILOT_PROFIL_ID. Vad gratiskontot får visa är mätt mot
// widgetservern 2026-10-22: reviewCollector svarade 200, mini svarade 400
// "BusinessUnit does not have access to that trustbox".
export const TRUSTBOX_TEMPLATES = {
  /** "Lämna ett omdöme om oss på Trustpilot". Ingår i gratiskontot. Omdömessidan. */
  reviewCollector: "56278e9abfbbba0bdcd568bc",
  /** Mini: stjärnbetyg, "Trustpilot" och antal omdömen. Kräver betald plan. Sidfoten. */
  mini: "53aa8807dec7e10d38f59f32",
  /** Product Reviews: omdömen för en viss produkt (data-sku). Kräver betald plan. */
  productReviews: "544a06dd00006400057a5b32",
} as const;
