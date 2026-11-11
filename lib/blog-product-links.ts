// lib/blog-product-links.ts
//
// Hittar produktlänkar i blogginnehåll som pekar på slugs katalogen inte längre
// har. Ren funktion, ingen IO — därför enhetstestbar i node --test.
//
// VARFÖR DEN FINNS. Blogginläggen (content/blog/*.md) länkar till produkter med
// hårdkodade slugs, både i brödtext och i produkt-embeds. När en produkt får ny
// slug eller tas bort ur katalogen märks det ingenstans: sidan renderar en länk
// som svarar 308 eller 404, och det upptäcks först i Search Console månader
// senare.
//
// MÄTT 2026-08-27, svep över alla 37 artiklar: fem döda länkar — en ren 404
// (peel-off-masken, produkten borttagen) och fyra som gick via 308 (två slugs
// hade bytt namn, två produkter var borta). Sitemap-krypningen i seo-health.ts
// kunde aldrig fånga dem: den kollar bara URL:er som ligger I sitemapen, och
// sitemapen var ren — alla 1 064 svarade 200.
//
// Det här blir värre, inte bättre: 5 000 nya produkter ur Aosom-flödet betyder
// fler slugbyten, och varje artikel som länkar fel läcker genomsökningsbudget
// (308) eller skickar besökaren i väggen (404).
//
// EN 308 RÄKNAS SOM FEL HÄR, med flit. Omdirigeringen räddar besökaren, men en
// intern länk ska peka på slutmålet — annars betalar varje genomsökning för ett
// extra hopp, och länkvärdet passerar en omdirigering i onödan.

/** En produktlänk i en artikel som inte matchar någon slug i katalogen. */
export type DodLank = {
  /** Artikelns slug (filnamnet utan .md). */
  artikel: string;
  /** Produkt-sluggen länken pekar på. */
  slug: string;
  /** Antal gånger den förekommer i artikeln. */
  antal: number;
};

/**
 * Alla produkt-slugs ett stycke innehåll länkar till.
 *
 * Matchar både markdown (`](/produkt/x)`) och renderad HTML (`href="/produkt/x"`),
 * så samma funktion kan användas på .md-källan och på en hämtad sida. Query och
 * fragment ignoreras; sluggen är allt fram till första tecknet som inte får ingå
 * i en slug.
 */
export function produktSlugsIInnehall(innehall: string): string[] {
  const ut: string[] = [];
  const re = /\/produkt\/([a-z0-9-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(innehall)) !== null) ut.push(m[1]);
  return ut;
}

/**
 * Alla kategori-slugs ett stycke innehåll länkar till (/kategori/<slug>), i
 * markdown eller renderad HTML. Query och fragment ignoreras.
 *
 * Bara VÅRA länkar räknas: en relativ adress (`](/kategori/x)`, `href="/kategori/x"`)
 * eller en hel adress på fyndplats.se. Många svenska sajter har också
 * /kategori/ i sina adresser, och en källhänvisning dit är ingen död länk hos
 * oss.
 *
 * ☠️ VARFÖR (2026-11-11). Halloweenguiden länkade till
 * /kategori/halloweendekoration. Efter säsongen var kategorin tom, och en tom
 * kategori skickar besökaren till /butik med 307: Semrush varnade för en
 * tillfällig omdirigering. Två andra guider länkade på tre ställen till en
 * kategori som bytt namn och svarade 308. Produktlänkarna hade en kontroll,
 * kategorilänkarna ingen.
 */
export function kategoriSlugsIInnehall(innehall: string): string[] {
  const ut: string[] = [];
  const re = /(?:(?<![\w.-])|(?<=fyndplats\.se))\/kategori\/([a-z0-9-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(innehall)) !== null) ut.push(m[1]);
  return ut;
}

/**
 * Artiklarnas kategorilänkar som inte finns i `levandeKategorier`.
 *
 * `levandeKategorier` ska vara sitemapens kategorier: de som finns och har
 * minst fem produkter (lib/category-threshold.ts). En kategori utanför den
 * mängden är tunn (sidan svarar 200 men är noindex), tom (307 till /butik),
 * omdöpt (308) eller borta (404). Ingen av dem ska en guide länka till. Tom
 * mängd ger inget svar, av samma skäl som för produkterna: då gick uppslaget
 * fel.
 */
export function dodaKategorilankar(
  artiklar: { slug: string; innehall: string }[],
  levandeKategorier: Set<string>,
): DodLank[] {
  return dodaLankar(artiklar, levandeKategorier, kategoriSlugsIInnehall);
}

/**
 * Artiklarnas produktlänkar som inte finns i `levandeSlugs`.
 *
 * `levandeSlugs` ska vara katalogens slugs — samma mängd sitemapen byggs av.
 * Är den tom returneras inget: en tom katalog betyder att uppslaget gick fel,
 * och då ska rapporten inte påstå att varenda länk är död.
 */
export function dodaProduktlankar(
  artiklar: { slug: string; innehall: string }[],
  levandeSlugs: Set<string>,
): DodLank[] {
  return dodaLankar(artiklar, levandeSlugs, produktSlugsIInnehall);
}

function dodaLankar(
  artiklar: { slug: string; innehall: string }[],
  levande: Set<string>,
  slugsI: (innehall: string) => string[],
): DodLank[] {
  if (levande.size === 0) return [];
  const ut: DodLank[] = [];
  for (const a of artiklar) {
    const antalPerSlug = new Map<string, number>();
    for (const s of slugsI(a.innehall)) {
      if (levande.has(s)) continue;
      antalPerSlug.set(s, (antalPerSlug.get(s) || 0) + 1);
    }
    for (const [slug, antal] of antalPerSlug) ut.push({ artikel: a.slug, slug, antal });
  }
  // Stabil ordning: artikel, sedan slug — så rapporten inte kastar om sig
  // mellan körningar och en diff blir läsbar.
  return ut.sort((a, b) => a.artikel.localeCompare(b.artikel) || a.slug.localeCompare(b.slug));
}

/** En död länk med sitt mål utskrivet, för rapportens lista. */
export type DodLankRad = { artikel: string; mal: string; antal: number };

/**
 * Produkt- och kategorilänkarna i en lista med målet som sökväg, i den ordning
 * rapporten visar dem: produkterna först, sedan kategorierna. Antalet ensamt
 * säger inte var man ska rätta.
 */
export function dodaLankRader(produkter: DodLank[], kategorier: DodLank[]): DodLankRad[] {
  return [
    ...produkter.map((l) => ({ artikel: l.artikel, mal: `/produkt/${l.slug}`, antal: l.antal })),
    ...kategorier.map((l) => ({ artikel: l.artikel, mal: `/kategori/${l.slug}`, antal: l.antal })),
  ];
}
