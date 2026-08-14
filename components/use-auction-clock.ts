"use client";
// Delad klocka + refresh-kedja för auktionskomponenterna (hjältekort, småkort,
// live-pill). Granskningen 2026-08-14 fällde den kopierade varianten på fyra
// punkter som hooken löser på ETT ställe:
//
//   1. KEDJNING. Dependencyn "har målet passerats?" ändras inte av ett
//      misslyckat refresh-försök, så den gamla koden gjorde ETT försök och gav
//      upp — "Priset uppdateras…" för evigt om ISR-svaret råkade vara 60 s
//      gammalt. Räknaren är nu STATE: varje utlöst försök re-armar effekten,
//      så backoff-stegen (REFRESH_BACKOFF_MS, ~28 min) faktiskt kedjas tills
//      servern levererat ett framtida mål.
//   2. NOLLSTÄLLNING. Räknaren var en livstidsbudget per mount — en flik som
//      stod öppen förbrukade den på dagens första steggränser och stod sedan
//      död resten av dagen. Nu nollställs den så fort ett färskt mål kommit.
//   3. EN ÄGARE. router.refresh() uppdaterar hela rutten, så alla kort får
//      färska props av EN refresh — ändå drev hjältekortet OCH alla fem
//      småkort varsin kedja (6 parallella hämtningar per steggräns). Nu driver
//      bara hjältekortet (driveRefresh); övriga konsumerar bara klockan.
//   4. HYDRERING. Klockan startar som null (samma mönster som climax/fuse) så
//      serverns och klientens första render är identiska — tidsberoende grenar
//      slår om först efter mount, aldrig mitt i hydreringen.
//
// Dessutom: när fliken blir synlig igen efter att ha varit gömd (mobilen ur
// fickan morgonen efter) nollställs kedjan och en refresh körs direkt — annars
// kunde en övernattad flik visa "Stängt för idag" mitt i en live-dag med
// förbrukad backoff.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LiveAuctionView } from "../lib/auction-view";
import { auctionPhase, REFRESH_BACKOFF_MS, type AuctionPhase } from "../lib/auction-day";

export function useAuctionClock(
  a: Pick<LiveAuctionView, "startsAt" | "startAt" | "nextDropAt">,
  opts?: { driveRefresh?: boolean },
): { phase: AuctionPhase | null; msLeft: number | null } {
  const drive = opts?.driveRefresh === true;
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
  const msLeft = pt?.targetMs != null && now !== null ? pt.targetMs - now : null;
  // Refresh behövs när målet passerats: stale (sänkning sen) eller ended
  // (dagen slut → hämta morgondagens lineup). pre/countdown/floor har framtida
  // mål och glider själva över i rätt fas när klockan hinner ikapp.
  const overdue = pt !== null && (pt.phase === "stale" || pt.phase === "ended");

  // Färskt framtida mål från servern → kedjan är klar, nollställ.
  useEffect(() => {
    if (drive && !overdue && attempt !== 0) setAttempt(0);
  }, [drive, overdue, attempt]);

  // Kedjande backoff: attempt är state, så varje utlöst steg re-armar effekten
  // för nästa. Avbryts (cleanup) i samma stund servern gett ett framtida mål.
  useEffect(() => {
    if (!drive || !overdue || attempt >= REFRESH_BACKOFF_MS.length) return;
    const t = setTimeout(() => {
      router.refresh();
      setAttempt((n) => n + 1);
    }, REFRESH_BACKOFF_MS[attempt]);
    return () => clearTimeout(t);
  }, [drive, overdue, attempt, router]);

  // Fliken tillbaka i förgrunden → nollställ och hämta färskt direkt.
  useEffect(() => {
    if (!drive) return;
    const onVis = () => {
      if (!document.hidden) {
        setAttempt(0);
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [drive, router]);

  return { phase: pt?.phase ?? null, msLeft };
}
