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
