"use client";

// Ett tryck på en produkt öppnar sidan med bilderna överst, precis under
// sidhuvudet (Leonard 2026-10-07). Gäller bara när sidan staplas (mobil och
// smal surfplatta); på dator står bilderna redan bredvid texten högst upp.
// Bakgrund och signaler: lib/sidminne.ts.

import { useLayoutEffect } from "react";
import { KLICK_NYCKEL, klickadeHit, type Fonster } from "../lib/sidminne";

/** Rullar direkt till y. html har scroll-behavior:smooth, och en glidande
 *  färd är just det kunden inte ska se. Glidet stängs av för det här anropet
 *  i stället för att skicka behavior:"instant", som äldre Safari avvisar med
 *  ett TypeError. */
export function rullaDirekt(y: number): void {
  const html = document.documentElement;
  const fore = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  window.scrollTo(0, Math.max(0, Math.round(y)));
  html.style.scrollBehavior = fore;
}

/** Luft mellan sidhuvudet och bildernas överkant. */
const LUFT = 12;

export function useLandaVidBilder(): void {
  useLayoutEffect(() => {
    const w = window as unknown as Fonster;
    if (!klickadeHit(w, location.pathname, Date.now())) return;
    // Signalen förbrukas, så ett senare byte av färg på samma sida inte flyttar
    // något. Tidsstämpeln står kvar: komMedHistoriken läser den.
    w.__fpKlick = { p: "", t: w.__fpKlick!.t };
    // Reservkopian för en hel sidladdning behövs inte heller (LANDA_SKRIPT).
    try { sessionStorage.removeItem(KLICK_NYCKEL); } catch { /* ingen lagring */ }
    if (location.hash || !matchMedia("(max-width: 760px)").matches) return;
    // Mikrouppgiften körs när hela renderingen är klar men före nästa bild.
    // Nexts egen scroll till sidans topp görs i samma rendering, efter den här
    // effekten, och hade annars ätit upp vår.
    queueMicrotask(() => {
      const g = document.querySelector<HTMLElement>(".pdp > .gallery");
      if (!g) return;
      const till = () => {
        const huvud = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
        return Math.max(0, Math.round(scrollY + g.getBoundingClientRect().top - Math.max(0, huvud) - LUFT));
      };
      // Sidhuvudet sitter under kampanjraden tills sidan rullats, så avståndet
      // mäts om en gång efter första flytten.
      rullaDirekt(till());
      const igen = till();
      if (Math.abs(igen - scrollY) > 1) rullaDirekt(igen);
    });
  }, []);
}
