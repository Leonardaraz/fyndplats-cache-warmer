"use client";

// Mobilens sidhuvud glider undan när man scrollar ner och kommer tillbaka så
// fort man scrollar upp (Leonard 2026-11-24). Regeln står i lib/huvud-gom.ts;
// här lyssnas det på sidans rörelse, och läget sätts som data-huvud="gomt" på
// <html>. Stilen (app/globals.css, "Sidhuvudet glider undan") flyttar
// sidhuvudet med transform, bara i mobilens sidhuvud (upp till 900 px).
//
// Ingen React-rendering när sidan rör sig: ett attribut skrivs, och bara när
// läget ändras. Lyssnaren är passiv och räknar en gång per bildruta.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { huvudStart, huvudSteg } from "../lib/huvud-gom";

const ATTRIBUT = "data-huvud";

export function HuvudGom() {
  const sokvag = usePathname();

  useEffect(() => {
    const rot = document.documentElement;
    const matt = () => ({ y: window.scrollY, hojd: window.innerHeight, sidhojd: rot.scrollHeight });
    let lage = huvudStart(matt());
    let ram = 0;
    const rakna = () => {
      ram = 0;
      const nytt = huvudSteg(lage, matt());
      if (nytt.gomt !== lage.gomt) {
        if (nytt.gomt) rot.setAttribute(ATTRIBUT, "gomt");
        else rot.removeAttribute(ATTRIBUT);
      }
      lage = nytt;
    };
    const vidScroll = () => {
      if (!ram) ram = requestAnimationFrame(rakna);
    };
    window.addEventListener("scroll", vidScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", vidScroll);
      if (ram) cancelAnimationFrame(ram);
      rot.removeAttribute(ATTRIBUT);
    };
    // En ny sida börjar med sidhuvudet framme och mäter från sitt eget läge.
  }, [sokvag]);

  return null;
}
