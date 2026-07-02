import type { Metadata } from "next";
import { jsonLdString } from "../lib/seo";
import { Geist, Fraunces } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { CartProvider } from "../components/cart";
import { getProducts, getCollections, forListings, cartRecommendations } from "../lib/products";
import { SiteHeader, SiteFooter } from "../components/site";
import { WishlistProvider } from "../components/wishlist";
// Below-fold / interaction-only components — code-split via next/dynamic so
// they don't bloat the initial JS payload (round-2 perf). See components/deferred.tsx.
import {
  ScrollIndicator,
  BackToTop,
  CookieConsent,
  CartDrawer,
  WishlistDrawer,
} from "../components/deferred";
import { MetaPixel } from "../components/metapixel";

const GA_MEASUREMENT_ID = "G-W6NZ87CX2Q";

// Meta Pixel-ID läses server-side (icke-hemligt — syns ändå i sidans källkod).
// Tomt → MetaPixel renderar inget och CAPI-routen svarar "not_configured", så
// sajten fungerar oförändrat tills Leonard fyllt i env-variabeln i Vercel.
const META_PIXEL_ID = (process.env.META_PIXEL_ID || "").trim();

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Fyndplats",
  url: "https://www.fyndplats.se/",
  logo: "https://www.fyndplats.se/logo.svg",
  email: "info@fyndplats.com",
  telephone: "+46736630990",
  sameAs: [
    // Google Business Profile — kritisk bidirektionell länk för Knowledge Graph
    "https://maps.google.com/?cid=13527624431203349873",
    "https://www.instagram.com/fyndplats/",
    "https://www.facebook.com/profile.php?id=100089607278056",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+46-736-630-990",
    contactType: "customer service",
    areaServed: "SE",
    availableLanguage: "Swedish",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.fyndplats.se"),
  title: {
    default: "Fyndplats | Noga utvalda fynd till smarta priser",
    template: "%s | Fyndplats",
  },
  description:
    "Fyndplats – svensk webbutik med noga utvalda fynd inom hem, mode, teknik och fritid. Smarta priser, Klarna och fri frakt över 499 kr.",
  keywords: ["fyndplats", "webbutik", "fynd", "smarta priser", "svensk e-handel"],
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: "Fyndplats",
    url: "https://www.fyndplats.se/",
    title: "Fyndplats | Noga utvalda fynd till smarta priser",
    description:
      "Svensk webbutik med noga utvalda fynd till smarta priser. Klarna och fri frakt över 499 kr.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.fyndplats.se/" },
  verification: {
    ...(process.env.GOOGLE_SEARCH_CONSOLE_TOKEN && {
      google: process.env.GOOGLE_SEARCH_CONSOLE_TOKEN,
    }),
    other: {
      'facebook-domain-verification': '8xp88bilq389lzbfgavv60cijsx2mr',
      ...(process.env.BING_VERIFICATION_TOKEN && {
        'msvalidate.01': process.env.BING_VERIFICATION_TOKEN,
      }),
      // Trustpilot domain-verifiering. Leonard skapar gratis-kontot på
      // trustpilot.com/business och klistrar in meta-koden i env. Tom →
      // taggen renderas inte (Trustpilot bryr sig inte om en tom tag, och
      // sajten är oförändrad tills verifieringen aktiveras). Se
      // docs/trustpilot-setup.md.
      ...(process.env.TRUSTPILOT_VERIFICATION_ID && {
        'trustpilot-one-time-domain-verification-id':
          process.env.TRUSTPILOT_VERIFICATION_ID,
      }),
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Bästsäljar-rekommendationer till cart-drawerns "Andra köpte också"-block.
  // getProducts() är cache:ad så detta delar fetch med övriga server-renders.
  const cartRecos = cartRecommendations(forListings(await getProducts()), await getCollections());
  return (
    <html lang="sv" className={`${geist.variable} ${fraunces.variable}`}>
      <head>
        {/* Hint browsers to open the TLS connection to Wix's image CDN early —
            every product image (hero, mosaic, PDP) is hosted at static.wixstatic.com,
            and the LCP is one of those images. preconnect saves the ~300ms
            DNS+TCP+TLS handshake on the first image fetch. */}
        <link rel="preconnect" href="https://static.wixstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://static.wixstatic.com" />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(orgJsonLd) }} />
        <CartProvider>
          <WishlistProvider>
            <ScrollIndicator />
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
            <CartDrawer recommendations={cartRecos} />
            <WishlistDrawer />
            <BackToTop />
          </WishlistProvider>
        </CartProvider>
        <CookieConsent />
        {/*
          GA4 stub måste vara definierad SYNKRONT så att klient-eventer (view_item,
          add_to_cart, purchase) som fyras i React-useEffects hittar window.gtag.
          next/script "afterInteractive" laddar efter hydration → eventer som
          körs tidigare hamnar i tomma intet. Inline-stuben här pushar till
          dataLayer; GTM-libben (lazy afterInteractive nedan) plockar upp kön
          när den initierar.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments);};gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`,
          }}
        />
        {/*
          lazyOnload (round-2 perf): GA4 doesn't need to load before user idle.
          The inline gtag stub above already queues 'js' + 'config' onto
          window.dataLayer, so when gtag.js eventually arrives it processes
          the backlog — no pageview / event loss. Moving from afterInteractive
          to lazyOnload removes ~50KB of script execution from main-thread
          critical path and shrinks TBT.
        */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="lazyOnload"
        />
        {/*
          Vercel Web Analytics (cookie-free, privacy-friendly) — no consent gate
          needed, so it sits outside <CookieConsent />. Beacons to
          /_vercel/insights/view. SpeedInsights reports real-user Core Web Vitals
          (LCP/CLS/INP) to /_vercel/speed-insights/vitals.
        */}
        <Analytics />
        <SpeedInsights />
        {/*
          Meta Pixel (Facebook/Instagram-annonsering). Gated på marknadssamtycke
          inuti komponenten (lib/consent) — laddas BARA efter "Godkänn alla".
          Konverteringsevent fyras via lib/analytics → lib/meta (Pixel + CAPI med
          delad event_id för deduplicering). Server-side CAPI: /api/meta/capi.
        */}
        {META_PIXEL_ID && <MetaPixel pixelId={META_PIXEL_ID} />}
      </body>
    </html>
  );
}
