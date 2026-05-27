"use client";
import { useEffect, useState } from "react";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("fp_cookie_consent")) setShow(true);
    } catch {}
  }, []);

  const choose = (v: "all" | "necessary") => {
    try { localStorage.setItem("fp_cookie_consent", v); } catch {}
    setShow(false);
    // Any future analytics/marketing scripts should be gated on
    // localStorage.fp_cookie_consent === "all".
  };

  if (!show) return null;

  return (
    <div className="cookiebar" role="dialog" aria-label="Cookie-samtycke" aria-live="polite">
      <p className="cookietext">
        Vi använder cookies för att ge dig en bättre upplevelse och en fungerande varukorg. Du väljer
        själv vad du godkänner – läs mer i vår <a href="/sekretesspolicy">sekretesspolicy</a>.
      </p>
      <div className="cookiebtns">
        <button className="ck-ghost" onClick={() => choose("necessary")}>Endast nödvändiga</button>
        <button className="ck-primary" onClick={() => choose("all")}>Godkänn alla</button>
      </div>
    </div>
  );
}
