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

// Gamla Wix-produkter som INTE finns i headless-katalogen (2026-08-28).
//
// Wildcarden /product-page/:slug → /produkt/:slug längre ner skrevs för de 204
// produkter vars slug var oförändrad vid migrationen. För allt annat gjorde den
// skada: den omdirigerade till en /produkt/-sida som inte finns, så Google fick
// en 308 rakt in i en 404 — sämre än en ren 404, eftersom den kostar två
// genomsökningar och ändå rapporteras som "Hittades inte".
//
// MÄTT i Search Console-exporten 2026-08-28: av 174 URL:er med 404 var 131
// exakt det här fallet (alla /product-page/…). Och det var inte bara
// genomsökningsspill — de bar 5 080 exponeringar och 68 klick på 92 dagar,
// alltså 6,7 % av sajtens exponeringar och 5,6 % av klicken, rakt in i väggen.
//
// Målen är kurerade per slug (nyckelordsmappning mot levande kategorier, sedan
// granskade mot exponeringsdatan) i stället för en klumpomdirigering till
// /alla-produkter: Google behandlar "många döda URL:er → en generisk sida" som
// soft-404 och släpper rankingen ändå, och en relevant kategori landar dessutom
// köparen på rätt hylla. Samma resonemang som RETIRED_REDIRECT_OVERRIDES ovan.
const LEGACY_WIX_REDIRECTS: Record<string, string> = JSON.parse(
  readFileSync(join(process.cwd(), "data/legacy-wix-redirects.json"), "utf8"),
);
const legacyWixRedirects = Object.entries(LEGACY_WIX_REDIRECTS).map(([slug, destination]) => ({
  source: `/product-page/${slug}`,
  destination,
  permanent: true,
}));
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

      // Gamla Wix-produkter som inte finns kvar — MÅSTE ligga före wildcarden,
      // annars skickar den dem till en /produkt/-sida som 404:ar. Se
      // LEGACY_WIX_REDIRECTS överst för mätningen som motiverar listan.
      ...legacyWixRedirects,

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

      // --- GSC-städning 2026-08-17: de 37 kvarvarande 404:orna ---
      // Search Console rapporterade 183 adresser. 130 /product-page/… 308:ar redan
      // (föråldrad GSC-data) och 7 /produkt/… är lagade via CMS-kollektionen
      // FyndplatsRedirects. 8 är crawler-skräp (/$, /&, /_next/…) som SKA fortsätta
      // 404:a — en redirect där är brus som döljer verkliga fel i GSC. Resterande 37
      // kräver regler HÄR: FyndplatsRedirects slås bara upp av /produkt/[slug] och
      // når alltså varken /kategori/…, roten eller /blog/… (mätt: en testrad gav 308
      // på /produkt/hem-och-inredning men /kategori/hem-och-inredning fortsatte 404:a).
      //
      // OBS åäö: source matchas mot den URL-KODADE sökvägen — samma fallgrop som
      // /product-page-raderna ovan. ä = %C3%A4, å = %C3%A5, ö = %C3%B6. Elva av
      // raderna nedan har svenska tecken (två av dem är bloggposter).
      // Alla mål verifierade som levande (HTTP 200) mot produktion 2026-08-17.

      // Kategorier: gamla "-och-"-formen samt nedlagda kategorier vars sortiment
      // flyttat. musmatta/tangentbord slogs ihop till dator-gaming, ljud-horlurar
      // till elektronik-tillbehor. "ovrigt" har inget tematiskt mål → /alla-produkter.
      { source: "/kategori/hem-och-inredning", destination: "/kategori/hem-inredning", permanent: true },
      { source: "/kategori/mode-och-accessoarer", destination: "/kategori/mode-accessoarer", permanent: true },
      { source: "/kategori/skonhet-och-halsa", destination: "/kategori/skonhet-halsa", permanent: true },
      { source: "/kategori/ljud-horlurar", destination: "/kategori/elektronik-tillbehor", permanent: true },
      { source: "/kategori/musmatta", destination: "/kategori/dator-gaming", permanent: true },
      { source: "/kategori/tangentbord", destination: "/kategori/dator-gaming", permanent: true },
      { source: "/kategori/ovrigt", destination: "/alla-produkter", permanent: true },

      // Gamla Wix-sajtens rot-adresser (ihopskrivna slugs, ofta med åäö).
      { source: "/barn-och-familj", destination: "/kategori/barn-familj", permanent: true },
      { source: "/hem-elektronik", destination: "/kategori/elektronik-tillbehor", permanent: true },
      { source: "/heminredning", destination: "/kategori/hem-inredning", permanent: true },
      { source: "/horlurar", destination: "/kategori/elektronik-tillbehor", permanent: true },
      { source: "/h%C3%B6rlurar", destination: "/kategori/elektronik-tillbehor", permanent: true },
      { source: "/konstgjordablommor", destination: "/kategori/dekoration-prydnad", permanent: true },
      { source: "/leksakerbarnbebisar", destination: "/kategori/leksaker-spel", permanent: true },
      // GSC listar även /mobiltillbehör?page=2. Query-strängar ingår inte i source-
      // matchningen och följer automatiskt med till destination, så raden nedan
      // fångar båda (page=2 är ofarlig på kategorisidan — verifierad 200).
      { source: "/mobiltillbeh%C3%B6r", destination: "/kategori/mobiltillbehor", permanent: true },
      { source: "/modeochaccessoarer", destination: "/kategori/mode-accessoarer", permanent: true },
      { source: "/sk%C3%B6nhetochh%C3%A4lsa", destination: "/kategori/skonhet-halsa", permanent: true },
      { source: "/shop", destination: "/butik", permanent: true },
      { source: "/kundtj%C3%A4nst", destination: "/kundtjanst", permanent: true },
      { source: "/vanligafr%C3%A5gor", destination: "/vanliga-fragor", permanent: true },
      { source: "/v%C3%A5rabutikpolicyer", destination: "/vara-butikspolicyer", permanent: true },
      // /basta-i-test och /for-dig-som har bara dynamiska barn ([type] resp.
      // [interest]) och saknar indexsida → roten 404:ar. Exakt source träffar bara
      // roten, så /basta-i-test/<type> och /for-dig-som/<interest> är orörda.
      { source: "/basta-i-test", destination: "/blogg", permanent: true },
      { source: "/for-dig-som", destination: "/butik", permanent: true },

      // Bloggen ligger på /blogg, inte /blog. De fyra inläggen finns kvar men med
      // andra sluggar — de måste ligga FÖRE en ev. framtida generell /post/-regel.
      { source: "/post/barbar-projektor-kopguide-2026", destination: "/blogg/barbar-projektor-kopguide-2026", permanent: true },
      { source: "/post/bladlos-nackflakt-kopguide-2026", destination: "/blogg/bladlos-nackflakt-kopguide-2026", permanent: true },
      { source: "/post/b%C3%A4rbar-projektor-till-hemmabio-s%C3%A5-v%C3%A4ljer-du-r%C3%A4tt-k%C3%B6pguide-2026", destination: "/blogg/barbar-projektor-kopguide-2026", permanent: true },
      { source: "/post/v%C3%A4lkommen-till-fyndplats-smarta-fynd-f%C3%B6r-hela-familjen", destination: "/blogg/valkommen-till-fyndplats", permanent: true },
      // Tre av Wix-taggarna har ett entydigt ämnesmatchande inlägg kvar. De pekas
      // dit i stället för till bloggindexet: Google behandlar ofta "många döda
      // URL:er → en generisk samlingssida" som soft-404 och släpper värdet ändå
      // (samma skäl som RETIRED_REDIRECT_OVERRIDES överst). Måste ligga FÖRE
      // /blog/:path* — Next matchar i ordning, första träff vinner.
      //
      // "projektor" matchar i dag TVÅ guider (bärbar projektor + stjärnprojektor).
      // Den pekas mot den bärbara: taggen är från Wix-tiden, då stjärnprojektor-
      // guiden inte fanns, och det är den bärbara som ligger i GSC-listan.
      //
      // Övriga taggar lämnas på /blogg med flit: "sommar-2026" matchar tre inlägg
      // (cykel, uteplats, uteliv) och "återhämtning" har ingen tagg-lista att luta
      // sig mot — där vore ett enskilt inlägg en gissning, inte en matchning.
      { source: "/blog/tags/projektor", destination: "/blogg/barbar-projektor-kopguide-2026", permanent: true },
      { source: "/blog/tags/hemmabio", destination: "/blogg/barbar-projektor-kopguide-2026", permanent: true },
      { source: "/blog/tags/nackfl%C3%A4kt", destination: "/blogg/bladlos-nackflakt-kopguide-2026", permanent: true },

      // Resten av /blog/… (index, /categories/…, övriga /tags/…) saknar
      // motsvarighet i headless — bloggen har inga taxonomisidor — så de samlas
      // på /blogg.
      // Båda raderna behövs: :path* garanterar inte bara-/blog utan efterföljande segment.
      { source: "/blog", destination: "/blogg", permanent: true },
      { source: "/blog/:path*", destination: "/blogg", permanent: true },

      // Utfasade Kina-produkter → /alla-produkter (se RETIRED_CHINA_SLUGS överst).
      // Specifika /produkt/<slug>-paths; matchar före ev. framtida wildcard.
      ...chinaRedirects,
    ];
  },
};

export default nextConfig;
