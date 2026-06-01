// Marknads-/spårningssamtycke. CookieConsent (components/cookieconsent.tsx)
// lagrar användarens val i localStorage["fp_cookie_consent"] = "all" | "necessary".
//
// Meta Pixel + CAPI är marknadsföringsverktyg: de sätter _fbp/_fbc-cookies och
// matchar besökaren mot ett Facebook-konto. De fyrar därför BARA när användaren
// uttryckligen godkänt "alla" cookies. GA4 körs idag ogated, men annons-pixeln
// är känsligare → vi följer kodbasens egen dokumenterade konvention (se
// kommentaren i cookieconsent.tsx: "gated on fp_cookie_consent === 'all'").

export const CONSENT_KEY = "fp_cookie_consent";

// Custom DOM-event som cookieconsent.tsx dispatchar när användaren väljer, så
// att MetaPixel + tracking-hjälparna kan reagera direkt (utan sidladdning).
export const CONSENT_EVENT = "fp-consent-change";

export function hasMarketingConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "all";
  } catch {
    return false;
  }
}
