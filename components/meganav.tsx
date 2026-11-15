"use client";
import { useEffect, useRef, useState } from "react";
import type { CategoryNode } from "../lib/category-groups";
import { AuctionDot } from "./auction-dot";
import { productCountLabel } from "../lib/rating";
import { grupperaUnderkategorier } from "../lib/meny-grupper";
import { hjalteAdress } from "../lib/meny-bilder";
import { useMenyAntal } from "./use-meny-antal";
import { forvarmMenyBilder, hamtaMenyBilder, MenyBild, useMenyBilder } from "./use-meny-bilder";

// Desktop-nav: huvudkategorierna inline (korta etiketter) + en full-bredds
// mega-meny som fälls ut under headern när man hovrar/fokuserar en kategori.
// Panelen (2026-11-15, Leonards önskan om IKEA-klass): avdelningens miljöfoto
// med namn och "Se alla" till vänster, och underkategorierna under sina
// rubriker med en produktbild var. Produktantal och bilder hämtas i webbläsaren
// (useMenyAntal, useMenyBilder), inte i sidans HTML. Stänger på mouseleave (med
// kort fördröjning så man hinner flytta musen ner i panelen), Escape eller
// efter navigering.
//
// Positionering: panelen är position:absolute med left/right:0 → den ankras mot
// <header> (närmaste positionerade förälder, sticky) och spänner hela bredden,
// oavsett hur djupt den ligger i DOM:en. Ingen portal behövs (till skillnad från
// mobil-drawern som måste undkomma headerns backdrop-filter).
//
// ALLA paneler ligger i HTML:en, dolda med `hidden` tills man hovrar. Förut
// renderades bara den hovrade panelen, och Googlebot hovrar aldrig. Mätt
// 2026-09-24: startsidan länkade till 0 av 105 underkategorier, både i
// server-HTML och renderad i Chromium, och en produktsida till 1. Bara /butik
// (48 av 105) och avdelningssidornas Förfina-chips länkade dit. En
// underkategori hade därmed ungefär samma interna PageRank som en
// medianprodukt, fast sökordskategorierna (TV-bänkar, Golvlampor, Hantlar …)
// ska ranka på ord med tiotusentals sökningar. Med panelerna i HTML länkar
// varje sida till varje underkategori, precis som menyn redan gör för den som
// hovrar. Bilderna kommer först i webbläsaren: en dold panels bilder laddas
// aldrig (loading="lazy" i ett dolt element).

// Kort etikett = första ordet i kategorinamnet ("Elektronik & Tillbehör" → "Elektronik").
function shortLabel(name: string): string {
  return name.split(/\s*&\s*|\s+/)[0];
}

/** Avdelningens foto i panelen: 4:5, 248 px brett på skärmen, dubbelt för skarpa skärmar. */
const FOTO_BREDD = 496;

