"use client";
import { useRef, useState } from "react";
import type { CategoryNode } from "../lib/category-groups";
import { AuctionDot } from "./auction-dot";
import { productCountLabel } from "../lib/rating";

// Desktop-nav: 8 huvudkategorier inline (korta etiketter) + en full-bredds
// mega-meny som fälls ut under headern när man hovrar/fokuserar en kategori.
// Panelen visar den hovrade kategorins underkategorier i ett luftigt 3–4-koll-
// rutnät med produktantal. Stänger på mouseleave (med kort fördröjning så man
// hinner flytta musen ner i panelen), Escape eller efter navigering.
//
// Positionering: panelen är position:absolute med left/right:0 → den ankras mot
// <header> (närmaste positionerade förälder, sticky) och spänner hela bredden,
// oavsett hur djupt den ligger i DOM:en. Ingen portal behövs (till skillnad från
// mobil-drawern som måste undkomma headerns backdrop-filter).

// Kort etikett = första ordet i kategorinamnet ("Elektronik & Tillbehör" → "Elektronik").
function shortLabel(name: string): string {
  return name.split(/\s*&\s*|\s+/)[0];
}

export function MegaNav({ tree, hasBlog, hasSale }: { tree: CategoryNode[]; hasBlog?: boolean; hasSale?: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setActive(null), 140);
  };
  const open = (i: number) => { cancelClose(); setActive(i); };
  const close = () => { cancelClose(); setActive(null); };

  const current = active !== null ? tree[active] : null;

  return (
    <nav
      className="meganav"
      aria-label="Kategorier"
      onMouseLeave={scheduleClose}
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

      {current && (
        <div
          className="meganav-panel"
          role="region"
          aria-label={current.name}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="container meganav-panel-inner">
            <div className="meganav-panel-head">
              <a className="meganav-panel-title" href={`/kategori/${current.slug}`} onClick={close}>
                {current.name}
              </a>
              <a className="meganav-panel-all" href={`/kategori/${current.slug}`} onClick={close}>
                Se alla {productCountLabel(current.count)} <span aria-hidden="true">→</span>
              </a>
            </div>
            {current.subs.length > 0 ? (
              <div className="meganav-grid">
                {current.subs.map((s) => (
                  <a key={s.id} className="meganav-sub" href={`/kategori/${s.slug}`} onClick={close}>
                    <span className="meganav-sub-name">{s.name}</span>
                    <span className="meganav-sub-count">{s.count}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="meganav-empty">Bläddra hela {current.name.toLowerCase()}.</p>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
