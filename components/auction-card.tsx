"use client";
// Fyndauktionens produktkort: aktuellt pris (= Wix-priset, det som debiteras),
// överstruket startpris när priset fallit, och en live-nedräkning till NÄSTA
// prissänkning. När nedräkningen når noll uppdateras sidan (router.refresh) —
// upp till ett par gånger, eftersom cron-ticken + ISR (60 s) kan ligga någon
// minut efter steggränsen. Golvet/prisstegen finns aldrig i klienten.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SHIMMER_BLUR } from "../lib/lqip";
import { tightFillUrl } from "../lib/wix-image";
import type { LiveAuctionView } from "../lib/auction-view";

function fmtLeft(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

export function AuctionCard({ a }: { a: LiveAuctionView }) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const refreshes = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = a.nextDropAt ? Date.parse(a.nextDropAt) : null;
  const msLeft = target ? target - now : null;

  // Steggränsen passerad → hämta nytt pris från servern (max 3 försök à 20 s).
  useEffect(() => {
    if (msLeft === null || msLeft > 0 || refreshes.current >= 3) return;
    const t = setTimeout(() => {
      refreshes.current += 1;
      router.refresh();
    }, 4000 + refreshes.current * 20_000);
    return () => clearTimeout(t);
  }, [msLeft === null || msLeft > 0, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const dropped = a.priceNum < a.listPrice;

  return (
    <a className="prod auction-card" href={`/produkt/${a.slug}`}>
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
      </div>
      <div className="pbody">
        <div className="pname">{a.name}</div>
        <div className="auction-price-row">
          <span className="auction-price">{a.priceFormatted}</span>
          {dropped && <span className="auction-old">{a.listPrice.toLocaleString("sv-SE")},00kr</span>}
        </div>
        {msLeft !== null && msLeft > 0 ? (
          <div className="auction-timer" suppressHydrationWarning>
            Nästa prissänkning om <b>{fmtLeft(msLeft)}</b>
          </div>
        ) : msLeft !== null ? (
          <div className="auction-timer auction-timer-soon">Priset uppdateras…</div>
        ) : (
          <div className="auction-timer auction-floor">Lägsta pris — först till kvarn!</div>
        )}
        <span className="auction-cta">Köp nu — innan någon annan gör det</span>
      </div>
    </a>
  );
}
