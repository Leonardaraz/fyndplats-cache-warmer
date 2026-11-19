// lib/guide-kort.ts
//
// Startsidans köpguider som en rad man bläddrar i (components/guide-karusell.tsx,
// 2026-11-19). Leonard: "kan du göra så det går att bläddra mellan alla
// blogginlägg där inte bara 3. Jag vill att det ska vara optimerad hastighet
// fortfarande super snabb."
//
// SÅ HÅLLS SIDAN LIKA LÄTT. Alla inlägg följer med som data (rubrik, adress,
// ingress, omslag), men bara de första ritas: fyra kort i sidans HTML, mot tre
// förut. Resten ritas när man bläddrar, sex åt gången. Ett kort som inte är
// ritat har inget <img>, så ingen bild hämtas för det: startsidan hämtar lika
// många omslag som förut tills kunden själv bläddrar.
//
// LÖVMODUL: inga importer, så att `node --test` kan ladda den.

/** Det ett kort i raden behöver. */
export type GuideKort = { slug: string; title: string; excerpt: string; cover: string };

/** Så många kort ritas i sidans HTML. Datorn visar tre i bredd; det fjärde är nästa. */
export const GUIDER_FORST = 4;
/** Så många kort läggs till åt gången när man bläddrar. */
export const GUIDER_STEG = 6;

/**
 * Ingressen kortad vid ett ordslut. Kortet visar två rader (.guide-text), som
 * mest runt 105 tecken på datorn, så resten skulle bara väga i sidan: 44
 * inlägg med hela ingressen är flera kB data som ingen ser.
 */
export function kortIngress(text: string, max = 130): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const klipp = t.slice(0, max);
  const slut = klipp.lastIndexOf(" ");
  return `${(slut > max * 0.6 ? klipp.slice(0, slut) : klipp).replace(/[\s,;:–-]+$/, "")}…`;
}

/** Inläggen som kort, nyast först. Inlägg utan omslag eller rubrik hoppas över. */
export function guideKort(
  poster: readonly { slug: string; title: string; excerpt: string; cover: string; date: string; updated?: string }[],
): GuideKort[] {
  return poster
    .filter((p) => p.cover && p.title && p.slug)
    .slice()
    .sort((a, b) => (b.updated || b.date).localeCompare(a.updated || a.date))
    .map((p) => ({ slug: p.slug, title: p.title, excerpt: kortIngress(p.excerpt), cover: p.cover }));
}

/** Hur många kort som ska vara ritade efter en bläddring. */
export function flerKort(ritade: number, totalt: number): number {
  return Math.min(totalt, ritade + GUIDER_STEG);
}
