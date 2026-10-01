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

/**
 * Har tillräckligt många val en egen bild för att väljaren ska visa bilder och
 * galleriet hoppa vid val? Alla, eller alla utom något enstaka: Mongar-tältet
 * har bild till 5 av 6 färger, och då fick ingen färg sin bild (2026-10-01).
 * Ett val utan bild visar sin färgprick, och galleriet står kvar på första
 * bilden när det väljs.
 */
export function flestaHarBild(val: Val[]): boolean {
  if (val.length < 2) return false;
  const med = val.filter((v) => v.image).length;
  return med === val.length || (val.length >= 4 && med >= val.length - 1);
}

export function variantLage(namn: string, val: Val[]): VariantLage {
  if (val.length === 0) return "text";
  if (arMattAxel(namn, val.map((v) => v.label), val.some((v) => v.color))) return "text";
  if (flestaHarBild(val)) return "image";
  // Färg-läge bara när MAJORITETEN av valen faktiskt är färger (speglar
  // importens värdebaserade isColorAxis), inte vid en enda falsk färgträff.
  if (val.filter((v) => v.color).length >= Math.ceil(val.length / 2)) return "color";
  return "text";
}

/**
 * Mått i tum med centimeter eller millimeter inom parentes visas i det
 * metriska — det är en svensk butik. Det som står mellan "tum" och parentesen
 * ("1 st", "A") följer med, så att två val aldrig blir lika:
 *   "18 × 12 × 14 tum (≈46 × 30 × 36 cm)"   → "46 × 30 × 36 cm"
 *   "38.6x15.2 tum 2 st (≈98 × 39 cm)"      → "98 × 39 cm · 2 st"
 *   "31.5 tum ( 800mm )"                     → "800 mm"
 */
export function utanTum(etikett: string): string {
  const m = (etikett || "").match(/^.*?\btum\b\s*(.*?)\s*\(\s*≈?\s*([^()]*?\d)\s*(cm|mm)\s*\)\s*$/i);
  if (!m) return etikett;
  const extra = m[1].trim();
  const matt = `${m[2].trim()} ${m[3].toLowerCase()}`;
  return extra ? `${matt} · ${extra}` : matt;
}

// Valnamn som de står i Wix men inte ska visas så. Wix API kan inte byta namn
// på ett val (update-choices tar bara primaryChoiceIds, och valen är oföränderliga
// på customizationen), så butiken visar dem rätt här. Kassan, som Wix äger,
// visar Wix-namnet tills det byts i Wix instrumentpanel. Granskningen 2026-10-01.
const VALNAMN: Record<string, string> = {
  // Naturehike Cloud Up: färg, antal personer och tyg i ett ("20D" har alla).
  "Sand-1P-20D": "Sand · 1 person", "Ljusgrå-1P-20D": "Ljusgrå · 1 person", "Skoggrön-1P-20D": "Skogsgrön · 1 person",
  "Gul-2P-20D": "Gul · 2 personer", "Sand-2P-20D": "Sand · 2 personer", "Ljusgrå-2P-20D": "Ljusgrå · 2 personer",
  "Marinblå-2P-20D": "Marinblå · 2 personer", "Ljusgrå-3P-20D": "Ljusgrå · 3 personer", "Marinblå-3P-20D": "Marinblå · 3 personer",
  "Sand-3P-20D": "Sand · 3 personer", "Skoggrön-3P-20D": "Skogsgrön · 3 personer",
  // Naturehike Star River och Mongar.
  "210T - Armégrön": "Armégrön · 210T", "20D - Grön": "Grön · 20D",
  "2P-210T-Forest": "Skogsgrön · 2 personer · 210T", "2P - 210T - Blå": "Blå · 2 personer · 210T",
  "2P-20D-Grå": "Grå · 2 personer · 20D", "1P-15D UL-Brun": "Brun · 1 person · 15D UL",
  "2P-15D UL-Brun": "Brun · 2 personer · 15D UL", "2P-15D UL-Grå": "Grå · 2 personer · 15D UL",
  // Mahjongbordet (alt-texterna säger vad valen är).
  "svartaDominostenar": "Svart med dominobrickor", "vitaDominostenar": "Vit med dominobrickor",
  "vitBärbar": "Vit, bärbar med spelduk", "vitKinesiskBärbar": "Vit, bärbar med mahjongbrickor",
  // Färger med stavfel eller engelsk särskrivning (halterneck-linnet, träningstoppen).
  "Druva Lila": "Druvlila", "Korall Rosa": "Korallrosa", "Elektrisk Blå": "Elektriskt blå", "Blå Grå": "Blågrå",
  "Grå Grön": "Grågrön", "Plomonfärgad": "Plommonlila", "Djuphavblå": "Djuphavsblå", "Grafitgrå Grå": "Grafitgrå",
  "Grå Lila": "Grålila", "Pistacijegrön": "Pistaschgrön", "Fjäder beige": "Fjäderbeige", "Rosé Lila": "Rosélila",
  // Garagehyllan: bredden först, som på produktkortet ("91 × 41 × 183 cm").
  "16x36x72 tum 5 Tire (≈41 × 91 × 183 cm)": "91 × 41 × 183 cm · 5 hyllplan",
  "18x48x72 tum 5 Tire (≈46 × 122 × 183 cm)": "122 × 46 × 183 cm · 5 hyllplan",
  "20x40x57 tum 4 Tire (≈51 × 102 × 145 cm)": "102 × 51 × 145 cm · 4 hyllplan",
  "20x48x72 tum 5 Tire (≈51 × 122 × 183 cm)": "122 × 51 × 183 cm · 5 hyllplan",
  "20x59x72 tum 5 Tire (≈51 × 150 × 183 cm)": "150 × 51 × 183 cm · 5 hyllplan",
  // Enheter som inte hör hemma i en svensk butik.
  "4500-5500sq.in.": "2,9–3,5 m²", "5500sq.in.": "3,5 m²", "1,8 x 1,8 x 1,8 m TypeA": "1,8 × 1,8 × 1,8 m",
};

/**
 * Valets namn som kunden ska se: rättat namn ur tabellen, mått i tum som cm,
 * "Tire" (hyllplan) på svenska och stor första bokstav ("endast låda" →
 * "Endast låda").
 */
export function visaValnamn(etikett: string): string {
  const s = (etikett || "").trim();
  if (!s) return etikett;
  const ratt = VALNAMN[s] ?? utanTum(s).replace(/\b(\d+)\s+Tire\b/g, "$1 hyllplan");
  return ratt.charAt(0).toLocaleUpperCase("sv-SE") + ratt.slice(1);
}
