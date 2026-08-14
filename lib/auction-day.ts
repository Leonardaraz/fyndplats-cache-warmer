// lib/auction-day.ts
//
// Fyndauktionens DAGSDRAMATURGI — ren klocklogik för upplevelselagret
// (färgtemperatur, tändning, timslag). Ingen prislogik här: priserna ägs av
// motorn i cache-warmer-appen; det här styr bara hur sidan SER UT och RÖR SIG
// under auktionsdagen 07:00 → 19:00.
//
//   heat 0 → 1   : 07:00 → 18:00 (sista sänkningen) — sidan värms upp
//   final        : 18:00–19:00 — ember-läget (mörkt, glöd, gnistor)
//   strike       : varje hel timme 08–18 — blixt + hjärtslag när priset faller

/** Auktionsdagens längd i timmar (07 → 19). Speglar motorns AUCTION_DAY_HOURS. */
export const AUCTION_DAY_HOURS = 12;

/** Timmen (relativt start) då golvet nås och sista timmen börjar (18:00). */
export const FINAL_HOUR = AUCTION_DAY_HOURS - 1;

const HOUR_MS = 3_600_000;

/**
 * Dagens "temperatur" 0–1: 0 vid start (07:00), 1 när golvet nås (18:00).
 * Före start och utan startAt ⇒ 0. Efter 18:00 ligger den kvar på 1.
 */
export function dayHeat(startAtMs: number | null, nowMs: number): number {
  if (startAtMs == null) return 0;
  const h = (nowMs - startAtMs) / (FINAL_HOUR * HOUR_MS);
  return Math.min(1, Math.max(0, h));
}

/** Sista timmen (18:00–19:00): golvpris, ember-läge, max dramatik. */
export function isFinalHour(startAtMs: number | null, nowMs: number): boolean {
  if (startAtMs == null) return false;
  const elapsed = nowMs - startAtMs;
  return elapsed >= FINAL_HOUR * HOUR_MS && elapsed < AUCTION_DAY_HOURS * HOUR_MS;
}

/** Dagen slut (≥ 19:00) — priserna är återställda, visa lugnt läge. */
export function isDayOver(startAtMs: number | null, nowMs: number): boolean {
  if (startAtMs == null) return false;
  return nowMs - startAtMs >= AUCTION_DAY_HOURS * HOUR_MS;
}

/**
 * Aktuellt timindex 0–11 (0 = 07-timmen, 11 = sista timmen). Före start ⇒ 0,
 * efter dagens slut klampas till 11. Samma indexering som motorns stege.
 */
export function hourIndex(startAtMs: number | null, nowMs: number): number {
  if (startAtMs == null) return 0;
  const idx = Math.floor((nowMs - startAtMs) / HOUR_MS);
  return Math.min(AUCTION_DAY_HOURS - 1, Math.max(0, idx));
}

/** Ms kvar till dagens slut (19:00), eller null utan start/efter slut. */
export function msToDayEnd(startAtMs: number | null, nowMs: number): number | null {
  if (startAtMs == null) return null;
  const left = startAtMs + AUCTION_DAY_HOURS * HOUR_MS - nowMs;
  return left > 0 ? left : null;
}

/**
 * Klientens refresh-backoff när en steggräns passerats (kort/hjältekort):
 * stegen KEDJAS av useAuctionClock — varje utlöst försök schemalägger nästa
 * tills servern levererat ett framtida mål eller stegen är slut, och räknaren
 * NOLLSTÄLLS när ett färskt mål kommit. Summan ~28 min täcker väckarklockans
 * uppmätta drift (audit 2026-08-14: GitHub Actions-cron 9–57 min sen; nu tätad
 * till var 10:e minut — backoffen är säkerhetsbältet om en körning uteblir).
 * Granskningen 2026-08-14 fällde första versionen på exakt detta: en
 * dependency på enbart "har målet passerats?" ändras inte av ett misslyckat
 * refresh-försök, så stege utan kedjning = ETT försök, inte sex.
 */
export const REFRESH_BACKOFF_MS = [5_000, 30_000, 90_000, 180_000, 420_000, 960_000] as const;

/** Auktionsdagens längd i ms + dagens slut för ett givet startAt. Håller
 *  07→19-matten i EN modul — komponenterna hade börjat inline:a 3_600_000. */
export const AUCTION_DAY_MS = AUCTION_DAY_HOURS * HOUR_MS;
export function dayEndMs(startAtMs: number | null): number | null {
  return startAtMs == null ? null : startAtMs + AUCTION_DAY_MS;
}

/** Nedräkningsformat H:MM:SS / M:SS — delades tidigare som fyra kopior. */
export function fmtLeft(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/**
 * Klientlägets tillståndsmaskin — REN funktion så den kan golden-testas i
 * node --test (komponenterna täcks inte av testsviten). Faserna:
 *
 *   pre       — före 07:00: räkna ner till start (target = startsAt)
 *   countdown — nästa sänkning känd och i framtiden (target = nextDropAt)
 *   stale     — målet passerat men servern har inte hunnit: "Priset uppdateras…"
 *               (target = det passerade målet → refresh-kedjan jobbar)
 *   floor     — golvet nått (ingen nextDropAt), dagen pågår: "Lägsta pris!"
 *               (target = dagens slut → 19:00-väckningen)
 *   ended     — ≥19:00: "Stängt för idag" (target = det passerade dagsslutet
 *               → refresh-kedjan hämtar morgondagens lineup)
 */
export type AuctionPhase = "pre" | "countdown" | "stale" | "floor" | "ended";
export function auctionPhase(
  nowMs: number,
  t: { startsAtMs: number | null; dayStartMs: number | null; nextDropAtMs: number | null },
): { phase: AuctionPhase; targetMs: number | null } {
  if (t.startsAtMs !== null && t.startsAtMs > nowMs) {
    return { phase: "pre", targetMs: t.startsAtMs };
  }
  if (isDayOver(t.dayStartMs, nowMs)) {
    return { phase: "ended", targetMs: dayEndMs(t.dayStartMs) };
  }
  if (t.nextDropAtMs !== null) {
    return { phase: t.nextDropAtMs > nowMs ? "countdown" : "stale", targetMs: t.nextDropAtMs };
  }
  return { phase: "floor", targetMs: dayEndMs(t.dayStartMs) };
}
