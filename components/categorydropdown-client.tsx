"use client";
import { useEffect, useRef, useState } from "react";
import type { CategoryNode } from "../lib/category-groups";

// Premium "Kategorier ▾"-dropdown:
//   • Stängd: en enda knapp som visar aktiv kategori eller "Alla kategorier" + antal.
//   • Öppen: en panel under knappen med 2-nivå-träd – huvudkategorier som rubriker,
//     subkategorier indragna med count-badges. Aktiv kategori markeras i orange.
//   • Mobil: panel slår om till en bottom-sheet (full-bredd, slide-up + backdrop).
//   • Stänger på Escape, klick utanför eller efter navigering.
//
// Länkar går till /kategori/[slug] (eller /alla-produkter för "Alla") – samma URL-
// struktur som tidigare CatNav, så SEO och bakåt-länkar bevaras.
export function CategoryDropdownClient({ tree, totalProducts, activeSlug }: {
  tree: CategoryNode[];
  totalProducts: number;
  activeSlug?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Hitta vad knappen ska visa när stängd
  let activeLabel = "Alla kategorier";
  let activeCount: number | null = totalProducts;
  if (activeSlug) {
    for (const root of tree) {
      if (root.slug === activeSlug) { activeLabel = root.name; activeCount = root.count; break; }
      const sub = root.subs.find((s) => s.slug === activeSlug);
      if (sub) { activeLabel = sub.name; activeCount = sub.count; break; }
    }
  }

  // Stäng vid klick utanför + Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    // Förhindra body scroll på mobil när bottom-sheet är öppen
    const prev = document.body.style.overflow;
    if (window.innerWidth <= 760) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const isActive = (slug?: string) => !!slug && slug === activeSlug;

  return (
    <div className={`catdrop ${open ? "open" : ""}`} ref={wrapRef}>
      <button
        type="button"
        className="catdrop-btn"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="catdrop-panel"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="catdrop-btn-lbl">
          <span className="catdrop-btn-pre">Kategori:</span>
          <span className="catdrop-btn-name">{activeLabel}</span>
        </span>
        {activeCount !== null && <span className="catdrop-btn-count">{activeCount}</span>}
        <span className="catdrop-btn-caret" aria-hidden="true">⌄</span>
      </button>

      {open && (
        <>
          <div className="catdrop-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="catdrop-panel" id="catdrop-panel" role="dialog" aria-label="Kategorier">
            <div className="catdrop-panel-head">
              <span>Alla kategorier</span>
              <button type="button" className="catdrop-close" aria-label="Stäng kategorier" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="catdrop-panel-body">
              <a
                className={`catdrop-all ${!activeSlug ? "active" : ""}`}
                href="/alla-produkter"
                onClick={() => setOpen(false)}
              >
                <span>Alla produkter</span>
                <span className="catdrop-count">{totalProducts}</span>
              </a>

              <div className="catdrop-tree">
                {tree.map((root) => (
                  <div className="catdrop-group" key={root.id}>
                    <a
                      className={`catdrop-main ${isActive(root.slug) ? "active" : ""}`}
                      href={`/kategori/${root.slug}`}
                      onClick={() => setOpen(false)}
                    >
                      <span className="catdrop-main-name">{root.name}</span>
                      <span className="catdrop-count">{root.count}</span>
                    </a>
                    {root.subs.length > 0 && (
                      <ul className="catdrop-subs">
                        {root.subs.map((s) => (
                          <li key={s.id}>
                            <a
                              className={`catdrop-sub ${isActive(s.slug) ? "active" : ""}`}
                              href={`/kategori/${s.slug}`}
                              onClick={() => setOpen(false)}
                            >
                              <span className="catdrop-sub-name">{s.name}</span>
                              <span className="catdrop-count">{s.count}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
