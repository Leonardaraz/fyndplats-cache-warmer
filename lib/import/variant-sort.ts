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
// räcker). Både förkortat OCH utskrivet: standardpipelinen ger förkortat (tum/
// cm/mm/m/ml/l), men RÅ AE-data kan stava ut enheten ("1 Meter", "500 Gram") →
// regexarna täcker även det så en utskriven enhet inte får faktor 1 (→ felsort)
// när den blandas med en förkortad i samma familj. Ankrade ^…$ mot HELA token →
// ömsesidigt uteslutande, inga falska träffar inuti ord.
const UNITS: { re: RegExp; family: string; factor: number }[] = [
  // Längd (bas mm). tum/inch = 25,4 mm; fot = 304,8 mm.
  { re: /^(?:inches|inch|in|tum)$/i, family: "len", factor: 25.4 },
  { re: /^(?:ft|foot|feet|fot)$/i, family: "len", factor: 304.8 },
  { re: /^(?:mm|millimet(?:er|re)s?)$/i, family: "len", factor: 1 },
  { re: /^(?:cm|centimet(?:er|re)s?)$/i, family: "len", factor: 10 },
  { re: /^(?:dm|decimet(?:er|re)s?)$/i, family: "len", factor: 100 },
  { re: /^(?:m|met(?:er|re)s?)$/i, family: "len", factor: 1000 },
  // Volym (bas ml).
  { re: /^(?:ml|millilit(?:er|re)s?)$/i, family: "vol", factor: 1 },
  { re: /^(?:cl|centilit(?:er|re)s?)$/i, family: "vol", factor: 10 },
  { re: /^(?:dl|decilit(?:er|re)s?)$/i, family: "vol", factor: 100 },
  { re: /^(?:l|lit(?:er|re)s?)$/i, family: "vol", factor: 1000 },
  // Vikt (bas g).
  { re: /^(?:mg|milligram(?:me)?s?)$/i, family: "wt", factor: 0.001 },
  { re: /^(?:kg|kilos?|kilogram(?:me)?s?)$/i, family: "wt", factor: 1000 },
  { re: /^(?:g|gram(?:me)?s?)$/i, family: "wt", factor: 1 },
  // Lagring (bas MB).
  { re: /^(?:mb|megabytes?)$/i, family: "stor", factor: 1 },
  { re: /^(?:gb|gigabytes?)$/i, family: "stor", factor: 1024 },
  { re: /^(?:tb|terabytes?)$/i, family: "stor", factor: 1048576 },
];

function unitOf(token: string): { family: string; factor: number } | null {
  for (const u of UNITS) if (u.re.test(token)) return u;
  return null;
}

// Spec-/antal-enheter som SIGNALERAR "detta är ett mått/en spec" men inte
// normaliseras (en axel bär bara en sådan enhet → råa tal räcker). Används bara
// för storleksbevis-grinden, inte för sortnyckeln. Matchas mot HELA bokstavslöpan
// efter talet, så en modellkod som "B6AC" (token "AC") aldrig räknas som enhet.
const EXTRA_UNITS = new Set([
  // el
  "w", "watt", "watts", "kw", "v", "volt", "volts", "kv", "a", "amp", "amps",
  "ampere", "amperes", "ma", "mah", "wh", "ah",
  // frekvens
  "hz", "khz", "mhz", "ghz",
  // temperatur
  "k", "kelvin",
  // antal
  "st", "stk", "pcs", "pc", "pair", "pairs", "par", "delar", "delars", "pack",
  "packs", "piece", "pieces",
  // övriga spec
  "mp", "dpi", "rpm", "fps",
]);

