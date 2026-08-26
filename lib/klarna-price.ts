// Klarna vill ha alla belopp i "minor units" (öre för SEK): 789 kr → 78900.
// Wrapper runt den enda tvetydiga fällan i integrationen — ingen på PDP-sidan
// ska tänka på decimaler. Namngivet så det syns i fyndplats-loggar när Klarna
// avvisar felformaterat belopp (som händer om vi råkar skicka 789 eller 789.00).
//
// Kontraktet med Klarna OSM:
//   • data-purchase-amount MÅSTE vara heltal i öre (inte kronor, inte string med komma).
//   • Klarna's client-side widget själv formaterar sen visningen till "789,00 kr".
//   • Skickar vi 0/undefined → widgeten visar inget belopp (default 30-dagars-badge).

/**
 * Konverterar ett SEK-belopp till Klarna minor units (öre).
 * Fräser bort NaN / negativa / icke-finita till 0 så vi aldrig skickar skräp
 * till widgeten. Klarna räknar decimaler exakt (0.005 = 0 öre, 0.005001 = 1 öre)
 * så vi använder Math.round för half-away-from-zero-beteende (JavaScript
 * default: bankers rounding för 0.5 skulle ge fel öre vid t.ex. 0.005).
 */
export function toMinorUnits(sek: number | null | undefined): number {
  if (typeof sek !== "number") return 0;
  if (!Number.isFinite(sek)) return 0;
  if (sek < 0) return 0;
  return Math.round(sek * 100);
}
