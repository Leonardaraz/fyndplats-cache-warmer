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

import type { LiveAuctionView } from "../lib/auction-view";
import { isActivelyDropping, phaseOf } from "../lib/auction-day";
import { useClientNow } from "./use-client-now";

type Row = Pick<
  LiveAuctionView,
  "startsAt" | "startAt" | "nextDropAt" | "discountPercent" | "serverNowMs"
>;

function view(rows: Row[], nowMs: number) {
  const phases = rows.map((a) => phaseOf(a, nowMs).phase);
  const dropping = rows.filter((_, i) => isActivelyDropping(phases[i]));
  return {
    count: dropping.length,
    maxDiscount: dropping.reduce((m, a) => Math.max(m, a.discountPercent), 0),
    // Golvtimmen (18–19): inget sjunker mer, men auktionen PÅGÅR och varorna
    // är köpbara till dagens lägsta. Utan den här grenen föll bannern tillbaka
    // på "startar kl 07" mitt i pågående auktion (granskning 2026-08-14).
    onFloor: phases.some((p) => p === "floor"),
  };
}

export function AuctionBannerText({ rows }: { rows: Row[] }) {
  // Startvärde = serverns klocka → identisk första render på båda sidor.
  // Minutupplösning räcker: bannern byter läge vid 07, 18 och 19 — inte per
  // sekund. useClientNow äger hydreringsmönstret och pausar i dold flik.
  const { nowMs } = useClientNow(rows[0]?.serverNowMs ?? 0, 60_000);
  const { count, maxDiscount, onFloor } = view(rows, nowMs);

  if (count > 0) {
    return (
      <>
        <span className="auction-banner-badge">🔨 Fyndauktionen pågår</span>
        <span className="auction-banner-text">
          {count} produkter vars pris sjunker just nu
          {maxDiscount > 0 && <> – största rabatt <b>−{maxDiscount}%</b></>}
        </span>
      </>
    );
  }
  if (onFloor) {
    return (
      <>
        <span className="auction-banner-badge">🔨 Fyndauktionen pågår</span>
        <span className="auction-banner-text">
          Lägsta priset just nu – först till kvarn, stänger kl 19
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
