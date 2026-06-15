// Storleks-sortering av variantval vid import (Leonard 2026-06-15): visa minsta
// storleken överst och största nederst i stället för AliExpress godtyckliga
// ordning. Gäller alla storlekstyper — tum/cm/mm/m, volym, vikt, effekt/el,
// lagring, antal och klädskala (S→M→L→XL→…→6XL).
//
// SÄKERHET: detta omordnar BARA listan av val i en options-DEFINITION. Det rör
// inte variantposterna (pris/SKU/lager/linkedMedia) — de matchas på värde, inte
// ordning. Anroparen (deriveOptions) gatar dessutom bort färgaxlar.
//
// PRINCIP "hellre orört än fel": kan en axels ordning inte avgöras säkert
// (blandade oförenliga enheter, otolkbart värde, blandning klädskala+tal)
// returneras null → anroparen behåller originalordningen. Aldrig en fel ordning.

// Klädskala → ordinal. Täcker bokstavsformer (oförändrade av translateValue),
// numeriska XL-former (2XL=XXL osv.) och ord (EN + svenska från translateValue:
// small→Liten, medium→Mellan, large→Stor, extra large→Extra stor).
const CLOTHING_ORDINAL: Record<string, number> = {
  xxs: 0, xs: 1, s: 2, m: 3, l: 4, xl: 5, xxl: 6, xxxl: 7,
  "2xl": 6, "3xl": 7, "4xl": 8, "5xl": 9, "6xl": 10, "7xl": 11, "8xl": 12, "9xl": 13,
  small: 2, medium: 3, large: 4, "x-large": 5, xlarge: 5, "extra large": 6,
  liten: 2, mellan: 3, stor: 4, "extra stor": 6,
};

function clothingOrdinal(value: string): number | null {
  const k = value.trim().toLowerCase();
  return k in CLOTHING_ORDINAL ? CLOTHING_ORDINAL[k] : null;
}

// Enhetsfamiljer med faktor till basenhet. Möjliggör korrekt sortering när EN
// axel blandar enheter ur samma familj ("500 ml" vs "2 L"). Effekt/spänning/
// ström/mAh/temperatur normaliseras inte (en axel har bara en enhet → råa tal
// räcker). Ordningen spelar roll: längre token testas före kortare (ml före l).
const UNITS: { re: RegExp; family: string; factor: number }[] = [
  // Längd (bas mm). tum/inch = 25,4 mm.
  { re: /^(?:inches|inch|in|tum)$/i, family: "len", factor: 25.4 },
  { re: /^mm$/i, family: "len", factor: 1 },
  { re: /^cm$/i, family: "len", factor: 10 },
  { re: /^dm$/i, family: "len", factor: 100 },
  { re: /^m$/i, family: "len", factor: 1000 },
  // Volym (bas ml).
  { re: /^ml$/i, family: "vol", factor: 1 },
  { re: /^cl$/i, family: "vol", factor: 10 },
  { re: /^dl$/i, family: "vol", factor: 100 },
  { re: /^(?:l|lit(?:er|re)s?)$/i, family: "vol", factor: 1000 },
  // Vikt (bas g).
  { re: /^mg$/i, family: "wt", factor: 0.001 },
  { re: /^kg$/i, family: "wt", factor: 1000 },
  { re: /^g$/i, family: "wt", factor: 1 },
  // Lagring (bas MB).
  { re: /^mb$/i, family: "stor", factor: 1 },
  { re: /^gb$/i, family: "stor", factor: 1024 },
  { re: /^tb$/i, family: "stor", factor: 1048576 },
];

function unitOf(token: string): { family: string; factor: number } | null {
  for (const u of UNITS) if (u.re.test(token)) return u;
  return null;
}

// Tolkar ett värde till en numerisk nyckel-tupel. Alla tal i värdet plockas ut
// (dimensioner + antal blir tupel: "8x10 tum 24 st" → [8,10,24]). Det FÖRSTA
// igenkända enhets-tokenet ger familj + faktor som normaliserar första talet
// (faktor 1 om ingen enhet). null = inga tal alls → ej sorterbart.
function parseNumeric(value: string): { key: number[]; family: string | null } | null {
  const matches = [...value.matchAll(/(\d+(?:[.,]\d+)?)\s*([\p{L}"]*)/gu)];
  const nums: number[] = [];
  let family: string | null = null;
  let factor = 1;
  let foundUnit = false;
  for (const m of matches) {
    nums.push(parseFloat(m[1].replace(",", ".")));
    if (!foundUnit && m[2]) {
      const u = unitOf(m[2]);
      if (u) {
        family = u.family;
        factor = u.factor;
        foundUnit = true;
      }
    }
  }
  if (nums.length === 0) return null;
  return { key: [nums[0] * factor, ...nums.slice(1)], family };
}

function tupleCompare(a: number[], b: number[]): number {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

// Stabil sort: dekorera med nyckel + originalindex (sista tie-break), så lika/
// orörda värden behåller inmatningsordningen.
function decorate(values: string[], keys: number[][]): string[] {
  return values
    .map((v, i) => ({ v, k: keys[i], i }))
    .sort((x, y) => tupleCompare(x.k, y.k) || x.i - y.i)
    .map((o) => o.v);
}

/**
 * Returnerar `values` sorterade minsta→största, eller `null` om ordningen inte
 * kan avgöras säkert (då ska anroparen behålla originalordningen).
 */
export function sortedSizeChoices(values: string[]): string[] | null {
  if (values.length < 2) return null;
  const trimmed = values.map((v) => v.trim());

  // 1) Klädskala — ALLA värden måste vara kända skal-tokens.
  const clo = trimmed.map(clothingOrdinal);
  if (clo.every((o) => o !== null)) {
    return decorate(values, clo.map((o) => [o as number]));
  }

  // 2) Numeriskt/mått.
  const parsed = trimmed.map(parseNumeric);
  if (parsed.some((p) => p === null)) return null; // otolkbart värde → orörd
  const families = new Set(parsed.map((p) => p!.family).filter((f): f is string => f !== null));
  if (families.size > 1) return null; // korsfamilj (t.ex. vikt + volym) → orörd
  return decorate(values, parsed.map((p) => p!.key));
}
