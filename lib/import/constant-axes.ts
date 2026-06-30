// "Icke-differentierande" axlar → spec i stället för en (död) variantväljare.
//
// En AliExpress-produkt vars axel bara har ETT värde (t.ex. en fast dimension
// "60X34X70 cm", eller en enda färg) ger idag en meningslös 1-vals-rullista i Wix —
// kunden har inget att välja. Värre: varje sådant unikt mått läggs i butikens DELADE
// "Storlek"-lista och fyller den mot Wix:s 100-vals-tak (se lib/wix/customization-identity.ts).
//
// Lösning (djup-auditerad, "mest premium + mest långsiktigt"): en axel som inte
// DIFFERENTIERAR några varianter (exakt 1 distinkt värde, närvarande på ALLA varianter)
// är ingen variant — den blir en SPEC-rad i stället. Effekt:
//   • Premium: rena produktsidor, inga döda 1-vals-rullister. Värdet syns ändå (i specen).
//   • Långsiktigt: en fast dimension bidrar då ALDRIG till den delade listan → taket
//     kan strukturellt aldrig nås av mått.
// Äkta val (S/M/L, flera mått att välja på) har >1 värde → rörs INTE.

export interface ConstantAxisSpec {
  /** Axelns (svenska) namn, blir spec-etiketten. */
  label: string;
  /** Det enda värdet, blir spec-värdet. */
  value: string;
}

export interface SplitConstantAxesResult<V> {
  /** Varianter med de icke-differentierande axlarna borttagna ur `options`. */
  prunedVariants: V[];
  /** De bortplockade axlarna som spec-rader (label+value). */
  specs: ConstantAxisSpec[];
  /** Namnen på de bortplockade axlarna. */
  constantAxisNames: Set<string>;
}

/**
 * Delar upp varianternas axlar i (a) äkta variant-axlar (>1 värde) som behålls och
 * (b) icke-differentierande axlar (exakt 1 värde, på alla varianter) som plockas ut
 * som specs. Rör bara `options`-fältet; allt annat på varianten bevaras oförändrat.
 *
 * Säkerhet: att ta bort en 1-värdes-axel kan ALDRIG slå ihop två distinkta varianter
 * (de skiljde sig på en ANNAN axel) och kan aldrig tappa ett val (1 värde = inget val).
 * Determinisitskt; muterar inte indata.
 */
export function splitConstantAxes<V extends { options: Record<string, string> }>(
  variants: V[],
): SplitConstantAxesResult<V> {
  if (variants.length === 0) {
    return { prunedVariants: variants, specs: [], constantAxisNames: new Set() };
  }

  // Distinkta icke-tomma värden per axel.
  const valuesByAxis = new Map<string, Set<string>>();
  for (const v of variants) {
    for (const [name, value] of Object.entries(v.options)) {
      if (value == null || value === "") continue;
      let s = valuesByAxis.get(name);
      if (!s) { s = new Set(); valuesByAxis.set(name, s); }
      s.add(value);
    }
  }

  // Konstant = exakt 1 distinkt värde OCH närvarande (icke-tomt) på ALLA varianter.
  const constantAxisNames = new Set<string>();
  const specs: ConstantAxisSpec[] = [];
  for (const [name, set] of valuesByAxis) {
    if (set.size !== 1) continue;
    const presentOnAll = variants.every((v) => v.options[name] != null && v.options[name] !== "");
    if (!presentOnAll) continue;
    constantAxisNames.add(name);
    specs.push({ label: name, value: [...set][0] });
  }

  if (constantAxisNames.size === 0) {
    return { prunedVariants: variants, specs: [], constantAxisNames };
  }

  const prunedVariants = variants.map((v) => {
    const o: Record<string, string> = {};
    for (const [name, value] of Object.entries(v.options)) {
      if (!constantAxisNames.has(name)) o[name] = value;
    }
    return { ...v, options: o };
  });

  return { prunedVariants, specs, constantAxisNames };
}

/**
 * Slår in konstant-axel-specs i en befintlig spec-lista, utan dubbletter: en axel
 * läggs bara till om ingen befintlig spec har samma etikett (skiftlägesokänsligt).
 * Befintliga specs (t.ex. AE:s egna mått) vinner alltid.
 */
export function mergeConstantAxisSpecs(
  existing: { label: string; value: string }[],
  constant: ConstantAxisSpec[],
): { label: string; value: string }[] {
  const have = new Set(existing.map((s) => s.label.trim().toLowerCase()));
  const additions = constant.filter((c) => !have.has(c.label.trim().toLowerCase()));
  return additions.length ? [...existing, ...additions] : existing;
}
