// lib/category-threshold.ts
//
// EN REGEL för vad antalet produkter i en kategori får betyda. Sitemapen,
// kategorisidans robots-tagg och navigationen läser härifrån, så de kan inte
// säga olika saker om samma kategori.
//
// Bakgrunden är åtgärdslistans punkt 17: hellre färre starka kategorier än
// många nästan tomma. En kategori med en enda produkt är ingen kategori — det
// är en produktsida med extra steg, och den konkurrerar med den riktiga sidan
// i Googles index.
//
// MÄTT PÅ SKARP KATALOG 2026-09-10 (36 kategorier på /butik):
//
//   0 produkter      0 st
//   1–4 produkter    4 st   Mobiltillbehör (1), Pälsvård & Skötsel (1),
//                           Väskor & Necessärer (1), Mode & Accessoarer (3)
//   5–9 produkter    5 st   Laddare & Kablar, Hår & Rakning, Servering & Glas,
//                           Hudvård & Ansikte, Kropp & Välbefinnande
//   10+ produkter   27 st
//
// VARFÖR 5–9 INTE AUTO-NOINDEXAS: punkten säger uttryckligen "gör individuell
// bedömning och indexera bara om kategorin faktiskt fyller ett tydligt
// sökbehov". Det är ett omdöme, inte en tröskel. "Laddare & Kablar" har sex
// produkter och är ett självklart sökord; att tysta den automatiskt vore att
// fatta Leonards beslut åt honom. Bandet finns därför i typen men ändrar
// ingenting — det är till för att kunna lista dem åt honom.
//
// RÄKNINGEN måste komma från samma mängd som kategorisidan visar (forListings,
// alltså utan dolda slutsålda). Annars noindexar vi en kategori som ser full ut
// för kunden, eller tvärtom.

export type CategoryTier =
  /** 0 produkter — ingen sida att indexera. */
  | "tom"
  /** 1–4 — för tunn för att stå på egna ben. */
  | "tunn"
  /** 5–9 — Leonards bedömning; behandlas som full tills han säger annat. */
  | "bedom"
  /** 10+ — full SEO-kategori. */
  | "full";

export function categoryTier(count: number): CategoryTier {
  if (!Number.isFinite(count) || count <= 0) return "tom";
  if (count <= 4) return "tunn";
  if (count <= 9) return "bedom";
  return "full";
}

/** Får kategorin indexeras av sökmotorer? */
export function categoryIndexable(count: number): boolean {
  const t = categoryTier(count);
  return t === "bedom" || t === "full";
}

/** Ska kategorin ligga i sitemapen? Samma gräns som robots — annars ber vi
 *  Google hämta en sida vi samtidigt säger åt den att inte indexera. */
export function categoryInSitemap(count: number): boolean {
  return categoryIndexable(count);
}

/** Får kategorin vara HUVUDkategori i navigationen? */
export function categoryInMainNav(count: number): boolean {
  const t = categoryTier(count);
  return t === "bedom" || t === "full";
}
