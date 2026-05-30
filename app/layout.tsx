import type { Metadata } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";
import { CartProvider, CartDrawer } from "../components/cart";
import { SiteHeader, SiteFooter } from "../components/site";
import { CookieConsent } from "../components/cookieconsent";
import { WishlistProvider, WishlistDrawer } from "../components/wishlist";
import { ScrollIndicator } from "../components/scrollindicator";
import { BackToTop } from "../components/backtotop";

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
  url: "https://www.fyndplats.se",
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
    default: "Fyndplats | Kvalitetsprodukter till låga priser online",
    template: "%s | Fyndplats",
  },
  description:
    "Fyndplats – din svenska webbutik för kvalitetsprodukter till låga priser. Fynda inom hem, mode, teknik och fritid för hela familjen. Fri frakt över 499 kr.",
  keywords: ["fyndplats", "webbutik", "billiga produkter", "fynd", "svensk e-handel"],
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: "Fyndplats",
    title: "Fyndplats | Kvalitetsprodukter till låga priser online",
    description:
      "Din svenska webbutik för kvalitetsprodukter till låga priser. Fri frakt över 499 kr.",
    images: [{ url: "https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85,enc_avif/file.jpg", width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.fyndplats.se" },
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
      </body>
    </html>
  );
}
