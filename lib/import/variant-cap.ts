// Kapar härledda options + varianter till Wix Stores V3:s hårda gränser innan
// create-product (annars 400 CHOICES_LIMIT_EXCEEDED / TOO_MANY_OPTIONS / TOO_MANY_
// VARIANTS). En AliExpress-produkt kan ha en överlastad axel med 100-tals värden;
// deriveOptions sväljer alla (den känner inte Wix-gränsen) → importen fälls.
//
// Garantier (designauditerat):
//   • De VALDA (included) varianternas värden behålls ALLTID → vald variant förblir köpbar.
//   • options↔varianter hålls KONSISTENTA: kapas ett val bort tas varje variant som
//     refererar det värdet bort (annars 428 MISSING_VARIANT_OPTION_CHOICE i Wix).
//   • Deterministiskt: bland icke-valda värden vinner högst (sälj→lager); originalordning
//     bryter likalägen. Inga AI-anrop ($0).
//   • Hårdfaller ALDRIG (ren slice som sista skyddsnät) — Leonards krav. capped=true →
//     produkten flaggas för manuell polering.

import {
  WIX_MAX_CHOICES_PER_OPTION,
  WIX_MAX_OPTIONS_PER_PRODUCT,
  WIX_MAX_VARIANTS_PER_PRODUCT,
} from "../wix/limits";

export interface CapOption {
  name: string;
  choices: { name: string; colorCode?: string }[];
}
export interface CapVariant {
  supplierVariantId: string;
  options: Record<string, string>;
  included?: boolean;
  stock?: number;
  salesCount?: number;
}
export interface CapResult<O extends CapOption, V extends CapVariant> {
  options: O[];
  variants: V[];
  /** True om något kapades → produkten bör flaggas för granskning/polering. */
  capped: boolean;
  /** Människoläsbar sammanfattning för audit/log, t.ex. "Färg 234→100 val". */
  summary: string;
}

/** Sälj-prioriterad poäng (sälj väger tyngre än lager). Deterministisk, NaN-säker. */
function rank(v: CapVariant): number {
  return Number(v.salesCount ?? 0) * 1e6 + Number(v.stock ?? 0);
}

export function capOptionsAndVariants<O extends CapOption, V extends CapVariant>(
  options: O[],
  variants: V[],
): CapResult<O, V> {
  const included = variants.filter((v) => v.included);
  const notes: string[] = [];
  const order = new Map(variants.map((v, i) => [v.supplierVariantId, i] as const));
  const ord = (v: V) => order.get(v.supplierVariantId) ?? 0;

  // Värden de VALDA varianterna använder per axel — måste behållas (köpbarhet).
  const mustKeep = new Map<string, Set<string>>();
  for (const v of included) {
    for (const [axis, val] of Object.entries(v.options)) {
      if (val == null) continue;
      let s = mustKeep.get(axis);
      if (!s) { s = new Set(); mustKeep.set(axis, s); }
      s.add(val);
    }
  }
  // Värde-poäng = bästa rank bland varianter som bär värdet (deterministiskt).
  const valueScore = (axis: string, val: string): number => {
    let best = -1;
    for (const v of variants) if (v.options[axis] === val) best = Math.max(best, rank(v));
    return best;
  };

  // 1) Per axel: ≤ WIX_MAX_CHOICES_PER_OPTION val (behåll mustKeep + topp-rankade).
  let outOptions = options.map((opt) => {
    if (opt.choices.length <= WIX_MAX_CHOICES_PER_OPTION) return opt;
    const names = opt.choices.map((c) => c.name);
    const keep = new Set(mustKeep.get(opt.name) ?? []);
    const rest = names
      .filter((n) => !keep.has(n))
      .sort((a, b) => valueScore(opt.name, b) - valueScore(opt.name, a) || names.indexOf(a) - names.indexOf(b));
    for (const n of rest) {
      if (keep.size >= WIX_MAX_CHOICES_PER_OPTION) break;
      keep.add(n);
    }
    let kept = names.filter((n) => keep.has(n)); // bevara originalordning
    if (kept.length > WIX_MAX_CHOICES_PER_OPTION) kept = kept.slice(0, WIX_MAX_CHOICES_PER_OPTION); // sista skyddsnät
    const keptSet = new Set(kept);
    notes.push(`${opt.name} ${names.length}→${kept.length} val`);
    return { ...opt, choices: opt.choices.filter((c) => keptSet.has(c.name)) };
  });

  // 2) Antal options: ≤ WIX_MAX_OPTIONS_PER_PRODUCT axlar (included-använda först).
  if (outOptions.length > WIX_MAX_OPTIONS_PER_PRODUCT) {
    const usedByIncluded = new Set(included.flatMap((v) => Object.keys(v.options)));
    const before = outOptions.length;
    outOptions = [...outOptions]
      .sort((a, b) => (usedByIncluded.has(b.name) ? 1 : 0) - (usedByIncluded.has(a.name) ? 1 : 0))
      .slice(0, WIX_MAX_OPTIONS_PER_PRODUCT);
    notes.push(`options ${before}→${outOptions.length} axlar`);
  }

  const keepByAxis = new Map(outOptions.map((o) => [o.name, new Set(o.choices.map((c) => c.name))] as const));
  const keptAxes = [...keepByAxis.keys()];
  const droppedAxes = outOptions.length !== options.length;

  // 3) Variant-konsistens: bara varianter vars värden för VARJE kvar-axel finns i
  //    keep-setet. Vid bortkapade axlar: strippa nyckeln + dedup:a kollapsade (included först).
  let outVariants = variants.filter((v) =>
    keptAxes.every((ax) => v.options[ax] == null || keepByAxis.get(ax)!.has(v.options[ax])),
  );
  if (droppedAxes) {
    outVariants = outVariants.map((v) => {
      const o: Record<string, string> = {};
      for (const ax of keptAxes) if (v.options[ax] != null) o[ax] = v.options[ax];
      return { ...v, options: o };
    });
    const seen = new Set<string>();
    outVariants = [...outVariants]
      .sort((a, b) => (b.included ? 1 : 0) - (a.included ? 1 : 0) || ord(a) - ord(b))
      .filter((v) => {
        const k = keptAxes.map((ax) => v.options[ax] ?? "").join("");
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => ord(a) - ord(b));
  }

  // 4) Antal varianter: ≤ WIX_MAX_VARIANTS_PER_PRODUCT (included först, fyll på rank).
  if (outVariants.length > WIX_MAX_VARIANTS_PER_PRODUCT) {
    const inc = outVariants.filter((v) => v.included);
    const others = outVariants.filter((v) => !v.included).sort((a, b) => rank(b) - rank(a) || ord(a) - ord(b));
    const before = outVariants.length;
    outVariants = [...inc, ...others.slice(0, Math.max(0, WIX_MAX_VARIANTS_PER_PRODUCT - inc.length))].sort(
      (a, b) => ord(a) - ord(b),
    );
    notes.push(`varianter ${before}→${outVariants.length}`);
  }

  return { options: outOptions, variants: outVariants, capped: notes.length > 0, summary: notes.join(", ") };
}
