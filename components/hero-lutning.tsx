"use client";

// Hjältens varuvägg följer muspekaren några grader (Leonard 2026-11-17:
// "finslipa den till max"). Väggen står vinklad i CSS (app/startsida.css,
// "Studion"); här sätts bara två tal, --hx och --hy (−1 till 1), som CSS:en
// räknar om till grader. Utan skriptet står väggen i sitt viloläge.
//
// Tre saker som inte ska ändras:
// 1. Talen sätts på .heromosaic, inte på .hero. En egen variabel ärvs, så på
//    .hero räknades stilen om för hela hjälten i varje bildruta.
// 2. Bara med mus eller styrplatta och bara på dator: en telefon har ingen
//    pekare som svävar, och där står brickorna i en rad som rullar.
// 3. Aldrig för den som bett om mindre rörelse.

import { useEffect } from "react";
import { lutning } from "../lib/hero-lutning";

export function HeroLutning() {
  useEffect(() => {
    const hjalte = document.querySelector<HTMLElement>(".hem2 .hero");
    const vagg = hjalte?.querySelector<HTMLElement>(".heromosaic");
    if (!hjalte || !vagg || typeof window.matchMedia !== "function") return;
    if (!window.matchMedia("(hover:hover) and (pointer:fine) and (min-width:881px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion:reduce)").matches) return;

    let ruta = 0;
    let x = 0;
    let y = 0;
    let kant = hjalte.getBoundingClientRect();
    const rita = () => {
      ruta = 0;
      vagg.style.setProperty("--hx", x.toFixed(3));
      vagg.style.setProperty("--hy", y.toFixed(3));
    };
    const begar = () => {
      if (!ruta) ruta = requestAnimationFrame(rita);
    };
    // Hjältens ruta läses när pekaren kommer in, inte vid varje rörelse.
    const in_ = () => {
      kant = hjalte.getBoundingClientRect();
    };
    const flytta = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      x = lutning(e.clientX, kant.left, kant.width);
      y = lutning(e.clientY, kant.top, kant.height);
      begar();
    };
    const lamna = () => {
      x = 0;
      y = 0;
      begar();
    };
    hjalte.addEventListener("pointerenter", in_);
    hjalte.addEventListener("pointermove", flytta, { passive: true });
    hjalte.addEventListener("pointerleave", lamna);
    return () => {
      hjalte.removeEventListener("pointerenter", in_);
      hjalte.removeEventListener("pointermove", flytta);
      hjalte.removeEventListener("pointerleave", lamna);
      if (ruta) cancelAnimationFrame(ruta);
      vagg.style.removeProperty("--hx");
      vagg.style.removeProperty("--hy");
    };
  }, []);
  return null;
}
