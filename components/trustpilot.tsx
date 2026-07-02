"use client";

// components/trustpilot.tsx
//
// Återanvändbara Trustpilot TrustBox-widgets. Trustpilots bootstrap-script
// (`tp.widget.bootstrap.min.js`) auto-initierar varje `.trustpilot-widget`-div
// vid sidladdning, men på SPA-navigeringar (Next.js client routing) körs det
// inte om — så vi anropar `window.Trustpilot.loadFromElement(el, true)` i en
// useEffect för att tvinga om-rendering när widgeten monteras klient-side.
//
// Scriptet laddas via next/script (dedupas på src, så footer + PDP delar EN
// laddning) och bara när en widget faktiskt renderas. Anroparna grindar redan
// på TRUSTPILOT_BUSINESS_UNIT_ID — är env tom renderas ingen widget och inget
// script begärs (noll extra requests). Se docs/trustpilot-setup.md.

import Script from "next/script";
import { useEffect, useRef } from "react";

const BOOTSTRAP_SRC =
  "https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js";

// Publika Trustpilot-template-ID:n (samma för alla konton — de identifierar
// widget-TYPEN, inte vårt konto). Vårt konto pekas ut av businessUnitId.
export const TRUSTBOX_TEMPLATES = {
  /** Mini — kompakt stjärnbetyg + "Trustpilot" + antal recensioner. Footer. */
  mini: "53aa8807dec7e10d38f59f32",
  /** Product Reviews — recensioner för en specifik produkt (kräver data-sku). */
  productReviews: "544a06dd00006400057a5b32",
} as const;

declare global {
  interface Window {
    Trustpilot?: {
      loadFromElement: (el: HTMLElement, forceReload?: boolean) => void;
    };
  }
}

interface TrustBoxProps {
  /** Trustpilot business unit-ID (vårt konto). Tom → komponenten renderas ej. */
  businessUnitId: string;
  /** Widget-template (se TRUSTBOX_TEMPLATES). */
  templateId: string;
  /** data-style-height, t.ex. "150px". */
  height: string;
  /** data-style-width, default "100%". */
  width?: string;
  theme?: "light" | "dark";
  className?: string;
  /** Product Reviews-widgeten matchar recensioner mot produktens SKU. */
  sku?: string;
  /** data-stars-filter, t.ex. "4,5" för att bara visa 4–5-stjärniga. */
  stars?: string;
  /** data-no-reviews: "hide" kollapsar widgeten när SKU:n saknar recensioner. */
  noReviews?: "hide" | "collapse";
  locale?: string;
}

export function TrustBox({
  businessUnitId,
  templateId,
  height,
  width = "100%",
  theme = "light",
  className,
  sku,
  stars,
  noReviews,
  locale = "sv-SE",
}: TrustBoxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // SPA-navigering: bootstrap-scriptet har redan kört sin första svep, så
    // tvinga om-init av just den här widgeten när den monteras.
    if (ref.current && window.Trustpilot) {
      window.Trustpilot.loadFromElement(ref.current, true);
    }
  }, []);

  if (!businessUnitId) return null;

  return (
    <>
      <Script src={BOOTSTRAP_SRC} strategy="lazyOnload" />
      <div
        ref={ref}
        className={`trustpilot-widget ${className || ""}`.trim()}
        data-locale={locale}
        data-template-id={templateId}
        data-businessunit-id={businessUnitId}
        data-style-height={height}
        data-style-width={width}
        data-theme={theme}
        {...(sku ? { "data-sku": sku } : {})}
        {...(stars ? { "data-stars": stars } : {})}
        {...(noReviews ? { "data-no-reviews": noReviews } : {})}
      >
        {/* Fallback-länk medan scriptet laddar (och för no-JS / crawlers). */}
        <a
          href="https://www.trustpilot.com/review/fyndplats.se"
          target="_blank"
          rel="noopener noreferrer"
        >
          Trustpilot
        </a>
      </div>
    </>
  );
}
