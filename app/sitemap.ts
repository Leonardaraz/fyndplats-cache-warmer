import type { MetadataRoute } from "next";
import { getSiteUrls } from "../lib/site-urls";

// The XML sitemap is a thin projection of lib/site-urls#getSiteUrls — the single
// source of truth shared with the IndexNow ping and the SEO health check, so the
// three can never drift. /sok, /tack, /sparning and /admin/* are excluded there
// (search results / transient / gated), so they never reach the sitemap.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls = await getSiteUrls();
  return urls.map((u) => ({
    url: u.url,
    lastModified: u.lastModified,
    changeFrequency: u.changeFrequency,
    priority: u.priority,
  }));
}
