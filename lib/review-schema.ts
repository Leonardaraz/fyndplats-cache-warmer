// lib/review-schema.ts
//
// Avgör om produktsidan ska skicka aggregateRating + Review till Google.
//
// Bakgrund (2026-08-16): recensionerna på produktsidorna är AliExpress-köpares
// omdömen om SAMMA produkt, hämtade server-side och översatta. Att VISA dem för
// kunden är ett merchandising- och konsumentlagsbeslut (formuleringen under
// listan säger vad de är). Att skicka dem som strukturerad data är en annan
// sak: då lämnar vi ett maskinläsbart betygspåstående till Google.
//
// Googles riktlinjer för review snippets vill att betyg kommer direkt från
// sajtens egna användare, och pekar ut betyg som samlats in från andra sajter
// som något annat. Ett importerat AE-betyg är precis det. Nedsidan är begränsad
// -- Google tar bort stjärnorna, det påverkar inte rankningen -- men uppsidan
// (stjärnor i sökresultatet) är inte värd att hävda något vi inte kan stå för.
//
// Därför: texten visas, betyget skickas inte. Vinsten som faktiskt betyder
// något -- unik svensk brödtext på annars tunna produktsidor, plus social proof
// för konverteringen -- påverkas inte alls av den här grinden.
//
// Slå PÅ när recensionerna är förstahandsdata, alltså när Trustpilot Product
// Reviews (TRUSTPILOT_BUSINESS_UNIT_ID) eller egna kundrecensioner bär sidan.
// Sätt då PRODUCT_REVIEW_SCHEMA=on.

export type ReviewSchemaMode = "on" | "off";

/**
 * Läser switchen. Default AV — den säkra riktningen: att glömma slå på den
 * kostar stjärnor vi ändå inte får ha, att glömma slå av den vore ett påstående
 * vi inte kan backa.
 */
export function reviewSchemaMode(raw: string | undefined): ReviewSchemaMode {
  return (raw ?? "").trim().toLowerCase() === "on" ? "on" : "off";
}

/**
 * true när aggregateRating/Review får läggas i produktsidans JSON-LD.
 * `count`/`average` är samma värden som styr den synliga sektionen.
 */
export function shouldEmitReviewSchema(
  mode: ReviewSchemaMode,
  count: number,
  average: number | null,
): boolean {
  if (mode !== "on") return false;
  return count > 0 && average != null;
}
