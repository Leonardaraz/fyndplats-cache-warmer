// Delad URL-byggare för produktsidor på headless-storefronten. Samma
// "baseUrl + /products/ + slug"-form som idag dupliceras i lib/seo/enrich.ts
// (canonical/OG) och lib/seo/migration.ts (sitemap) — extraherad så att
// IndexNow-pingen och produktfeeden bygger EXAKT samma URL:er som canonical
// och sitemap. Annars riskerar vi att pinga/feeda en URL Google inte känner igen.

export interface UrlConfig {
  baseUrl: string;
  newPathPrefix: string;
}

export const DEFAULT_URL_CONFIG: UrlConfig = {
  // Override:bart via env för staging/preview utan kodändring; default = prod.
  baseUrl: process.env.SEO_BASE_URL || "https://www.fyndplats.se",
  newPathPrefix: process.env.SEO_PATH_PREFIX || "/products/",
};

/** Bygger den publika produkt-URL:en för en slug (`https://…/products/<slug>`). */
export function productUrl(slug: string, config: Partial<UrlConfig> = {}): string {
  const cfg = { ...DEFAULT_URL_CONFIG, ...config };
  const base = cfg.baseUrl.replace(/\/+$/, "");
  const prefix = cfg.newPathPrefix.endsWith("/") ? cfg.newPathPrefix : `${cfg.newPathPrefix}/`;
  return `${base}${prefix}${slug}`;
}
