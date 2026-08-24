import type { MetadataRoute } from "next";
import { getSiteUrls } from "../lib/site-urls";

// The XML sitemap is a thin projection of lib/site-urls#getSiteUrls — the single
// source of truth shared with the IndexNow ping and the SEO health check, so the
// three can never drift. /sok, /tack, /sparning and /admin/* are excluded there
// (search results / transient / gated), so they never reach the sitemap.

// ISR, 1 timme — samma takt som varenda annat flöde i repot (bild-sitemapen,
// Google-flödet, produktflödet, sökindexet) och som de sidor vars kommentarer
// redan säger "i takt med sitemapen". Sitemapen var den enda som saknade det.
//
// MÄTT I PRODUKTION 2026-08-24, sitemapen mot sin egen syskonfil som redan
// har revalidate 3600:
//
//   /sitemap.xml                    max-age=0, must-revalidate
//                                   x-vercel-cache: MISS  (6 anrop av 6, age 0)
//   /api/feed/image-sitemap.xml     max-age=3600
//                                   x-vercel-cache: HIT   (från anrop 2)
//
// Sitemapen CDN-cachades alltså inte alls — den byggdes om vid varje anrop.
// Varm kostar det 0,3–0,9 s, men med kalla Wix-cachar mättes 24,4 s för
// 1 024 URL:er. Search Console har en egen timeout när den hämtar sitemapen.
//
// Med revalidate serveras den cachade kopian direkt medan en ny byggs i
// bakgrunden (stale-while-revalidate), precis som syskonfilen.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls = await getSiteUrls();
  return urls.map((u) => ({
    url: u.url,
    lastModified: u.lastModified,
    changeFrequency: u.changeFrequency,
    priority: u.priority,
  }));
}
