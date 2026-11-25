"use client";

// Mobilens sidhuvud följer fingret (Leonard 2026-11-24). Räkningen står i
// lib/huvud-gom.ts, och där står också hur det går till: sidhuvudet ligger i
// omslaget .huvudspar (components/site.tsx), och omslagets höjd avgör var
// sidhuvudet lämnar skärmen. Här mäts sidan, och omslagets höjd skrivs när
// rörelsen vänder. Själva rörelsen gör webbläsarens scrollning.
//
// Utan den här koden, över 760 px och i sökläget finns omslaget inte för
// layouten (display:contents i app/globals.css), och sidhuvudet sitter fäst
// överst som förut. Går något fel här är det alltså som det var.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { glidMs, sparAvbrutet, sparFran, sparRast, sparStart, sparSteg, sparVila, synligt, type SparLage, type SparMatt, type Vila } from "../lib/huvud-gom";

/** Telefonen, samma gräns som i app/globals.css. Över 760 px fäster produktsidans
 *  bildgalleri under sidhuvudet (--ankare), och där står sidhuvudet kvar. */
const MOBIL = "(max-width:760px)";
/** Sätts på <html> medan sidhuvudet är helt ur bild. Produktsidans köprad läser den
 *  (components/productview.tsx): utan sidhuvud täcks ingen del av skärmen. */
const BORTA = "data-huvud-borta";
/** Så länge efter den sista rörelsen räknas sidan som stilla. */
const VILA_MS = 130;
/** Fingret släppte: vilan prövas så här snart, i stället för vid nästa hela väntan. */
const SLAPP_MS = 70;
/** Glidet den sista biten börjar stilla, tar fart och bromsar in mjukt.
 *  ☠️ Inte en kurva som börjar i full fart: sidhuvudet har stått still när glidet
 *  börjar, och med cubic-bezier(.22,.7,.3,1) gick det 16–21 px i första bildrutan
 *  (mätt 2026-11-24). Det är samma hopp som Leonard såg i första versionen. */
const GLIDKURVA = "cubic-bezier(.4,0,.2,1)";

