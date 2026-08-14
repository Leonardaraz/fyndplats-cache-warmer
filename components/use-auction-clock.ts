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

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LiveAuctionView } from "../lib/auction-view";
import { phaseOf, tickerStepMs, REFRESH_BACKOFF_MS, type AuctionPhase } from "../lib/auction-day";
import { useClientNow } from "./use-client-now";

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
): { phase: AuctionPhase; msLeft: number | null; mounted: boolean } {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);

  // Fasen avgör takten, takten uppdaterar klockan, klockan avgör fasen — men
  // takten är ALLTID ändlig, så cykeln kan inte frysa. Första varvet använder
  // serverns klocka (serverNowMs) → identisk SSR/hydrering.
  const [step, setStep] = useState(1_000);
  const { nowMs, mounted } = useClientNow(a.serverNowMs, step);

  const pt = phaseOf(a, nowMs);
  const msLeft = mounted && pt.targetMs != null ? pt.targetMs - nowMs : null;
  const overdue = pt.phase === "stale" || pt.phase === "ended";

  useEffect(() => {
    setStep(tickerStepMs(pt.phase));
  }, [pt.phase]);

  // Färskt framtida mål → nollställ kedjan inför nästa gräns.
  useEffect(() => {
    if (!overdue && attempt !== 0) setAttempt(0);
  }, [overdue, attempt]);

  // Puls. Snabb backoff när något är sent, annars långsam bevakning av "såld"
  // (varan kan försvinna ur lineupen när som helst). INTE i pre-läget: före
  // start är målet en fast tidsstämpel och inget är säljbart.
  //
  // Steget avanceras ÄVEN när strypningen slog till: router.refresh() är
  // rutt-bred, så en annan instans hämtning uppdaterade redan våra props —
  // begäran blev alltså utförd, bara inte av oss. Att inte avancera gav
  // i stället sex hämtningar per steg (granskning 2026-08-14), och att varken
  // avancera eller schemalägga om dödade kedjan helt.
  useEffect(() => {
    if (!mounted || pt.phase === "pre") return;
    const delay = overdue ? (REFRESH_BACKOFF_MS[attempt] ?? SLOW_POLL_MS) : SLOW_POLL_MS;
    const t = setTimeout(() => {
      requestRefresh(() => router.refresh());
      setAttempt((n) => n + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [mounted, pt.phase, overdue, attempt, router]);

  // Flik tillbaka i förgrunden → hämta ikapp, om något kan ha ändrats. Fasen
  // beräknas ur en FÄRSK tidsstämpel, inte ur en möjligen efterbliven `nowMs`:
  // en flik som legat dold över 07:00 hade annars läst sin gamla pre-fas och
  // hoppat över just den hämtning den behövde (granskningsfynd).
  const aRef = useRef(a);
  useEffect(() => { aRef.current = a; }, [a]);
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) return;
      if (phaseOf(aRef.current, Date.now()).phase === "pre") return;
      setAttempt(0);
      requestRefresh(() => router.refresh());
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [router]);

  return { phase: pt.phase, msLeft, mounted };
}
