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
  const preStart = startMs !== null && startMs > now;
  const target = preStart ? startMs : a.nextDropAt ? Date.parse(a.nextDropAt) : null;
  const msLeft = target ? target - now : null;

  useEffect(() => {
    if (msLeft === null || msLeft > 0 || refreshes.current >= 3) return;
    const t = setTimeout(() => {
      refreshes.current += 1;
      router.refresh();
    }, 4000 + refreshes.current * 20_000);
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
            priority
          />
        )}
      </div>
      <div className="a-hc-info">
        <div className="a-hc-label">Dagens hetaste fynd</div>
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
        ) : msLeft !== null && msLeft > 0 ? (
          <div className="a-hc-timer" suppressHydrationWarning>
            Nästa prissänkning om <b>{fmtLeft(msLeft)}</b>
          </div>
        ) : msLeft !== null ? (
          <div className="a-hc-timer">Priset uppdateras…</div>
        ) : (
          <div className="a-hc-timer a-floor">
            Lägsta pris – <b>först till kvarn!</b>
          </div>
        )}
        <span className="a-hc-btn">Köp nu – innan någon annan gör det →</span>
      </div>
    </a>
  );
}
