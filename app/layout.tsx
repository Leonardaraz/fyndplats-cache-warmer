import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { CartProvider, CartDrawer } from "../components/cart";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });

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
    images: ["https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1200,h_630,al_c,q_85,enc_avif/file.jpg"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.fyndplats.se" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" className={geist.variable}>
      <body>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
