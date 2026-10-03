"use client";
import { useEffect } from "react";
import { CONSENT_KEY } from "../lib/consent";
import { steg, utanSrsltid, type Miljo } from "../lib/srsltid";

// Tar bort Googles ?srsltid=… ur adressfältet när taggen är klar med den.
// Varför och när står i lib/srsltid.ts.

const INTERVALL_MS = 1000;
// Väljer besökaren aldrig i bannern står koden kvar, som före ändringen.
const MAX_MS = 10 * 60 * 1000;

function taggLaddad(): boolean {
  const w = window as unknown as { google_tag_manager?: unknown; dataLayer?: { push?: unknown } };
  // gtag.js skapar google_tag_manager och byter ut dataLayer.push mot sin egen
  // när den tagit över kön. Något av dem räcker.
  return (
    typeof w.google_tag_manager === "object" ||
    (Array.isArray(w.dataLayer) && w.dataLayer.push !== Array.prototype.push)
  );
}

function samtycke(): string | null {
  try {
    return window.localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

// History.prototype och inte window.history.replaceState. Både Next och Googles
// tagg lägger sig runt metoden på window.history. Provat mot den skarpa sidan
// 2026-09-30: via window.history skickade Google Ads-taggen två extra
// sidvisningar, via prototypen ingen. Next får heller ingen uppdatering, så
// ingenting på sidan renderas om. Next:s eget tillstånd följer med i state,
// så bakåtknappen fungerar som förut.
function ersatt(nySokdel: string): void {
  History.prototype.replaceState.call(
    window.history,
    window.history.state,
    "",
    window.location.pathname + nySokdel + window.location.hash,
  );
}

export function RensaSrsltid() {
  useEffect(() => {
    if (utanSrsltid(window.location.search) === null) return;
    const m: Miljo = {
      sokdel: () => window.location.search,
      ersatt,
      samtycke,
      taggLaddad,
      nu: () => Date.now(),
    };
    const start = Date.now();
    let klarSedan: number | null = null;
    const id = window.setInterval(() => {
      if (Date.now() - start > MAX_MS) {
        window.clearInterval(id);
        return;
      }
      klarSedan = steg(m, klarSedan);
    }, INTERVALL_MS);
    return () => window.clearInterval(id);
  }, []);

  return null;
}
