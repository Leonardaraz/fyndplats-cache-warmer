// Urvalet till startsidans hjälte-mosaik.
//
// Bruten ur app/page.tsx 2026-08-19 av samma skäl som lib/rating.ts och
// lib/gallery-preload.ts: logiken satt inne i en serverkomponent och gick inte
// att testa utan en riktig Wix-nyckel (utan nyckel blir betygskartan tom och
// alla grenar ser likadana ut).
//
// Regeln: MJUK prioritering av produkter som har omdömen — inte ett filter.
//
// Bakgrunden är mätt, inte gissad. Startsidan drivs av de 100 senast skapade
// produkterna, och nya produkter är precis de som ännu inte hunnit få omdömen:
// 0 av 12 produkter på startsidan hade betyg, mot 55 % i katalogen som helhet
// (281 av 510 kort över 28 kategorisidor, 2026-08-19).
//
// Ett HÅRT filter vore fel, för täckningen är ojämn per avdelning: 100 % i
// hudvård och dator/gaming, men 12 % i trädgård & utemöbler och 17 % i hem &
// inredning. Just de avdelningarna bär de dyraste varorna. Ett filter hade
// alltså tyst tömt hjälten på möbler och trädgård.

/** Minsta möjliga form — allt urvalet behöver veta om en produkt. */
export interface HeroCandidate {
  slug: string;
  rating?: unknown;
}

/**
 * Väljer `limit` produkter till hjälten: först de som har omdömen, sedan resten
 * som reserv, och sist `fallback` om poolen inte räcker till.
 *
 * Ordningen INOM varje pass bevaras. Anroparen skickar in mixByCategory-ordnad
 * data, så bredden över avdelningar och nyast-först följer med — vi sorterar
 * aldrig om, vi delar bara upp i två pass.
 *
 * Dubbletter på slug plockas bort över alla pass, så en produkt som finns både
 * i poolen och i fallbacken bara kan ta en plats.
 */
export function pickHero<T extends HeroCandidate>(
  pool: T[],
  fallback: T[] = [],
  limit = 4,
): T[] {
  const valda: T[] = [];
  const sedda = new Set<string>();
  const passen = [
    pool.filter((p) => p.rating),
    pool.filter((p) => !p.rating),
    fallback,
  ];
  for (const pass of passen) {
    for (const p of pass) {
      if (valda.length >= limit) return valda;
      if (sedda.has(p.slug)) continue;
      valda.push(p);
      sedda.add(p.slug);
    }
  }
  return valda;
}
