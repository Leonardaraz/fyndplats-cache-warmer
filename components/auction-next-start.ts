// Fyndauktionens tomma läge: när startar nästa auktionsdag, och vad ska sidan
// säga medan listan är tom? Ren klocklogik i Europe/Stockholm, så att samma
// funktioner kan köras på servern (första render) och i klienten (nedräkningen)
// och testas i node --test (lib/auction-next-start.test.ts).
//
// Klockslaget 07 är auktionens publika starttid (se lib/auction-day.ts). Här
// räknas bara "nästa gång klockan slår 07 i Sverige", inte motorns faktiska
// startAt: den finns inte när listan är tom.

export const AUKTION_TZ = "Europe/Stockholm";
export const START_TIMME = 7;
export const SLUT_TIMME = 19;
/** Efter 07:00 väntar sidan så här länge på att dagens fynd dyker upp innan
 *  den ger upp och säger "sålda". Motorn lägger ut raderna strax efter 07. */
export const STARTFONSTER_MIN = 15;

type Delar = { y: number; mo: number; d: number; h: number; mi: number; s: number };

const DELAR_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: AUKTION_TZ,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hourCycle: "h23",
});

/** Väggklockan i Stockholm för ett ögonblick. */
export function stockholmDelar(ms: number): Delar {
  const p: Record<string, number> = {};
  for (const del of DELAR_FMT.formatToParts(new Date(ms))) {
    if (del.type !== "literal") p[del.type] = Number(del.value);
  }
  return { y: p.year, mo: p.month, d: p.day, h: p.hour % 24, mi: p.minute, s: p.second };
}

/** Stockholms UTC-förskjutning i ms vid ett ögonblick (+1 h vinter, +2 h sommar). */
function forskjutning(ms: number): number {
  const p = stockholmDelar(ms);
  const vagg = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s);
  return vagg - Math.floor(ms / 1000) * 1000;
}

/**
 * Nästa gång klockan slår 07:00 i Stockholm (i dag före 07, annars i morgon).
 * Förskjutningen räknas vid MÅLET, inte nu: natten mot sommartid/vintertid
 * hade nedräkningen annars legat en timme fel.
 */
export function nastaStartMs(nuMs: number): number {
  const p = stockholmDelar(nuMs);
  const dagar = p.h < START_TIMME ? 0 : 1;
  const vaggMal = Date.UTC(p.y, p.mo - 1, p.d + dagar, START_TIMME, 0, 0);
  let gissning = vaggMal - forskjutning(nuMs);
  gissning = vaggMal - forskjutning(gissning);
  return gissning;
}

/**
 * Vad den tomma listan betyder just nu:
 *   fore  — före 07: dagens fynd har inte startat
 *   snart — 07:00–07:15: fynden läggs ut, sidan hämtar om sig själv
 *   salda — under dagen: alla dagens fynd är sålda
 *   kvall — efter 19: dagen är slut
 */
export type TomtLage = "fore" | "snart" | "salda" | "kvall";

export function tomtLage(nuMs: number): TomtLage {
  const { h, mi } = stockholmDelar(nuMs);
  if (h < START_TIMME) return "fore";
  if (h === START_TIMME && mi < STARTFONSTER_MIN) return "snart";
  if (h < SLUT_TIMME) return "salda";
  return "kvall";
}

const DAG_FMT = new Intl.DateTimeFormat("sv-SE", { timeZone: AUKTION_TZ, weekday: "long", day: "numeric", month: "long" });

/** "i dag, onsdag 30 september" / "i morgon, torsdag 1 oktober". */
export function startDagText(malMs: number, nuMs: number): string {
  const a = stockholmDelar(nuMs), b = stockholmDelar(malMs);
  const dagar = Math.round((Date.UTC(b.y, b.mo - 1, b.d) - Date.UTC(a.y, a.mo - 1, a.d)) / 86_400_000);
  const nar = dagar <= 0 ? "i dag" : dagar === 1 ? "i morgon" : "";
  const datum = DAG_FMT.format(new Date(malMs));
  return nar ? `${nar}, ${datum}` : datum;
}

/** Nedräkningens tre fält (timmar, minuter, sekunder), aldrig negativa. */
export function nedrakning(ms: number): { h: number; m: number; s: number } {
  const t = Math.max(0, Math.floor(ms / 1000));
  return { h: Math.floor(t / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
}
