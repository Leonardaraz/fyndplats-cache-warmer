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
 * Klientens refresh-backoff när en steggräns passerats (kort/hjältekort/pill):
 * täcker ~28 min sen tick i stället för ~1 min som förr. Skälet är uppmätt
 * (audit 2026-08-14): väckarklockan är en GitHub Actions-cron som driver
 * 9–57 min per timme, så nedräkningen nådde noll utan att priset hunnit
 * PATCH:as — korten fastnade på "Priset uppdateras…" efter tre snabba försök
 * och gav upp. Stegen är stigande så tidiga träffar är snabba när ticken är i
 * tid, och sena träffar fångar drift utan att spamma servern.
 */
export const REFRESH_BACKOFF_MS = [5_000, 30_000, 90_000, 180_000, 420_000, 960_000] as const;
