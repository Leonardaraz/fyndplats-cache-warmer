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

/**
 * Bygger länken till vår spårsida. Tomt spårnummer ger undefined så anroparen
 * kan utelämna fältet helt (Wix vägrar tomma strängar).
 */
export function sparningsLank(trackingNumber: string | null | undefined): string | undefined {
  const tn = String(trackingNumber ?? "").trim();
  if (!tn) return undefined;
  return `${SPARNING_BAS}?tn=${encodeURIComponent(tn)}`;
}
