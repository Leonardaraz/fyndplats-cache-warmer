"use client";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, CONSENT_KEY, writeConsentCookie } from "../lib/consent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const val = localStorage.getItem(CONSENT_KEY);
      if (!val) {
        setShow(true);
        return;
      }
      // SPEGLA OM VID VARJE BESÖK, inte bara när knappen klickas.
      //
      // Två fall som annars aldrig får någon cookie (granskning 2026-08-19):
      //
      //  1. Alla som redan sagt ja före den här deployen. De har localStorage
      //     men ingen cookie, och bannern visas aldrig igen — så `choose` körs
      //     aldrig och servern skulle för evigt tro att de tackat nej.
      //  2. Safari. WebKit kapar cookies satta via document.cookie till 7 dagar
      //     medan localStorage överlever, så cookien försvinner tyst efter en
      //     vecka. Omspeglingen sätter tillbaka den.
      if (val === "all" || val === "necessary") writeConsentCookie(val);
    } catch {}
  }, []);

  const choose = (v: "all" | "necessary") => {
    try { localStorage.setItem(CONSENT_KEY, v); } catch {}
    // Spegla valet i en cookie så SERVERN kan se det. /tack behöver veta det
    // innan sidan renderas — se noten i lib/consent.ts.
    writeConsentCookie(v);
    // Notify marketing scripts (Meta Pixel + CAPI) so de kan starta/stoppa
    // direkt utan sidladdning. Gated on localStorage.fp_cookie_consent === "all".
    try { window.dispatchEvent(new Event(CONSENT_EVENT)); } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="cookiebar" role="dialog" aria-label="Cookie-samtycke" aria-live="polite">
      <div className="cookiehead">
        <span className="cookie-icon" aria-hidden>🍪</span>
        <strong>Cookies på Fyndplats</strong>
      </div>
      <p className="cookietext">
        Vi använder cookies för varukorg, önskelista och statistik. Du väljer vad du godkänner – läs mer i vår{" "}
        <a href="/sekretesspolicy">sekretesspolicy</a>.
      </p>
      <div className="cookiebtns">
        <button className="ck-ghost" onClick={() => choose("necessary")}>Endast nödvändiga</button>
        <button className="ck-primary" onClick={() => choose("all")}>Godkänn alla</button>
      </div>
    </div>
  );
}
