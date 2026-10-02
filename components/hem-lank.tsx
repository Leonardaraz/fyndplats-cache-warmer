"use client";
import type { ReactNode, MouseEvent } from "react";

// Loggan i sidhuvudet. Står kunden redan på startsidan glider sidan upp till
// toppen i stället för att laddas om. En omladdning tonade gamla och nya sidan
// över varandra (med 25 px förskjutning, eftersom fraktraden bara syns överst)
// och spelade inledningsanimationen igen — det såg ut som ett hopp
// (Leonards inspelning 2026-10-01). Länken är fortfarande ett vanligt <a
// href="/">, så den finns i HTML:en och fungerar utan JS och med ny flik.
export function HemLank({ className, children }: { className?: string; children: ReactNode }) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (window.location.pathname !== "/") return;
    e.preventDefault();
    const lugn = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: lugn ? "auto" : "smooth" });
    if (window.location.search || window.location.hash) window.history.replaceState(null, "", "/");
  };
  return (
    // Butiken navigerar med vanliga länkar (hela sidladdningar med
    // view transitions), inte next/link — samma som resten av sidhuvudet.
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a className={className} href="/" onClick={onClick}>
      {children}
    </a>
  );
}
