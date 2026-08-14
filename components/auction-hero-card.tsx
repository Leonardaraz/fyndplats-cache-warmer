"use client";
// "Dagens hetaste fynd" — hjältekortet: flaggskeppet (störst rabatt) i stort
// format med rullande odometer-pris, "Du sparar X kr", nedräkning och stor CTA.
// All klocklogik (faser, nedräkning, hämtningskedja) bor i useAuctionClock.
// Varje kort äger sin egen klocka — raderna har olika stegar, så ett småkort
// kan bli sent medan hjälten räknar ned; hooken stryper hämtningarna på
// modulnivå så alla korten tillsammans ändå bara ger en route-hämtning.
//
// EFTER STÄNGNING (fas ended) döljs rabattbadgen och "Du sparar"-raden — de
// beskriver en rabatt som Wix håller på att återställa och som ingen längre kan
// få. PRISET självt visas alltid som a.priceNum: det är Wix-priset, alltså det
// som faktiskt debiteras i kassan (lib/auction-view.ts:9-10). En tidigare
// version visade listPrice här och bröt just den invarianten under de minuter
// det tar för ticken att återställa priset (granskning 2026-08-14).

import Image from "next/image";
import { SHIMMER_BLUR } from "../lib/lqip";
import { tightFillUrl } from "../lib/wix-image";
import type { LiveAuctionView } from "../lib/auction-view";
import { AuctionOdometer } from "./auction-odometer";
import { fmtLeft } from "../lib/auction-day";
import { useAuctionClock } from "./use-auction-clock";

export function AuctionHeroCard({ a }: { a: LiveAuctionView }) {
  // phase är aldrig null: före mount kommer den från serverns klocka, så
  // SSR-HTML och klientens första render är identiska (och HTML:en korrekt för
  // crawlers). Ingen egen ternär här — fasmaskinen är enda beslutspunkten.
  const { phase, msLeft } = useAuctionClock(a);
  const ended = phase === "ended";
  const preStart = phase === "pre";

  const dropped = !ended && a.priceNum < a.listPrice;
  const saved = Math.round(a.listPrice - a.priceNum);

  return (
    <a className="a-hero-card" href={`/produkt/${a.slug}`}>
      <div className="a-hc-img">
        {dropped && <span className="a-hc-badge">−{a.discountPercent}%</span>}
        {a.img && (
          <Image
            src={tightFillUrl(a.img, 900, 900)}
            alt={a.name}
            fill
            sizes="(max-width:760px) 100vw, 40vw"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR}
            // contain (inte cover): produktbilderna är kvadratiska och ramen är
            // det inte — cover beskar produkten (t.ex. kamerans topp). Vit botten
            // i .a-hc-img gör letterbox-banden osynliga.
            style={{ objectFit: "contain", padding: "4%" }}
            // `priority` är utfasad i Next 16 → `preload`. fetchPriority sätts
            // separat eftersom next/image inte härleder den ur preload (samma
            // resonemang som components/gallery.tsx). Auktionsbilden är sidans
            // entydiga LCP-element, så den ska både förladdas och prioriteras.
            preload
            fetchPriority="high"
          />
        )}
      </div>
      <div className="a-hc-info">
        <div className="a-hc-label">
          {preStart ? "Startar kl 07" : ended ? "Stängt för idag" : "Dagens hetaste fynd"}
        </div>
        <div className="a-hc-name">{a.name}</div>
        <div className="a-hc-price-row">
          <AuctionOdometer value={a.priceNum} className="a-hc-price" />
          {dropped && <span className="a-hc-old">{a.listPrice.toLocaleString("sv-SE")} kr</span>}
          {dropped && saved > 0 && <span className="a-hc-save">Du sparar {saved.toLocaleString("sv-SE")} kr</span>}
        </div>
        {phase === "pre" ? (
          <div className="a-hc-timer" suppressHydrationWarning>
            {msLeft !== null ? <>Startar kl 07 — om <b>{fmtLeft(msLeft)}</b></> : "Startar kl 07"}
          </div>
        ) : ended ? (
          <div className="a-hc-timer">Stängt för idag — nya fynd kl 07</div>
        ) : phase === "countdown" ? (
          <div className="a-hc-timer" suppressHydrationWarning>
            {msLeft !== null
              ? <>Nästa prissänkning om <b>{fmtLeft(msLeft)}</b></>
              : "Priset sjunker varje timme"}
          </div>
        ) : phase === "stale" ? (
          <div className="a-hc-timer">Priset uppdateras…</div>
        ) : (
          <div className="a-hc-timer a-floor">
            Lägsta pris – <b>första köparen tar det!</b>
          </div>
        )}
        {/* Brådske-CTA:n hör hemma under pågående dag. Före start och efter
            stängning finns inget att hinna före — då säljer lugnet bättre. */}
        <span className="a-hc-btn">
          {preStart
            ? "Se fyndet — priset faller från kl 07 →"
            : ended
              ? "Nya fynd kl 07 →"
              : "Köp nu – innan någon annan gör det →"}
        </span>
      </div>
    </a>
  );
}
