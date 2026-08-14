"use client";
// "Dagens hetaste fynd" — hjältekortet: flaggskeppet (störst rabatt) i stort
// format med rullande odometer-pris, "Du sparar X kr", nedräkning och stor CTA.
// Samma refresh-mekanik som småkorten: när steggränsen passeras hämtas nytt
// pris från servern (Wix-priset är alltid det som visas och debiteras).

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SHIMMER_BLUR } from "../lib/lqip";
import { tightFillUrl } from "../lib/wix-image";
import type { LiveAuctionView } from "../lib/auction-view";
import { AuctionOdometer } from "./auction-odometer";
import { AUCTION_DAY_HOURS, isDayOver, REFRESH_BACKOFF_MS } from "../lib/auction-day";

function fmtLeft(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

export function AuctionHeroCard({ a }: { a: LiveAuctionView }) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const refreshes = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const startMs = a.startsAt ? Date.parse(a.startsAt) : null;
  const dayMs = a.startAt ? Date.parse(a.startAt) : null;
  const preStart = startMs !== null && startMs > now;
  // Dagen slut (≥19:00) med kvarliggande dagsprops — fliken som stått öppen
  // sedan kvällen. Utan grenen fortsatte kortet ropa "Lägsta pris – första
  // köparen tar det!" hela natten med ett pris som Wix redan återställt.
  const ended = !preStart && isDayOver(dayMs, now);
  // Mål för nedräkning/refresh: start (före 07) → nästa sänkning → dagens slut.
  // Sista ledet är nytt: när 19:00 passeras korsar msLeft noll → refresh-loopen
  // hämtar morgondagens lineup i stället för att kortet fryser i golv-läget.
  const target = preStart
    ? startMs
    : a.nextDropAt
      ? Date.parse(a.nextDropAt)
      : dayMs !== null
        ? dayMs + AUCTION_DAY_HOURS * 3_600_000
        : null;
  const msLeft = target ? target - now : null;

  useEffect(() => {
    if (msLeft === null || msLeft > 0 || refreshes.current >= REFRESH_BACKOFF_MS.length) return;
    const t = setTimeout(() => {
      refreshes.current += 1;
      router.refresh();
    }, REFRESH_BACKOFF_MS[refreshes.current]);
    return () => clearTimeout(t);
  }, [msLeft === null || msLeft > 0, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const dropped = a.priceNum < a.listPrice;
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
        {/* Före start är inget "hetast" — allt står på ordinarie pris. */}
        <div className="a-hc-label">{preStart ? "Startar kl 07" : "Dagens hetaste fynd"}</div>
        <div className="a-hc-name">{a.name}</div>
        <div className="a-hc-price-row">
          <AuctionOdometer value={a.priceNum} className="a-hc-price" />
          {dropped && <span className="a-hc-old">{a.listPrice.toLocaleString("sv-SE")} kr</span>}
          {dropped && saved > 0 && <span className="a-hc-save">Du sparar {saved.toLocaleString("sv-SE")} kr</span>}
        </div>
        {preStart && msLeft !== null && msLeft > 0 ? (
          <div className="a-hc-timer" suppressHydrationWarning>
            Startar kl 07 — om <b>{fmtLeft(msLeft)}</b>
          </div>
        ) : ended ? (
          <div className="a-hc-timer">Stängt för idag — nya fynd kl 07</div>
        ) : a.nextDropAt && msLeft !== null && msLeft > 0 ? (
          <div className="a-hc-timer" suppressHydrationWarning>
            Nästa prissänkning om <b>{fmtLeft(msLeft)}</b>
          </div>
        ) : a.nextDropAt ? (
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
