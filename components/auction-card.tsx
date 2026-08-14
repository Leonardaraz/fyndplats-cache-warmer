"use client";
// Fyndauktionens produktkort: aktuellt pris (= Wix-priset, det som debiteras),
// överstruket startpris när priset fallit, och en live-nedräkning till NÄSTA
// prissänkning. Auktionsdagen går 07:00–19:00; en auktion som är schemalagd
// men inte startat visar "startar om …" i stället för prisnedräkningen.
// När nedräkningen når noll uppdateras sidan (router.refresh) — upp till ett
// par gånger, eftersom cron-ticken + ISR (60 s) kan ligga någon minut efter
// steggränsen. Golvet/prisstegen finns aldrig i klienten.

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

  // Före 07:00 räknar vi ner till starten i stället för till nästa sänkning.
  const startMs = a.startsAt ? Date.parse(a.startsAt) : null;
  const dayMs = a.startAt ? Date.parse(a.startAt) : null;
  const preStart = startMs !== null && startMs > now;
  // Dagen slut (≥19:00) med kvarliggande dagsprops (flik öppen sedan kvällen):
  // utan grenen ropade kortet "Lägsta pris!" hela natten med ett återställt pris.
  const ended = !preStart && isDayOver(dayMs, now);
  // Mål: start → nästa sänkning → dagens slut. Sista ledet väcker refresh-loopen
  // vid 19:00 så kortet hämtar morgondagens lineup i stället för att frysa.
  const target = preStart
    ? startMs
    : a.nextDropAt
      ? Date.parse(a.nextDropAt)
      : dayMs !== null
        ? dayMs + AUCTION_DAY_HOURS * 3_600_000
        : null;
  const msLeft = target ? target - now : null;

  // Steggränsen passerad → hämta nytt pris från servern. Backoffen täcker ~28
  // min sen tick (väckarklockans cron driver) — förr gav korten upp efter ~1 min
  // och fastnade på "Priset uppdateras…".
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
        {preStart && msLeft !== null && msLeft > 0 ? (
          <div className="auction-timer" suppressHydrationWarning>
            Startar kl 07 — om <b>{fmtLeft(msLeft)}</b>
          </div>
        ) : ended ? (
          <div className="auction-timer">Stängt för idag — nya fynd kl 07</div>
        ) : a.nextDropAt && msLeft !== null && msLeft > 0 ? (
          <div className="auction-timer" suppressHydrationWarning>
            Nästa prissänkning om <b>{fmtLeft(msLeft)}</b>
          </div>
        ) : a.nextDropAt ? (
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
