"use client";

// Startar hjältens entré när sidan är lugn ("studion vaknar" i
// app/globals.css). Skriptet först i sidan har satt data-entre="vantar" på
// <html>; här byts det till "gar" när tre saker är sanna:
//   1. sidan är väckt (den här effekten körs först då),
//   2. typsnittet och de synliga brickornas bilder är inne och avkodade,
//   3. bildrutorna kommer jämnt (lib/hero-entre.ts).
// Sedan tas attributet bort, och hjälten är stilla som på ett vanligt besök.
//
// ☠️ Tre saker som inte ska ändras:
// 1. Syns varorna redan har väntlägets egen utgång spelat (2,4 s, se
//    globals.css). Då tas attributet bara bort: en entré till hade släckt och
//    tänt varorna en andra gång.
// 2. Väntan på typsnitt och bilder har ett tak. En bild som aldrig kommer får
//    inte hålla varorna dolda.
// 3. Lämnas sidan innan entrén startat tas attributet bort.

import { useEffect } from "react";
import { vantaPaLugn } from "../lib/hero-entre";

/** Längsta väntan på typsnitt och bilder, i ms. */
const VANTA_PA_INNEHALL = 900;
/** Så länge står "gar" kvar: den längsta rörelsen (ljussvepet) är klar efter 2,25 s. */
const ENTRE_KLAR = 2800;

export function HeroEntre() {
  useEffect(() => {
    const rot = document.documentElement;
    if (rot.getAttribute("data-entre") !== "vantar") return;
    const ta_bort = () => {
      if (rot.hasAttribute("data-entre")) rot.removeAttribute("data-entre");
    };
    const forsta = document.querySelector<HTMLElement>(".hem2 .hero .herotile");
    const rad = document.querySelector<HTMLElement>(".hem2 .hero .heromosaic");
    if (!forsta || !rad || typeof requestAnimationFrame !== "function") return ta_bort();
    // Väntlägets egen utgång har redan visat varorna: ingen entré till.
    const synlig = (el: HTMLElement) => Number(getComputedStyle(el).opacity) > 0.5;
    if (synlig(forsta) && synlig(rad)) return ta_bort();

    let avbruten = false;
    let avbrytLugn: (() => void) | null = null;
    let klarTimer = 0;
    const starta = () => {
      if (avbruten || rot.getAttribute("data-entre") !== "vantar") return;
      rot.setAttribute("data-entre", "gar");
      klarTimer = window.setTimeout(ta_bort, ENTRE_KLAR);
    };
    const bilder = [...document.querySelectorAll<HTMLImageElement>(".hem2 .hero .herotile img")].slice(0, 3).map((b) =>
      typeof b.decode === "function"
        ? b.decode().catch(() => {})
        : new Promise<void>((klar) => {
            if (b.complete) return klar();
            b.addEventListener("load", () => klar(), { once: true });
            b.addEventListener("error", () => klar(), { once: true });
          }),
    );
    const typsnitt = document.fonts?.ready?.then(() => {}).catch(() => {}) ?? Promise.resolve();
    const tak = new Promise<void>((klar) => window.setTimeout(klar, VANTA_PA_INNEHALL));
    void Promise.race([Promise.all([typsnitt, ...bilder]), tak]).then(() => {
      if (avbruten) return;
      avbrytLugn = vantaPaLugn(requestAnimationFrame, starta);
    });
    return () => {
      avbruten = true;
      avbrytLugn?.();
      window.clearTimeout(klarTimer);
      ta_bort();
    };
  }, []);
  return null;
}
