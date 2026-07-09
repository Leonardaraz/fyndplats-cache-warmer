import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Utfasade Kina-produkter (2026-06): sortimentet går helt till EU-lager (snabb
// leverans). När dessa gamla produkter avpubliceras i Wix 301:as deras
// /produkt/<slug> till /alla-produkter — länkkraften bevaras och inga döda
// länkar/404:or uppstår (Googles rekommendation för utgångna produkter).
// KEEP_LIVE = ev. undantag som INTE fasas ut. TOM nu — hela Kina-batchen (alla
// 207, inkl. träningsvästarna) är utfasad; sortimentet är 100 % EU-lager.
const RETIRED_CHINA_SLUGS: string[] = JSON.parse(
  readFileSync(join(process.cwd(), "data/retired-china-slugs.json"), "utf8"),
);
const KEEP_LIVE = new Set<string>([]);

// Utfasade produkter med FAKTISK Google-ranking/exponeringar pekas till närmaste
// RELEVANTA kategori i stället för generiska /alla-produkter. Skäl: Google
// behandlar ofta "många döda URL:er → en generisk samlingssida" som en soft-404
// och släpper rankingen ändå; en topikalt relevant kategori bevarar länkkraften
// OCH landar köparen på rätt EU-hylla (bättre konvertering än en 400+ produkters
// vägg). Bara sluggar med reella exponeringar kureras här — resten faller på
// /alla-produkter nedan. Alla mål verifierade som levande kategorier (≥1 produkt)
// 2026-07-09. Örhängen har inget relevant mål (smycken-kategorin är tom → /butik),
// så den lämnas medvetet på /alla-produkter.
const RETIRED_REDIRECT_OVERRIDES: Record<string, string> = {
  "robust-paraply-med-uv-skydd": "/kategori/tradgard-utemobler",
  "traningsvastar-for-lag-numrerade-sportvastar": "/kategori/traning-gym",
  "vikbar-skotbadd-vattentat-och-portabel-skotmatta": "/kategori/baby-smabarn",
  "vagghangd-utfallbar-kladhangare-i-tra-platsbesparande": "/kategori/forvaring-organisering",
  "elektrisk-aggkokare": "/kategori/koksmaskiner-apparater",
};
const chinaRedirects = RETIRED_CHINA_SLUGS.filter((s) => !KEEP_LIVE.has(s)).map((slug) => ({
  source: `/produkt/${slug}`,
  destination: RETIRED_REDIRECT_OVERRIDES[slug] ?? "/alla-produkter",
  permanent: true,
}));

// OBS: tömda kategorier hanteras INTE här längre. Kategori-routen
// (app/kategori/[slug]/page.tsx) redirectar tomma/okända kategorier → /butik och
// återupplivar dem automatiskt så fort de får ≥1 synlig produkt. Det gör att en
// kategori-import inte kräver någon config-ändring.

const nextConfig: NextConfig = {
  images: {
    // Global loader (lib/image-loader.ts): serverar varje <Image> direkt från
    // bildens egen CDN (Wix / Unsplash) med responsiv srcset, i stället för via
    // Vercels /_next/image-optimerare (kallstart + extra hop). remotePatterns
    // behålls som dokumentation av tillåtna värdar; optimeraren är förbikopplad.
    loaderFile: "./lib/image-loader.ts",
    remotePatterns: [
      { protocol: "https", hostname: "static.wixstatic.com" },
      // Curated kategori-hero-bilder (lib/category-groups.ts → CATEGORY_HERO_IMAGES).
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async rewrites() {
    return [
      // 17TRACK-push: dashboardens webhook-URL ärvdes från Velo och pekar på
      // /_functions/track_webhook. Sen DNS-cutovern är fyndplats.se → Vercel, så
      // vi serverar den legacy-vägen vidare till den nya headless-handlern. Då
      // återupptas pushen UTAN att röra 17TRACK-dashboarden. (Next behandlar
      // mappar som börjar med "_" som privata → ingen riktig route kan ligga
      // där; därför en rewrite i stället för en fil under app/_functions/.)
      { source: "/_functions/track_webhook", destination: "/api/track17-webhook" },
    ];
  },
  async redirects() {
    return [
      // --- SEO-migration: gamla Wix-sajtens produkt-URL:er → headless ---
      // Google har indexerat /product-page/[slug] från gamla fyndplats.se.
      // Headless serverar produkterna på /produkt/[slug]. 204 av 207 produkter
      // har identisk slug → wildcard nedan tar dem. 301 (permanent) för att
      // föra över länkstyrka.

      // 3 produkter fick ny slug vid V1→V3-migrationen — explicita redirects
      // måste ligga FÖRE wildcarden (Next matchar i ordning, första träff vinner).
      //
      // VIKTIGT: source matchas mot URL-encoded pathname, INTE decoded.
      // Browsern skickar /product-page/%C3%A4ppelskalare... (ä → %C3%A4).
      // Om vi skriver "ä" rakt här matchar inte — wildcarden vinner istället
      // och pekar mot /produkt/[V1-slug-med-åäö] som inte finns → 404.
      // Därför är "ä" här %C3%A4, "ö" %C3%B6. Tredje slug:en har inga åäö.
      { source: "/product-page/%C3%A4ppelskalare-3-i-1-skalar-k%C3%A4rnar-ur-och-skivar", destination: "/produkt/appelskalare-3-i-1-skalar-karnar-skivar", permanent: true },
      { source: "/product-page/mini-soptunna-f%C3%B6r-bilen-550-ml-med-smart-trycklock", destination: "/produkt/mini-soptunna-bil-550-ml-trycklock", permanent: true },
      { source: "/product-page/vaggmonterad-solcellsdriven-uv-tandborststerilisator-automatisk-tankramspress", destination: "/produkt/vaggmonterad-uv-tandborststerilisator-solcell", permanent: true },

      // Wildcard: täcker de 204 produkter vars slug är oförändrad.
      { source: "/product-page/:slug", destination: "/produkt/:slug", permanent: true },

      // Gamla Wix V1-URL-strukturen /products/[slug] — Wix lagrar fortfarande den
      // som canonical/og:url i produkternas seoData, och Google kan ha indexerat
      // den från Wix-eran. Headless servar /produkt/[slug], så /products/ 404:ar.
      // 301 hit så de leder rätt i stället för att tappa länkstyrka.
      { source: "/products/:slug", destination: "/produkt/:slug", permanent: true },

      // Gamla Wix-kategori-URL:er → headless /kategori/[slug].
      // Slugs verifierade mot V3-katalogens faktiska huvudkategorier (2026-06-04).
      // Tidigare pekade /elektronik och /kok-och-matlagning på slugs som 404:ade
      // (elektronik / kok-matlagning finns inte — rätt är elektronik-tillbehor /
      // kok-husgerad), och Sport/Skönhet pekade på underkategorier trots att
      // huvudkategorierna numera finns (sport-fritid / skonhet-halsa).
      { source: "/elektronik", destination: "/kategori/elektronik-tillbehor", permanent: true },
      { source: "/hem-och-inredning", destination: "/kategori/hem-inredning", permanent: true },
      { source: "/kok-och-matlagning", destination: "/kategori/kok-husgerad", permanent: true },
      { source: "/sport-och-fritid", destination: "/kategori/sport-fritid", permanent: true },
      { source: "/skonhet-och-halsa", destination: "/kategori/skonhet-halsa", permanent: true },
      { source: "/mode-och-accessoarer", destination: "/kategori/mode-accessoarer", permanent: true },
      { source: "/smycken", destination: "/kategori/smycken", permanent: true },
      { source: "/husdjur", destination: "/kategori/husdjur", permanent: true },

      // Wix-sajtens "blank-7"-sida var omdömessidan.
      { source: "/blank-7", destination: "/omdomen", permanent: true },

      // Utfasade Kina-produkter → /alla-produkter (se RETIRED_CHINA_SLUGS överst).
      // Specifika /produkt/<slug>-paths; matchar före ev. framtida wildcard.
      ...chinaRedirects,
    ];
  },
};

export default nextConfig;
