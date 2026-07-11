"use client";
// Flytande live-pill (endast mobil): flaggskeppets pris + nedräkning följer
// med när man scrollar, som i en riktig auktions-app. Ärver scenens
// CSS-variabler (ligger i .a-stage-trädet) så den glöder i ember-läget.
// Visas efter att man scrollat förbi hjältekortet; mount-gated (klockan).

import { useEffect, useState } from "react";
import type { LiveAuctionView } from "../lib/auction-view";

function fmtLeft(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

export function AuctionLiveBar({ a }: { a: LiveAuctionView }) {
  const [now, setNow] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    const onScroll = () => setScrolled(window.scrollY > 480);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => { clearInterval(t); removeEventListener("scroll", onScroll); };
  }, []);

  if (now === null) return null;
  const startMs = a.startsAt ? Date.parse(a.startsAt) : null;
  const preStart = startMs !== null && startMs > now;
  const target = preStart ? startMs : a.nextDropAt ? Date.parse(a.nextDropAt) : null;
  const msLeft = target ? target - now : null;
  const dropped = a.priceNum < a.listPrice;
  // Timmens progress som en tunn linje i pillens botten (100 % = nästa sänkning;
  // vid golvet ligger den fulltecknad). Före start: hur nära 07 vi är (12h-fönster).
  const windowMs = preStart ? 12 * 3_600_000 : 3_600_000;
  const progress = msLeft === null ? 100 : Math.min(100, Math.max(0, (1 - msLeft / windowMs) * 100));

  return (
    <a className={`a-live-bar${scrolled ? " show" : ""}`} href={`/produkt/${a.slug}`} aria-hidden={!scrolled}>
      <span className="a-lb-progress" style={{ width: `${progress}%` }} aria-hidden="true" />
      <span className="a-lb-flame" aria-hidden="true">🔥</span>
      <span className="a-lb-price">{Math.round(a.priceNum).toLocaleString("sv-SE")} kr</span>
      {dropped && <span className="a-lb-old">{a.listPrice.toLocaleString("sv-SE")} kr</span>}
      <span className="a-lb-timer" suppressHydrationWarning>
        {preStart && msLeft !== null && msLeft > 0
          ? `startar om ${fmtLeft(msLeft)}`
          : msLeft !== null && msLeft > 0
            ? `faller om ${fmtLeft(msLeft)}`
            : "lägsta pris!"}
      </span>
      <span className="a-lb-cta">Köp →</span>
    </a>
  );
}
