// Urvalet till startsidans två ytor: hjälte-mosaiken och Veckans fynd.
//
// Bruten ur app/page.tsx 2026-08-19 av samma skäl som lib/rating.ts och
// lib/gallery-preload.ts: logiken satt inne i en serverkomponent och gick inte
// att testa utan en riktig Wix-nyckel (utan nyckel blir betygskartan tom och
// alla grenar ser likadana ut).
//
// REGELN, efter Leonards genomgång 2026-08-19: minst 2 av produkterna på varje
// yta ska ha omdömen — inte alla.
//
// Första försöket prioriterade betygsatta så hårt det gick, och alla fyra
// hjälte-brickorna blev "5,0 (1)". Fyra identiska ensamma omdömen ser inte ut
// som förtroende, det ser ut som en tunn butik.
//
// Mätt över samtliga 28 kategorisidor 2026-08-19 — 328 betygsatta kort:
//
//    1 omdöme   84 produkter      8–14 omdömen   22 produkter
//    2          73                  15–20         10
//    3–7       138                  29             1
//
// Alltså: en fjärdedel av de betygsatta har exakt ETT omdöme, och tar man dem
// i träffordning är det nästan alltid dem man får. Svansen finns — upp till 29
// — men den måste sökas upp aktivt.
//
// Två ändringar följer av det:
//   1. De reserverade platserna går till de BÄST recenserade, inte till de
//      först påträffade. Har någon 11 omdömen är det den som ska stå överst.
//   2. Bara `minRated` platser reserveras (default 2). Resten fylls som förut,
//      nyast-först — så nytt sortiment behåller sin exponering och raden får en
//      blandning i stället för fyra likadana pillar.
//
// Bakgrunden till att prioriteringen behövs alls: startsidan drivs av de 100
// senast skapade produkterna, och nya produkter är precis de som ännu inte
// hunnit få omdömen — 0 av 12 kort på startsidan hade betyg, mot 55 % i
// katalogen som helhet (281 av 510 kort över 28 kategorisidor).
//
// Ett HÅRT filter vore fortfarande fel: täckningen är ojämn per avdelning,
// 100 % i hudvård och dator/gaming men 12 % i trädgård & utemöbler och 17 % i
// hem & inredning. Just de avdelningarna bär de dyraste varorna, så ett filter
// hade tyst tömt startsidan på möbler och trädgård.
//
// BREDDEN MÅSTE VARA EXPLICIT (granskning 2026-08-19). Ett tidigt försök
// filtrerade bara mixByCategory-listan i två pass. Ordningen bevarades, men
// inte bredden: när bara ett par avdelningar har betygsatta produkter blir den
// filtrerade listan cat1[0], cat2[0], cat1[1], cat1[2]… och alla fyra brickorna
// kan hamna i samma två avdelningar — exakt den kollaps som var argumentet MOT
// det hårda filtret. Därför tar varje pass högst EN produkt per avdelning innan
// det tillåter en andra ur samma.

/** Minsta möjliga form — allt urvalet behöver veta om en produkt. */
export interface HeroCandidate {
  slug: string;
  /** Sätts av applyRatings till ett CardRating, annars odefinierad. */
  rating?: unknown;
}

function harBetyg(p: HeroCandidate): boolean {
  return !!p.rating;
}

/**
 * Antal omdömen, eller 0. Läser `count` ur CardRating utan att kräva typen —
 * fältet är medvetet `unknown` i HeroCandidate så anropare slipper importera
 * hela Product-typen hit.
 */
