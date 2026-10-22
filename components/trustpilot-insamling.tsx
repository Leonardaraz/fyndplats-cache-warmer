"use client";

// components/trustpilot-insamling.tsx
//
// Omdömessidans knapp för att lämna ett omdöme på Trustpilot (2026-10-22).
// Insamlingsknappen är den enda Trustpilot-widget gratiskontot får visa
// (lib/trustpilot-profil.ts). Widgeten hämtas från Trustpilot och skickar
// visningar dit, så den visas bara med samtycke till alla cookies, som Klarnas
// och Googles moduler (lib/use-marketing-consent.ts). Utan samtycke är den en
// vanlig länk till samma sida hos Trustpilot, och ingenting hämtas därifrån.

import { useMarketingConsent } from "../lib/use-marketing-consent";
import { TRUSTBOX_TEMPLATES, TRUSTPILOT_OMDOME_URL, TRUSTPILOT_PROFIL_ID } from "../lib/trustpilot-profil";
import { TrustBox } from "./trustpilot";

export function TrustpilotInsamling() {
  const samtycke = useMarketingConsent();
  if (!samtycke) {
    return (
      <a className="btn btn-ghost" href={TRUSTPILOT_OMDOME_URL} target="_blank" rel="noopener noreferrer">
        Lämna ett omdöme på Trustpilot
      </a>
    );
  }
  return (
    <TrustBox
      businessUnitId={TRUSTPILOT_PROFIL_ID}
      templateId={TRUSTBOX_TEMPLATES.reviewCollector}
      height="52px"
    />
  );
}
