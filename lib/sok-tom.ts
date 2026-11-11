// lib/sok-tom.ts
//
// Vad en sökning utan träff visar i stället för en återvändsgränd.
//
// MÄTT 2026-11-10 (auditen): söksidan utan träff var en mening och en länk,
// medan 404-sidan hade två knappar och sex kategorier. Av GA4:s 23 kundsökord
// gav flera noll träffar ("Homcom", "Grouw"). Nu visar sidan samma vägar som
// 404-sidan och fyra varor som säljer just nu.
//
// LÖVMODUL med flit, så att `node --test` kan ladda den.

export type Valbar = { slug: string; inStock: boolean; img?: string; priceNum?: number; popularity?: number; imageScore?: number; createdAt?: number };

/**
 * De `antal` varor som ska visas när sökningen inte gav något.
 *
 * Bara köpbara varor med bild och pris. Mest sålda först (popularity är sålda
 * enheter de senaste 90 dagarna); vid lika går bättre bild och sedan nyare vara
 * först, och sist sluggen så att ordningen är densamma varje gång.
 */
export function populartNu<T extends Valbar>(produkter: readonly T[], antal = 4): T[] {
  return produkter
    .filter((p) => p.inStock && Boolean(p.img) && (p.priceNum ?? 0) > 0)
    .sort(
      (a, b) =>
        (b.popularity ?? 0) - (a.popularity ?? 0)
        || (b.imageScore ?? 0) - (a.imageScore ?? 0)
        || (b.createdAt ?? 0) - (a.createdAt ?? 0)
        || a.slug.localeCompare(b.slug),
    )
    .slice(0, Math.max(0, antal));
}