function antalOmdomen(p: HeroCandidate): number {
  const r = p.rating;
  if (!r || typeof r !== "object") return 0;
  const n = Number((r as { count?: unknown }).count);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Bäst recenserade först. Stabil — lika många omdömen behåller inbördes ordning. */
function bastRecenseradeForst<T extends HeroCandidate>(kandidater: T[]): T[] {
  return kandidater
    .map((p, i) => ({ p, i }))
    .sort((a, b) => antalOmdomen(b.p) - antalOmdomen(a.p) || a.i - b.i)
    .map((x) => x.p);
}

/**
 * Väljer `limit` produkter till hjälten.
 *
 * Passen i tur och ordning, tills platserna är fyllda:
 *   1. de `minRated` bäst recenserade ur pool + fallback, högst en per avdelning
 *   2. samma, oavsett avdelning                                 ← hellre stjärnor än bredd
 *   3. resten av poolen i sin egen ordning, högst en per avdelning
 *   4. samma, oavsett avdelning
 *   5. fallback, samma två steg
 *
 * Pass 1–2 fyller HÖGST `minRated` platser. Resten går till pass 3–5, som tar
 * produkterna i den ordning anroparen skickade dem (mixByCategory → nyast-först
 * inom varje avdelning). En produkt som råkar ha omdömen kan förstås hamna där
 * också — `minRated` är ett golv, inte ett tak.
 *
 * Konsekvensen är avsiktlig: hjälten blir "de N bäst recenserade + resten
 * nyast", inte "enbart nyast". Med `minRated: 0` beter den sig som förut.
 *
 * `keyOf` ger avdelningen. Utelämnad (eller tom sträng) → ingen breddspärr.
 *
 * Dubbletter på slug plockas bort över alla pass, så en produkt som finns både
 * i poolen och i fallbacken bara kan ta en plats.
 */
export function pickHero<T extends HeroCandidate>(
  pool: T[],
  fallback: T[] = [],
  limit = 4,
  keyOf: (p: T) => string = () => "",
  minRated = 2,
): T[] {
  const valda: T[] = [];
  const seddaSlugs = new Set<string>();
  const seddaAvdelningar = new Set<string>();

  const ta = (kandidater: T[], kravUnikAvdelning: boolean, tak: number) => {
    for (const p of kandidater) {
      if (valda.length >= tak) return;
      if (seddaSlugs.has(p.slug)) continue;
      const avdelning = keyOf(p);
      if (kravUnikAvdelning && avdelning && seddaAvdelningar.has(avdelning)) continue;
      valda.push(p);
      seddaSlugs.add(p.slug);
      if (avdelning) seddaAvdelningar.add(avdelning);
    }
  };

  // Pass 1–2: de reserverade betygsplatserna. Taket är `minRated`, aldrig `limit`.
  //
  // Kandidaterna hämtas ur POOLEN OCH reserv-listan tillsammans, sorterade på
  // antal omdömen. Ett första försök tittade bara i poolen (de 100 senaste) och
  // gick till reserven först när poolen inte räckte till golvet. Preview-deployen
  // visade vad det ger: hjälten fick "4,5 (2)" och "5,0 (1)" medan Veckans fynd
  // — som söker i hela katalogen — fick "4,9 (20)" och "5,0 (29)". Alltså tvärtom
  // mot vad ytorna är till för; hjälten ligger ovanför vikningen och är butikens
  // förtroende-shot. Ett ensamt omdöme där var hela ursprungsklagomålet.
  //
  // Poolen står först i den sammanslagna listan, så vid lika många omdömen
  // vinner den färska produkten.
  const betygstak = Math.min(minRated, limit);
  const medBetyg = bastRecenseradeForst([...pool, ...fallback].filter(harBetyg));
  ta(medBetyg, true, betygstak);
  ta(medBetyg, false, betygstak);

  // Pass 3–6: resten, i anroparens ordning — här styr nyast-först, inte betyg.
  ta(pool, true, limit);
  ta(pool, false, limit);
  ta(fallback, true, limit);
  ta(fallback, false, limit);
  return valda;
}

/**
 * Ser till att en FÄRDIGT ORDNAD lista (Veckans fynd) innehåller minst
 * `minRated` produkter med omdömen.
 *
 * Skiljer sig från pickHero med flit: här är ordningen redan bestämd av andra
 * krav — REA-fynden ska leda raden — så inget får sorteras om. I stället byts
 * de SISTA obetygsatta posterna ut mot de bäst recenserade kandidaterna. Raden
 * behåller sin längd, sin ledning och sin nyast-först-känsla.
 *
 * Byter aldrig ut en post som redan har omdömen, och lägger aldrig till en
 * produkt som redan finns i listan (slug). Saknas kandidater returneras listan
 * oförändrad — hellre en rad med färre stjärnor än en gles rad.
 */
export function ensureRated<T extends HeroCandidate>(
  picks: T[],
  candidates: T[],
  minRated = 2,
): T[] {
  const behov = minRated - picks.filter(harBetyg).length;
  if (behov <= 0) return picks;

  const finns = new Set(picks.map((p) => p.slug));
  const koa = bastRecenseradeForst(candidates.filter((p) => harBetyg(p) && !finns.has(p.slug)));
  if (koa.length === 0) return picks;

  const ut = [...picks];
  let kvar = behov;
  // Bakifrån: raden leds av REA-fynden och de nyaste, och de ska stå kvar.
  for (let i = ut.length - 1; i >= 0 && kvar > 0 && koa.length > 0; i--) {
    if (harBetyg(ut[i])) continue;
    ut[i] = koa.shift() as T;
    kvar--;
  }
  return ut;
}
