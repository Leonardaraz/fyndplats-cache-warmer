// Urvalet till startsidans hjälte-mosaik.
//
// Bruten ur app/page.tsx 2026-08-19 av samma skäl som lib/rating.ts och
// lib/gallery-preload.ts: logiken satt inne i en serverkomponent och gick inte
// att testa utan en riktig Wix-nyckel (utan nyckel blir betygskartan tom och
// alla grenar ser likadana ut).
//
// Regeln: MJUK prioritering av produkter som har omdömen — inte ett filter —
// OCH bredd över avdelningar.
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
//
// BREDDEN MÅSTE VARA EXPLICIT (granskning 2026-08-19). Ett första försök
// filtrerade bara mixByCategory-listan i två pass. Ordningen bevarades, men
// inte bredden: när bara ett par avdelningar har betygsatta produkter blir
// den filtrerade listan cat1[0], cat2[0], cat1[1], cat1[2]… och alla fyra
// brickorna kan hamna i samma två avdelningar — exakt den kollaps som var
// argumentet MOT det hårda filtret. Därför tar första passet högst EN produkt
// per avdelning.

/** Minsta möjliga form — allt urvalet behöver veta om en produkt. */
export interface HeroCandidate {
  slug: string;
  rating?: unknown;
}

/**
 * Väljer `limit` produkter till hjälten.
 *
 * Passen i tur och ordning, tills platserna är fyllda:
 *   1. med omdömen, högst en per avdelning   ← bredd + stjärnor
 *   2. med omdömen, oavsett avdelning        ← hellre stjärnor än bredd
 *   3. utan omdömen, högst en per avdelning
 *   4. utan omdömen, oavsett avdelning
 *   5. fallback (hela katalogen), samma två steg
 *
 * Ordningen INOM varje pass bevaras. Anroparen skickar in mixByCategory-ordnad
 * data, så nyast-först följer med — vi sorterar aldrig om.
 *
 * `keyOf` ger avdelningen. Utelämnad (eller tom sträng) → ingen breddspärr, och
 * funktionen beter sig som ren betygsprioritering.
 *
 * Dubbletter på slug plockas bort över alla pass, så en produkt som finns både
 * i poolen och i fallbacken bara kan ta en plats.
 */
export function pickHero<T extends HeroCandidate>(
  pool: T[],
  fallback: T[] = [],
  limit = 4,
  keyOf: (p: T) => string = () => "",
): T[] {
  const valda: T[] = [];
  const seddaSlugs = new Set<string>();
  const seddaAvdelningar = new Set<string>();

  const ta = (kandidater: T[], kravUnikAvdelning: boolean) => {
    for (const p of kandidater) {
      if (valda.length >= limit) return;
      if (seddaSlugs.has(p.slug)) continue;
      const avdelning = keyOf(p);
      if (kravUnikAvdelning && avdelning && seddaAvdelningar.has(avdelning)) continue;
      valda.push(p);
      seddaSlugs.add(p.slug);
      if (avdelning) seddaAvdelningar.add(avdelning);
    }
  };

  const medBetyg = pool.filter((p) => p.rating);
  const utanBetyg = pool.filter((p) => !p.rating);
  ta(medBetyg, true);
  ta(medBetyg, false);
  ta(utanBetyg, true);
  ta(utanBetyg, false);
  ta(fallback, true);
  ta(fallback, false);
  return valda;
}
