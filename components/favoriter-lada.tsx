"use client";
// Favoriternas låda. Hämtas först när sidan är ledig (components/deferred.tsx):
// den ligger stängd tills kunden trycker på hjärtat i sidhuvudet.
//
// Raderna (bild, namn, pris, lager, knapp) delas med Mina sidor och står i
// components/favoriter-rader.tsx. Här finns ramen: rubriken med antalet, det
// tomma läget och raden om kontot i foten.
//
// Raderna står i lådan bara medan den är öppen, och medan den glider ut.
// Förut stod de där också i en stängd låda. Butiken frågas först när lådan
// öppnas, så en nytänd favorit väntade där med en puls som aldrig tog slut,
// och sidan ritades om i varje bildruta så länge man stannade på den. Mätt
// 2026-11-15 på www i telefonläge med processorn strypt 4×, en stilla sida
// två sekunder efter ett tryck på ett hjärta: huvudtråden arbetade 248 ms av
// 2 000. Utan pulsen 74 ms (mobilmenyns auktionsprick, se globals.css), och
// utan båda 2 ms.

import { useEffect, useRef, useState } from "react";
import { SYNK_LADA_MS } from "../lib/favoriter";
import { Favoritrader, useFavoritrader } from "./favoriter-rader";
import { useKontolank } from "./konto-lank";
import { usePanelFokus } from "./use-panel-fokus";
import { HjartIkon, useWishlist } from "./wishlist";

/** Lite längre än lådans glidning (0,3 s), så att raderna står kvar tills den är ute. */
const UTGLIDNING_MS = 400;

export function WishlistDrawer() {
  const { count, open, setOpen, inne, markor, synka } = useWishlist();
  const { synlig: kontoOppet } = useKontolank();
  const panelRef = useRef<HTMLDivElement>(null);
  const stang = () => setOpen(false);
  usePanelFokus(open, panelRef, stang);
  const rader = useFavoritrader(open);
  // Raderna kommer med lådan och går när den glidit ut (0,3 s, .drawer i globals.css).
  const [monterad, setMonterad] = useState(false);
  if (open && !monterad) setMonterad(true);
  useEffect(() => {
    if (open || !monterad) return;
    const t = setTimeout(() => setMonterad(false), UTGLIDNING_MS);
    return () => clearTimeout(t);
  }, [open, monterad]);

  // En öppen låda visar kontots lista som den är nu, också det som lagts till på en annan enhet.
  useEffect(() => {
    if (open) synka(SYNK_LADA_MS);
  }, [open, synka]);

  // Kunden har loggat ut: kontots lista lämnade enheten och står kvar på kontot.
  const vantarPaKontot = !inne && markor === "ut";

  return (
    <>
      <div className={`drawer-ov ${open ? "show" : ""}`} onClick={stang} />
      <div ref={panelRef} className={`drawer wl-drawer ${open ? "show" : ""}`} role="dialog" aria-modal="true" aria-label="Mina favoriter" aria-hidden={!open} inert={!open}>
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
          ) : monterad ? (
            <Favoritrader rader={rader} vidLank={stang} foreKop={stang} />
          ) : null}
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
      </div>
    </>
  );
}
