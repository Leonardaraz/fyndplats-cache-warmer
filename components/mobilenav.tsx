"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SearchBox } from "./searchbox";

// Kategorierna ligger högt upp (direkt efter "Butik"), före info-sidorna —
// det är produktnavigeringen folk vill åt först i en butik.
const shopLink = { href: "/butik", label: "Butik" };
const infoLinks = [
  { href: "/omoss", label: "Om oss" },
  { href: "/vanliga-fragor", label: "Vanliga frågor" },
  { href: "/kontaktaoss", label: "Kontakta oss" },
  { href: "/kundtjanst", label: "Kundtjänst" },
];

export function MobileNav({ collections = [], hasBlog = false }: { collections?: { name: string; slug: string }[]; hasBlog?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Render the overlay + drawer via a portal on <body>. The <header> uses
  // backdrop-filter, which makes it a containing block for fixed-position
  // descendants — that would trap this fixed drawer inside the header's box.
  // Portaling to body lets position:fixed resolve against the viewport.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const menu = (
    <>
      <div className={`mobileov ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`mobilemenu ${open ? "open" : ""}`} aria-hidden={!open} inert={!open}>
        <div className="mm-head">
          <strong>Meny</strong>
          <button onClick={() => setOpen(false)} aria-label="Stäng">✕</button>
        </div>
        <SearchBox onNavigate={() => setOpen(false)} />
        <div className="mm-scroll">
          <nav className="mm-links">
            <a href={shopLink.href} onClick={() => setOpen(false)}>{shopLink.label}</a>
          </nav>
          {collections.length > 0 && (
            <div className="mm-cats">
              <div className="mm-cats-head">Kategorier</div>
              {collections.slice(0, 10).map((c) => (
                <a key={c.slug} href={`/kategori/${c.slug}`} onClick={() => setOpen(false)}>
                  {c.name}
                </a>
              ))}
            </div>
          )}
          <nav className="mm-links">
            {hasBlog && <a href="/blogg" onClick={() => setOpen(false)}>Blogg</a>}
            {infoLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
            ))}
          </nav>
        </div>
        <div className="mm-social">
          <a className="soc-ig" href="https://www.instagram.com/fyndplats/" target="_blank" rel="noopener noreferrer" aria-label="Fyndplats på Instagram">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" /></svg>
          </a>
          <a className="soc-fb" href="https://www.facebook.com/profile.php?id=100089607278056" target="_blank" rel="noopener noreferrer" aria-label="Fyndplats på Facebook">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.5l.5-3H14V9.5c0-.3.2-.5.5-.5Z" /></svg>
          </a>
        </div>
      </aside>
    </>
  );

  return (
    <>
      <button className="hamburger" aria-label="Öppna meny" onClick={() => setOpen(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </button>
      {mounted ? createPortal(menu, document.body) : null}
    </>
  );
}
