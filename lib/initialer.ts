// Recensentens namn som initialer: "George Galush" → "G. G.", "Orlando" → "O."
// (Leonard 2026-10-07, för kundernas integritet). Se lib/curated-reviews.ts.

export function initialer(namn: string): string {
  const delar = namn.trim().split(/\s+/).filter(Boolean);
  const bokstaver = delar.map((d) => [...d].find((c) => /\p{L}/u.test(c))).filter(Boolean) as string[];
  return bokstaver.length ? bokstaver.map((b) => `${b.toLocaleUpperCase("sv-SE")}.`).join(" ") : "Kund";
}
