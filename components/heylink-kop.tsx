"use client";

// components/heylink-kop.tsx
//
// Lämnar ordern till Heylink på tacksidan, åt GoWish (Leonard 2026-11-25).
// Bakgrunden står i lib/heylink.ts.
//
// Heylinks skript hämtas bara när ALLT det här gäller:
//
// - servern gav en order (app/tack/page.tsx bygger den bara med samtycke i
//   kakan, och bara i produktion),
// - besökaren har samtyckt till alla cookies också enligt webbläsaren,
// - det finns ett sparat klick från GoWish som inte gått ut
//   (components/heylink-klick.tsx),
// - och den här ordern har inte redan lämnats (F5 på tacksidan).
//
// ☠️ Ordningen är hela poängen: window.hlconversion sätts FÖRE skriptet. Då
// skickar skriptet ordern en gång när det startar. Sätts objektet efteråt går
// det genom en sättare som skriptet lagt upp till fem lyssnare på, och ordern
// skickas lika många gånger.
//
// Skriptet säger till med händelsen heylink:conversion när det har skickat.
// Först då glöms klicket: ett klick ger ett köp, som i Heylinks eget skript.
import { useEffect } from "react";
import { hasMarketingConsent } from "../lib/consent";
import {
  HEYLINK_NYCKEL,
  HEYLINK_SKICKAD,
  HEYLINK_TAGG,
  HEYLINK_TAGG_ID,
  tolkaMarke,
  type HeylinkKop as Kop,
} from "../lib/heylink";

declare global {
  interface Window {
    /** Ordern som Heylinks skript läser (docs.heylink.com/inbound/tracking-guide). */
    hlconversion?: Kop & { hltid: string };
  }
}

export function HeylinkKop({ kop }: { kop: Kop | null }) {
  useEffect(() => {
    if (!kop || !hasMarketingConsent()) return;
    if (document.getElementById(HEYLINK_TAGG_ID)) return;
    let klickId: string;
    try {
      if (window.localStorage.getItem(HEYLINK_SKICKAD) === kop.orderId) return;
      const marke = tolkaMarke(window.localStorage.getItem(HEYLINK_NYCKEL), Date.now());
      if (!marke) return;
      klickId = marke.id;
    } catch {
      return;
    }

    document.addEventListener(
      "heylink:conversion",
      () => {
        try {
          window.localStorage.setItem(HEYLINK_SKICKAD, kop.orderId);
          window.localStorage.removeItem(HEYLINK_NYCKEL);
        } catch {
          // lagringen försvann mellan läsningen och nu: inget att göra
        }
      },
      { once: true },
    );

    window.hlconversion = { ...kop, hltid: klickId };
    const tagg = document.createElement("script");
    tagg.id = HEYLINK_TAGG_ID;
    tagg.src = HEYLINK_TAGG;
    tagg.defer = true;
    document.head.appendChild(tagg);
  }, [kop]);

  return null;
}
