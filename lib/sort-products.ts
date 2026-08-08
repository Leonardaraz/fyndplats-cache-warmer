// lib/sort-products.ts — sorteringsordningar för produktlistningarna.
//
// Designen (Leonard 2026-08-08: "det borde vara mer genomtänkt"):
//   • Nyast       = importdatum, fallande. Rakt av.
//   • Populärast  = sålda enheter (90 d, riktiga Wix-ordrar) fallande;
//                   lika många sålda → nyast först (nollsäljare ordnas alltså
//                   som "Nyast" — vettigt för en ung butik där de flesta
//                   produkter ännu inte hunnit sälja).
//   • Rekommenderat = butikens egen mix: bästsäljare väger tyngst
//                   (logaritmiskt — 10 sålda ska inte krossa allt annat),
//                   nyheter får en färskhets-skjuts som klingar av på ett par
//                   veckor (nya produkter måste synas för att kunna BLI
//                   populära), och REA-produkter en liten knuff. Determinis-
//                   tiskt och förklarbart — ingen magi.
//
// Rena komparatorer (enhetstestbara). Datumen kan komma som mikro- eller
// millisekunder (createdAt härleds ur Wix numericId = µs) → normalisera.

export interface SortableProduct {
  id?: string;
  createdAt?: number;
  popularity?: number;
  onSale?: boolean;
}

/** createdAt kan vara µs (Wix numericId) eller ms — normalisera till ms. */
export function createdAtMs(p: SortableProduct): number {
  const v = p.createdAt || 0;
  return v > 1e14 ? v / 1000 : v;
}

/** Stabil sista-instans-ordning så listan aldrig hoppar mellan renderingar. */
function tieBreak(a: SortableProduct, z: SortableProduct): number {
  return (z.createdAt || 0) - (a.createdAt || 0) || String(a.id ?? "").localeCompare(String(z.id ?? ""));
}

/** Populärast: sålda enheter fallande, sedan nyast. */
export function compareByPopularity(a: SortableProduct, z: SortableProduct): number {
  return (z.popularity ?? 0) - (a.popularity ?? 0) || tieBreak(a, z);
}

/**
 * Rekommenderat-poängen. `nowMs` skickas in (dag-upplösning i UI:t så server-
 * och klientrendering ger samma ordning — annars hydration-hopp vid midnatt).
 */
export function recommendedScore(p: SortableProduct, nowMs: number): number {
  const sold = Math.max(0, p.popularity ?? 0);
  const ageDays = Math.max(0, (nowMs - createdAtMs(p)) / 86_400_000);
  // log1p: 1 såld ≈ 2.1p, 5 ≈ 5.4p, 20 ≈ 9.1p — bästsäljare toppar utan att
  // en enda storsäljare låser listan för alltid.
  const popScore = 3 * Math.log1p(sold);
  // Färskhets-skjuts: 2p dag 0, ~1p efter 10 dagar, ~0 efter en månad.
  const newnessScore = 2 * Math.exp(-ageDays / 14);
  const saleScore = p.onSale ? 0.4 : 0;
  return popScore + newnessScore + saleScore;
}

/** Rekommenderat: poäng fallande, sedan stabil tie-break. */
export function compareByRecommended(nowMs: number) {
  return (a: SortableProduct, z: SortableProduct): number =>
    recommendedScore(z, nowMs) - recommendedScore(a, nowMs) || tieBreak(a, z);
}
