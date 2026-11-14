"use client";
// Favoriternas låda. Hämtas först när sidan är ledig (components/deferred.tsx):
// den ligger stängd tills kunden trycker på hjärtat i sidhuvudet.
//
// Raderna (bild, namn, pris, lager, knapp) delas med Mina sidor och står i
// components/favoriter-rader.tsx. Här finns ramen: rubriken med antalet, det
// tomma läget och raden om kontot i foten.

import { useEffect, useRef } from "react";
import { SYNK_LADA_MS } from "../lib/favoriter";
import { Favoritrader, useFavoritrader } from "./favoriter-rader";
import { useKontolank } from "./konto-lank";
import { usePanelFokus } from "./use-panel-fokus";
import { HjartIkon, useWishlist } from "./wishlist";

export function WishlistDrawer() {
  const { count, open, setOpen, inne, markor, synka } = useWishlist();
  const { synlig: kontoOppet } = useKontolank();
  const panelRef = useRef<HTMLElement>(null);
  const stang = () => setOpen(false);
  usePanelFokus(open, panelRef, stang);
  const rader = useFavoritrader(open);

  // En öppen låda visar kontots lista som den är nu, också det som lagts till på en annan enhet.
  useEffect(() => {
    if (open) synka(SYNK_LADA_MS);
  }, [open, synka]);

  // Kunden har loggat ut: kontots lista lämnade enheten och står kvar på kontot.
  const vantarPaKontot = !inne && markor === "ut";

  return (
    <>
      <div className={`drawer-ov ${open ? "show" : ""}`} onClick={stang} />
      <aside ref={panelRef} className={`drawer wl-drawer ${open ? "show" : ""}`} role="dialog" aria-modal="true" aria-label="Mina favoriter" aria-hidden={!open} inert={!open}>
        <div className="drawer-head">
          <strong className="fav-rubrik">
            Mina favoriter
            {count > 0 ? <span className="fav-antal" aria-label={`${count} st`}>{count}</span> : null}
          </strong>
          <button className="drawer-x" onClick={stang} aria-label="Stäng">✕</button>
        </div>
        <div className="drawer-body">
          {count === 0 ? (
            <div className="fav-tom">
              <span className="fav-tom-ikon"><HjartIkon storlek={28} /></span>
              <strong className="fav-tom-rubrik">{vantarPaKontot ? "Dina favoriter finns på ditt konto" : "Inga favoriter än"}</strong>
              <p>{vantarPaKontot ? "Logga in, så står de här igen." : "Tryck på hjärtat på en vara du gillar, så sparas den här."}</p>
              {vantarPaKontot ? (
                <a className="fav-kop" href="/konto" onClick={stang}>Logga in</a>
              ) : (
                <a className="fav-kop" href="/butik" onClick={stang}>Upptäck sortimentet</a>
              )}
            </div>
          ) : (
            <Favoritrader rader={rader} vidLank={stang} foreKop={stang} />
          )}
        </div>
        {count === 0 ? null : inne && markor === "1" ? (
          <p className="fav-fot">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            <span>Sparade på ditt konto.</span>
            <a href="/konto#favoriter" onClick={stang}>Visa på Mina sidor</a>
          </p>
        ) : !inne && kontoOppet ? (
          <p className="fav-fot">
            <span>Logga in, så följer favoriterna med till alla dina enheter.</span>
            <a href="/konto" onClick={stang}>Logga in eller bli medlem</a>
          </p>
        ) : null}
      </aside>
    </>
  );
}
