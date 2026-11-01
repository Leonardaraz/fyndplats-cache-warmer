// lib/review-kopt.ts
//
// VILKEN VARIANT RECENSENTEN KÖPTE.
//
// På en sida med flera varianter (färg, storlek) skickar motorn med vilken
// variant en recension gäller, i fältet `kopt` ("Svart / 50 liter", samma namn
// som sidans val). Butiken visar det som "Köpt: Svart / 50 liter" under namnet,
// så att en kund som läser om den stora storleken vet att omdömet gäller den.
// Fältet saknas på produkter med en variant, och då visas ingenting.
//
// Ingen import här, med flit: node-testköraren laddar modulen direkt.

/** Längre än så är inget variantnamn (Wix tar 50 tecken per val, två axlar). */
export const KOPT_MAX = 120;

/** Det visade variantnamnet, eller undefined när det saknas eller ser fel ut. */
export function koptEtikett(varde: unknown): string | undefined {
  if (typeof varde !== "string") return undefined;
  const ren = varde.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!ren || ren.length > KOPT_MAX) return undefined;
  return ren;
}
