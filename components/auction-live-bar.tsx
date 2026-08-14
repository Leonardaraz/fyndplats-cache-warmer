"use client";
// Flytande live-pill (endast mobil): flaggskeppets pris + nedräkning följer
// med när man scrollar, som i en riktig auktions-app. Ärver scenens
// CSS-variabler (ligger i .a-stage-trädet) så den glöder i ember-läget.
// Visas efter att man scrollat förbi hjältekortet; mount-gated (klockan).
//
// Klockan kommer från useAuctionClock (som stryper hämtningarna på modulnivå
// så alla korten tillsammans ändå bara ger en route-hämtning). Granskningen
// 2026-08-14 fällde pillens gamla fallback: när en sänkning var SEN visade
// den "lägsta pris!" mitt på dagen (falskt golv-påstående) medan korten
// intill sa "Priset uppdateras…". Nu delar alla samma fasmaskin. Efter
// stängning (ended) döljs pillen helt — det finns inget att jaga.

import { useEffect, useState } from "react";
import type { LiveAuctionView } from "../lib/auction-view";
import { PRESTART_WINDOW_MS, fmtLeft } from "../lib/auction-day";
import { useAuctionClock } from "./use-auction-clock";

export function AuctionLiveBar({ a }: { a: LiveAuctionView }) {
  const { phase, msLeft } = useAuctionClock(a);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 480);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  // Före mount saknas msLeft (den beror på klientklockan). Utan den här grinden
  // föll rendern igenom till "lägsta pris!" — alltså ett falskt golvpåstående i
  // serverns HTML mitt under en nedräkning, samma fel pillen fällts för förut
  // (granskning 2026-08-14). Pillen är ändå dold tills man scrollat.
  if (phase === "ended" || msLeft === null) return null;
  const preStart = phase === "pre";
  const dropped = a.priceNum < a.listPrice;
  // Timmens progress som en tunn linje i pillens botten (100 % = nästa sänkning;
  // vid golvet ligger den fulltecknad). Före start: hur nära 07 vi är (12h-fönster).
  // Före start mäts hur nära 07 vi är över NATTENS längd (19→07), inte dagens
  // — de är lika bara så länge dagen råkar vara 12 h (granskningsfynd).
  const windowMs = preStart ? PRESTART_WINDOW_MS : 3_600_000;
  const progress =
    phase === "floor" || phase === "stale" || msLeft === null
      ? 100
      : Math.min(100, Math.max(0, (1 - msLeft / windowMs) * 100));

  return (
    <a className={`a-live-bar${scrolled ? " show" : ""}`} href={`/produkt/${a.slug}`} aria-hidden={!scrolled}>
      <span className="a-lb-progress" style={{ width: `${progress}%` }} aria-hidden="true" />
      <span className="a-lb-flame" aria-hidden="true">🔥</span>
      <span className="a-lb-price">{Math.round(a.priceNum).toLocaleString("sv-SE")} kr</span>
      {dropped && <span className="a-lb-old">{a.listPrice.toLocaleString("sv-SE")} kr</span>}
      <span className="a-lb-timer" suppressHydrationWarning>
        {preStart && msLeft !== null
          ? `startar om ${fmtLeft(msLeft)}`
          : phase === "countdown" && msLeft !== null
            ? `faller om ${fmtLeft(msLeft)}`
            : phase === "stale"
              ? "uppdateras…"
              : "lägsta pris!"}
      </span>
      <span className="a-lb-cta">Köp →</span>
    </a>
  );
}
