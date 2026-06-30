// lib/site-urls.ts
// Single source of truth for the site's indexable, public URLs.
//
// app/sitemap.ts, the IndexNow ping (lib/indexnow.ts) and the SEO health check
// (lib/seo-health.ts) all derive their URL list from here, so the sitemap, the
// search-engine pings and the health dashboard can never drift apart.
//
// What's IN: home, /butik, /alla-produkter, the evergreen info pages, every
// category (/kategori/*), every product (/produkt/*) and every blog post
// (/blogg/*). /blogg index is only listed once at least one post exists (a
// noindex thin index in the sitemap would trip Search Console's
// "submitted URL marked noindex").
//
// What's OUT (deliberately): /sok (search results — thin/duplicate, noindex),
// /tack and /sparning (transient/private order pages), /admin/* (proxy-gated).
import { getProductSlugs, getCollections } from "./products";
import { getPosts } from "./blog";
import { getProgrammaticUrls } from "./seo/programmatic";

export const SITE = "https://www.fyndplats.se";

export type SiteUrlType =
  | "home"
  | "butik"
  | "alla-produkter"
  | "sida"
  | "kategori"
  | "produkt"
  | "blogg"
  | "programmatic";

export type SiteUrl = {
  path: string; // "" for home, otherwise leading-slash path
  url: string; // absolute
  type: SiteUrlType;
  lastModified: Date;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
};

// Evergreen static pages (excl. home/butik/alla-produkter which get their own
// type + cadence). Mirrors the curated list that ships in app/sitemap.ts.
const STATIC_INFO_PATHS = [
  "/omoss",
  "/omdomen",
  "/kundtjanst",
  "/kontaktaoss",
  "/vanliga-fragor",
  "/returer",
  "/eu-lager-garanti",
  "/kopvillkor",
  "/sekretesspolicy",
  "/vara-butikspolicyer",
  "/integritetspolicy-app",
  "/anvandarvillkor-app",
];

/**
 * The full list of indexable URLs, in sitemap order (static → categories →
 * products → blog). Pulls products/categories/posts from the same cached Wix
 * loaders the storefront uses, so it costs nothing extra per request.
 */
export async function getSiteUrls(): Promise<SiteUrl[]> {
  const [slugs, collections, posts, programmatic] = await Promise.all([
    getProductSlugs(),
    getCollections(),
    getPosts(),
    getProgrammaticUrls(),
  ]);

  const now = new Date();
  const entry = (
    path: string,
    type: SiteUrlType,
    changeFrequency: SiteUrl["changeFrequency"],
    priority: number,
    lastModified: Date = now,
  ): SiteUrl => ({ path, url: `${SITE}${path}`, type, lastModified, changeFrequency, priority });

  const urls: SiteUrl[] = [
    entry("", "home", "daily", 1),
    entry("/butik", "butik", "daily", 0.8),
    entry("/alla-produkter", "alla-produkter", "daily", 0.8),
  ];

  // /blogg index only once there's at least one post (else it's noindex).
  if (posts.length > 0) urls.push(entry("/blogg", "sida", "weekly", 0.7));

  for (const p of STATIC_INFO_PATHS) urls.push(entry(p, "sida", "monthly", 0.7));

  for (const c of collections) urls.push(entry(`/kategori/${c.slug}`, "kategori", "weekly", 0.7));
  for (const slug of slugs) urls.push(entry(`/produkt/${slug}`, "produkt", "weekly", 0.8));
  for (const post of posts) {
    urls.push(
      entry(`/blogg/${post.slug}`, "blogg", "monthly", 0.6, post.date ? new Date(post.date) : now),
    );
  }

  // Programmatiska SEO-landningssidor (Pattern 1–3, lib/seo/programmatic.ts).
  // Bara sidor som klarar quality-guards (>= 3/4 produkter, >= 250 ord) listas
  // här → de pingas automatiskt till IndexNow och syns i sitemap/health-check.
  for (const pg of programmatic) {
    urls.push(entry(pg.path, "programmatic", pg.changeFrequency, pg.priority));
  }

  return urls;
}

/** Just the absolute URL strings (used by IndexNow). */
export async function getSiteUrlStrings(): Promise<string[]> {
  return (await getSiteUrls()).map((u) => u.url);
}
