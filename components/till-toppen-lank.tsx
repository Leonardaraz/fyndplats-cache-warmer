"use client";

/**
 * Sidfotens egen väg till toppen, bara på mobilen (`.fbar-topp` i globals.css).
 *
 * Den flytande knappen (components/backtotop.tsx) låg ovanpå sidfotens högra
 * länkspalt och, på produktsidan där köpraden lyfter den, ovanpå
 * "Cookie-inställningar". Nu göms den flytande när sidfoten når den, och
 * funktionen finns kvar här i stället.
 *
 * En <button>: det finns ingen adress att gå till. Stilen kommer från
 * `.fbar a,.fbar button`.
 */
export function TillToppenLank() {
  return (
    <button type="button" className="fbar-topp" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      Till toppen <span aria-hidden="true">↑</span>
    </button>
  );
}
