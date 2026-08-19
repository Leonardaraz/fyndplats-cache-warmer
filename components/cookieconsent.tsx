"use client";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, writeConsentCookie } from "../lib/consent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("fp_cookie_consent")) setShow(true);
    } catch {}
  }, []);

  const choose = (v: "all" | "necessary") => {
    try { localStorage.setItem("fp_cookie_consent", v); } catch {}
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
