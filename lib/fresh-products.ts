// lib/fresh-products.ts
//
// Vilka produkter är NYA eller NYSS ÄNDRADE och bör värmas + aviseras nu?
// Ren funktion, ingen IO — därför enhetstestbar i node --test.
//
// VARFÖR DEN FINNS. Fram till nu aviserades en ny produkt till sökmotorerna
// enbart av veckosvepet (app/api/cron/indexnow-ping, måndag 03:00 UTC).
// lib/indexnow.ts exporterar `pingProductSlug` för realtidsavisering och
// kommentaren i cron-routen påstår att Wix-webhooken anropar den — men
// webhooken klassar bara order- och checkout-event (app/api/wix-webhook,
// `classify`), så funktionen var i praktiken död kod. En produkt som
// publicerades på en tisdag väntade alltså upp till sex dagar på sin avisering.
//
// Det spelar roll nu: 2 712 dolda Aosom-produkter (mätt mot Wix 2026-08-28)
// ska publiceras i omgångar. Utan realtidsavisering ligger varje omgång och
// väntar på nästa måndag.
//
// DESSUTOM VÄRMER VI SIDAN FÖRST. Uppmätt i produktion 2026-08-28: en
// produktsida utan cache-post svarar på 1,3–2,1 s, en varm på 0,2–0,6 s.
// Bara 40 produktsidor förbyggs (SSG_PREBUILD i app/produkt/[slug]/page.tsx),
// så en nypublicerad produkt är alltid kall — och den första hämtningen är
// Googlebots, den som avgör om sidan indexeras. Att rendera sidan en gång
// INNAN vi berättar att den finns gör den hämtningen 3–4× snabbare.
//
// VARFÖR updatedAt OCH INTE createdAt. Aosom-produkterna skapades 26–28
// augusti men blir synliga långt senare. createdAt rör sig inte när Leonard
// fäller synlighetsflaggan — updatedAt gör det. Fönstret fångar alltså
// "blev synlig nyss", inte "importerades nyss".

/** Minsta produktform vi behöver — matchar getProductSitemapEntries(). */
export type FarskProdukt = { slug: string; updatedAt: number };

export type FarskUrval = {
  /** Slugs att värma och avisera, nyast först. */
  slugs: string[];
  /** Hur många som låg i fönstret innan taket skar. */
  iFonstret: number;
  /** Hur många som klipptes bort av taket (0 = alla fick plats). */
  overTaket: number;
};

const TOMT: FarskUrval = { slugs: [], iFonstret: 0, overTaket: 0 };

/**
 * Produkter vars `updatedAt` ligger inom `fonsterMs` bakåt från `nuMs`.
 *
 * `tak` skär listan så en enda körning aldrig kan dra iväg: publicerar Leonard
 * 2 000 produkter på en gång värms de `tak` nyaste nu och resten av nästa
 * körning (fönstret är avsiktligt längre än cron-intervallet, så ingenting
 * faller mellan stolarna). Nyast först — det är de som Google inte sett alls.
 *
 * En produkt utan äkta `updatedAt` (0 eller negativt) räknas ALDRIG som färsk:
 * annars hade en katalog utan tidsstämplar aviserat allt vid varje körning.
 */
export function farskaProdukter(
  produkter: readonly FarskProdukt[],
  nuMs: number,
  fonsterMs: number,
  tak: number,
): FarskUrval {
  if (fonsterMs <= 0 || tak <= 0) return TOMT;
  const grans = nuMs - fonsterMs;
  const inom = produkter
    .filter((p) => p.slug && p.updatedAt > 0 && p.updatedAt >= grans && p.updatedAt <= nuMs)
    // Nyast först, sedan slug som stabil tie-break så ordningen inte kastar om
    // sig mellan körningar när flera produkter delar tidsstämpel (en bulk-
    // publicering ger många identiska updatedAt).
    .sort((a, z) => z.updatedAt - a.updatedAt || a.slug.localeCompare(z.slug));
  return {
    slugs: inom.slice(0, tak).map((p) => p.slug),
    iFonstret: inom.length,
    overTaket: Math.max(0, inom.length - tak),
  };
}
