// Färgnamn → CSS-hex för premium färgprick i variantväljaren när per-val-bild saknas.
// Utbruten hit (utan tunga beroenden) så den är enhetstestbar och delas av
// products.ts. Matchningen är EXAKT eller på HELA ord — INTE lös delsträng, som
// tidigare gav fel träffar ("blå" inne i "marinblå" → fel blå istället för marin;
// "ko" inne i "kontakt"/"korall" → cream). Sammansatta svenska färger finns som
// egna nycklar så de matchar exakt.

export const COLOR_HEX: Record<string, string> = {
  vit: "#FFFFFF", white: "#FFFFFF",
  svart: "#1c1c1c", black: "#1c1c1c",
  grå: "#9ca3af", grey: "#9ca3af", gray: "#9ca3af",
  röd: "#dc2626", red: "#dc2626",
  blå: "#2563eb", blue: "#2563eb",
  grön: "#16804a", green: "#16804a",
  gul: "#fbbc05", yellow: "#fbbc05",
  orange: "#f47a35",
  rosa: "#fbcfe8", pink: "#fbcfe8",
  lila: "#a855f7", purple: "#a855f7", violett: "#a855f7",
  beige: "#e8d4b3", khaki: "#c3b091",
  brun: "#92400e", brown: "#92400e", tan: "#d2b48c",
  guld: "#d4af37", gold: "#d4af37",
  silver: "#c0c0c0",
  turkos: "#06b6d4", turquoise: "#06b6d4", teal: "#0d9488",
  petrol: "#005f73",
  natur: "#e0d3c1", naturlig: "#e0d3c1",
  marin: "#1e3a8a", navy: "#1e3a8a",
  vinröd: "#7f1d1d", burgundy: "#7f1d1d", bordeaux: "#7f1d1d",
  champagne: "#f7e7ce",
  cream: "#fefce8", creme: "#fefce8",
  ko: "#fefce8", cow: "#fefce8",
  tiger: "#f59e0b",
  // Sammansatta svenska färger (egna nycklar → exakt match, ingen delsträngs-gissning).
  marinblå: "#1e3a8a",
  ljusblå: "#7dd3fc", mörkblå: "#1e40af",
  ljusgrå: "#d1d5db", mörkgrå: "#4b5563",
  ljusgrön: "#86efac", mörkgrön: "#14532d",
  ljusrosa: "#fbcfe8",
  roséguld: "#b76e79", roseguld: "#b76e79",
  gräddvit: "#fefce8",
};

/**
 * CSS-hex för ett färgnamn, annars "" (→ ingen prick / text-läge). Exakt match
 * först, sedan hela ord (unicode-bokstäver). Ingen lös delsträng → "EU-kontakt",
 * "Korall" m.fl. ger inte längre falska träffar, och "Marinblå" ger marin (egen
 * nyckel) i stället för blå.
 */
export function colorOf(name: string): string {
  const k = (name || "").toLowerCase().trim();
  if (!k) return "";
  if (COLOR_HEX[k]) return COLOR_HEX[k];
  for (const w of k.match(/\p{L}+/gu) || []) {
    if (COLOR_HEX[w]) return COLOR_HEX[w];
  }
  return "";
}
