// lib/auction/antal.ts
//
// HUR MÅNGA FYND EN AUKTIONSDAG HAR. Ren logik, inga sidoeffekter.
//
// Leonard 2026-11-04: tio om dagen i stället för fem. Driften kostar nästan
// ingenting mer (ticken går var tionde minut oavsett antal); det som kostar är
// rabatten på de fynd som faktiskt säljs. Black Week läggs in som datum i
// `DAGAR` när motorn klarar 50 och 100 om dagen (planen, del C2).
//
// DAGEN RÄKNAS PÅ STARTEN. Antalet för en dag gäller fynden som startar 07:00
// den dagen (svensk väggklocka). Ticken fyller platserna med start NÄSTA 07:00,
// så det är nästa starts dag som avgör hur många som ska främjas.
//
// ALLA LEVANDE RÄKNAS. Ett sålt fynd ersätts direkt med ett som startar nästa
// morgon, så under dagen ligger startade och schemalagda rader sida vid sida.
// Ticken främjar tills alla levande (startade + schemalagda) är lika många som
// nästa dags antal:
//
//   - en dag med fler fynd än i dag (10 → 50): resten schemaläggs redan under
//     dagen. Butiken visar en schemalagd rad först när dagens är slut
//     (headless-site lib/auction-visible.ts), så de syns inte för tidigt.
//   - en dag med färre (100 → 50): ingenting främjas förrän dagens tagit slut
//     kl 19, och då fylls nästa dag till sitt antal.

/** Fynd per dag när inget datum säger annat (Leonard 2026-11-04). */
export const STANDARD_ANTAL = 10;

/**
 * Dagar med ett annat antal: "ÅÅÅÅ-MM-DD" (startens dag, svensk tid) → antal.
 * Tom tills Black Week-delen är byggd (planen, del C2).
 */
export const DAGAR: Readonly<Record<string, number>> = {};

/** Det största antalet någon dag kan ha. Läsgränsen i /api/auctions/rader följer det. */
export const MAX_ANTAL = Math.max(STANDARD_ANTAL, ...Object.values(DAGAR));

const SVENSK_DAG = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Stockholm",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Startens dag på svensk väggklocka, "ÅÅÅÅ-MM-DD". */
export function svenskDag(iso: string): string {
  return SVENSK_DAG.format(new Date(iso));
}

/** Antalet fynd för auktionsdagen som startar `startAt` (ISO). */
export function auktionerFor(startAt: string): number {
  return DAGAR[svenskDag(startAt)] ?? STANDARD_ANTAL;
}

/** Hur många som ska främjas: nästa dags antal minus alla levande (startade + schemalagda). */
export function attFramja(levande: number, mal: number): number {
  return Math.max(0, mal - levande);
}

/**
 * De `antal` lägsta lediga slotnumren, från 1. En slot är bara ett id för
 * raden bland de levande (butiken sorterar inte på den), så luckor fylls först.
 */
export function ledigaSlots(upptagna: ReadonlySet<number>, antal: number): number[] {
  const ut: number[] = [];
  for (let s = 1; ut.length < antal; s++) if (!upptagna.has(s)) ut.push(s);
  return ut;
}
