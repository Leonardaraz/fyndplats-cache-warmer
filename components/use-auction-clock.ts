"use client";
// Delad klocka + hämtningslogik för auktionskomponenterna (hjältekort, småkort,
// live-pill). Tre granskningar 2026-08-14 formade den här filen; kommentarerna
// nedan säger varför varje del ser ut som den gör, så ingen "förenklar" tillbaka.
//
// FAS FÖRE MOUNT KOMMER FRÅN SERVERNS KLOCKA. `phase` är aldrig null: innan
// klockan startat används a.serverNowMs, alltså samma tidpunkt servern
// renderade med. SSR-HTML och klientens första render blir därmed identiska,
// och HTML:en är korrekt redan för crawlers. Efter mount tar den levande
// klockan över. Tidigare varianter hade en färdig `closed`-boolean plus
// handrullade ternärer i komponenterna — de hann säga emot fasmaskinen.
//
// VARJE KORT ÄGER SIN EGEN KLOCKA. Att bara låta hjältekortet hämta var fel:
// varje auktionsrad har en EGEN stege (nextDropAtOf hoppar över dubblettrungor),
// så ett småkort kan bli sent medan hjälten räknar ned. En modulnivå-strypning
// ser till att fem samtidiga begäran ändå bara blir en route-hämtning.
//
// VI POLLAR ÄVEN UNDER NEDRÄKNING. Varan kan bli SÅLD när som helst — då
// försvinner den ur getLiveAuctions och webhooken revalididerar rutten för nya
// besökare, men en redan öppen flik visste inget. Nedräkning är ~55 av 60
// minuter, så utan puls kunde en flik visa "Köp nu" för något sålt i nästan en
// timme. Pulsen är långsam (5 min) och pausas när fliken är dold.
//
// KEDJAN DÖR ALDRIG. Efter de sex backoff-stegen fortsätter samma långsamma
// puls i stället för att sluta — ett längre cron-avbrott låste annars sidan på
// "Priset uppdateras…" utan väg tillbaka för en flik som står synlig.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LiveAuctionView } from "../lib/auction-view";
import { auctionPhase, REFRESH_BACKOFF_MS, type AuctionPhase } from "../lib/auction-day";

/** Långsam puls: efter backoffen, och löpande för att fånga "såld". */
const SLOW_POLL_MS = 5 * 60_000;
/** Minsta tid mellan FAKTISKA hämtningar, delat av alla instanser. */
const MIN_REFRESH_GAP_MS = 4_000;

// Monoton tidsstämpel: performance.now() går aldrig bakåt. Med Date.now() kunde
// en bakåtjusterad klocka (NTP/tidszon) lägga `lastRefreshAt` i framtiden och
// tysta ALLA hämtningar tills klockan hunnit ikapp (granskningsfynd).
const monoNow = () =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

let lastRefreshAt = -Infinity;
/** Strypt hämtning. Returnerar false när anropet slogs bort — anroparen ska då
 *  INTE avancera sin backoff, annars vandrar ett kort genom hela stegen utan
 *  att någonsin ha hämtat något (granskningsfynd). */
function requestRefresh(refresh: () => void): boolean {
  const t = monoNow();
  if (t - lastRefreshAt < MIN_REFRESH_GAP_MS) return false;
  lastRefreshAt = t;
  refresh();
  return true;
}

export function useAuctionClock(
  a: Pick<LiveAuctionView, "startsAt" | "startAt" | "nextDropAt" | "serverNowMs">,
): { phase: AuctionPhase; msLeft: number | null } {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const times = {
    startsAtMs: a.startsAt ? Date.parse(a.startsAt) : null,
    dayStartMs: a.startAt ? Date.parse(a.startAt) : null,
    nextDropAtMs: a.nextDropAt ? Date.parse(a.nextDropAt) : null,
  };
  // Före mount: serverns klocka → identisk render på server och klient.
  const pt = auctionPhase(now ?? a.serverNowMs, times);
  // msLeft bara efter mount: en serverberäknad nedräkning vore fel i samma
  // sekund den renderades, och digits i SSR-HTML garanterar hydreringsbråk.
  const msLeft = now !== null && pt.targetMs != null ? pt.targetMs - now : null;

  const overdue = pt.phase === "stale" || pt.phase === "ended";

  // Färskt framtida mål → nollställ kedjan inför nästa gräns.
  useEffect(() => {
    if (!overdue && attempt !== 0) setAttempt(0);
  }, [overdue, attempt]);

  // visibilitychange fyrar bara vid ÖVERGÅNGAR, så en sidladdning triggar
  // ingen hämtning här (sidan är ju nyss serverrenderad). Startvärdet läses
  // separat vid mount utan att hämta.
  useEffect(() => {
    setHidden(document.hidden);
    const onVis = () => {
      const h = document.hidden;
      setHidden(h);
      if (!h) {
        setAttempt(0);
        requestRefresh(() => router.refresh());
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [router]);

  // Puls. Snabb backoff när något är sent, annars långsam bevakning av "såld".
  // Pausad medan fliken är dold — effekten kör om när `hidden` slår om, och
  // återkomsten hämtar dessutom direkt (nedan).
  useEffect(() => {
    if (now === null || hidden) return;
    const delay = overdue ? (REFRESH_BACKOFF_MS[attempt] ?? SLOW_POLL_MS) : SLOW_POLL_MS;
    const t = setTimeout(() => {
      // Avancera bara steget om hämtningen FAKTISKT gick iväg.
      if (requestRefresh(() => router.refresh())) setAttempt((n) => n + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [now === null, hidden, overdue, attempt, router]); // eslint-disable-line react-hooks/exhaustive-deps

  return { phase: pt.phase, msLeft };
}
