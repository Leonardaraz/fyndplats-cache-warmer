"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { SearchBox } from "./searchbox";
import { AuctionDot } from "./auction-dot";
import type { CategoryNode } from "../lib/category-groups";
import { grupperaUnderkategorier } from "../lib/meny-grupper";
import { hjalteAdress } from "../lib/meny-bilder";
import { mjukaBindestreck } from "../lib/mjukt-bindestreck";
import { lasSidan } from "../lib/las-sidan";
import { productCountLabel } from "../lib/rating";
import { useMenyAntal } from "./use-meny-antal";
import { forvarmMenyBilder, hamtaMenyBilder, MenyBild, useMenyBilder } from "./use-meny-bilder";
import { usePanelFokus } from "./use-panel-fokus";
import { PersonIkon, useKontolank } from "./konto-lank";

// Mobilmenyn i två steg, som IKEA:s (Leonards skärmbilder 2026-11-15): först
// avdelningarna med en produktbild var, och ett tryck på en avdelning för in
// till dess underkategorier, under sina rubriker och med en bild var. Pilen
// tillbaka (eller Escape) går ett steg upp; krysset stänger. Förut var menyn
// ett dragspel utan bilder där allt fälldes ut i samma lista.
//
// Bilderna och antalen hämtas i webbläsaren (useMenyBilder, useMenyAntal), inte
// i sidans HTML; menyn ritas ändå bara här i webbläsaren. Hämtningen startar när
// webbläsaren är ledig och senast när någon trycker på menyknappen.

const infoLinks = [
  { href: "/omoss", label: "Om oss" },
  { href: "/vanliga-fragor", label: "Vanliga frågor" },
  { href: "/returer", label: "Returer & ångerrätt" },
  { href: "/kontaktaoss", label: "Kontakta oss" },
  { href: "/kundtjanst", label: "Kundtjänst" },
];

/** Avdelningens banderoll överst i steg två: 12:5, hela menyns bredd (högst 430 px), dubbelt för skarpa skärmar. */
const BANDEROLL_BREDD = 860;
/** Så länge glider stegen (globals.css .mm-spar). Efter det töms steg två. */
const GLID_MS = 320;

