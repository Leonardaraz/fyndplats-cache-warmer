// lib/interna-lankar.ts
//
// Länkarna i en produkttext ska peka på sidan, inte på en omdirigering.
//
// VARFÖR DEN FINNS. Poleringen skriver "Passar inte den här?" och "Fler …" med
// länkar i Wix adressform, https://www.fyndplats.se/product-page/<slug>.
// Butiken har produkterna på /produkt/<slug>, och next.config.ts skickar den
// gamla formen dit med 308. Länken fungerar alltså, men varje klick och varje
// genomsökning betalar ett extra hopp, och målsidan räknas inte som länkad.
//
// MÄTT 2026-11-11. Semrush: 600 interna länkar till en permanent omdirigering,
// och 5 869 sidor med bara en intern länk till sig. Ett stickprov på 300
// produktsidor: 14 hade sådana länkar, 39 länkar. Samma regel som
// lib/blog-product-links.ts har för blogginläggen: en 308 räknas som fel.
//
// LÖVMODUL med flit, så att `node --test` kan ladda den.

/** Värden som är butiken själv. Allt annat är en extern länk och lämnas. */
const VARD = String.raw`(https?:\/\/(?:www\.)?fyndplats\.se)?`;

/**
 * href="…/product-page/<slug>" med en slug i butikens form (a–z, 0–9, bindestreck).
 * En slug med å, ä, ö eller procentkodning hör till den gamla Wix-sajten och har
 * egna regler i next.config.ts, så den lämnas orörd.
 */
const WIX_LANK = new RegExp(
  String.raw`(href\s*=\s*)(["'])${VARD}\/product-page\/([a-z0-9][a-z0-9-]*)\/?((?:[?#][^"']*)?)\2`,
  "g",
);

/**
 * Skriver om produkttextens länkar från /product-page/<slug> till /produkt/<slug>.
 *
 * `undantag` svarar sant för en slug som INTE ska skrivas om: de gamla
 * Wix-produkterna i data/legacy-wix-redirects.json går till en kategori, och
 * /produkt/<slug> för dem är en 404.
 *
 * En länk med värd behåller en värd (alltid https://www.fyndplats.se), en
 * relativ länk förblir relativ. Fråga och ankare följer med.
 */
export function rattaProduktlankar(html: string, undantag: (slug: string) => boolean = () => false): string {
  if (!html || !html.includes("/product-page/")) return html;
  return html.replace(WIX_LANK, (hel: string, href: string, citat: string, vard: string | undefined, slug: string, svans: string) => {
    if (undantag(slug)) return hel;
    return `${href}${citat}${vard ? "https://www.fyndplats.se" : ""}/produkt/${slug}${svans}${citat}`;
  });
}

