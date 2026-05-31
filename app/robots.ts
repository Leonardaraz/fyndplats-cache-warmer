import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /admin/* är proxy-gated (404 utan ADMIN_SECRET) men disallow:as ändå.
      // /tack + /sparning: privata/transienta orderssidor → ur indexet.
      // OBS: /sok är INTE disallow:ad — den måste vara crawl-bar för att Google
      // ska kunna se dess <meta robots noindex> (app/sok/page.tsx). Disallow +
      // noindex är motsägelsefullt: crawlern når aldrig taggen. Allow + noindex
      // är det korrekta sättet att hålla sökresultatsidor ur indexet.
      disallow: ["/admin", "/tack", "/sparning"],
    },
    sitemap: "https://www.fyndplats.se/sitemap.xml",
  };
}
