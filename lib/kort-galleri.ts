// lib/kort-galleri.ts
// Produktkortets EXTRA bilder — de som hämtas först när någon sveper.
//
// Listsidorna skickar två bilder per kort (huvudbild + hover-bild). Fler än så
// i listnyttolasten kostar alla besökare: mätt 2026-09-24 hade en tredje
// nyckel per produkt gjort bildkartan (/api/kort-bilder) 40 % större, 178 → 246
// kB gzip, för bilder de flesta aldrig sveper fram till. I stället hämtar
// kortet resten av galleriet från /api/kort-galleri/<del> på pekskärmar — och
// visar själva bilden först när besökaren sveper fram till den.
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

// ── Katalogen i fasta delar ─────────────────────────────────────────────────
// Extrabilderna ligger i KORT_DELAR förbyggda svar, /api/kort-galleri/<del>,
// och varje produkt hör alltid till samma del. Webbläsaren ber om de delar
// sidans kort hör till.
//
// VARFÖR INTE EN FRÅGA PER SIDA (?s=a,b,c, 2026-09-24 → 25). En sådan fråga är
// en ny nyckel för varje urval, alltså ett funktionsanrop — och på en kall
// instans läser rutten hela katalogen: 47,5 s uppmätt på preview. Leonards
// prickar kom först när han öppnade sidan igen. Fasta delar byggs vid deployen
// (generateStaticParams) och förnyas i bakgrunden, som /api/kort-bilder, så
// ingen besökare väntar på en kall katalog.
//
// 128 delar: ett kort svar per del (~30 produkter), och en sida med 24 kort
// rör i snitt ~22 delar. Färre delar ger färre anrop men mer data man inte
// behöver; det här är en balans, inte ett magiskt tal. Ändras talet byter
// alla produkter del — det är ofarligt, klient och server delar funktionen.
export const KORT_DELAR = 128;

/** Vilken del en produkt hör till: FNV-1a över sluggen, modulo KORT_DELAR. */
export function kortDel(slug: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % KORT_DELAR;
}

/** "0".."127" → delens nummer; allt annat → null. */
export function lasDel(s: string): number | null {
  if (!/^(0|[1-9][0-9]{0,3})$/.test(s)) return null;
  const n = Number(s);
  return n < KORT_DELAR ? n : null;
}
