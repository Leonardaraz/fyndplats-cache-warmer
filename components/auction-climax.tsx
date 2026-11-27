"use client";
// "SISTA TIMMEN"-bannern: fälls ut 18:00–19:00 med nedräkning till stängning.
// Går på sidans gemensamma sekundklocka; syns aldrig utanför sista timmen.
//
// Servern ritar bannern i det läge som gäller när sidan byggs (nuMs), och den
// första renderingen i webbläsaren använder samma tid, så att HTML:en och
// hydreringen är lika. Förut ritades den först efter mount: sista timmen fälldes
// den då ut när sidan redan stod, och dagens fynd hoppade ner 129 px på en
// telefon (CLS 0,13, mätt 2026-11-26). Utanför sista timmen står behållaren tom
// i sidan, så att ingen text om stängningen hamnar i HTML:en.

import { isFinalHour, msToDayEnd } from "../lib/auction-day";
import { useClientNow } from "./use-client-now";

export function AuctionClimax({ startAt, nuMs }: { startAt: string | null; nuMs: number }) {
  const { nowMs: now } = useClientNow(nuMs, 1000);
  const startMs = startAt ? Date.parse(startAt) : null;
  const show = isFinalHour(startMs, now);
  const left = msToDayEnd(startMs, now);
  const min = left != null ? Math.max(1, Math.ceil(left / 60_000)) : 0;
  return (
    <div className={`a-climax${show ? " show" : ""}`} aria-hidden={!show} suppressHydrationWarning>
      {show && (
        <div className="a-climax-inner">
          <span className="a-climax-badge">SISTA TIMMEN</span>
          <span className="a-climax-txt">
            Lägsta pris just nu – <b>stänger om {min} min</b>
          </span>
        </div>
      )}
    </div>
  );
}
