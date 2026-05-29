"use client";
import { useEffect, useRef, useState } from "react";

// Klient-skal runt den svepbara kategori-raden.
//
// 1. Pil-knappar (‹ ›) som dyker upp när raden svämmar över — på desktop går
//    det annars inte att nå de kategorier som ligger utanför kanten (mus kan
//    inte "svepa" och scrollbaren är dold). På mobil räcker touch-svep, så
//    pilarna göms där via CSS.
// 2. Auto-centrerar den aktiva kategorin i raden vid laddning (justerar bara
//    radens egen horisontella scroll — ingen page-jump).
export function CatNavRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const sync = () => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Centrera aktiv kategori
    const active = el.querySelector<HTMLElement>(".catchip.active");
    if (active) {
      const elRect = el.getBoundingClientRect();
      const aRect = active.getBoundingClientRect();
      el.scrollLeft += aRect.left - elRect.left - (el.clientWidth - aRect.width) / 2;
    }
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="catnav-scroller">
      <button
        type="button"
        className={`catnav-arrow left ${atStart ? "off" : ""}`}
        aria-label="Visa föregående kategorier"
        tabIndex={atStart ? -1 : 0}
        onClick={() => nudge(-1)}
      >
        ‹
      </button>
      <div className="catnav-main" ref={ref} role="navigation" aria-label="Kategorier">
        {children}
      </div>
      <button
        type="button"
        className={`catnav-arrow right ${atEnd ? "off" : ""}`}
        aria-label="Visa fler kategorier"
        tabIndex={atEnd ? -1 : 0}
        onClick={() => nudge(1)}
      >
        ›
      </button>
    </div>
  );
}
