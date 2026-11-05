// lib/medlem/visning.ts
//
// Besluten bakom texterna på Mina sidor, som rena funktioner så att de går att
// pröva (visning.test.ts). Granskningen 2026-11-04 hittade tre texter som kunde
// säga fel sak:
//   - "Du har den högsta nivån" visades också för en nivå satt för hand under
//     den räknade, där nästa nivå redan var nådd;
//   - en betald order som inte räknas av annat skäl än ålder fick texten
//     "äldre än ett år", fast den var en vecka gammal;
//   - "Spårning kommer när paketet har skickats" stod på varje gammal order
//     utan spårningsnummer, också de som levererades för ett halvår sedan;
//   - "Handla för X före Y så behåller du VIP" stod elva månader i förväg.
//
// Ren modul utan lokala imports utom typer.

import type { Nivalage, Regler } from "./niva";

/** Sant bara när kunden faktiskt står på den översta nivån. */
export function arHogstaNivan(lage: Pick<Nivalage, "niva" | "nasta">, regler: Regler): boolean {
  if (lage.nasta) return false;
  const ix = regler.nivaer.findIndex((n) => n.namn === lage.niva.namn);
  return ix === regler.nivaer.length - 1;
}

export type Orderstatus = "betald" | "delvis-aterbetald" | "aterbetald" | "avbruten" | "obetald";

/** Dagar tills en order räknas som gammal på Mina sidor. */
export const ETT_AR_DAGAR = 365;
/** Så länge en betald order utan spårning väntas få ett paket. */
export const SPARNING_VANTAS_DAGAR = 30;

/** Varför en order inte räknas i nivån. `alderDagar` räknas från beställningen. */
export function inteRaknadText(status: Orderstatus, alderDagar: number): string {
  if (status === "avbruten") return "Räknas inte, ordern är avbruten.";
  if (status === "obetald") return "Räknas från dagen du betalar.";
  if (status === "aterbetald") return "Räknas inte, hela beloppet är återbetalt.";
  if (alderDagar >= ETT_AR_DAGAR) return "Räknas inte längre, köpet är äldre än ett år.";
  return "Räknas inte i nivån.";
}

/** "Spårning kommer när paketet har skickats": bara för en ny, betald order. */
export function visaSparningVantas(status: Orderstatus, alderDagar: number): boolean {
  return (status === "betald" || status === "delvis-aterbetald") && alderDagar <= SPARNING_VANTAS_DAGAR;
}

/** Så nära sänkningen visas "Handla för X före Y" på Mina sidor. Mejlet går 14 dagar före. */
export const UPPMANING_DAGAR = 60;

/** Uppmaningen att handla för att behålla nivån: bara när sänkningen är nära. */
export function visaUppmaning(sankningDag: number | null | undefined, idag: number): boolean {
  return sankningDag != null && sankningDag - idag <= UPPMANING_DAGAR;
}

/**
 * Länken "Kvitto (PDF)" på en order (motorns /api/medlem/kvitto via butikens
 * /api/konto/kvitto/<nummer>). Bara för en order som har betalats och inte är
 * helt återbetald; motorn prövar samma sak igen.
 */
export function visaKvitto(status: Orderstatus): boolean {
  return status === "betald" || status === "delvis-aterbetald";
}

/** Beskedet när kvittot inte går att hämta, per skäl från motorn. */
export function kvittoFelText(skal: string | undefined): string {
  switch (skal) {
    case "obetald":
      return "Ordern är inte betald än. Kvittot finns här när betalningen har kommit in.";
    case "avbruten":
      return "Ordern är avbruten, så det finns inget kvitto.";
    case "inget-kvitto":
      return "Kvittot för den här ordern går inte att hämta här. Svara på orderbekräftelsen, så skickar vi det.";
    case "inte-din":
    case "saknas":
      return "Ordern finns inte på ditt konto.";
    case "utloggad":
      return "Logga in på Mina sidor för att hämta kvittot.";
    default:
      return "Kvittot går inte att hämta just nu. Försök igen om en stund.";
  }
}
