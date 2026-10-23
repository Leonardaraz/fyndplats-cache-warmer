"use client";

// components/trustpilot-insamling.tsx
//
// Omdömessidans knapp för att lämna ett omdöme på Trustpilot (2026-10-22).
// Insamlingsknappen är den enda Trustpilot-widget gratiskontot får visa
// (lib/trustpilot-profil.ts). Widgeten hämtas från Trustpilot och skickar
// visningar dit, så den visas bara med samtycke till alla cookies, som Klarnas
// och Googles moduler (lib/use-marketing-consent.ts). Utan samtycke är den en
// vanlig länk till samma sida hos Trustpilot, och ingenting hämtas därifrån.

import { useEffect, useRef, useState } from "react";
import { useMarketingConsent } from "../lib/use-marketing-consent";
import { TRUSTBOX_TEMPLATES, TRUSTPILOT_OMDOME_URL, TRUSTPILOT_PROFIL_ID } from "../lib/trustpilot-profil";
import { TrustBox } from "./trustpilot";

// Rutan ryms på en rad vid 329 px bredd men inte vid 293 (mätt i Chromium
// 2026-10-22). Smalare bryter Trustpilot texten på två rader, och i en 52 px
// hög ruta kapas den då nedtill. Höjden väljs därför efter platsen rutan
// faktiskt får.
const EN_RAD_PX = 310;

export function TrustpilotInsamling() {
  const samtycke = useMarketingConsent();
  const ref = useRef<HTMLDivElement>(null);
  const [hojd, setHojd] = useState("52px");
  useEffect(() => {
    if (ref.current && ref.current.offsetWidth < EN_RAD_PX) setHojd("72px");
  }, []);

  if (!samtycke) {
    return (
      <div ref={ref} className="tp-insamling">
        <a className="btn btn-ghost" href={TRUSTPILOT_OMDOME_URL} target="_blank" rel="noopener noreferrer">
          Lämna ett omdöme på Trustpilot
        </a>
      </div>
    );
  }
  return (
    <div ref={ref} className="tp-insamling">
      <TrustBox
        businessUnitId={TRUSTPILOT_PROFIL_ID}
        templateId={TRUSTBOX_TEMPLATES.reviewCollector}
        height={hojd}
      />
    </div>
  );
}
