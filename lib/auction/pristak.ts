// lib/auction/pristak.ts
//
// PRISTAKET: inget fynd kostar mer än 2 000 kr i ordinarie pris.
// Ren logik, inga sidoeffekter.
//
// Leonard 2026-11-18: "kan du göra så fyndauktionen inte har grejer som är
// dyrare än 2000 kr". Taket gäller VARJE variant, inte bara den billigaste som
// kortet visar: en sida "från 1 499 kr" med en storlek för 2 899 kr hade annars
// sålt den dyra storleken till auktionspris.
//
// Taket prövas på två ställen, och båda behövs:
//
//   • Seeden (evaluateCandidate i seed.ts) tar varan ur urvalet. En köad eller
//     schemalagd rad över taket tas då bort (planSeed), före 07-starten.
//   • Ticken (tick.ts) främjar aldrig en rad över taket. Det täcker tiden
//     mellan driftsättningen och första seeden, och de AVSLUTADE raderna:
//     dem rör seeden inte, och ticken återvinner dem när kön sinar.
//
// Mätt 2026-11-18 (bara läsning i FyndplatsAuctions): 773 köade, 118 med någon
// variant över 2 000 kr. Kvar blir 655, och 19–29/11 tar cirka 440 (tio om
// dagen 19–22/11 och Black Weeks 400).

/** Högsta ordinarie pris för ett fynd, i kronor inklusive moms. Exakt 2 000 kr får vara med. */
export const AUKTION_PRISTAK_KR = 2000;

const ore = (kr: number) => Math.round(kr * 100);

/**
 * Kostar någon variant mer än taket? Raden kan vara en kandidat (bara
 * `variantPrices`), en rad med spår per variant, eller en äldre rad med bara
 * `listPrice`. Ett pris som inte är ett tal räknas inte: de andra grindarna
 * (kostnad, pris i Wix vid främjandet) tar en sådan rad.
 */
export function overPristak(
  a: { listPrice?: number; variantPrices?: ReadonlyArray<{ listPrice: number }> },
  takKr: number = AUKTION_PRISTAK_KR,
): boolean {
  const priser = a.variantPrices?.length ? a.variantPrices.map((t) => t.listPrice) : [a.listPrice ?? Number.NaN];
  return priser.some((p) => Number.isFinite(p) && ore(p) > ore(takKr));
}
