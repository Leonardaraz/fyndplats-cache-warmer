// lib/variant-lage.ts
// Hur en variantaxel ritas: med bild, med färgprick eller som text.
//
// Bild > färgprick > text, som förut, med ett undantag: en MÅTTAXEL (volym,
// storlek, längd …) ritas alltid som text. Leonard 2026-10-01 om
// ultraljudstvätten (2 L–15 L): varje storlek hade sitt eget produktkort som
// bild, och i 38 px blev de fem korten likadana grå rutor med texten avkapad
// ("…ter"). Bilden skiljer inte storlekarna åt; siffran gör det.

export type VariantLage = "image" | "color" | "text";

type Val = { label: string; image?: string; color?: string };

// Axelnamn som betyder mått eller mängd. "färg"/"mönster" är aldrig mått.
const MATT_NAMN = /storlek|volym|m[åa]tt|l[äa]ngd|bredd|h[öo]jd|djup|diameter|antal|kapacitet|effekt|vikt|liter|[åa]lder|size|dimension|length|width|height|capacity|volume/i;
const UTSEENDE_NAMN = /f[äa]rg|m[öo]nster|motiv|design|colou?r|pattern/i;

/**
 * Är axeln ett mått? Namnet avgör. Ett neutralt namn ("Variant", "Typ") räknas
 * som mått när varje etikett bär en siffra och ingen etikett är en färg —
 * "Svart 120 cm" och "Vit 120 cm" skiljer sig på färgen, och där hjälper
 * bilden.
 */
export function arMattAxel(namn: string, etiketter: string[], nagonFarg = false): boolean {
  if (UTSEENDE_NAMN.test(namn)) return false;
  if (MATT_NAMN.test(namn)) return true;
  if (nagonFarg) return false;
  return etiketter.length > 0 && etiketter.every((l) => /\d/.test(l));
}

export function variantLage(namn: string, val: Val[]): VariantLage {
  if (val.length === 0) return "text";
  if (arMattAxel(namn, val.map((v) => v.label), val.some((v) => v.color))) return "text";
  if (val.every((v) => v.image)) return "image";
  // Färg-läge bara när MAJORITETEN av valen faktiskt är färger (speglar
  // importens värdebaserade isColorAxis), inte vid en enda falsk färgträff.
  if (val.filter((v) => v.color).length >= Math.ceil(val.length / 2)) return "color";
  return "text";
}
