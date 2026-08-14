"use client";
// Hydreringssäker klockbootstrap — ETT ställe för mönstret som låg kopierat i
// fyra komponenter (auktionsklockan, luntan, climax, bannern).
//
// Invarianten den kodar: FÖRSTA renderingen på klienten måste använda SERVERNS
// tidpunkt, annars skiljer sig SSR-HTML och hydrering. Först efter mount får
// klientklockan ta över. Varje kopia av mönstret var ett tillfälle att få det
// fel — och granskningen 2026-08-14 visade att en kopia gjorde just det:
// tickern gate:ades bort i vissa lägen, `now` frös, och eftersom `now` är det
// som DRIVER fasövergångarna inträffade 19:00 aldrig för en öppen flik. Kortet
// satt kvar på "Lägsta pris — första köparen tar det!" hela kvällen.
//
// Därav regeln här: klockan får sakta ner, ALDRIG stanna medan fliken är
// synlig. Och när fliken kommer tillbaka läses tiden om direkt, så en flik som
// varit dold över en gräns (07:00 eller 19:00) hinner ikapp omedelbart.

import { useEffect, useState } from "react";

/** Sant medan fliken är dold (SSR: alltid false). */
function docHidden(): boolean {
  return typeof document !== "undefined" && document.hidden;
}

export function useClientNow(
  serverNowMs: number,
  /** Uppdateringstakt i ms. Byt fritt över tid — intervallet läggs om. */
  stepMs: number,
): { nowMs: number; mounted: boolean } {
  const [now, setNow] = useState<number | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setNow(Date.now());
    setHidden(docHidden());
    const onVis = () => {
      const h = docHidden();
      setHidden(h);
      // Läs om tiden direkt vid återkomst: en flik som varit dold över 19:00
      // ska inte behöva vänta på nästa intervall för att upptäcka det.
      if (!h) setNow(Date.now());
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (hidden) return; // dold flik: inget syns ändå, och återkomsten läser om
    const t = setInterval(() => setNow(Date.now()), stepMs);
    return () => clearInterval(t);
  }, [hidden, stepMs]);

  return { nowMs: now ?? serverNowMs, mounted: now !== null };
}
