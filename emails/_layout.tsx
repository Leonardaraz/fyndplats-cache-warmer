// Delad layout för Fyndplats transaktionsmejl. Inline-styles används (inte
// Tailwind) för bredast möjligast kompatibilitet i Gmail/Outlook/Apple Mail
// — React Email's `<Tailwind>` wrappar kräver att alla mottagar-klienter
// stöder vissa CSS-features, vilket inte är säkert i äldre Outlook m.fl.

import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

// Brand-tokens speglar app/globals.css: --orange, --orange2, --char, --warm.
// Logo serverar vi från egna domänen så mejlklienter inte blockar tracking.
export const BRAND = {
  orange: "#F47A35",
  orange2: "#E5681F",
  cta: "#C2410C",
  char: "#222018",
  warm: "#FFF6EF",
  ink: "#1a1a1a",
  line: "#e7e2da",
  muted: "#6b6b6b",
  // Email-only logo. PNG (not SVG — Apple Mail mobile won't render SVG) with
  // the wordmark already in white on the same dark background as headerBar,
  // so no CSS filter is needed (most email clients strip `filter:` anyway).
  // Served from app/email-logo/route.tsx via next/og ImageResponse.
  logoUrl: "https://www.fyndplats.se/email-logo",
  siteUrl: "https://www.fyndplats.se",
  supportEmail: "info@fyndplats.com",
  supportPhone: "+46 73 663 09 90",
  companyName: "Fyndplats",
  companyAddress: "Bergviksgatan 10, 152 44 Södertälje",
  socials: {
    instagram: "https://www.instagram.com/fyndplats/",
    facebook: "https://www.facebook.com/profile.php?id=100089607278056",
  },
} as const;

const baseStyles = {
  body: {
    background: BRAND.warm,
    margin: 0,
    padding: 0,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    color: BRAND.ink,
    WebkitFontSmoothing: "antialiased" as const,
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    background: "#ffffff",
    borderRadius: "16px",
    overflow: "hidden" as const,
    boxShadow: "0 12px 32px -16px rgba(28,28,28,0.18)",
  },
  headerBar: {
    background: BRAND.char,
    padding: "20px 28px",
    textAlign: "center" as const,
  },
  brandAccent: {
    height: "6px",
    background: BRAND.orange,
  },
  logoWrap: {
    display: "inline-block" as const,
  },
  logo: {
    height: "44px",
    width: "auto",
    display: "block" as const,
    margin: "0 auto",
    border: 0,
    outline: "none",
    textDecoration: "none" as const,
  },
  content: {
    padding: "32px 28px 8px 28px",
  },
  footerWrap: {
    background: "#fafafa",
    padding: "28px 28px 32px 28px",
    textAlign: "center" as const,
    borderTop: `1px solid ${BRAND.line}`,
  },
  footerText: {
    fontSize: "13px",
    color: BRAND.muted,
    lineHeight: "1.5",
    margin: "4px 0",
  },
  footerLink: {
    color: BRAND.orange2,
    textDecoration: "none" as const,
    fontWeight: 600,
  },
  socialRow: {
    margin: "12px 0 8px 0",
  },
};

export function EmailShell({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="sv">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={baseStyles.body}>
        <Container style={{ padding: "20px 12px" }}>
          <Section style={baseStyles.container}>
            <Section style={baseStyles.headerBar}>
              <Img
                src={BRAND.logoUrl}
                alt="Fyndplats"
                width="220"
                height="44"
                style={baseStyles.logo}
              />
            </Section>
            <div style={baseStyles.brandAccent} />
            <Section style={baseStyles.content}>{children}</Section>
            <Section style={baseStyles.footerWrap}>
              <Text style={{ ...baseStyles.footerText, fontWeight: 700, color: BRAND.ink, marginBottom: "8px" }}>
                Behöver du hjälp?
              </Text>
              <Text style={baseStyles.footerText}>
                Mejla{" "}
                <Link href={`mailto:${BRAND.supportEmail}`} style={baseStyles.footerLink}>
                  {BRAND.supportEmail}
                </Link>
                {" "}eller ring {BRAND.supportPhone}
              </Text>
              <Text style={baseStyles.socialRow}>
                <Link href={BRAND.socials.instagram} style={{ ...baseStyles.footerLink, marginRight: "16px" }}>
                  Instagram
                </Link>
                <Link href={BRAND.socials.facebook} style={baseStyles.footerLink}>
                  Facebook
                </Link>
              </Text>
              <Hr style={{ borderColor: BRAND.line, margin: "18px 0 14px 0" }} />
              <Text style={{ ...baseStyles.footerText, fontSize: "12px" }}>
                {BRAND.companyName} · {BRAND.companyAddress}
              </Text>
              <Text style={{ ...baseStyles.footerText, fontSize: "12px" }}>
                <Link href={BRAND.siteUrl} style={baseStyles.footerLink}>
                  www.fyndplats.se
                </Link>
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Återanvändbara styles för innehållssektioner — exporteras så individuella
// templates inte behöver duplicera typografi och därmed kan driva ifrån.
export const text = {
  h1: {
    fontSize: "24px",
    fontWeight: 800,
    color: BRAND.ink,
    margin: "0 0 8px 0",
    lineHeight: "1.25",
  },
  h2: {
    fontSize: "16px",
    fontWeight: 700,
    color: BRAND.ink,
    margin: "24px 0 10px 0",
    letterSpacing: "0.02em",
    textTransform: "uppercase" as const,
  },
  body: {
    fontSize: "15px",
    color: BRAND.ink,
    lineHeight: "1.55",
    margin: "0 0 14px 0",
  },
  muted: {
    fontSize: "13px",
    color: BRAND.muted,
    lineHeight: "1.5",
    margin: "0 0 8px 0",
  },
  emph: {
    fontWeight: 700,
    color: BRAND.cta,
  },
} as const;

export const block = {
  card: {
    background: BRAND.warm,
    border: `1px solid ${BRAND.line}`,
    borderRadius: "12px",
    padding: "18px 20px",
    margin: "16px 0",
  },
  ctaButton: {
    display: "inline-block" as const,
    background: BRAND.cta,
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "15px",
    padding: "12px 22px",
    borderRadius: "10px",
    textDecoration: "none" as const,
    boxShadow: "0 10px 22px -8px rgba(194,65,12,0.45)",
  },
  // Sekundär knapp. Används när mejlet har TVÅ handlingar och bara den ena är
  // den vi ber om: två fyllda orange knappar bredvid varandra gör att ingen av
  // dem läser som huvudsaken.
  ctaGhost: {
    display: "inline-block" as const,
    background: "#ffffff",
    color: BRAND.ink,
    fontWeight: 700,
    fontSize: "14px",
    padding: "11px 20px",
    borderRadius: "10px",
    textDecoration: "none" as const,
    border: `1px solid ${BRAND.line}`,
  },
} as const;

export function formatSEK(amount: number, currency = "SEK"): string {
  // Använd "kr" för SEK (vad svenska köpare ser i butiken), generic ISO annars.
  const fmt = new Intl.NumberFormat("sv-SE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (currency === "SEK") return `${fmt.format(amount)} kr`;
  return `${fmt.format(amount)} ${currency}`;
}
