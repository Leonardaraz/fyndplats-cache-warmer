// SEO-migrationsmappare: matchar gamla V1-produkter mot nya V3-produkter via
// normaliserade namn (case-insensitive, trim, kollapsade whitespace).
//
// Output: lista med par för att generera 301-redirects + statistik på lösa
// trådar (V1 utan match = produkter som "försvinner" från Google,
// V3 utan match = nya produkter som behöver färsk indexering).

import type { WixV1ProductSummary } from "../wix/v1-products";
import type { WixV3ProductSummary } from "../wix/v3-products";

export interface MigrationPair {
  v1: WixV1ProductSummary;
  v3: WixV3ProductSummary;
  oldUrl: string;
  newUrl: string;
  slugChanged: boolean;
}

export interface MigrationReport {
  pairs: MigrationPair[];
  v1Orphans: WixV1ProductSummary[];
  v3Orphans: WixV3ProductSummary[];
  stats: {
    v1Total: number;
    v3Total: number;
    matched: number;
    slugIdentical: number;
    slugDifferent: number;
  };
}

/**
 * Normaliserar produktnamn för matchning. Tar bort case, kollapsar whitespace
 * och rensar punktuation som lätt skiljer mellan migrationer.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Bygger 301-redirect-mapp från V1 → V3-katalogen.
 *
 * @param v1List   Alla gamla produkter (med slugs Google indexerat)
 * @param v3List   Alla nya headless-produkter (med nya slugs)
 * @param newPathPrefix  Det URL-prefix headless använder. Default `/products/`.
 *                       Konfigurerbart för att stötta /p/, /store-products/ etc.
 */
export function buildMigrationReport(
  v1List: WixV1ProductSummary[],
  v3List: WixV3ProductSummary[],
  newPathPrefix = "/products/",
): MigrationReport {
  const prefix = newPathPrefix.endsWith("/") ? newPathPrefix : `${newPathPrefix}/`;

  // Indexera V3 på normaliserat namn för O(1) lookup.
  const v3ByName = new Map<string, WixV3ProductSummary>();
  for (const v of v3List) {
    v3ByName.set(normalizeName(v.name), v);
  }

  const pairs: MigrationPair[] = [];
  const v1Orphans: WixV1ProductSummary[] = [];
  const matchedV3Ids = new Set<string>();

  for (const v1 of v1List) {
    const match = v3ByName.get(normalizeName(v1.name));
    if (match) {
      const newUrl = `${prefix}${match.slug}`;
      pairs.push({
        v1,
        v3: match,
        oldUrl: v1.oldPath,
        newUrl,
        slugChanged: v1.slug !== match.slug,
      });
      matchedV3Ids.add(match.id);
    } else {
      v1Orphans.push(v1);
    }
  }

  const v3Orphans = v3List.filter((v) => !matchedV3Ids.has(v.id));

  return {
    pairs,
    v1Orphans,
    v3Orphans,
    stats: {
      v1Total: v1List.length,
      v3Total: v3List.length,
      matched: pairs.length,
      slugIdentical: pairs.filter((p) => !p.slugChanged).length,
      slugDifferent: pairs.filter((p) => p.slugChanged).length,
    },
  };
}

/**
 * Genererar en Next.js redirect-config-array som direkt klistras in
 * i `next.config.js` under `async redirects()`.
 */
export function toNextRedirectsConfig(pairs: MigrationPair[]): Array<{
  source: string;
  destination: string;
  permanent: true;
}> {
  return pairs.map((p) => ({
    source: p.oldUrl,
    destination: p.newUrl,
    permanent: true,
  }));
}

/**
 * CSV-export: `old_url,new_url,slug_changed,product_name`. För manuell
 * granskning eller import i annat redirect-system (Cloudflare, Vercel
 * dashboard, .htaccess osv).
 */
export function toRedirectsCsv(pairs: MigrationPair[]): string {
  const header = "old_url,new_url,slug_changed,product_name";
  const rows = pairs.map((p) => {
    const safeName = `"${p.v1.name.replace(/"/g, '""')}"`;
    return `${p.oldUrl},${p.newUrl},${p.slugChanged},${safeName}`;
  });
  return [header, ...rows].join("\n");
}

/**
 * Genererar sitemap.xml-content för nya headless-sajten från V3-katalogen.
 * Inkluderar bara visible-produkter med slug.
 *
 * @param v3List      Alla V3-produkter
 * @param baseUrl     Headless-sajtens bas-URL, t.ex. `https://www.fyndplats.se`
 * @param newPathPrefix  Samma som buildMigrationReport
 */
export function buildSitemapXml(
  v3List: WixV3ProductSummary[],
  baseUrl: string,
  newPathPrefix = "/products/",
): string {
  const base = baseUrl.replace(/\/$/, "");
  const prefix = newPathPrefix.endsWith("/") ? newPathPrefix : `${newPathPrefix}/`;
  const now = new Date().toISOString();

  const urls = v3List
    .filter((p) => Boolean(p.slug))
    .map(
      (p) => `  <url>
    <loc>${base}${prefix}${escapeXml(p.slug)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${base}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${urls}
</urlset>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
