"use client";
// "Dagens hetaste fynd" — hjältekortet: flaggskeppet (störst rabatt) i stort
// format med rullande odometer-pris, "Du sparar X kr", nedräkning och stor CTA.
// All klocklogik (faser, nedräkning, refresh-kedja) bor i useAuctionClock —
// hjältekortet är kortens enda refresh-ägare (driveRefresh), eftersom
// router.refresh() uppdaterar hela rutten och därmed även småkorten.
//
// EFTER STÄNGNING (fas ended) visas LISTPRISET utan badge/spara-rad:
// granskningen 2026-08-14 fällde första stängt-läget för att det bara bytte
// texterna — golvpris, "−34%" och "Du sparar…" låg kvar från stale props och
// annonserade en rabatt som Wix redan återställt och ingen kunde få.

import Image from "next/image";
import { SHIMMER_BLUR } from "../lib/lqip";
import { tightFillUrl } from "../lib/wix-image";
import type { LiveAuctionView } from "../lib/auction-view";
import { AuctionOdometer } from "./auction-odometer";
import { fmtLeft } from "../lib/auction-day";
import { useAuctionClock } from "./use-auction-clock";

export function AuctionHeroCard({ a }: { a: LiveAuctionView }) {
  const { phase, msLeft } = useAuctionClock(a, { driveRefresh: true });
  const ended = phase === "ended";
  // Före mount (phase null) används serverns eget förstart-besked (startsAt
  // sätts bara av servern före 07) så SSR-HTML och klientens första render
  // alltid är identiska — inga tidsgrenar i hydreringen.
  const preStart = phase === null ? a.startsAt !== null : phase === "pre";

  const dropped = !ended && a.priceNum < a.listPrice;
  const saved = Math.round(a.listPrice - a.priceNum);
  const shownPrice = ended ? a.listPrice : a.priceNum;

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
          <AuctionOdometer value={shownPrice} className="a-hc-price" />
          {dropped && <span className="a-hc-old">{a.listPrice.toLocaleString("sv-SE")} kr</span>}
          {dropped && saved > 0 && <span className="a-hc-save">Du sparar {saved.toLocaleString("sv-SE")} kr</span>}
        </div>
        {/* Fas null (före mount) → radhög platshållare så layouten inte hoppar
            när texten dyker upp efter hydrering (samma mönster som climax). */}
        {phase === null ? (
          <div className="a-hc-timer">{" "}</div>
        ) : phase === "pre" && msLeft !== null ? (
          <div className="a-hc-timer" suppressHydrationWarning>
            Startar kl 07 — om <b>{fmtLeft(msLeft)}</b>
          </div>
        ) : ended ? (
          <div className="a-hc-timer">Stängt för idag — nya fynd kl 07</div>
        ) : phase === "countdown" && msLeft !== null ? (
          <div className="a-hc-timer" suppressHydrationWarning>
            Nästa prissänkning om <b>{fmtLeft(msLeft)}</b>
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
