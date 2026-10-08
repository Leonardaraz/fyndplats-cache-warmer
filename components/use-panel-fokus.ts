"use client";
import { useEffect, useRef, type RefObject } from "react";

// Tangentbordet i sidopanelerna (meny, varukorg, favoriter). Utan det låg
// fokus kvar på knappen som öppnade panelen, Tab gick till sidhuvudets sökfält
// bakom den och Escape gjorde ingenting (extern audit 2026-10-07).
//
// Öppen panel: fokus flyttas in, Tab och Shift+Tab stannar i panelen och
// Escape stänger. Stängd: fokus går tillbaka dit det var, om det elementet
// finns kvar. Bakgrunden behöver ingen egen spärr, eftersom panelen täcker den
// och Tab inte släpps ut.

const FOKUSBARA =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function usePanelFokus(open: boolean, panel: RefObject<HTMLElement | null>, stang: () => void) {
  const stangRef = useRef(stang);
  useEffect(() => { stangRef.current = stang; });

  useEffect(() => {
    if (!open) return;
    const forra = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const el = panel.current;
    const fokusbara = () =>
      el ? Array.from(el.querySelectorAll<HTMLElement>(FOKUSBARA)).filter((x) => x.offsetParent !== null) : [];
    fokusbara()[0]?.focus({ preventScroll: true });

    const tangent = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); stangRef.current(); return; }
      if (e.key !== "Tab" || !el) return;
      const f = fokusbara();
      if (f.length === 0) return;
      const forsta = f[0];
      const sista = f[f.length - 1];
      const aktiv = document.activeElement;
      if (!el.contains(aktiv)) { e.preventDefault(); forsta.focus(); return; }
      if (e.shiftKey && aktiv === forsta) { e.preventDefault(); sista.focus(); }
      else if (!e.shiftKey && aktiv === sista) { e.preventDefault(); forsta.focus(); }
    };
    document.addEventListener("keydown", tangent);
    return () => {
      document.removeEventListener("keydown", tangent);
      if (forra?.isConnected) forra.focus({ preventScroll: true });
    };
  }, [open, panel]);
}
