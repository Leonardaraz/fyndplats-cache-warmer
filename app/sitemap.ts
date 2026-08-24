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
// VAD SOM FAKTISKT VAR FEL: utan revalidate förhandsrenderas sitemapen vid
// BYGGET och regenereras sedan aldrig. Den var alltså inte långsam — den var
// FRUSEN: nya produkter och blogginlägg nådde den först vid nästa deploy.
// Att butiken deployar ofta dolde det, men mellan två deployer speglade
// sitemapen ett gammalt sortiment.
//
// Med revalidate serveras den cachade kopian direkt medan en ny byggs i
// bakgrunden (stale-while-revalidate), så ingen crawler väntar på bygget.
//
// KVAR ATT VETA: den första hämtningen efter en deploy måste fortfarande
// generera filen, och den vägen mättes 2026-08-24 till 24,4 s (1 024 URL:er,
// kalla Wix-cachar) mot 0,3–0,9 s varm. Det taket ligger i getSiteUrls, inte
// här, och rörs inte av den här ändringen.
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