// Tolkar ett värde till en numerisk nyckel-tupel. Alla tal i värdet plockas ut
// (dimensioner + antal blir tupel: "8x10 tum 24 st" → [8,10,24]). Det FÖRSTA
// igenkända normaliserings-enhets-tokenet ger familj + faktor som normaliserar
// första talet (faktor 1 om ingen enhet). `hasUnit` = sant om NÅGOT token är en
// känd enhet (normalisering ELLER EXTRA_UNITS) → används av storleksbevis-grinden.
// null = inga tal alls → ej sorterbart.
function parseNumeric(
  value: string,
): { key: number[]; family: string | null; hasUnit: boolean } | null {
  const matches = [...value.matchAll(/(\d+(?:[.,]\d+)?)\s*([\p{L}"]*)/gu)];
  const nums: number[] = [];
  let family: string | null = null;
  let factor = 1;
  let foundUnit = false;
  let hasUnit = false;
  for (const m of matches) {
    nums.push(parseFloat(m[1].replace(",", ".")));
    const token = m[2];
    if (token) {
      const u = unitOf(token);
      if (u) {
        hasUnit = true;
        if (!foundUnit) {
          family = u.family;
          factor = u.factor;
          foundUnit = true;
        }
      } else if (EXTRA_UNITS.has(token.toLowerCase())) {
        hasUnit = true;
      }
    }
  }
  if (nums.length === 0) return null;
  return { key: [nums[0] * factor, ...nums.slice(1)], family, hasUnit };
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

// Axelnamn (svenska, efter översättning) som betecknar storlek/mått. "Effekt"
// UTESLUTS medvetet — i denna kodbas är det oftast den visuella "Effect"
// (Glow/Shimmer), inte watt; wattvärden fångas via enheten W. Compound-namn
// (skostorlek, sitthöjd, skärmstorlek) fångas av ändelse-kontrollen.
const SIZE_AXIS_NAMES = new Set([
  "storlek", "längd", "bredd", "höjd", "djup", "diameter", "volym", "vikt", "mått",
  "tjocklek", "omkrets", "spänning", "ström", "lagring", "kapacitet", "antal",
  "size", "length", "width", "height", "depth", "weight", "volume", "capacity",
  "voltage", "storage", "quantity", "dimension", "dimensions",
]);
const SIZE_AXIS_SUFFIXES = ["storlek", "längd", "höjd", "bredd", "vikt", "volym", "mått", "size"];

function isSizeLikeAxisName(name?: string): boolean {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  if (SIZE_AXIS_NAMES.has(n)) return true;
  return SIZE_AXIS_SUFFIXES.some((s) => n.endsWith(s));
}

/**
 * Returnerar `values` sorterade minsta→största, eller `null` om axeln inte säkert
 * kan sorteras som storlek (då ska anroparen behålla originalordningen).
 * Sorterar BARA äkta storleksaxlar: klädskala, ELLER varje värde bär en igenkänd
 * enhet, ELLER `axisName` är ett storleksnamn (för enhetslösa rena tal som
 * skostorlek). Annars (modell-/kod-/stilaxlar med siffror) → orörd.
 */
export function sortedSizeChoices(values: string[], axisName?: string): string[] | null {
  if (values.length < 2) return null;
  const trimmed = values.map((v) => v.trim());

  // 1) Klädskala — ALLA värden måste vara kända skal-tokens (klädskala ÄR storlek).
  const clo = trimmed.map(clothingOrdinal);
  if (clo.every((o) => o !== null)) {
    return decorate(values, clo.map((o) => [o as number]));
  }

  // 2) Numeriskt/mått.
  const parsed = trimmed.map(parseNumeric);
  if (parsed.some((p) => p === null)) return null; // otolkbart värde → orörd
  const families = new Set(parsed.map((p) => p!.family).filter((f): f is string => f !== null));
  if (families.size > 1) return null; // korsfamilj (t.ex. vikt + volym) → orörd

  // Storleksbevis-grind: sortera bara om VARJE värde bär en igenkänd enhet ELLER
  // axeln har ett storleksnamn. Annars (rena tal/koder på t.ex. "Modell"/"Stil/Typ"
  // — KM-6631, iPhone 15) → lämna orörd, så säljarens kurerade ordning inte rörs.
  if (!parsed.every((p) => p!.hasUnit) && !isSizeLikeAxisName(axisName)) return null;

  return decorate(values, parsed.map((p) => p!.key));
}
