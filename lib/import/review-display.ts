// Killswitch för hur recensions-avsändaren VISAS publikt.
//
//   REVIEW_DISPLAY_MODE=initials       (default) → "M.K."
//   REVIEW_DISPLAY_MODE=verified_buyer           → "Verifierad köpare"
//
// Bytet sker per-deploy med en enda env-flagga (ingen DB-migration). "panic-läge"
// om t.ex. en Konsumentverket-anmälan kommer: byt till verified_buyer och deploya.
//
// OBS: detta påverkar BARA visningen. Den lagrade datan (initialer, rånamn, land,
// originaltext) ändras aldrig — vi byter aldrig namn baserat på ursprung.

export type ReviewDisplayMode = "initials" | "verified_buyer";

export function reviewDisplayMode(): ReviewDisplayMode {
  return (process.env.REVIEW_DISPLAY_MODE ?? "").toLowerCase() === "verified_buyer"
    ? "verified_buyer"
    : "initials";
}

/** Publikt visningsnamn för en recension utifrån killswitch-läget. */
export function reviewDisplayName(initials: string, mode = reviewDisplayMode()): string {
  if (mode === "verified_buyer") return "Verifierad köpare";
  return initials || "Verifierad köpare";
}
