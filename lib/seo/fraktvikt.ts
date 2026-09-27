// Tredje saxen: en "Vikt"-rad som i själva verket är FRAKTVIKTEN.
//
// Importens spec-block (`buildSpecifications` i lib/aosom/to-product.ts) skriver
// raden "Vikt" ur feedkolumnen "Weight (incl. Package) in kg", alltså vikten MED
// förpackning. Poleringen skrev av raden som varans vikt. Mätt 2026-09-27 på
// rundornas egna filer: 142 av 147 sidor i B-rundorna och 616 texter i 69 andra
// rundor bar fraktvikten som "Vikt", och i 131 av de 616 stod det dessutom i
// löptexten att varan väger så mycket.
//
// Saxen byter ETIKETT, aldrig tal: raden "Vikt: X kg" blir "Fraktvikt: X kg" när
// X är exakt artikelns fraktvikt i feeden. En rad med ett annat tal rörs inte, för
// där kan det stå produktens verkliga vikt ur den tyska texten. Meningar i
// löptexten ("väger X kg") går inte att skriva om mekaniskt; de rapporteras.

/**
 * Hur nära feedens tal en rad måste ligga. Importen avrundar till två decimaler
 * (`formatNumber`), så allt utöver det är ett annat tal — och då kan raden vara
 * produktens verkliga vikt.
 */
export const FRAKTVIKT_TOLERANS_KG = 0.005;

const TAL = String.raw`(\d+(?:[.,]\d+)?)`;

/** Etiketten får bära importens bock eller en punkt framför sig, inget annat. */
const LI_TEXT = new RegExp(String.raw`^(?:[✔•·]\s*)?Vikt\s*:\s*${TAL}\s*kg\.?$`);
const TD_ETIKETT = /^Vikt\s*:?$/;
const TD_VARDE = new RegExp(String.raw`^${TAL}\s*kg\.?$`);

function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;| /g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tal(s: string): number {
  return Number(s.replace(",", "."));
}

function lika(a: number, b: number): boolean {
  return Math.abs(a - b) < FRAKTVIKT_TOLERANS_KG;
}

function tdCeller(tr: string): string[] {
  return [...tr.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => m[1]);
}

/** En `<li>` vars hela text är "Vikt: X kg" med X = fraktvikten. */
function arFraktviktsLi(li: string, kg: number): boolean {
  const m = LI_TEXT.exec(text(li));
  return m !== null && lika(tal(m[1]), kg);
}

/** En tabellrad med två celler: "Vikt" och "X kg" med X = fraktvikten. */
function arFraktviktsTr(tr: string, kg: number): boolean {
  const celler = tdCeller(tr);
  if (celler.length !== 2) return false;
  const m = TD_VARDE.exec(text(celler[1]));
  return TD_ETIKETT.test(text(celler[0])) && m !== null && lika(tal(m[1]), kg);
}

const LI = /<li\b[^>]*>[\s\S]*?<\/li>/gi;
const TR = /<tr\b[^>]*>[\s\S]*?<\/tr>/gi;

/** Raderna saxen skulle byta etikett på, ordagrant som de står i texten. */
export function hittaFraktviktsrader(html: string, kg: number | null | undefined): string[] {
  if (!kg || kg <= 0) return [];
  const li = (html.match(LI) ?? []).filter((r) => arFraktviktsLi(r, kg));
  const tr = (html.match(TR) ?? []).filter((r) => arFraktviktsTr(r, kg));
  return [...li, ...tr];
}

/**
 * Byter "Vikt" mot "Fraktvikt" på raderna ovan och rör ingenting annat.
 * Bara FÖRSTA förekomsten av ordet i raden byts: det är etiketten, eftersom
 * raden per definition börjar med den.
 */
export function rattaFraktvikt(html: string, kg: number | null | undefined): string {
  if (!kg || kg <= 0) return html;
  return html
    .replace(LI, (r) => (arFraktviktsLi(r, kg) ? r.replace("Vikt", "Fraktvikt") : r))
    .replace(TR, (r) => (arFraktviktsTr(r, kg) ? r.replace("Vikt", "Fraktvikt") : r));
}

const PAKET = /paket|förpackning|kartong|fraktvikt/i;
const VAGER = new RegExp(
  String.raw`\bväger\s+(?:bara\s+|endast\s+|cirka\s+|ca\.?\s+|ungefär\s+|omkring\s+|runt\s+|drygt\s+)?${TAL}\s*kg`,
  "gi",
);
const FRAGA_SVAR = new RegExp(
  String.raw`Hur (?:mycket|tung)[^<]*?\?\s*(?:<\/[^>]+>\s*)*<p>\s*${TAL}\s*kg`,
  "gi",
);

/**
 * Sant när löptexten eller en vanlig fråga påstår att VARAN väger fraktvikten.
 * Spec-raderna räknas inte (dem lagar saxen), och inte heller meningar om
 * paketet, som är sanna.
 */
export function viktILoptext(html: string, kg: number | null | undefined): boolean {
  if (!kg || kg <= 0) return false;
  const utanRader = html.replace(LI, " ").replace(TR, " ");
  for (const m of utanRader.matchAll(VAGER)) {
    const fore = utanRader.slice(Math.max(0, (m.index ?? 0) - 40), m.index ?? 0);
    if (!PAKET.test(fore) && lika(tal(m[1]), kg)) return true;
  }
  for (const m of utanRader.matchAll(FRAGA_SVAR)) {
    if (!PAKET.test(m[0]) && lika(tal(m[1]), kg)) return true;
  }
  return false;
}
