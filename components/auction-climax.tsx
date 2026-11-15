"use client";
// "SISTA TIMMEN"-bannern: fälls ut 18:00–19:00 med nedräkning till stängning.
// Går på sidans gemensamma sekundklocka; syns aldrig utanför sista timmen.

import { isFinalHour, msToDayEnd } from "../lib/auction-day";
import { useClientNow } from "./use-client-now";

export function AuctionClimax({ startAt }: { startAt: string | null }) {
  // Mount-gated: synligheten beror på klockan (server/klient-mismatch annars).
  const { nowMs: now, mounted } = useClientNow(0, 1000);
  if (!mounted) return null;
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