function Pil({ vanster = false }: { vanster?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={vanster ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Kryss() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function MobileNav({ tree = [], hasBlog = false, hasSale = false }: { tree?: CategoryNode[]; hasBlog?: boolean; hasSale?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Steg två: avdelningen som visas (slug), eller null i första steget. `visad`
  // ligger kvar medan steget glider tillbaka, så att innehållet inte försvinner
  // mitt i rörelsen.
  const [vald, setVald] = useState<string | null>(null);
  const [visad, setVisad] = useState<string | null>(null);
  // "Bli medlem" / "Mitt konto" överst i menyn när kontot är öppet för alla (läget pa).
  const konto = useKontolank();
  // Antalen och bilderna hämtas i webbläsaren; trädet kommer utan dem (lib/meny-antal.ts).
  const antal = useMenyAntal();
  const bilder = useMenyBilder();

  // Render the overlay + drawer via a portal on <body>. The <header> uses
  // backdrop-filter, which makes it a containing block for fixed-position
  // descendants — that would trap this fixed drawer inside the header's box.
  // Portaling to body lets position:fixed resolve against the viewport.
  useEffect(() => setMounted(true), []);
  useEffect(() => forvarmMenyBilder(), []);

  // Sidan bakom står still medan menyn är öppen (lib/las-sidan.ts: låset sitter på html).
  useEffect(() => (open ? lasSidan() : undefined), [open]);

  // En stängd meny börjar om i första steget nästa gång (efter att lådan glidit ut).
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setVald(null);
      setVisad(null);
    }, GLID_MS);
    return () => clearTimeout(t);
  }, [open]);

  const steg2Ref = useRef<HTMLDivElement>(null);
  const tillbakaRef = useRef<HTMLButtonElement>(null);
  const forstaRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => setOpen(false);
  const visa = (slug: string) => {
    setVisad(slug);
    setVald(slug);
    steg2Ref.current?.scrollTo({ top: 0 });
  };
  const tillbaka = () => setVald(null);

  // Fokus följer steget: in → pilen tillbaka, ut → avdelningen man kom ifrån.
  // Bara vid byte av steg; när lådan öppnas sköter usePanelFokus fokus.
  const forraVald = useRef<string | null>(null);
  useEffect(() => {
    const forra = forraVald.current;
    forraVald.current = vald;
    if (!open || forra === vald) return;
    if (vald) {
      tillbakaRef.current?.focus({ preventScroll: true });
      return;
    }
    if (!forra) return;
    forstaRef.current?.querySelector<HTMLElement>(`[data-avd="${CSS.escape(forra)}"]`)?.focus({ preventScroll: true });
    const t = setTimeout(() => setVisad((v) => (v === forra ? null : v)), GLID_MS);
    return () => clearTimeout(t);
  }, [vald, open]);

  const panelRef = useRef<HTMLDivElement>(null);
  // Escape går ett steg tillbaka i steg två och stänger i första steget.
  usePanelFokus(open, panelRef, () => (vald ? tillbaka() : closeMenu()));

  const oppna = () => {
    void hamtaMenyBilder();
    setOpen(true);
  };
  // Trycket börjar en tiondels sekund före klicket: hämta redan då.
  const forvarna = () => {
    void hamtaMenyBilder().then((s) => {
      // Avdelningarnas bilder syns direkt när lådan öppnas; be om dem nu.
      for (const m of tree) {
        const src = s.bilder[m.slug];
        if (src) new Image().src = src;
      }
    });
  };

  const avd = tree.find((m) => m.slug === visad) ?? null;
  const banderoll = avd && bilder?.hjaltar[avd.slug] ? hjalteAdress(bilder.hjaltar[avd.slug], BANDEROLL_BREDD, "12:5") : null;

  const menu = (
    <>
      <div className={`mobileov ${open ? "show" : ""}`} onClick={closeMenu} />
      <div ref={panelRef} className={`mobilemenu ${open ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="Meny" aria-hidden={!open} inert={!open}>
        <div className="mm-spar" data-steg={vald ? "2" : "1"}>
          {/* Steg 1: sök, kontot, snabbvägar och avdelningarna. */}
          <div className="mm-steg" ref={forstaRef} inert={vald !== null}>
            <div className="mm-head">
              <strong>Meny</strong>
              <button type="button" className="mm-ikonknapp" onClick={closeMenu} aria-label="Stäng"><Kryss /></button>
            </div>
            <SearchBox onNavigate={closeMenu} />
            <div className="mm-scroll">
              {konto.synlig && (
                <Link prefetch={false} className="mm-konto" href="/konto" onClick={closeMenu}>
                  <span className="mm-konto-ikon"><PersonIkon storlek={22} /></span>
                  <span className="mm-konto-text">
                    <span className="mm-konto-titel">{konto.text}</span>
                    <span className="mm-konto-under">
                      {konto.inne ? "Dina köp, paket och kvitton" : "Gratis · dina köp, paket och nivå på ett ställe"}
                    </span>
                  </span>
                  <span className="mm-konto-pil" aria-hidden="true">›</span>
                </Link>
              )}
              <nav className="mm-snabb" aria-label="Genvägar">
                <a href="/butik" onClick={closeMenu}>Butik</a>
                <a className="mm-auktion" href="/fyndauktion" onClick={closeMenu}>Fyndauktionen<AuctionDot /></a>
                {/* Se kommentaren i meganav.tsx: /kategori/rea finns inte, och
                    knappen göms när inget är nedsatt. */}
                {hasSale && <a className="mm-rea" href="/rea" onClick={closeMenu}>REA</a>}
              </nav>
              {tree.length > 0 && (
                <nav className="mm-cats" aria-label="Kategorier">
                  <p className="mm-cats-head">Kategorier</p>
                  {tree.map((m) =>
                    m.subs.length > 0 ? (
                      <button
                        type="button"
                        key={m.id}
                        className="mm-avd"
                        data-avd={m.slug}
                        onClick={() => visa(m.slug)}
                        aria-label={`${m.name}: visa underkategorier`}
                      >
                        <MenyBild src={bilder?.bilder[m.slug]} klass="mn-bild mn-bild-stor" lat={false} />
                        <span className="mm-avd-namn">{mjukaBindestreck(m.name)}</span>
                        <span className="mm-avd-pil"><Pil /></span>
                      </button>
                    ) : (
                      <a key={m.id} className="mm-avd" href={`/kategori/${m.slug}`} onClick={closeMenu}>
                        <MenyBild src={bilder?.bilder[m.slug]} klass="mn-bild mn-bild-stor" lat={false} />
                        <span className="mm-avd-namn">{mjukaBindestreck(m.name)}</span>
                        <span className="mm-avd-pil"><Pil /></span>
                      </a>
                    ),
                  )}
                </nav>
              )}
              <nav className="mm-links" aria-label="Information">
                {hasBlog && <a href="/blogg" onClick={closeMenu}>Blogg</a>}
                {infoLinks.map((l) => (
                  <a key={l.href} href={l.href} onClick={closeMenu}>{l.label}</a>
                ))}
              </nav>
              <div className="mm-social">
                <a className="soc-ig" href="https://www.instagram.com/fyndplats/" target="_blank" rel="noopener noreferrer" aria-label="Fyndplats på Instagram">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" /><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" /></svg>
                </a>
                <a className="soc-fb" href="https://www.facebook.com/profile.php?id=100089607278056" target="_blank" rel="noopener noreferrer" aria-label="Fyndplats på Facebook">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.5l.5-3H14V9.5c0-.3.2-.5.5-.5Z" /></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Steg 2: en avdelning, med "Se alla" och underkategorierna under sina rubriker. */}
          <div className="mm-steg mm-steg-2" inert={vald === null} aria-hidden={vald === null}>
            {avd ? (
              <>
                <div className="mm-head mm-head-2">
                  <button type="button" ref={tillbakaRef} className="mm-ikonknapp" onClick={tillbaka} aria-label="Tillbaka till alla kategorier"><Pil vanster /></button>
                  <strong className="mm-head-titel">{avd.name}</strong>
                  <button type="button" className="mm-ikonknapp" onClick={closeMenu} aria-label="Stäng"><Kryss /></button>
                </div>
                <div className="mm-scroll" ref={steg2Ref}>
                  {/* Avdelningens miljöfoto som banderoll; saknas fotot står avdelningens
                      produktbild bredvid texten, som på datorns kort. */}
                  <a className={banderoll ? "mm-alla" : "mm-alla mm-alla-utan-foto"} href={`/kategori/${avd.slug}`} onClick={closeMenu}>
                    {banderoll ? (
                      <MenyBild src={banderoll} klass="mm-alla-bild" lat={false} />
                    ) : (
                      <MenyBild src={bilder?.bilder[avd.slug]} klass="mn-bild mn-bild-stor" lat={false} />
                    )}
                    <span className="mm-alla-text">
                      <span className="mm-alla-titel">Se alla i {avd.name}</span>
                      <span className="mm-alla-antal">
                        {antal?.[avd.slug] !== undefined ? productCountLabel(antal[avd.slug]) : "Hela avdelningen"}
                      </span>
                    </span>
                    <span className="mm-avd-pil"><Pil /></span>
                  </a>
                  {grupperaUnderkategorier(avd.slug, avd.subs).map((g) => (
                    <div key={g.rubrik ?? "alla"} className="mm-grupp">
                      {g.rubrik && <p className="mm-grupp-rubrik">{g.rubrik}</p>}
                      {g.subs.map((s) => (
                        <a key={s.id} className="mm-sub" href={`/kategori/${s.slug}`} onClick={closeMenu}>
                          <MenyBild src={bilder?.bilder[s.slug]} />
                          <span className="mm-sub-namn">{mjukaBindestreck(s.name)}</span>
                          {antal?.[s.slug] !== undefined && <span className="mm-sub-count">{antal[s.slug]}</span>}
                        </a>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button className="hamburger" aria-label="Öppna meny" onPointerDown={forvarna} onClick={oppna}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </button>
      {mounted ? createPortal(menu, document.body) : null}
    </>
  );
}
