// lib/sync/mapping-repair.ts
//
// Självläkning av SYNTETISKA variant-id:n i mappningarna — REN logik.
//
// Bakgrund (audit 2026-08-08): 85 av 571 mappningar bär syntetiska
// supplierVariantId ("dom-N" från skrapans DOM-fallback, "default" från
// en-variant-produkter utan SKU-data). Orderläggningen skickar mappningens id
// som sku_attr till AliExpress → ett syntetiskt id kan aldrig beställas
// automatiskt, och lagersynken matchar aldrig per-variant-saldot (tyst
// even-split-fallback). Importvägen är fixad (#372 reparerar id:n vid import),
// men de 85 befintliga raderna läker inte själva.
//
// Fixen: dagliga synken hämtar redan DS-produkten per mappning — här stäms
// varje syntetiskt id av mot DS-SKU:erna och repareras när matchningen är
// ENTYDIG. Konservativ i samma anda som prisavstämningen: hellre oreparerat
// (och loggat) än fel SKU på en kundorder.
//
// Matchningsordning per syntetisk mappningsvariant:
//   1. Ensam variant på BÅDA sidor → matcha direkt (vanligaste fallet: ~60 av 85).
//   2. Options-signatur: DS-råvärden översätts med samma statiska tabell som
//      importen (translateValue) och jämförs mot mappningens svenska choices
//      (ordnings- och skiftlägesokänsligt på VÄRDEN). Unik träff på båda sidor krävs.
//   3. Pris: exakt en DS-SKU vars pris ligger inom 1 % av mappningens costUsd.
//   Ingen entydig träff → lämnas orörd + rapporteras (ambiguous).

export interface RepairableMappingVariant {
  supplierVariantId: string;
  choices?: Record<string, string>;
  costUsd?: number;
}

export interface RepairDsVariant {
  skuId?: string;
  skuProps?: Record<string, string>;
  price?: number;
}

export interface RepairResult<V> {
  variants: V[];
  /** Antal id:n som reparerades till riktiga AE-skuId:n. */
  repaired: number;
  /** Syntetiska id:n som INTE kunde matchas entydigt (lämnade orörda). */
  ambiguous: string[];
}

const SYNTHETIC_RE = /^(dom-|idx-)/;

export function isSyntheticMappingId(id: string): boolean {
  const s = String(id ?? "").trim();
  return SYNTHETIC_RE.test(s) || s === "default" || s === "";
}

const SHIP_AXIS_RE = /ships?\s*from|ship\s*country/i;

function valueSignature(
  options: Record<string, string> | undefined,
  mapValue: (raw: string) => string,
): string {
  return Object.entries(options ?? {})
    .filter(([axis, v]) => !SHIP_AXIS_RE.test(axis) && String(v ?? "").trim())
    .map(([, v]) => mapValue(String(v)).trim().toLowerCase())
    .sort()
    .join(" ");
}

export function repairSyntheticVariantIds<V extends RepairableMappingVariant>(
  mappingVariants: ReadonlyArray<V>,
  dsVariants: ReadonlyArray<RepairDsVariant>,
  /** Rå→svensk värdeöversättning (importens statiska tabell). Identitet i test. */
  translate: (raw: string) => string,
): RepairResult<V> {
  const ds = dsVariants.filter((d) => d.skuId && String(d.skuId).trim());
  const synthetic = mappingVariants.filter((v) => isSyntheticMappingId(v.supplierVariantId));
  if (synthetic.length === 0 || ds.length === 0) {
    return { variants: [...mappingVariants], repaired: 0, ambiguous: [] };
  }

  // Redan använda riktiga id:n (i BLANDAT-mappningar) får inte återanvändas —
  // två mappningsrader ska aldrig peka på samma DS-SKU.
  const taken = new Set(
    mappingVariants
      .filter((v) => !isSyntheticMappingId(v.supplierVariantId))
      .map((v) => String(v.supplierVariantId)),
  );
  const free = ds.filter((d) => !taken.has(String(d.skuId)));

  // DS-signaturer, bara UNIKA får användas (samma spärr som prisavstämningen).
  const bySig = new Map<string, RepairDsVariant | null>();
  for (const d of free) {
    const sig = valueSignature(d.skuProps, translate);
    bySig.set(sig, bySig.has(sig) ? null : d);
  }
  const mappingSigCount = new Map<string, number>();
  for (const v of synthetic) {
    // Mappningens choices är REDAN svenska → identitetsmappning i signaturen.
    const sig = valueSignature(v.choices, (s) => s);
    mappingSigCount.set(sig, (mappingSigCount.get(sig) ?? 0) + 1);
  }

  const singlePair = synthetic.length === 1 && free.length === 1;
  const claimed = new Set<string>(); // skuId:n som reparerats i DENNA körning

  let repaired = 0;
  const ambiguous: string[] = [];
  const out = mappingVariants.map((v) => {
    if (!isSyntheticMappingId(v.supplierVariantId)) return v;
    let hit: RepairDsVariant | undefined;
    if (singlePair) {
      hit = free[0];
    } else {
      const sig = valueSignature(v.choices, (s) => s);
      if (mappingSigCount.get(sig) === 1) {
        const cand = bySig.get(sig);
        if (cand && !claimed.has(String(cand.skuId))) hit = cand;
      }
      if (!hit && typeof v.costUsd === "number" && v.costUsd > 0) {
        const near = free.filter(
          (d) =>
            !claimed.has(String(d.skuId)) &&
            typeof d.price === "number" &&
            d.price > 0 &&
            Math.abs(d.price - (v.costUsd as number)) / (v.costUsd as number) <= 0.01,
        );
        if (near.length === 1) hit = near[0];
      }
    }
    if (!hit) {
      ambiguous.push(v.supplierVariantId);
      return v;
    }
    claimed.add(String(hit.skuId));
    repaired++;
    return { ...v, supplierVariantId: String(hit.skuId) };
  });

  return { variants: out, repaired, ambiguous };
}