export function MegaNav({ tree, hasBlog, hasSale }: { tree: CategoryNode[]; hasBlog?: boolean; hasSale?: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  // Sant när man flyttar från en öppen panel till en annan. Då ska panelen inte
  // glida in igen: förut bytte samma element bara innehåll, och animationen
  // spelades bara när menyn öppnades.
  const [byte, setByte] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Antalen kommer från /api/meny-antal, inte ur trädet: trädet skickas utan
  // siffror så att en ny siffra inte gör varje sida "ny" (lib/meny-antal.ts).
  const antal = useMenyAntal();
  // Bilderna från /api/meny-bilder, av samma skäl. De hämtas när webbläsaren är
  // ledig på en dator med mus, och annars senast när en kategori hovras.
  const bilder = useMenyBilder();
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia?.("(hover: hover) and (pointer: fine)").matches) return;
    return forvarmMenyBilder();
  }, []);

  const cancelClose = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setActive(null), 140);
  };
  const open = (i: number) => { cancelClose(); void hamtaMenyBilder(); setByte(active !== null && active !== i); setActive(i); };
  const close = () => { cancelClose(); setActive(null); };

  return (
    <nav
      className={byte ? "meganav byte" : "meganav"}
      aria-label="Kategorier"
      onMouseLeave={scheduleClose}
      onPointerEnter={() => void hamtaMenyBilder()}
      onKeyDown={(e) => { if (e.key === "Escape") close(); }}
    >
      <a className="meganav-shop" href="/butik">Butik</a>
      {tree.map((m, i) => (
        <a
          key={m.id}
          className={`meganav-link ${active === i ? "active" : ""}`}
          href={`/kategori/${m.slug}`}
          aria-haspopup="true"
          aria-expanded={active === i}
          onMouseEnter={() => open(i)}
          onFocus={() => open(i)}
          onClick={close}
        >
          {shortLabel(m.name)}
        </a>
      ))}

      {/* Blogg-länk i desktop-navet (göms tills minst ett inlägg finns, samma
          hasBlog-grind som footern/mobilmenyn). Återanvänder .meganav-link-stilen
          men utan mega-panel (ingen kategori) → bara en vanlig topp-navlänk. */}
      {hasBlog && <a className="meganav-link" href="/blogg" onClick={close}>Blogg</a>}

      {/* Fyndauktionen — glödpricken pulserar under auktionsdagen 07–19. */}
      <a className="meganav-auktion" href="/fyndauktion" onClick={close}>
        Fyndauktionen<AuctionDot />
      </a>

      {/* REA pekade först på /kategori/rea — en kategori som ALDRIG funnits;
          länken 307:ade till /butik, så den som klickade REA fick hela
          sortimentet. Nästa steg blev /alla-produkter?rea=1, som visade rätt
          varor men bara som ett filter i en frågesträng — alltså ingenting
          Google indexerar. Målet är nu /rea (punkt 16): en permanent adress
          med egen titel, egen brödtext och plats i sitemapen.
          Grindad på hasSale av samma skäl som Blogg-länken: är inget nedsatt
          leder knappen till en tom lista, vilket är sämre än ingen knapp.
          Grinden MÅSTE vara samma regel som saleProducts() i lib/rea.ts —
          lib/rea.test.ts håller ihop dem. */}
      {hasSale && <a className="meganav-rea" href="/rea" onClick={close}>REA</a>}

      {tree.map((m, i) => (
        <div
          key={m.id}
          className="meganav-panel"
          role="region"
          aria-label={m.name}
          hidden={active !== i}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="container meganav-panel-inner">
            <Avdelningsfoto
              namn={m.name}
              href={`/kategori/${m.slug}`}
              antal={antal?.[m.slug]}
              foto={bilder?.hjaltar[m.slug]}
              produkt={bilder?.bilder[m.slug]}
              vidKlick={close}
            />
            {m.subs.length > 0 ? (
              <div className="meganav-grid">
                {grupperaUnderkategorier(m.slug, m.subs).map((g) => (
                  <div
                    key={g.rubrik ?? "alla"}
                    className={!g.rubrik ? "meganav-grupp utan-rubrik" : g.subs.length > 7 ? "meganav-grupp bred" : "meganav-grupp"}
                  >
                    {g.rubrik && <p className="meganav-grupp-rubrik">{g.rubrik}</p>}
                    {g.subs.map((s) => (
                      <a key={s.id} className="meganav-sub" href={`/kategori/${s.slug}`} onClick={close}>
                        <MenyBild src={bilder?.bilder[s.slug]} />
                        {/* Antalet står direkt efter namnet, så att ett långt
                            sammansatt ord (Trädgårdsanläggning) får hela bredden. */}
                        <span className="meganav-sub-name">
                          {s.name}
                          {antal?.[s.slug] !== undefined && <span className="meganav-sub-count"> {antal[s.slug]}</span>}
                        </span>
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="meganav-empty">Bläddra hela {m.name.toLowerCase()}.</p>
            )}
          </div>
        </div>
      ))}
    </nav>
  );
}

/**
 * Avdelningens kort till vänster i panelen: miljöfotot (eller avdelningens
 * produktbild när fotot saknas), namnet och vägen till hela avdelningen. Rutan
 * har fast form, så att ingenting flyttar sig när bilden kommer.
 */
function Avdelningsfoto({
  namn, href, antal, foto, produkt, vidKlick,
}: { namn: string; href: string; antal?: number; foto?: string; produkt?: string; vidKlick: () => void }) {
  const fotoAdress = foto ? hjalteAdress(foto, FOTO_BREDD, "4:5") : null;
  return (
    <a className="meganav-feature" href={href} onClick={vidKlick}>
      {fotoAdress ? (
        <MenyBild src={fotoAdress} klass="meganav-feature-bild" />
      ) : (
        <MenyBild src={produkt} klass="meganav-feature-bild meganav-feature-produkt" />
      )}
      <span className="meganav-feature-namn">{namn}</span>
      <span className="meganav-feature-cta">
        Se alla {antal !== undefined ? productCountLabel(antal) : "produkter"} <span aria-hidden="true">→</span>
      </span>
    </a>
  );
}
