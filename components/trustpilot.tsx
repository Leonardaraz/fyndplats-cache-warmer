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
// laddning) och bara när en widget faktiskt renderas. Sidfoten och produktsidan
// grindar på TRUSTPILOT_BUSINESS_UNIT_ID — är env tom renderas ingen widget och
// inget script begärs (noll extra requests). Omdömessidans insamlingsknapp
// grindar på samtycke (components/trustpilot-insamling.tsx). Se
// docs/trustpilot-setup.md.
//
// Mall-ID:na och profilens adress bor i lib/trustpilot-profil.ts. Den här filen
// exporterar bara komponenten: en serverkomponent kan inte läsa ett värde ur en
// klientmodul (lib/trustpilot-profil.test.ts låser det).

import Script from "next/script";
import { useEffect, useRef } from "react";
import { TRUSTPILOT_PROFIL_URL } from "../lib/trustpilot-profil";

const BOOTSTRAP_SRC =
  "https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js";

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
  /** Widget-template (se TRUSTBOX_TEMPLATES i lib/trustpilot-profil.ts). */
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
          href={TRUSTPILOT_PROFIL_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Trustpilot
        </a>
      </div>
    </>
  );
}
