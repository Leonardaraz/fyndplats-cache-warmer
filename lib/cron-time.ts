// lib/cron-time.ts
//
// DST-safe gating for Vercel Cron.
//
// Vercel Cron schedules are evaluated in FIXED UTC — there is no timezone
// support (https://vercel.com/docs/cron-jobs). Sweden observes daylight saving:
//   • winter (CET)  = UTC+1
//   • summer (CEST) = UTC+2
// so a single fixed-UTC cron drifts one hour across the year. A cron at
// "0 6 * * *" is 08:00 Swedish in summer but 07:00 in winter.
//
// To fire at a fixed *Swedish* wall-clock hour year-round we schedule the cron
// at BOTH candidate UTC hours (one covers summer, the other winter) and gate in
// code: the run only proceeds when the Stockholm local hour matches the target.
// On any given day exactly one of the two UTC firings lands on the target hour;
// the other is short-circuited with a 200 (so Vercel doesn't flag a failure).
//
//   target 08:00 Swedish  →  schedule "0 6,7 * * *"
//     summer: 06 UTC = 08:00 ✓ fire   |  07 UTC = 09:00 ✗ skip
//     winter: 06 UTC = 07:00 ✗ skip   |  07 UTC = 08:00 ✓ fire

/** Current hour (0–23) in Europe/Stockholm for the given instant. */
export function swedishHour(now: Date = new Date()): number {
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    hour: "numeric",
    hour12: false,
  }).format(now);
  // sv-SE renders "08" (zero-padded); parseInt copes with that and a bare "8".
  return Number.parseInt(formatted, 10);
}

/** True when the Stockholm local hour equals `target` (0–23). */
export function isSwedishHour(target: number, now: Date = new Date()): boolean {
  return swedishHour(now) === target;
}

/**
 * Clock snapshot for cron logging — UTC ISO plus the Swedish wall-clock string
 * and hour, so every trigger leaves a "fired at UTC X = Swedish Y" audit line.
 */
export function cronClock(now: Date = new Date()): {
  utc: string;
  swedish: string;
  swedishHour: number;
} {
  return {
    utc: now.toISOString(),
    swedish: new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Stockholm",
      dateStyle: "short",
      timeStyle: "medium",
    }).format(now),
    swedishHour: swedishHour(now),
  };
}
