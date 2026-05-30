import type { Metadata } from "next";
import { Geist, Fraunces } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CartProvider, CartDrawer } from "../components/cart";
import { SiteHeader, SiteFooter } from "../components/site";
import { CookieConsent } from "../components/cookieconsent";
import { WishlistProvider, WishlistDrawer } from "../components/wishlist";
import { ScrollIndicator } from "../components/scrollindicator";
import { BackToTop } from "../components/backtotop";

const GA_MEASUREMENT_ID = "G-W6NZ87CX2Q";

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
  address: {
    "@type": "PostalAddress",
    streetAddress: "Bergviksgatan 10",
    postalCode: "152 44",
    addressLocality: "Södertälje",
    addressCountry: "SE",
  },
  sameAs: [
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
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" className={`${geist.variable} ${fraunces.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <CartProvider>
          <WishlistProvider>
            <ScrollIndicator />
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
            <CartDrawer />
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
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
