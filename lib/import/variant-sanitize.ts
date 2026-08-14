// lib/import/variant-sanitize.ts
//
// Sanering av variantoptions FÖRE resten av importpipelinen — REN logik.
//
// Bakgrund (VEVOR-pumpen 2026-08-08): skrapan kan ge varianter där en axel har
// TOMMA värden (syns i popupen som rader som börjar med "/ ") — t.ex. en
// bild-swatch-axel utan textetiketter, eller en prop skrapan inte kunde läsa.
// Tomma värden nådde Wix orört och produkten avvisades med 400
// "choicesSettings.choices[].name has size 0". Två strukturella hål:
//   • splitConstantAxes prunar bara axlar som är icke-tomma på ALLA varianter.
//   • deriveOptions filtrerar inte tomma värden.
//
// Regeln här: en axel där NÅGOT värde är tomt går inte att representera giltigt
// i Wix (varje variant måste ange varje option) → hela axeln tas bort från alla
// varianter. Varianter som därefter får identiska options slås ihop (första
// vinner; en vald/included variant föredras) — hellre färre men KORREKTA val
// för kunden än en import som fäller sig själv. Orderflödet mappar den kvar-
// hållna variantens skuId som vanligt.

// Tecken som är OSYNLIGA men som String.trim() INTE tar bort: Unicode-
// formattecken (Cf: zero-width space, LTR/RTL-markörer, soft hyphen, BOM …)
// och kontrolltecken (Cc utanför \s-mängden). AE-sidor strör LRM/RLM i
// variantetiketter och bild-swatchar utan text kan ge rena ZWSP-värden. Wix
// normaliserar serverside och ser längd 0 → 400 "name has size 0" — trots att
// värdet passerade en naiv .trim()-koll. (Batch-fyndet 2026-08-08: två
// produkter föll EFTER #378 exakt så här.)
const INVISIBLE_ONLY_RE = /^[\p{Cc}\p{Cf}\p{Zs}\p{Zl}\p{Zp}]*$/u;

/** Sant när strängen saknar synligt innehåll: tom, whitespace, eller enbart
 *  format-/kontrolltecken som .trim() släpper igenom men Wix räknar som tomma. */
export function isEffectivelyEmpty(s: string): boolean {
  return INVISIBLE_ONLY_RE.test(String(s ?? ""));
}

export interface SanitizeResult<V> {
  variants: V[];
  /** Axlar som togs bort för att de bar tomma värden (eller själva saknade namn). */
  removedAxes: string[];
  /** Antal varianter som slogs ihop för att de blev identiska efter borttaget. */
  mergedDuplicates: number;
}

export function sanitizeVariantOptions<
  V extends { options: Record<string, string>; included: boolean },
>(variants: ReadonlyArray<V>): SanitizeResult<V> {
  // 1. Hitta ogiltiga axlar: effektivt tomt namn ELLER minst ett effektivt tomt
  //    värde (inkl. osynliga format-/kontrolltecken som .trim() missar).
  const badAxes = new Set<string>();
  for (const v of variants) {
    for (const [axis, val] of Object.entries(v.options ?? {})) {
      if (isEffectivelyEmpty(axis) || isEffectivelyEmpty(String(val ?? ""))) badAxes.add(axis);
    }
  }
  if (badAxes.size === 0) {
    return { variants: [...variants], removedAxes: [], mergedDuplicates: 0 };
  }

  // 2. Ta bort de ogiltiga axlarna från ALLA varianter (muterar inte indata).
  const cleaned = variants.map((v) => {
    const options: Record<string, string> = {};
    for (const [axis, val] of Object.entries(v.options ?? {})) {
      if (!badAxes.has(axis)) options[axis] = val;
    }
    return { ...v, options };
  });

  // 3. Slå ihop varianter som blev identiska (den borttagna axeln var enda
  //    skillnaden). Stabil ordning: första förekomsten behålls; en included
  //    variant föredras framför en avbockad så kundens val aldrig försvinner.
  const seen = new Map<string, number>();
  const out: V[] = [];
  let merged = 0;
  for (const v of cleaned) {
    const sig = Object.entries(v.options)
      .map(([a, b]) => `${a}\u0000${b}`)
      .sort()
      .join("\u0001");
    const at = seen.get(sig);
    if (at === undefined) {
      seen.set(sig, out.length);
      out.push(v);
    } else {
      merged++;
      if (v.included && !out[at].included) out[at] = v;
    }
  }
  return { variants: out, removedAxes: [...badAxes], mergedDuplicates: merged };
}
