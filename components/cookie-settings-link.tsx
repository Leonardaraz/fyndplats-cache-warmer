"use client";
import { reopenConsentBanner } from "../lib/consent";

/**
 * Sidfotens väg tillbaka till samtyckesbannern.
 *
 * En <button> och inte en <a>: det finns ingen adress att gå till, och en
 * länk utan mål är fel för både tangentbord och skärmläsare. Stilen matchar
 * grannlänkarna via `.fbar a,.fbar button` i globals.css.
 */
export function CookieSettingsLink() {
  return (
    <button type="button" onClick={reopenConsentBanner}>
      Cookie-inställningar
    </button>
  );
}
