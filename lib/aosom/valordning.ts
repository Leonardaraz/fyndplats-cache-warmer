/**
 * Var ett nytt val hamnar i en option: storlekarna i storleksordning (2026-11-11).
 *
 * Leonards skärmbild 2026-11-06 visade hantlarna med 4, 5, 10 och sedan 6 kg.
 * Sammanslagningen lade givarens val SIST i optionen, och butiken visar valen i
 * den ordning Wix har dem. Sexton publicerade sidor låg fel och rättades med
 * `tools/polish-gates/sortera-val.js`; växthuset och fyra VEVOR-sidor har hittats
 * efteråt av samma svep. Den här funktionen gör att sammanslagningen inte skapar
 * felet längre (docs/claude/05-aosom-synken/31-storleksvyer.md, regel 4).
 *
 * Reglerna är svepets (`tools/polish-gates/sortera-val-svep.js`, funktionen
 * `analysera`) och ska hållas lika:
 *
 *   · Färg bedöms aldrig. Ett nytt färgval hamnar sist, som förut.
 *   · Bokstavsstorlekar (XS, S, M, L, XL, 2XL …) går efter bokstavsordningen, men bara
 *     när ALLA val, också det nya, är bokstavsstorlekar.
 *   · Val med tal går efter måttens produkt (area) och därefter måttens ordning
 *     (2 × 6 kg efter 2 × 5 kg och före 2 × 10 kg), inom samma grupp: texten före
 *     första siffran, så att *Metall 46 tum* och *Trä 63 tum* är två grupper.
 *     Kravet är att varje val har tal, lika många tal i varje val och inga blandade
 *     enheter (cm och kg i samma option).
 *   · Allt annat (*Liten – Mellan – Stor*, olika antal tal, dubblettnamn) går inte att
 *     bedöma, och då hamnar det nya valet sist, som förut.
 *
 * Funktionen flyttar aldrig ett val som redan finns. Den svarar bara på vilken plats
 * det NYA valet ska ha: före det första befintliga val i samma grupp som ska komma
 * efter det, annars efter gruppens sista val, annars sist. En option som redan låg
 * fel blir därför inte rättad här (det gör svepet), men heller inte sämre.
 */

const TAL = /\d+(?:[.,]\d+)?/g;

const BOKSTAV: Record<string, number> = {
  xxs: 0, xs: 1, s: 2, m: 3, l: 4, xl: 5, xxl: 6, "2xl": 6, xxxl: 7, "3xl": 7, "4xl": 8, "5xl": 9, "6xl": 10, "7xl": 11,
};

// Enhetsfamilj och faktor till familjens grundenhet: längd i cm, volym i liter, vikt i kg.
const ENHET: Record<string, readonly [string, number]> = {
  mm: ["l", 0.1], cm: ["l", 1], dm: ["l", 10], m: ["l", 100],
  ml: ["v", 0.001], cl: ["v", 0.01], dl: ["v", 0.1], l: ["v", 1], liter: ["v", 1],
  g: ["w", 0.001], kg: ["w", 1],
};

const talAv = (s: string): number[] => (s.match(TAL) ?? []).map((t) => parseFloat(t.replace(",", ".")));

function bokstavAv(s: string): number | null {
  const k = s.toLowerCase().replace(/\s+/g, "");
  return Object.prototype.hasOwnProperty.call(BOKSTAV, k) ? BOKSTAV[k] : null;
}

function enhetAv(s: string): readonly [string, number] | null {
  const m = s.toLowerCase().match(/\d\s*(mm|cm|dm|ml|cl|dl|kg|liter|m|l|g)(?![a-zåäö])/);
  return m ? ENHET[m[1]] : null;
}

const produkt = (a: number[]): number => a.reduce((x, y) => x * y, 1);

/** Sorteringsordningen inom en grupp: area, därefter måttens egen ordning. Negativt = a före b. */
function jamfor(a: number[], b: number[]): number {
  const d = produkt(a) - produkt(b);
  if (d !== 0) return d;
  for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) return a[k] - b[k];
  return 0;
}

const norm = (s: string): string => s.trim().toLowerCase();

/**
 * Platsen (0 … befintliga.length) där ett nytt val ska stå bland de befintliga.
 * `axel` är optionens namn ("Färg" eller "Storlek").
 */
export function valPlats(axel: string, befintliga: string[], nytt: string): number {
  const sist = befintliga.length;
  if (/^f[aä]rg$/i.test(String(axel ?? "").trim())) return sist;
  // Ett val utan namn (ett fält som saknas) kan inte jämföras och hamnar sist, som förut.
  const namn = [...befintliga, nytt].map((x) => String(x ?? ""));
  if (namn.some((x) => x.trim() === "")) return sist;
  if (new Set(namn.map(norm)).size !== namn.length) return sist;

  // Bokstavsstorlekar: bara om varje val, också det nya, är en bokstavsstorlek.
  const bok = namn.map(bokstavAv);
  if (bok.every((x) => x !== null)) {
    const nyttVarde = bok[bok.length - 1] as number;
    const i = befintliga.findIndex((_, k) => (bok[k] as number) > nyttVarde);
    return i < 0 ? sist : i;
  }

  // Tal: varje val har tal, lika många tal i varje val.
  const tal = namn.map(talAv);
  if (!tal.every((t) => t.length > 0)) return sist;
  const antal = tal[0].length;
  if (!tal.every((t) => t.length === antal)) return sist;

  // Enheter: antingen ingen alls, eller samma familj i alla val.
  const enh = namn.map(enhetAv);
  const familjer = enh.filter((e): e is readonly [string, number] => e !== null).map((e) => e[0]);
  if (familjer.length > 0 && (familjer.length !== enh.length || familjer.some((f) => f !== familjer[0]))) return sist;
  const faktor = enh.map((e) => (e ? e[1] : 1));
  const nycklar = tal.map((t, k) => t.map((x) => x * faktor[k]));
  const grupp = namn.map((n) => n.split(/\d/)[0].trim().toLowerCase());

  const nyKey = nycklar[nycklar.length - 1];
  const nyGrupp = grupp[grupp.length - 1];
  const medlemmar = befintliga.map((_, k) => k).filter((k) => grupp[k] === nyGrupp);
  if (medlemmar.length === 0) return sist;
  const fore = medlemmar.find((k) => jamfor(nyKey, nycklar[k]) < 0);
  return fore !== undefined ? fore : medlemmar[medlemmar.length - 1] + 1;
}

/** Två val på en ny axel: sidans eget och givarens, det mindre först när de går att jämföra. */
export function valPar(axel: string, sidans: string, nytt: string): string[] {
  return valPlats(axel, [sidans], nytt) === 0 ? [nytt, sidans] : [sidans, nytt];
}
