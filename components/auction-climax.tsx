"use client";
// "SISTA TIMMEN"-bannern: fälls ut 18:00–19:00 med nedräkning till stängning.
// Egen klientticker; syns aldrig utanför sista timmen.

import { useEffect, useState } from "react";
import { isFinalHour, msToDayEnd } from "../lib/auction-day";

export function AuctionClimax({ startAt }: { startAt: string | null }) {
  // Mount-gated: synligheten beror på klockan (server/klient-mismatch annars).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return null;
  const startMs = startAt ? Date.parse(startAt) : null;
  const show = isFinalHour(startMs, now);
  const left = msToDayEnd(startMs, now);
  const min = left != null ? Math.max(1, Math.ceil(left / 60_000)) : 0;
  return (
    <div className={`a-climax${show ? " show" : ""}`} aria-hidden={!show} suppressHydrationWarning>
      <div className="a-climax-inner">
        <span className="a-climax-badge">SISTA TIMMEN</span>
        <span className="a-climax-txt">
          Lägsta pris just nu – <b>stänger om {min} min</b>
        </span>
      </div>
    </div>
  );
}
