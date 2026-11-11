// lib/katalog-alder.ts
//
// Hur gammal katalogen i minnet får bli för flödena, sitemapen och sökindexet.
//
// ☠️ getProducts() håller katalogen så länge instansen lever, och en instans
// med jämn trafik lever i många timmar. Sitemapen och flödena byggdes om varje
// timme, men ur samma lista: MÄTT 2026-11-10 visade sitemapen, Google-flödet
// och produktflödet katalogen från deployen ett dygn tidigare. 151 varor hade
// gårdagens pris, dagens 15 nya varor saknades, och en vara som bytt adress
// stod kvar med den gamla (Semrush: "fel sida i sitemapen").
//
// Sidorna drabbas inte på samma sätt: produktsidan läser sin vara direkt ur
// Wix, och listsidorna byggs om på många instanser. Därför förnyas katalogen
// bara av det som byggs i bakgrunden (flöden, sitemap, sökindex), där ingen
// kund väntar på de 10–25 sekunder en hämtning tar.
//
// LÖVMODUL med flit, så att `node --test` kan ladda den.

/** Äldre än så hämtas katalogen om innan ett flöde eller sitemapen byggs. */
export const KATALOG_FARSK_MS = 60 * 60 * 1000;

/** Ska katalogen hämtas om? `hamtadMs` 0 betyder att den aldrig hämtats. */
export function forGammal(hamtadMs: number, nuMs: number, maxAlderMs: number): boolean {
  if (!(hamtadMs > 0)) return true;
  return nuMs - hamtadMs > maxAlderMs;
}

/**
 * Vilken katalog instansen ska behålla efter en förnyelse.
 *
 * En hel ny lista ersätter alltid den gamla. En kapad hämtning eller
 * reservlistan ersätter ALDRIG en hel gammal lista: en dag gammal katalog är
 * bättre i ett flöde än tre reservprodukter eller en katalog där 60 varor
 * saknas (Google tar bort det som saknas).
 */
export function behallNy(nyArDegraderad: boolean): boolean {
  return !nyArDegraderad;
}
