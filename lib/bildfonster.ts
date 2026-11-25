// Kortens bilder finns bara nära fönstret (Leonard 2026-11-25).
// Varför, och vad som mättes, står i components/kort-bildfonster.tsx.
// Här står talen och den regel som går att pröva utan webbläsare.

/** Så långt från fönstret, uppåt och nedåt, bär ett kort sina bilder. Drygt
 *  fyra telefonskärmar: en hel omgång "Visa fler" (tolv rader på en telefon)
 *  ryms, och ett svep med tummen hinner inte förbi. */
export const BILDFONSTER_PX = 4000;

/** När en lång lista ställs tillbaka efter bakåt: så många kort före och efter
 *  det sparade kortet börjar med sina bilder (en omgång åt varje håll). Resten
 *  får dem när de närmar sig fönstret. */
export const BILDER_RUNT_ANKARET = 24;

/** Varans adressnamn ur kortets länk (`/produkt/<namn>`, med eller utan `?farg=`). Tomt för annat. */
export const slugUrLank = (href: string): string => /^\/produkt\/([^/?#]+)/.exec(href)?.[1] ?? "";

/** Läget som ställdes tillbaka: det sparade kortets plats i listan (-1 när det
 *  inte finns där) och hur många kort läget gällde. */
export type Ankare = { index: number; antal: number };

/**
 * Börjar kortet på plats `i` med sina bilder, innan bevakaren har svarat?
 *
 * Utan tillbakaställt läge: ja. Kortet ritas där kunden står (sidans första
 * kort, eller en ny omgång "Visa fler").
 *
 * Med ett tillbakaställt läge: bara korten runt det sparade kortet. De andra
 * står långt från fönstret, och var det hundratals fick fliken varje gång
 * hämta och rita alla deras bilder på en gång. Kort som kommer till EFTER
 * läget (`i >= antal`) är en ny omgång och börjar med sina bilder. Saknas det
 * sparade kortet börjar inget av lägets kort med bilder: bevakaren ger dem till
 * dem som står vid fönstret, en bildruta senare.
 */
export function borjarMedBilder(i: number, ankare: Ankare | null, runt: number = BILDER_RUNT_ANKARET): boolean {
  if (!ankare || i >= ankare.antal) return true;
  return ankare.index >= 0 && Math.abs(i - ankare.index) <= runt;
}
