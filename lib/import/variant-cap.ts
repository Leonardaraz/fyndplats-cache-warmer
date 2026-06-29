// Kapar härledda options + varianter till Wix Stores V3:s hårda gränser innan
// create-product (annars 400 CHOICES_LIMIT_EXCEEDED / TOO_MANY_OPTIONS / TOO_MANY_
// VARIANTS). En AliExpress-produkt kan ha en överlastad axel med 100-tals värden;
// deriveOptions sväljer alla (den känner inte Wix-gränsen) → importen fälls.
//
// Garantier (designauditerat + adversariellt granskat, PR #218):
//   • De VALDA (included) varianternas värden behålls SÅ LÅNGT Wix-gränsen tillåter:
//     när de RYMS hålls de alltid köpbara. Om köpbara varianter SJÄLVA spränger en hård
//     Wix-gräns (>100 val på EN axel, eller >1000 varianter totalt) kan de fysiskt inte
//     alla representeras — då behålls de HÖGST rankade köpbara deterministiskt, överskottet
//     utelämnas och RÄKNAS i `droppedIncluded` (+ note) så pipelinen kan flagga/larma.
//     Vi väljer hellre detta än att låta importen 400:a — importen får ALDRIG hårdfalla.
//   • options↔varianter hålls KONSISTENTA i BÅDA riktningar: (a) ingen variant refererar
//     ett bortkapat val (annars Wix MISSING_VARIANT_OPTION_CHOICE); (b) inget kvarvarande
//     val saknar variant (föräldralösa val rensas → inga döda val i butiken); inga tomma
//     options. Dessutom: aldrig två identiska variant-kombinationer (Wix avvisar dem).
//   • Deterministiskt: bland värden/varianter vinner högst rank (sälj→lager); originalordning
//     bryter likalägen. Inga AI-anrop ($0). NaN-säker rank.
//   • Hårdfaller ALDRIG (ovillkorliga slutclamps som skyddsnät). capped=true → produkten
//     flaggas för manuell polering.

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
  /** Försäljningssignal om uppströms fyller i den. Populeras f.n. INTE på import-vägen
   *  (AliExpressVariant saknar fältet) → rank() degraderar då till ren lager-ordning. */
  salesCount?: number;
}
export interface CapResult<O extends CapOption, V extends CapVariant> {
  options: O[];
  variants: V[];
  /** True om något kapades → produkten bör flaggas för granskning/polering. */
  capped: boolean;
  /** Antal KÖPBARA (included) varianter som inte fick plats inom Wix-gränserna och
   *  utelämnades. >0 ⇒ pengaväg-relevant: namnges separat i pipeline-loggen + flaggas. */
  droppedIncluded: number;
  /** Människoläsbar sammanfattning för audit/log, t.ex. "Färg 234→100 val". */
  summary: string;
}

/** Sälj-prioriterad poäng (sälj väger tyngre än lager). Deterministisk, NaN-säker. */
function rank(v: CapVariant): number {
  const sales = Number(v.salesCount);
  const stock = Number(v.stock);
  return (Number.isFinite(sales) ? sales : 0) * 1e6 + (Number.isFinite(stock) ? stock : 0);
}

// Dedup-nyckel för en variants kvar-axel-tupel. JSON.stringify av VÄRDE-ARRAYEN (inte en
// join på en separator) är kollisionssäker by construction: distinkta tupler ger distinkta
// strängar även när värden innehåller mellanslag/citattecken/hakparenteser (["a","b c"] vs
// ["a b","c"] → olika strängar). Inget magiskt separator-tecken att råka "städa" bort.
function tupleKey(v: CapVariant, axes: string[]): string {
  return JSON.stringify(axes.map((ax) => v.options[ax] ?? ""));
}

