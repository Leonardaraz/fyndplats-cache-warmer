// lib/kort-galleri.ts
// Produktkortets EXTRA bilder — de som hämtas först när någon sveper.
//
// Listsidorna skickar två bilder per kort (huvudbild + hover-bild). Fler än så
// i listnyttolasten kostar alla besökare: mätt 2026-09-24 hade en tredje
// nyckel per produkt gjort bildkartan (/api/kort-bilder) 40 % större, 178 → 246
// kB gzip, för bilder de flesta aldrig sveper fram till. I stället hämtar
// kortet resten av galleriet från /api/kort-galleri/<slug> när besökaren
// börjar svepa — då betalar bara den som faktiskt tittar.
//
// Ren funktion utan importer (node:test kör den direkt); rutten skickar in
// nyckelfunktionen.

/** Högst så många bilder per kort totalt, inklusive de två som redan finns. */
export const KORT_MAX_BILDER = 6;

/**
 * Galleriets bilder UTÖVER huvud- och hover-bilden, som media-nycklar, i
 * galleriets ordning. Dubbletter (samma fil med olika transform-parametrar,
 * eller samma bild som huvud-/hover-bilden) tas bort, och listan kapas så att
 * kortet totalt aldrig har fler än KORT_MAX_BILDER.
 */
export function extraKortbilder(
  img: string | undefined,
  gallery: string[] | undefined,
  nyckel: (url: string) => string | null,
): string[] {
  const n = (u: string) => nyckel(u) ?? u;
  const sett = new Set<string>();
  if (img) sett.add(n(img));
  // Hover-bilden är galleriets första bild som inte är huvudbilden — samma
  // regel som forClient och /api/kort-bilder, så den räknas som redan visad.
  const hover = gallery?.find((g) => g !== img);
  if (hover) sett.add(n(hover));
  const ut: string[] = [];
  for (const g of gallery ?? []) {
    if (!g) continue;
    const k = n(g);
    if (sett.has(k)) continue;
    sett.add(k);
    ut.push(k);
    if (ut.length >= KORT_MAX_BILDER - 2) break;
  }
  return ut;
}
