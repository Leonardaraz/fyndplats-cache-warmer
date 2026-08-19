// Marknads-/spårningssamtycke. CookieConsent (components/cookieconsent.tsx)
// lagrar användarens val i localStorage["fp_cookie_consent"] = "all" | "necessary".
//
// Meta Pixel + CAPI är marknadsföringsverktyg: de sätter _fbp/_fbc-cookies och
// matchar besökaren mot ett Facebook-konto. De fyrar därför BARA när användaren
// uttryckligen godkänt "alla" cookies. GA4 körs idag ogated, men annons-pixeln
// är känsligare → vi följer kodbasens egen dokumenterade konvention (se
// kommentaren i cookieconsent.tsx: "gated on fp_cookie_consent === 'all'").

export const CONSENT_KEY = "fp_cookie_consent";

// Samma val speglas i en cookie med samma namn. localStorage räcker för allt
// som körs i webbläsaren, men SERVERN kan inte läsa det — och /tack behöver
// veta valet innan den renderar, eftersom Google-modulens konfiguration
// innehåller kundens e-postadress. Utan cookien hamnar adressen i sidans
// HTML även för den som valt "bara nödvändiga" (granskning 2026-08-19).
//
// Cookien är inte hemlig och sätts från klienten: den bär bara samma "all" |
// "necessary" som redan ligger i localStorage. SameSite=Lax, ett år, ingen
// HttpOnly (klienten måste kunna skriva den).
export const CONSENT_COOKIE = CONSENT_KEY;
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

/** Skriver samtyckescookien. No-op utanför webbläsaren. */
export function writeConsentCookie(value: "all" | "necessary"): void {
  if (typeof document === "undefined") return;
  try {
    // Secure på https. Utan den kan en angripare på ett öppet nät både läsa och
    // SKRIVA värdet över klartext-http, och en påtvingad "all" får servern att
    // bädda in kundens e-post i /tack. Utelämnas på localhost, där http är
    // normalfallet och en secure-cookie tyst inte skulle sättas alls.
    const secure = location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE}; samesite=lax${secure}`;
  } catch {
    /* cookies avstängda → localStorage-vägen får räcka */
  }
}

/**
 * Serverns läsning av samma val. Tar cookiens råvärde.
 *
 * Default är NEKANDE: saknas cookien (förstagångsbesökare, cookies avstängda)
 * behandlas det som "inte samtyckt". Ett utebliven enkätruta är ett mycket
 * mindre fel än en e-postadress i HTML hos någon som sagt nej.
 */
export function marketingConsentFromCookie(raw: string | null | undefined): boolean {
  return String(raw ?? "").trim() === "all";
}

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
