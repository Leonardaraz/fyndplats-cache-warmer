// lib/tracking-link.ts
//
// Spårlänken vi lägger på Wix-fulfillmenten.
//
// Wix genererar själv en länk när fraktbolaget är ett den känner igen ("ups",
// "postnord"). AliExpress svarar ofta med något helt annat — t.ex. "Seller
// Shipping ES Local" för EU-lagren — och då blir det INGEN länk alls. Uppmätt
// på order 10018 (2026-08-17): kunden fick Wix leveransbekräftelse utan ett
// enda sätt att följa paketet.
//
// Vi sätter därför alltid vår egen. Två vinster utöver att länken finns:
// sidan är på svenska, och den maskerar ursprunget — fraktbolagens egna
// spårsidor kan visa avsändarland och terminaler i Kina.

export const SPARNING_BAS = "https://www.fyndplats.se/sparning";

/** Wix tar högst 100 tecken i spårningsfältet (FulfillmentTrackingInfo.trackingNumber,
 *  maxLength 100 i Wix eget schema). */
export const WIX_SPARNINGSFALT_MAX = 100;

// Flera nummer i ett fält. Wix tar ett spårningsnummer per fulfillment och en
// fulfillment per artikelantal, och en fulfillment utan rader nekas. En vara
// som kommer i flera kartonger (order 10095, 2026-10-17: ett hantelset i två
// DPD-paket) får därför alla numren i samma fält, med komma emellan. Butiken
// delar upp fältet och skickar ett fraktmejl med alla nummer.
//
// ☠️ Samma regel står i butikens lib/fraktmejl-rader.ts (grenen headless-site).
// De två historierna kan inte dela kod, så regeln finns på båda ställena och
// måste stämma: dela på komma, semikolon och radbrytning, aldrig på mellanslag.

/**
 * Delar ett spårningsfält i nummer: på komma, semikolon och radbrytning,
 * aldrig på mellanslag, eftersom vissa bolags nummer innehåller mellanslag.
 * Trimmar, tar bort tomma och dubbletter och behåller ordningen.
 */
export function delaSparningsnummer(falt: string | null | undefined): string[] {
  const ut: string[] = [];
  for (const del of String(falt ?? "").split(/[,;\r\n]+/)) {
    const nummer = del.trim();
    if (nummer && !ut.includes(nummer)) ut.push(nummer);
  }
  return ut;
}

/**
 * Bygger länken till vår spårsida, för det första numret i fältet. Tomt
 * spårnummer ger undefined så anroparen kan utelämna fältet helt (Wix vägrar
 * tomma strängar).
 */
export function sparningsLank(trackingNumber: string | null | undefined): string | undefined {
  const tn = delaSparningsnummer(trackingNumber)[0];
  if (!tn) return undefined;
  return `${SPARNING_BAS}?tn=${encodeURIComponent(tn)}`;
}