export function capOptionsAndVariants<O extends CapOption, V extends CapVariant>(
  options: O[],
  variants: V[],
): CapResult<O, V> {
  const MAXC = WIX_MAX_CHOICES_PER_OPTION;
  const MAXO = WIX_MAX_OPTIONS_PER_PRODUCT;
  const MAXV = WIX_MAX_VARIANTS_PER_PRODUCT;

  const included = variants.filter((v) => v.included);
  const includedCount = included.length;
  const notes: string[] = [];
  const order = new Map(variants.map((v, i) => [v.supplierVariantId, i] as const));
  const ord = (v: V) => order.get(v.supplierVariantId) ?? 0;

  // Värden de VALDA varianterna använder per axel — prioriteras (köpbarhet).
  const mustKeep = new Map<string, Set<string>>();
  for (const v of included) {
    for (const [axis, val] of Object.entries(v.options)) {
      if (val == null) continue;
      let s = mustKeep.get(axis);
      if (!s) { s = new Set(); mustKeep.set(axis, s); }
      s.add(val);
    }
  }

  // Förberäkna värde-poäng per (axel,värde) = bästa rank bland varianter som bär värdet.
  // ETT svep över variants (i st.f. O(val × varianter) inuti sort-comparatorn).
  const scoreByAxisVal = new Map<string, Map<string, number>>();
  for (const v of variants) {
    const r = rank(v);
    for (const [axis, val] of Object.entries(v.options)) {
      if (val == null) continue;
      let m = scoreByAxisVal.get(axis);
      if (!m) { m = new Map(); scoreByAxisVal.set(axis, m); }
      const cur = m.get(val);
      if (cur === undefined || r > cur) m.set(val, r);
    }
  }
  const valueScore = (axis: string, val: string): number => scoreByAxisVal.get(axis)?.get(val) ?? -1;

  // 1) Per axel: ≤ MAXC val (behåll de mest värda; mustKeep prioriteras men kan självt > MAXC).
  let outOptions = options.map((opt) => {
    if (opt.choices.length <= MAXC) return opt;
    const names = opt.choices.map((c) => c.name);
    const nameIndex = new Map(names.map((n, i) => [n, i] as const));
    const must = mustKeep.get(opt.name) ?? new Set<string>();
    const byScore = (a: string, b: string) =>
      valueScore(opt.name, b) - valueScore(opt.name, a) ||
      (nameIndex.get(a) ?? 0) - (nameIndex.get(b) ?? 0);

    let keptNames: string[];
    if (must.size >= MAXC) {
      // Köpbara värden ensamma spränger gränsen → kan inte alla representeras i Wix.
      // Behåll topp-MAXC köpbara (rank desc, deterministiskt). Resten faller bort (räknas nedan).
      keptNames = [...must].sort(byScore).slice(0, MAXC);
    } else {
      const rest = names.filter((n) => !must.has(n)).sort(byScore);
      keptNames = [...must, ...rest.slice(0, MAXC - must.size)];
    }
    const keptSet = new Set(keptNames);
    const keptOrdered = names.filter((n) => keptSet.has(n)); // bevara originalordning i utdata
    notes.push(`${opt.name} ${names.length}→${keptOrdered.length} val`);
    return { ...opt, choices: opt.choices.filter((c) => keptSet.has(c.name)) };
  });

  // 2) Antal options: ≤ MAXO axlar (included-använda först).
  if (outOptions.length > MAXO) {
    const usedByIncluded = new Set(included.flatMap((v) => Object.keys(v.options)));
    const before = outOptions.length;
    outOptions = [...outOptions]
      .sort((a, b) => (usedByIncluded.has(b.name) ? 1 : 0) - (usedByIncluded.has(a.name) ? 1 : 0))
      .slice(0, MAXO);
    notes.push(`options ${before}→${outOptions.length} axlar`);
  }

  const keepByAxis = new Map(outOptions.map((o) => [o.name, new Set(o.choices.map((c) => c.name))] as const));
  let keptAxes = [...keepByAxis.keys()];
  const droppedAxes = outOptions.length !== options.length;

  // 3) Variant-konsistens + dedup. (a) Filtrera bort varianter som refererar bortkapade val.
  //    (b) Vid bortkapade axlar: strippa nyckeln. (c) Dedupa ALLTID på kvar-axel-tupeln
  //    (included först, sedan högst rank, originalordning bryter lika) — så två identiska
  //    kombinationer aldrig dubbleras mot Wix (V3 avvisar dem), oavsett om dubbletten kom
  //    av en bortkapad axel eller redan fanns i upstream-datan.
  let outVariants = variants.filter((v) =>
    keptAxes.every((ax) => v.options[ax] == null || keepByAxis.get(ax)!.has(v.options[ax])),
  );
  if (droppedAxes) {
    outVariants = outVariants.map((v) => {
      const o: Record<string, string> = {};
      for (const ax of keptAxes) if (v.options[ax] != null) o[ax] = v.options[ax];
      return { ...v, options: o };
    });
  }
  {
    const seen = new Set<string>();
    const deduped = [...outVariants]
      .sort((a, b) => (b.included ? 1 : 0) - (a.included ? 1 : 0) || rank(b) - rank(a) || ord(a) - ord(b))
      .filter((v) => {
        const k = tupleKey(v, keptAxes);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    if (deduped.length !== outVariants.length) {
      notes.push(`dubbletter ${outVariants.length}→${deduped.length}`);
    }
    outVariants = deduped.sort((a, b) => ord(a) - ord(b));
  }

  // 4) Antal varianter: ≤ MAXV. Included rank-först så mest värda köpbara överlever; sedan
  //    ovillkorlig slutclamp (skyddsnät — får ALDRIG returnera >MAXV ens när included ensamt > MAXV).
  if (outVariants.length > MAXV) {
    const byRank = (a: V, b: V) => rank(b) - rank(a) || ord(a) - ord(b);
    const inc = outVariants.filter((v) => v.included).sort(byRank);
    const others = outVariants.filter((v) => !v.included).sort(byRank);
    const before = outVariants.length;
    outVariants = [...inc, ...others].slice(0, MAXV).sort((a, b) => ord(a) - ord(b));
    notes.push(`varianter ${before}→${outVariants.length}`);
  }

  // 5) Föräldralösa val: efter all variant-kapning kan ett kvarvarande val sakna varje
  //    refererande variant (t.ex. en bortkapad färg var de enda som bar storlek "L", eller
  //    variant-taket tog sista varianten för ett val). Beskär choices till faktiskt använda
  //    värden → inga döda val i butiken; droppa option som blir tom + strippa dess axel.
  const usedByAxis = new Map<string, Set<string>>();
  for (const v of outVariants) {
    for (const ax of keptAxes) {
      const val = v.options[ax];
      if (val == null) continue;
      let s = usedByAxis.get(ax);
      if (!s) { s = new Set(); usedByAxis.set(ax, s); }
      s.add(val);
    }
  }
  let prunedAny = false;
  outOptions = outOptions
    .map((opt) => {
      const used = usedByAxis.get(opt.name);
      const pruned = opt.choices.filter((c) => used?.has(c.name));
      if (pruned.length !== opt.choices.length) {
        prunedAny = true;
        notes.push(`${opt.name} föräldralösa val rensade (${opt.choices.length}→${pruned.length})`);
      }
      return pruned.length === opt.choices.length ? opt : { ...opt, choices: pruned };
    })
    .filter((opt) => opt.choices.length > 0);
  if (prunedAny && outOptions.length !== keptAxes.length) {
    // En axel föll bort helt (alla val föräldralösa) → strippa nyckeln ur varianterna så
    // options↔varianter förblir konsistenta. (Inga varianter bar ändå ett kvar-värde för den,
    // så strippen kan inte skapa nya dubbletter.)
    keptAxes = outOptions.map((o) => o.name);
    outVariants = outVariants.map((v) => {
      const o: Record<string, string> = {};
      for (const ax of keptAxes) if (v.options[ax] != null) o[ax] = v.options[ax];
      return { ...v, options: o };
    });
  }

  const droppedIncluded = includedCount - outVariants.filter((v) => v.included).length;
  if (droppedIncluded > 0) {
    notes.push(`${droppedIncluded} köpbara varianter fick ej plats inom Wix-gränserna`);
  }

  return {
    options: outOptions,
    variants: outVariants,
    capped: notes.length > 0,
    droppedIncluded,
    summary: notes.join(", "),
  };
}