/** Antal länkar i texten som fortfarande går till /product-page/. För loggar och prov. */
export function raknaWixLankar(html: string): number {
  return (html.match(/href\s*=\s*["'][^"']*\/product-page\//g) || []).length;
}

// ── Länkar till produkter som har flyttat ─────────────────────────────────────
//
// ☠️ VARFÖR (2026-11-11). Poleringen skriver "Passar inte den här?" med länkar
// till syskonen: "Samma vagn i svart". När syskonen senare slås ihop till en sida
// med färgval, eller får en ny adress, står länken kvar i texten i Wix och går
// till en omdirigering. Semrush fann 166 sådana länkar mellan produktsidor, och
// tolv av tolv stickprov stod kvar i sidornas HTML samma dag. Länken fungerar,
// men varje klick och varje genomsökning betalar ett extra hopp, och målsidan
// räknas inte som länkad.
//
// Texten i Wix rörs inte: produkttexter ändras bara av poleringen. Butiken
// byter i stället adressen när sidan ritas, mot den som omdirigeringen ändå
// hade lett till (tabellen FyndplatsRedirects, lib/redirects.ts). Ankartexten
// stämmer fortfarande: givarens omdirigering landar på givarens färg.

/** href="…/produkt/<slug>" hos butiken själv, med eller utan värd. */
const PRODUKT_LANK = new RegExp(
  String.raw`(href\s*=\s*)(["'])${VARD}\/produkt\/([a-z0-9][a-z0-9-]*)\/?((?:[?#][^"']*)?)\2`,
  "g",
);

/** Sluggarna som textens produktlänkar pekar på, en gång var, i textens ordning. */
export function produktlankarIText(html: string): string[] {
  if (!html || !html.includes("/produkt/")) return [];
  const ut = new Set<string>();
  // Grupperna: 1 href=, 2 citattecknet, 3 värden, 4 sluggen, 5 fråga och ankare.
  for (const m of html.matchAll(PRODUKT_LANK)) ut.add(m[4]);
  return [...ut];
}

/**
 * Byter adressen på länkar till produkter som har flyttat. `mal` ger den nya
 * sökvägen för en slug, så som omdirigeringen anger den: "/produkt/ny",
 * "/produkt/ny?variant=<id>" eller "/kategori/x". Länkar till andra sluggar
 * lämnas orörda.
 *
 * Den gamla länkens fråga och ankare följer inte med: målet bär sitt eget val.
 * En länk med värd behåller en värd, en relativ länk förblir relativ.
 */
export function flyttaProduktlankar(html: string, mal: ReadonlyMap<string, string>): string {
  if (!html || mal.size === 0 || !html.includes("/produkt/")) return html;
  return html.replace(PRODUKT_LANK, (hel: string, href: string, citat: string, vard: string | undefined, slug: string) => {
    const ny = mal.get(slug);
    if (!ny || !ny.startsWith("/") || ny.startsWith("//") || /["'<>\s]/.test(ny)) return hel;
    return `${href}${citat}${vard ? "https://www.fyndplats.se" : ""}${ny}${citat}`;
  });
}

/** Så många flyttade länkar slås upp per text. En produkttext har sällan fler än fem länkar. */
export const MAX_FLYTTADE_LANKAR = 12;

/** Så många omdirigeringar i rad följs. En sammanslagen sida kan själv ha slagits ihop igen. */
const MAX_HOPP = 3;

const PRODUKTMAL = /^\/produkt\/([a-z0-9][a-z0-9-]*)\/?(?:[?#].*)?$/;

/**
 * Produkttexten med varje länk till en flyttad produkt bytt mot sidan den leder
 * till.
 *
 * `levande` svarar sant för en slug som är en publicerad produkt i dag: de
 * länkarna är redan rätt och slås aldrig upp. `slaUpp` ger omdirigeringarna för
 * en lista sluggar (lib/redirects.ts). En slug utan omdirigering lämnas som den
 * är: då vet vi inte vart länken ska gå.
 *
 * Fail-open: kastar uppslaget ritas texten med länkarna som de står. En trasig
 * tabell får aldrig fälla en produktsida.
 */
export async function medLevandeLankar(
  html: string,
  levande: (slug: string) => boolean,
  slaUpp: (slugs: string[]) => Promise<ReadonlyMap<string, string>>,
): Promise<string> {
  const flyttade = produktlankarIText(html).filter((s) => !levande(s)).slice(0, MAX_FLYTTADE_LANKAR);
  if (flyttade.length === 0) return html;
  try {
    const mal = new Map<string, string>();
    // slug i texten → sluggen vi letar efter just nu (ändras när ett mål självt har flyttat).
    let letar = new Map(flyttade.map((s) => [s, s] as const));
    for (let hopp = 0; hopp < MAX_HOPP && letar.size > 0; hopp++) {
      const svar = await slaUpp([...new Set(letar.values())]);
      const nasta = new Map<string, string>();
      for (const [ursprung, nu] of letar) {
        const ny = svar.get(nu);
        if (!ny) continue;
        mal.set(ursprung, ny);
        const m = PRODUKTMAL.exec(ny);
        // Målet är en produkt som själv har flyttat: följ den ett steg till.
        if (m && !levande(m[1]) && m[1] !== nu) nasta.set(ursprung, m[1]);
      }
      letar = nasta;
    }
    // Ett mål som fortfarande pekar på en produkt som inte finns hade gett en
    // död länk i stället för en omdirigering. Då står den gamla länken kvar.
    for (const [ursprung, ny] of mal) {
      const m = PRODUKTMAL.exec(ny);
      if (m && !levande(m[1])) mal.delete(ursprung);
    }
    return flyttaProduktlankar(html, mal);
  } catch {
    return html;
  }
}
