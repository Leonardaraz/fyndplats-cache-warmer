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
//
// SIDAN HAR EN KLOCKA (Black Week, 2026-11-04). Varje kort hade förut en egen
// setInterval; med 100 fynd blev det 100 timers i sekundtakt och 100 separata
// renderingar varje sekund. Nu delar alla kort lib/delad-klocka.ts: en timer
// per takt, och ett slag ritar om alla kort på den takten i samma svep. Under
// hydreringen ger useSyncExternalStore serverns tid (getServerSnapshot = null),
// och direkt efteråt klientens. Varför tiden är gemensam för alla takter står
// i lib/delad-klocka.ts.

import { useCallback, useSyncExternalStore } from "react";
import { deladKlocka } from "../lib/delad-klocka";

const lasKlockan = () => deladKlocka().las();
/** På servern och under hydreringen finns ingen klienttid. */
const ingenKlienttid = () => null;

export function useClientNow(
  serverNowMs: number,
  /** Uppdateringstakt i ms. Byt fritt över tid — prenumerationen läggs om. */
  stepMs: number,
): { nowMs: number; mounted: boolean } {
  const prenumerera = useCallback((lyssnare: () => void) => deladKlocka().prenumerera(stepMs, lyssnare), [stepMs]);
  const nu = useSyncExternalStore(prenumerera, lasKlockan, ingenKlienttid);
  return { nowMs: nu ?? serverNowMs, mounted: nu !== null };
}
