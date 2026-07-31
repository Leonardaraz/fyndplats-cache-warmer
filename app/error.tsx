"use client"; // Error boundaries måste vara klientkomponenter.

import { useEffect } from "react";

// Fångar oväntade fel i sidor/layouter UNDER rot-layouten — dvs allt utom
// själva rot-layouten (den täcks av global-error.tsx). Utan den här filen fick
// kunden Next.js standardskärm: engelsk, grå, utan väg tillbaka till butiken.
//
// Header och footer renderas fortfarande, eftersom error.tsx ligger inuti
// rot-layouten. Kunden behåller alltså meny, sök och kundvagn.
//
// OBS: proppen heter `unstable_retry` i den här Next-versionen, INTE `reset`
// (se node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/
// error.md). `reset` finns kvar men rör bara om utan att hämta om innehållet —
// för ett tillfälligt Wix-fel är omhämtning precis vad vi vill ha.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Hamnar i Vercels runtime-loggar. I produktion är `message` generisk för
    // serverfel — `digest` är nyckeln som matchar mot serverloggen.
    console.error("[error-boundary]", error.digest ?? "", error);
  }, [error]);

  return (
    <div className="container nf-wrap">
      <div className="nf">
        <div className="nf-num">Oj då</div>
        <h1 className="nf-title">Något gick fel</h1>
        <p className="nf-text">
          Ett tillfälligt fel gjorde att sidan inte kunde visas. Det är nästan
          alltid övergående – försök igen, så brukar det lösa sig.
        </p>
        <div className="nf-actions">
          <button className="btn btn-primary" type="button" onClick={() => unstable_retry()}>
            Försök igen
          </button>
          <a className="btn btn-ghost" href="/butik">Se hela sortimentet</a>
        </div>
        <div className="nf-cats">
          <div className="nf-cats-label">Behöver du hjälp?</div>
          <div className="nf-cats-row">
            <a href="/">Startsidan</a>
            <a href="/kontaktaoss">Kontakta oss</a>
            <a href="/kundtjanst">Kundtjänst</a>
          </div>
        </div>
        {/* digest kopplar kundens skärmdump till rätt rad i Vercel-loggen.
            Renderas bara när Next faktiskt satt den (serverfel), och med
            inline-stil för att slippa en ny CSS-klass för ett hörnfall. */}
        {error.digest && (
          <p style={{ marginTop: 18, fontSize: 13, color: "var(--soft)" }}>
            Felkod: <code>{error.digest}</code>
          </p>
        )}
      </div>
    </div>
  );
}
