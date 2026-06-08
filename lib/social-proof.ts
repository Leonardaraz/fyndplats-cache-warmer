// Enda sanningskälla för det SYNLIGA Google-betyget (sidfotens badge, startsidans
// trust-rader och /omdomen). Uppdatera HÄR när Google-betyget eller antalet
// omdömen ändras — hårdkoda det inte i komponenterna (det har drivit isär förr:
// "21" på 6 ställen som missades vid uppdatering).
//
// VIKTIGT: detta är ENDAST synlig text. Lägg INTE in det som `aggregateRating`
// i JSON-LD på butiks-/Organization-entiteten — det är ett "self-serving rating"
// som Googles riktlinjer förbjuder (kan ge manuell åtgärd). Äkta produktbetyg
// ligger på produktsidorna och byggs från riktig recensionsdata.
export const GOOGLE_RATING = "4,9";
export const GOOGLE_REVIEW_COUNT = 23;
export const GOOGLE_REVIEWS_LABEL = `${GOOGLE_REVIEW_COUNT} omdömen`;
