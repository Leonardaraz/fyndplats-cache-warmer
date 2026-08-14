"use client";
// Fyndauktionens produktkort: aktuellt pris (= Wix-priset, det som debiteras),
// överstruket startpris när priset fallit, och en live-nedräkning till NÄSTA
// prissänkning. All klocklogik bor i useAuctionClock, och VARJE kort äger sin
// egen — raderna har olika stegar (dubblettrungor hoppas över), så ett kort kan
// bli sent medan hjälten fortfarande räknar ned. Hooken stryper hämtningarna på
// modulnivå så fem samtidiga begäran ändå bara blir en route-hämtning.
//
// EFTER STÄNGNING (fas ended) döljs rabattbadgen och "Du sparar"-raden — de
// beskriver en rabatt Wix håller på att återställa. PRISET visas alltid som
// a.priceNum (= Wix-priset, det som debiteras); en tidigare version visade
// listPrice och bröt den invarianten i minuterna innan ticken hann återställa.
// Golvet/prisstegen finns aldrig i klienten.

import Image from "next/image";
import { SHIMMER_BLUR } from "../lib/lqip";
import { tightFillUrl } from "../lib/wix-image";
import type { LiveAuctionView } from "../lib/auction-view";
import { AuctionOdometer } from "./auction-odometer";
import { fmtLeft } from "../lib/auction-day";
import { useAuctionClock } from "./use-auction-clock";

export function AuctionCard({ a }: { a: LiveAuctionView }) {
  // phase är aldrig null: före mount kommer den från serverns klocka, så SSR
  // och klientens första render är identiska. Fasmaskinen är enda beslutspunkten.
  const { phase, msLeft } = useAuctionClock(a);
  const ended = phase === "ended";
  const preStart = phase === "pre";

  const dropped = !ended && a.priceNum < a.listPrice;
  const saved = Math.round(a.listPrice - a.priceNum);

  return (
    <a className={`prod auction-card a-card${a.img2 ? "" : " noswap"}`} href={`/produkt/${a.slug}`}>
      <div className="pimg">
        {dropped && <span className="sale-badge">−{a.discountPercent}%</span>}
        {a.img && (
          <Image
            className="pimg-main"
            src={tightFillUrl(a.img, 600, 600)}
            alt={a.name}
            fill
            sizes="(max-width:540px) 100vw, (max-width:900px) 50vw, 20vw"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR}
            style={{ objectFit: "cover" }}
          />
        )}
        {/* Hover-bytet: andra galleribilden, samma mönster som butikskorten.
            Utan img2 får kortet .noswap så första bilden aldrig tonas bort. */}
        {a.img2 && (
          <Image
            className="pimg-alt"
            src={tightFillUrl(a.img2, 600, 600)}
            alt={a.name}
            fill
            sizes="(max-width:540px) 100vw, (max-width:900px) 50vw, 20vw"
            style={{ objectFit: "cover" }}
          />
        )}
      </div>
      <div className="pbody">
        <div className="pname">{a.name}</div>
        <div className="auction-price-row">
          <AuctionOdometer value={a.priceNum} className="auction-price" />
          {dropped && <span className="auction-old">{a.listPrice.toLocaleString("sv-SE")} kr</span>}
        </div>
        {/* Samma "Du sparar"-rad som hjältekortet — kronor säljer bättre än
            procent, och utan den såg småkorten tommare ut än flaggskeppet. */}
        {dropped && saved > 0 && (
          <div className="auction-save">Du sparar {saved.toLocaleString("sv-SE")} kr</div>
        )}
        {phase === "pre" ? (
          <div className="auction-timer" suppressHydrationWarning>
            {msLeft !== null ? <>Startar kl 07 — om <b>{fmtLeft(msLeft)}</b></> : "Startar kl 07"}
          </div>
        ) : ended ? (
          <div className="auction-timer">Stängt för idag — nya fynd kl 07</div>
        ) : phase === "countdown" ? (
          <div className="auction-timer" suppressHydrationWarning>
            {msLeft !== null
              ? <>Nästa prissänkning om <b>{fmtLeft(msLeft)}</b></>
              : "Priset sjunker varje timme"}
          </div>
        ) : phase === "stale" ? (
          <div className="auction-timer auction-timer-soon">Priset uppdateras…</div>
        ) : (
          <div className="auction-timer auction-floor">Lägsta pris — första köparen tar det!</div>
        )}
        <span className="auction-cta">
          {preStart
            ? "Priset faller varje timme 07–19"
            : ended
              ? "Nya fynd kl 07"
              : "Köp nu — innan någon annan gör det"}
        </span>
      </div>
    </a>
  );
}
