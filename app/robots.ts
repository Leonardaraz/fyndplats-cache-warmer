import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Verktygssidor utan SEO-värde: sök (oändlig query-param-rymd → crawl-budget),
      // orderbekräftelse och spårning (privat/transient). Håll dem ur indexet.
      disallow: ["/sok", "/tack", "/sparning"],
    },
    sitemap: "https://www.fyndplats.se/sitemap.xml",
  };
}
