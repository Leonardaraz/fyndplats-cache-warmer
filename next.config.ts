import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "static.wixstatic.com" },
    ],
  },
  async redirects() {
    return [
      // --- SEO-migration: gamla Wix-sajtens produkt-URL:er → headless ---
      // Google har indexerat /product-page/[slug] från gamla fyndplats.se.
      // Headless serverar produkterna på /produkt/[slug]. 204 av 207 produkter
      // har identisk slug → wildcard nedan tar dem. 301 (permanent) för att
      // föra över länkstyrka.
      //
      // OBS: 3 produkter fick ny slug vid V1→V3-migrationen. Lägg deras
      // explicita redirects HÄR (före wildcard — Next matchar i ordning,
      // första träff vinner). Hämta de 3 paren från /admin/seo →
      // "Full rapport (JSON)" → report.pairs där slugChanged === true:
      //
      //   { source: "/product-page/GAMMAL-SLUG", destination: "/produkt/NY-SLUG", permanent: true },
      //   { source: "/product-page/GAMMAL-SLUG", destination: "/produkt/NY-SLUG", permanent: true },
      //   { source: "/product-page/GAMMAL-SLUG", destination: "/produkt/NY-SLUG", permanent: true },

      // Wildcard: täcker de 204 produkter vars slug är oförändrad.
      { source: "/product-page/:slug", destination: "/produkt/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
