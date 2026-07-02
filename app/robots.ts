import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /admin/* är proxy-gated (404 utan ADMIN_SECRET) men disallow:as ändå.
      // /tack + /sparning hålls ur indexet med <meta robots noindex> (respektive
      // page.tsx) och ska därför INTE disallow:as — Disallow + noindex är
      // motsägelsefullt: crawlern når aldrig taggen. Samma princip som /sok:
      // den är crawl-bar just för att Google ska kunna se dess noindex
      // (app/sok/page.tsx). Allow + noindex håller sidorna ur indexet korrekt.
      disallow: ["/admin"],
    },
    sitemap: "https://www.fyndplats.se/sitemap.xml",
  };
}
