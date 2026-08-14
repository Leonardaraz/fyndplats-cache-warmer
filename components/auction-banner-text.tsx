"use client";
// Startsidans auktionsbanner-text. KLIENTKOMPONENT av ett enda skäl: startsidan
// har ISR-fönster på en timme och auktionsrotationen kl 19 invaliderar den inte
// (bara order-webhooken gör det, och bara /fyndauktion). En serverberäknad
// "pågår"-flagga frös därför in i HTML:en och kunde påstå "priset sjunker just
// nu" långt efter stängning på en lugn kväll — precis det granskningen
// 2026-08-14 fällde bannern för. Med klientens klocka självkorrigerar texten
// hos varje besökare, oavsett hur gammal den cachade sidan är.
//
// Serverns text renderas som utgångsläge (samma fasberäkning, serverns klocka)
// så att SSR-HTML och klientens första render är identiska — ingen hydrerings-
// mismatch, och crawlern får riktig text.

import { useEffect, useState } from "react";
import type { LiveAuctionView } from "../lib/auction-view";
import { isActivelyDropping, phaseOf } from "../lib/auction-day";

type Row = Pick<
  LiveAuctionView,
  "startsAt" | "startAt" | "nextDropAt" | "discountPercent" | "serverNowMs"
>;

function view(rows: Row[], nowMs: number) {
  const dropping = rows.filter((a) => isActivelyDropping(phaseOf(a, nowMs).phase));
  return {
    count: dropping.length,
    maxDiscount: dropping.reduce((m, a) => Math.max(m, a.discountPercent), 0),
  };
}

export function AuctionBannerText({ rows }: { rows: Row[] }) {
  // Startvärde = serverns klocka → identisk första render på båda sidor.
  const serverNow = rows[0]?.serverNowMs ?? 0;
  const [nowMs, setNowMs] = useState(serverNow);
  useEffect(() => {
    setNowMs(Date.now());
    // Minutupplösning räcker: bannern byter läge vid 07 och 19, inte per sekund.
    const t = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const { count, maxDiscount } = view(rows, nowMs);

  if (count > 0) {
    return (
      <>
        <span className="auction-banner-badge">🔨 Fyndauktionen pågår</span>
        <span className="auction-banner-text" suppressHydrationWarning>
          {count} produkter vars pris sjunker just nu
          {maxDiscount > 0 && <> – största rabatt <b>−{maxDiscount}%</b></>}
        </span>
      </>
    );
  }
  return (
    <>
      <span className="auction-banner-badge">🔨 Fyndauktionen</span>
      <span className="auction-banner-text">
        Dagens {rows.length} fynd startar kl 07 – priset faller varje timme till kl 19
      </span>
    </>
  );
}