export function HuvudGom() {
  const sokvag = usePathname();

  useEffect(() => {
    const rot = document.documentElement;
    const huvud = document.querySelector<HTMLElement>(".huvudspar > .sidhuvud");
    const spar = huvud?.parentElement;
    if (!huvud || !spar) return;
    const mobil = window.matchMedia(MOBIL);
    const lugn = window.matchMedia("(prefers-reduced-motion: reduce)");

    let pa = false;
    let lage: SparLage = { hb: 0, y: 0, rikt: 0 };
    let ram = 0;
    let vilar = 0;
    let fingret = false;
    let glid: Vila | null = null;
    let glidvakt = 0;
    /** Sidhuvudets höjd när omslaget senast skrevs. */
    let hojd = 0;
    let arBorta = false;
    // Sidan landar: från sidbytet tills kunden själv rör den. Det som flyttar
    // sidan under tiden är webbläsaren som ställer tillbaka läget efter
    // bakåtknappen, eller produktsidan som ställer bilden under sidhuvudet.
    // ☠️ Utan det avgjorde ordningen mellan den flytten och den här effekten om
    // sidhuvudet stod framme eller var borta när sidan kom tillbaka.
    let landar = true;

    const matt = (): SparMatt => ({
      y: window.scrollY,
      hojd: window.innerHeight,
      sidhojd: rot.scrollHeight,
      h: huvud.getBoundingClientRect().height,
      // Inte offsetTop: den är avrundad till hela px, och kampanjremsan ovanför är 46,4 px hög.
      topp: spar.getBoundingClientRect().top + window.scrollY,
    });
    const markera = (m: SparMatt) => {
      const borta = pa && synligt(lage.hb, m) <= 0;
      if (borta === arBorta) return;
      arBorta = borta;
      rot.toggleAttribute(BORTA, borta);
    };
    /** Omslagets höjd, och lika mycket tillbaka i marginalen: sidan under flyttar sig aldrig. */
    const skriv = (hb: number, h: number) => {
      spar.style.height = `${hb}px`;
      spar.style.marginBottom = `${h - hb}px`;
      hojd = h;
    };
    const utanGlid = () => {
      if (glidvakt) window.clearTimeout(glidvakt);
      glidvakt = 0;
      huvud.style.transition = "";
      huvud.style.transform = "";
      glid = null;
    };
    /** Sidhuvudet står kvar där det syns just nu, utan glid: ett avbrutet glid hoppar inte.
     *  Hur långt glidet hunnit läses ur transformen. Sidhuvudets läge läses inte: det kan
     *  stå en bildruta efter sidans (sparAvbrutet). Utan DOMMatrixReadOnly läses det ändå. */
    const stanna = () => {
      if (!glid) return;
      const m = matt();
      const hb =
        typeof DOMMatrixReadOnly === "function"
          ? sparAvbrutet(lage, m, new DOMMatrixReadOnly(getComputedStyle(huvud).transform).m42)
          : sparFran(huvud.getBoundingClientRect().bottom, m);
      utanGlid();
      lage = { ...lage, hb };
      skriv(lage.hb, m.h);
      markera(m);
    };
    const klart = () => {
      if (!glid) return;
      const mal = glid;
      const m = matt();
      utanGlid();
      lage = { ...lage, hb: mal.hb };
      skriv(lage.hb, m.h);
      markera(m);
    };
    const vila = () => {
      vilar = 0;
      if (!pa || glid || rot.hasAttribute("data-sok-lage")) return;
      const m = matt();
      if (m.h < 1) return;
      const v = sparVila(lage, m);
      if (!v) {
        // Helt framme eller helt borta: fästet läggs där sidhuvudet står. Inget syns av det,
        // och nästa rörelse tar sidhuvudet med sig från första pixeln (sparRast).
        const hb = sparRast(lage, m);
        if (hb !== lage.hb) {
          lage = { ...lage, hb };
          skriv(hb, m.h);
        }
        return;
      }
      // Till hälften framme: glidet väntar tills fingret släppt.
      if (fingret) {
        vilar = window.setTimeout(vila, VILA_MS);
        return;
      }
      if (lugn.matches) {
        lage = { ...lage, hb: v.hb };
        skriv(lage.hb, m.h);
        markera(m);
        return;
      }
      glid = v;
      const ms = glidMs(v.flytt);
      huvud.style.transition = `transform ${ms}ms ${GLIDKURVA}`;
      huvud.style.transform = `translate3d(0,${v.flytt}px,0)`;
      // transitionend uteblir om fliken göms mitt i glidet: då avslutas det ändå.
      glidvakt = window.setTimeout(klart, ms + 200);
    };
    const rakna = () => {
      ram = 0;
      if (!pa || rot.hasAttribute("data-sok-lage")) return;
      const m = matt();
      if (m.h < 1) return;
      if (landar) {
        fram();
        return;
      }
      if (glid && m.y !== lage.y) stanna();
      const nytt = sparSteg(lage, m);
      if (nytt.hb !== lage.hb) skriv(nytt.hb, m.h);
      lage = nytt;
      markera(m);
      if (vilar) window.clearTimeout(vilar);
      vilar = window.setTimeout(vila, VILA_MS);
    };
    const vidScroll = () => {
      if (!ram) ram = requestAnimationFrame(rakna);
    };
    /** Sidhuvudet helt framme vid sidans läge: från början, efter sökläget och när fokus hamnar i det. */
    const fram = () => {
      // I sökläget finns omslaget inte för layouten och går inte att mäta. När sökläget stängs körs det här igen.
      if (rot.hasAttribute("data-sok-lage")) return;
      const m = matt();
      if (m.h < 1) return;
      utanGlid();
      lage = sparStart(m);
      skriv(lage.hb, m.h);
      markera(m);
    };
    const start = () => {
      if (pa || huvud.getBoundingClientRect().height < 1) return;
      pa = true;
      landar = true;
      // Omslaget får sin ruta först (höjden är sidhuvudets, så inget flyttar sig),
      // sedan mäts var det står i sidan.
      skriv(huvud.getBoundingClientRect().height, huvud.getBoundingClientRect().height);
      spar.setAttribute("data-spar", "");
      fram();
    };
    const stopp = () => {
      pa = false;
      if (ram) cancelAnimationFrame(ram);
      if (vilar) window.clearTimeout(vilar);
      ram = 0;
      vilar = 0;
      utanGlid();
      spar.removeAttribute("data-spar");
      spar.style.height = "";
      spar.style.marginBottom = "";
      arBorta = false;
      rot.removeAttribute(BORTA);
    };
    const vidBredd = () => (mobil.matches ? start() : stopp());
    const rord = () => {
      landar = false;
    };
    const ner = () => {
      fingret = true;
      landar = false;
    };
    const upp = () => {
      fingret = false;
      // Fingret släppte med sidhuvudet till hälften framme: glidet ska inte vänta en hel
      // vila till (mätt: 265 ms från sista rörelsen). Fortsätter sidan av farten kommer en
      // ny rörelse före dess, och väntan börjar om.
      if (!vilar) return;
      window.clearTimeout(vilar);
      vilar = window.setTimeout(vila, SLAPP_MS);
    };
    const vidGlidslut = (e: TransitionEvent) => {
      if (e.target === huvud && e.propertyName === "transform") klart();
    };
    // Sidhuvudets höjd ändras (typsnittet laddas, skärmen vrids): omslaget följer med.
    // Stod sidhuvudet helt framme gör det det efteråt också. Annars står nederkanten kvar.
    const vidStorlek = () => {
      if (!pa || glid || rot.hasAttribute("data-sok-lage")) return;
      const m = matt();
      if (m.h < 1 || m.h === hojd) return;
      if (synligt(lage.hb, { ...m, h: hojd }) >= hojd) {
        fram();
        return;
      }
      lage = sparSteg(lage, m);
      skriv(lage.hb, m.h);
    };
    const storlek = typeof ResizeObserver === "function" ? new ResizeObserver(vidStorlek) : null;
    // Sökläget stängs: sidhuvudet står framme där sidan är, och sidan landar på nytt.
    // ☠️ Remsan och loggans rad kommer tillbaka ovanför, och Chrome flyttar sidan lika
    // mycket för att det kunden ser ska stå still. Räknades den flytten som ett svep
    // ner gled sidhuvudet undan i samma stund som sökläget stängdes.
    const sok = new MutationObserver(() => {
      if (!pa || rot.hasAttribute("data-sok-lage")) return;
      landar = true;
      fram();
    });

    vidBredd();
    window.addEventListener("scroll", vidScroll, { passive: true });
    window.addEventListener("touchstart", ner, { passive: true });
    window.addEventListener("touchend", upp, { passive: true });
    window.addEventListener("touchcancel", upp, { passive: true });
    // Ett smalt fönster på datorn: hjulet, tangenterna och rullningslisten.
    window.addEventListener("wheel", rord, { passive: true });
    window.addEventListener("keydown", rord);
    window.addEventListener("pointerdown", rord, { passive: true });
    huvud.addEventListener("transitionend", vidGlidslut);
    // Tangentbordets fokus i ett sidhuvud som är borta: fram med det.
    huvud.addEventListener("focusin", fram);
    mobil.addEventListener?.("change", vidBredd);
    storlek?.observe(huvud);
    sok.observe(rot, { attributes: true, attributeFilter: ["data-sok-lage"] });
    return () => {
      window.removeEventListener("scroll", vidScroll);
      window.removeEventListener("touchstart", ner);
      window.removeEventListener("touchend", upp);
      window.removeEventListener("touchcancel", upp);
      window.removeEventListener("wheel", rord);
      window.removeEventListener("keydown", rord);
      window.removeEventListener("pointerdown", rord);
      huvud.removeEventListener("transitionend", vidGlidslut);
      huvud.removeEventListener("focusin", fram);
      mobil.removeEventListener?.("change", vidBredd);
      storlek?.disconnect();
      sok.disconnect();
      stopp();
    };
    // En ny sida börjar med sidhuvudet framme och mäter från sitt eget läge.
  }, [sokvag]);

  return null;
}
