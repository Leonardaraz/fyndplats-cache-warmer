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
//   1. Ensam variant på BÅDA sidor → matcha direkt.
//   2. Options-signatur: DS-råvärden översätts med samma statiska tabell som
//      importen (translateValue) och jämförs mot mappningens svenska choices
//      (ordnings- och skiftlägesokänsligt på VÄRDEN). Unik träff på mappnings-
//      sidan krävs; flera DS-träffar med SAMMA signatur är per konstruktion
//      samma vara i olika lager (frakt-axeln ingår inte i signaturen) → välj
//      föredragen: EU-lager först, sedan högst saldo, sedan först-sedd.
//   3. Ensam SYNTETISK mappningsvariant med TOMMA choices + ALLA lediga
//      DS-SKU:er delar EN signatur → samma vara oavsett val (första nattens
//      facit 2026-08-09: "default"-mappningar mot flerlager-listningar var
//      18 av 19 tvetydiga) → välj föredragen enligt samma preferens. En rad
//      med EGNA motsägande värden lämnas tvetydig (aldrig tvångsmappning).
//   4. Pris: exakt en DS-SKU vars pris ligger inom 1 % av mappningens costUsd.
//   Ingen entydig träff → lämnas orörd + rapporteras (ambiguous).

import { isEuCountry, normalizeShipFromCode } from "../aliexpress/eu-countries";

export interface RepairableMappingVariant {
  supplierVariantId: string;
  choices?: Record<string, string>;
  costUsd?: number;
}

export interface RepairDsVariant {
  skuId?: string;
  skuProps?: Record<string, string>;
  price?: number;
  stock?: number;
  /** Normaliserad landskod ("ES", "CN"…) när DS-API:t gav den per SKU. */
  shipFrom?: string;
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

// OBS: mappnings-/Wix-sidan bär SVENSKA axelnamn (importen översätter
// "Ships From" → "Skickas från") — utan de svenska formerna blev signaturen
// asymmetrisk (frakt-axeln exkluderad på DS-sidan men kvar på mappningssidan)
// och flerlager-produkter kunde aldrig värdematchas (audit 2026-08-09).
const SHIP_AXIS_RE = /ships?\s*from|ship\s*country|skickas\s*från|levereras\s*från/i;

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

/** Landskod för en DS-SKU: fältet shipFrom om satt, annars frakt-axelns värde. */
function shipCode(d: RepairDsVariant): string {
  const raw =
    d.shipFrom ??
    Object.entries(d.skuProps ?? {}).find(([axis]) => SHIP_AXIS_RE.test(axis))?.[1];
  return normalizeShipFromCode(raw);
}

/** Välj bland DS-SKU:er som är SAMMA vara (identisk icke-frakt-signatur).
 *  Ordning: EU-lager MED saldo > valfritt lager med saldo > EU utan saldo >
 *  övriga; högst saldo bryter lika, sedan först-sedd (stabil sort →
 *  deterministiskt). Saldo okänt (fältet saknas) räknas som i lager — annars
 *  skulle degraderad DS-data straffa alla kandidater lika godtyckligt.
 *  (Audit 2026-08-09: ren EU-först låste mappningen på ett TOMT EU-lager
 *  medan CN-lagret hade 500 st → varianten blev osäljbar i butiken.) */
function pickPreferred(candidates: RepairDsVariant[]): RepairDsVariant | undefined {
  const score = (d: RepairDsVariant) =>
    (typeof d.stock !== "number" || d.stock > 0 ? 2 : 0) + (isEuCountry(shipCode(d)) ? 1 : 0);
  return [...candidates].sort(
    (a, b) => score(b) - score(a) || (b.stock ?? 0) - (a.stock ?? 0),
  )[0];
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

  // DS-SKU:er grupperade per signatur. Flera SKU:er med SAMMA signatur är per
  // konstruktion samma vara i olika lager (frakt-axeln ingår inte) → gruppen är
  // en giltig träff där pickPreferred väljer lager.
  const bySig = new Map<string, RepairDsVariant[]>();
  for (const d of free) {
    const sig = valueSignature(d.skuProps, translate);
    const arr = bySig.get(sig) ?? [];
    arr.push(d);
    bySig.set(sig, arr);
  }
  const mappingSigCount = new Map<string, number>();
  for (const v of synthetic) {
    // Mappningens choices är REDAN svenska → identitetsmappning i signaturen.
    const sig = valueSignature(v.choices, (s) => s);
    mappingSigCount.set(sig, (mappingSigCount.get(sig) ?? 0) + 1);
  }

  const singleSynthetic = synthetic.length === 1;
  const singlePair = singleSynthetic && free.length === 1;
  const claimed = new Set<string>(); // skuId:n som reparerats i DENNA körning
  const unclaimed = (list: RepairDsVariant[]) => list.filter((d) => !claimed.has(String(d.skuId)));

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
        // Signatur-träff: unik på mappningssidan; DS-gruppen kan ha flera
        // lager-SKU:er av samma vara → pickPreferred avgör.
        hit = pickPreferred(unclaimed(bySig.get(sig) ?? []));
      }
      if (!hit && singleSynthetic && sig === "") {
        // Ensam syntetisk rad UTAN egna värden ("default"-mappningarnas tomma
        // choices) + ALLA lediga DS-SKU:er är samma vara (en enda signatur) →
        // vilken som helst är rätt vara; välj föredraget lager. Kravet sig===""
        // är avsiktligt (audit 2026-08-09): en rad som SJÄLV säger "Gul" får
        // ALDRIG tvångsmappas till en enhetlig "Rosa"-grupp bara för att den är
        // ensam — motsägande värden är tvetydighet, inte en matchning.
        const left = unclaimed(free);
        const sigs = new Set(left.map((d) => valueSignature(d.skuProps, translate)));
        if (left.length > 0 && sigs.size === 1) hit = pickPreferred(left);
      }
      if (!hit && typeof v.costUsd === "number" && v.costUsd > 0) {
        const near = unclaimed(free).filter(
          (d) =>
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
