"use client";
// Delad klocka + hämtningslogik för auktionskomponenterna (hjältekort, småkort,
// live-pill). Granskningarna 2026-08-14 fällde två tidigare varianter; den här
// filen är resultatet av båda och kommenterar därför varför det ser ut så här.
//
// VARJE KORT ÄGER SIN EGEN KLOCKA. Första försöket lät bara hjältekortet driva
// hämtningen ("router.refresh() uppdaterar ändå hela rutten"). Det var fel:
// varje auktionsrad har en EGEN stege, och nextDropAtOf hoppar över dubblett-
// rungor, så raderna får olika sänkningstider. Ett småkort vars sänkning kom
// först fastnade då på "Priset uppdateras…" i timmar eftersom hjälten ännu
// räknade ned — och när hjälten nått sitt golv (nextDropAt=null) hämtades
// ingenting alls resten av dagen. Nu begär varje instans själv, och en
// MODULNIVÅ-strypning gör att fem samtidiga begäran ändå blir en hämtning.
//
// KEDJAN DÖR ALDRIG. Backoff-stegen (REFRESH_BACKOFF_MS) täcker ~28 min sen
// tick; därefter fortsätter en långsam puls (SLOW_POLL_MS) i stället för att
// sluta för gott. Ett längre cron-avbrott lämnade annars sidan låst på
// "Priset uppdateras…" utan väg tillbaka för en flik som står synlig.
//
// GOLVLÄGET PULSAR OCKSÅ. På golvet finns ingen kommande sänkning, men varan
// kan bli SÅLD — då försvinner den ur getLiveAuctions. Utan puls fortsatte en
// öppen flik visa "Köp nu – innan någon annan gör det" för något som var borta.
//
// HYDRERING: klockan startar null och komponenterna renderar då serverns egna
// besked (startsAt / closed). Server och klientens första render är alltså
// alltid identiska; den levande klockan tar över först efter mount.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LiveAuctionView } from "../lib/auction-view";
import { auctionPhase, REFRESH_BACKOFF_MS, type AuctionPhase } from "../lib/auction-day";

/** Långsam puls när backoffen är slut, och i golvläget (fånga "såld"). */
const SLOW_POLL_MS = 5 * 60_000;
/** Minsta tid mellan FAKTISKA hämtningar, delat av alla instanser. */
const MIN_REFRESH_GAP_MS = 4_000;

let lastRefreshAt = 0;
/** Strypt hämtning: fem kort som blir sena samtidigt ger EN route-hämtning. */
function requestRefresh(refresh: () => void): void {
  const now = Date.now();
  if (now - lastRefreshAt < MIN_REFRESH_GAP_MS) return;
  lastRefreshAt = now;
  refresh();
}

export function useAuctionClock(
  a: Pick<LiveAuctionView, "startsAt" | "startAt" | "nextDropAt">,
): { phase: AuctionPhase | null; msLeft: number | null } {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const pt = now === null
    ? null
    : auctionPhase(now, {
        startsAtMs: a.startsAt ? Date.parse(a.startsAt) : null,
        dayStartMs: a.startAt ? Date.parse(a.startAt) : null,
        nextDropAtMs: a.nextDropAt ? Date.parse(a.nextDropAt) : null,
      });
  const phase = pt?.phase ?? null;
  const msLeft = pt?.targetMs != null && now !== null ? pt.targetMs - now : null;

  // Målet passerat (sänkning sen, eller dagen slut och rotationen inte klar)
  // → hämta med stigande backoff. Golvläget pulsar långsamt för att fånga att
  // varan blivit såld. pre/countdown har framtida mål och sköter sig själva.
  const overdue = phase === "stale" || phase === "ended";
  const poll = overdue || phase === "floor";

  // Färskt framtida mål → nollställ kedjan inför nästa gräns.
  useEffect(() => {
    if (!overdue && attempt !== 0) setAttempt(0);
  }, [overdue, attempt]);

  useEffect(() => {
    if (!poll) return;
    const delay = overdue
      ? (REFRESH_BACKOFF_MS[attempt] ?? SLOW_POLL_MS)
      : SLOW_POLL_MS;
    const t = setTimeout(() => {
      requestRefresh(() => router.refresh());
      setAttempt((n) => n + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [poll, overdue, attempt, router]);

  // Fliken tillbaka i förgrunden EFTER att något blivit sent → hämta direkt.
  // Gate:at på `poll`: utan det gav varje flikväxling en full route-hämtning
  // mitt i en nedräkning där ingenting ändrats (granskningsfynd).
  useEffect(() => {
    if (!poll) return;
    const onVis = () => {
      if (!document.hidden) {
        setAttempt(0);
        requestRefresh(() => router.refresh());
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [poll, router]);

  return { phase, msLeft };
}
