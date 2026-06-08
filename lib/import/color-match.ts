// Robust svensk färgmatchning för att koppla färg-/modell-VAL till rätt
// galleribild (Wix linkedMedia).
//
// Bakgrund: vissa produkter får per-färg-bilder i galleriet (med färgnamn i
// alt-texten, t.ex. "…i grått") men ingen strukturerad swatch-mappning från
// skrapan/DS-API:t. Då kan vi ändå koppla rätt bild till rätt val genom att
// matcha färg-valets namn mot bildens alt-text — med svensk böjning (grå→grått,
// blå→blått, röd→rött …) och engelska synonymer. Storefronten läser linkedMedia
// med högsta prioritet → rätt bild visas per modell.
//
// Matchningen sker på HELA ord (tokeniserat) mot en form-lista per bas-färg, så
// "Blå" INTE felaktigt matchar "marinblå" (egen bas) och "Large" inte matchar alls.

const COLOR_FORMS: Record<string, string[]> = {
  grå: ["grå", "grått", "gråa", "grey", "gray"],
  blå: ["blå", "blått", "blåa", "blue"],
  röd: ["röd", "rött", "röda", "red"],
  gul: ["gul", "gult", "gula", "yellow"],
  grön: ["grön", "grönt", "gröna", "green"],
  vit: ["vit", "vitt", "vita", "white"],
  svart: ["svart", "svarta", "black"],
  brun: ["brun", "brunt", "bruna", "brown"],
  beige: ["beige"],
  rosa: ["rosa", "pink"],
  lila: ["lila", "purple", "violett", "violet"],
  orange: ["orange"],
  guld: ["guld", "gold", "gyllene"],
  silver: ["silver", "silvergrå"],
  turkos: ["turkos", "turquoise"],
  marinblå: ["marinblå", "marinblått", "navy"],
  ljusblå: ["ljusblå", "ljusblått"],
  mörkblå: ["mörkblå", "mörkblått"],
  ljusgrå: ["ljusgrå", "ljusgrått"],
  mörkgrå: ["mörkgrå", "mörkgrått"],
  vinröd: ["vinröd", "vinrött", "vinröda", "bordeaux", "burgundy"],
  khaki: ["khaki"],
  brons: ["brons", "bronze"],
  creme: ["creme", "gräddvit", "cream"],
  mint: ["mint", "mintgrön"],
  korall: ["korall", "coral"],
  persika: ["persika", "aprikos", "peach"],
  lavendel: ["lavendel", "lavender"],
};

/** Tokeniserar text till gemena ord (unicode-bokstäver). */
function words(text: string): Set<string> {
  return new Set((text.toLowerCase().match(/\p{L}+/gu) || []));
}

/** Vilka bas-färger förekommer i texten (som hela ord)? T.ex. "Grön modell 1" → ["grön"]. */
export function colorBasesIn(text: string): string[] {
  if (!text) return [];
  const w = words(text);
  const bases: string[] = [];
  for (const [base, forms] of Object.entries(COLOR_FORMS)) {
    if (forms.some((f) => w.has(f))) bases.push(base);
  }
  return bases;
}

/**
 * True om `altText` namnger samma färg som `choiceName` (svensk böjning + engelska
 * synonymer, ord-för-ord). T.ex. matchesColorName("Pawhut hundvagn i grått", "Grå")
 * → true. "Blå" matchar INTE en alt som bara säger "marinblå".
 */
export function matchesColorName(altText: string, choiceName: string): boolean {
  if (!altText || !choiceName) return false;
  const choiceBases = colorBasesIn(choiceName);
  if (choiceBases.length === 0) return false;
  const altWords = words(altText);
  return choiceBases.some((base) => COLOR_FORMS[base].some((f) => altWords.has(f)));
}

/**
 * True om värdena i en options-axel faktiskt är FÄRGER (majoriteten bär ett
 * igenkänt färgnamn) — inte storlekar/volymer/modeller/kontakttyper som AE-säljare
 * ofta lägger under "Color"-fältet. Används för att INTE göra en sådan axel till en
 * (meningslös, grå) färg-swatch i Wix bara för att värdena råkar ha en bild att
 * sampla färg ur. Tomt → false (säkrare som text; bilder behålls ändå via linkedMedia).
 */
export function isColorAxis(values: ReadonlyArray<string>): boolean {
  const vals = values.filter((v) => v && v.trim());
  if (vals.length === 0) return false;
  const colored = vals.filter((v) => colorBasesIn(v).length > 0).length;
  return colored >= Math.ceil(vals.length / 2);
}
