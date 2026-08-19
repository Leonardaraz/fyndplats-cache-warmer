"use client";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, hasMarketingConsent } from "./consent";

// Delad prenumeration på marknadssamtycke. Bruten ur components/metapixel.tsx
// 2026-08-19 när Google-modulen behövde exakt samma sak — två identiska
// kopior av lyssnarparet hade drivit isär vid första ändring av semantiken.
//
// Ligger i EGEN fil, inte i lib/consent.ts: den filen importeras även från
// server-kod (app/api/newsletter-signup) och får därför inte bära "use client"
// eller React-beroenden.

/**
 * True när användaren godkänt "alla" cookies.
 *
 * Startar false på servern och vid första klientrender (localStorage finns
 * inte under SSR), och uppdateras i en effekt. Lyssnar på fp-consent-change
 * (dispatchas av cookieconsent.tsx) så ett klick på "Godkänn alla" slår igenom
 * direkt utan sidladdning, samt på storage för samtycke givet i annan flik.
 */
export function useMarketingConsent(): boolean {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    const sync = () => setConsent(hasMarketingConsent());
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return consent;
}
