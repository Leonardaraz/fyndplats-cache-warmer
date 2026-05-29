// Länk-upptäckt för djup (flersidig) granskning.
// Plockar interna länkar ur en sidas HTML, normaliserar till absoluta URL:er på
// samma domän, och prioriterar sidor som brukar vara viktigast för en e-handel
// (produkt, kategori, kassa, om, kontakt, villkor). Ren funktion — testbar offline.

const SKIP_EXT = /\.(pdf|jpe?g|png|gif|svg|webp|ico|css|js|mjs|json|xml|zip|rar|mp4|webm|woff2?)$/i;

// Högre vikt = viktigare att inkludera i ett urval.
const PRIORITY: Array<[RegExp, number]> = [
  [/\b(produkt|product)\b|\/p\//i, 5],
  [/\b(kategori|category|collections?|shop|butik)\b/i, 4],
  [/\b(kassa|cart|checkout|varukorg)\b/i, 4],
  [/\b(om|about|kontakt|contact)\b/i, 2],
  [/\b(villkor|terms|integritet|privacy|frakt|retur)\b/i, 2],
];

function priorityOf(url: string): number {
  let score = 1;
  for (const [re, w] of PRIORITY) if (re.test(url)) score = Math.max(score, w);
  return score;
}

/**
 * Returnerar upp till `max` interna länkar (exkl. startsidan själv), prioriterade
 * efter hur viktiga de brukar vara. Absoluta, avduplicerade, utan fragment.
 */
export function extractInternalLinks(html: string, baseUrl: string, max = 4): string[] {
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return [];
  }

  const seen = new Set<string>();
  const candidates: string[] = [];

  for (const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
    const raw = (m[2] ?? m[3] ?? "").trim();
    if (!raw || raw.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(raw)) continue;

    let abs: URL;
    try {
      abs = new URL(raw, base);
    } catch {
      continue;
    }
    if (abs.protocol !== "http:" && abs.protocol !== "https:") continue;
    if (abs.hostname !== base.hostname) continue;
    if (SKIP_EXT.test(abs.pathname)) continue;

    abs.hash = "";
    const norm = abs.toString().replace(/\/$/, "");
    const baseNorm = base.toString().replace(/\/$/, "");
    if (norm === baseNorm) continue; // hoppa över startsidan
    if (seen.has(norm)) continue;
    seen.add(norm);
    candidates.push(norm);
  }

  return candidates
    .map((url) => ({ url, p: priorityOf(url) }))
    .sort((a, b) => b.p - a.p)
    .slice(0, max)
    .map((c) => c.url);
}
