// lib/aliexpress/freight.ts
//
// Fraktbarhet till Sverige per SKU — ren tolkningslogik (ingen I/O).
//
// Bakgrund (2026-07-13, SucceBuy-lådskåpet): AliExpress produktdata visar
// LAGER för en SKU (26 st) samtidigt som kassan säger "can't be shipped to
// your address" — säljarens fraktmall täcker inte Sverige för just den SKU:n.
// Lagersynk och fraktbarhet är alltså två olika saker; denna modul tolkar
// svaret från fraktAPI:erna så synken kan nolla ofraktbara varianter.
//
// Två API-generationer förekommer (klienten provar båda, se
// queryFreightToCountry i client.ts):
//   - aliexpress.ds.freight.query           → delivery_options-lista
//   - aliexpress.logistics.buyer.freight.calculate
//                                            → aeop_freight_calculate_result_…-lista
// LÄRDOM 2026-07-14 (kod röd): API:ts NEJ-svar är INTE pålitliga per anrop.
// Nattens rotation gav DELIVERY_NOT_AVAILABLE_TO_YOUR_ADDRESS för enskilda
// färgvarianter hos säljare som bevisligen levererar (Aosom ES — samma
// säljare som hundvagnen — fick "Beige ok, Grå nej" på samma vägghylla).
// 8 produkter nollades felaktigt. Därför gäller nu: ENDAST POSITIV EVIDENS
// (icke-tom alternativlista) ger en dom. Alla nej/fel/tomma svar → unknown,
// och unknown ändrar aldrig någonting. En framtida v2 kan återinföra
// nej-domar med hårdare beviskrav (t.ex. flera oberoende nej över flera dygn
// + full adresskontext i frågan).

/** Utfall från klientens fraktanrop (rått svar ELLER felsträng). */
export interface FreightQueryOutcome {
  method: string;
  raw?: unknown;
  error?: string;
}

export interface FreightVerdict {
  /** true när svaret gick att tolka med säkerhet. */
  known: boolean;
  /** true/false när known; null när svaret inte gick att avgöra. */
  shippable: boolean | null;
  /** Antal fraktalternativ som hittades. */
  optionCount: number;
  /** Kort diagnos för logg/felsökning (aldrig kundexponerad). */
  note?: string;
  /**
   * true när svaret UTTRYCKLIGEN säger att adressen inte kan levereras till —
   * inte bara "tomt" eller "fel". Ett enskilt sådant svar är fortfarande INTE
   * en dom (`shippable` förblir null); det är en signal som måste bekräftas
   * över flera oberoende körningar innan den får nolla lager. Skiljer kod röd-
   * fallet (flaxiga nej hos säljare som bevisligen levererar) från ett äkta
   * nej: ett äkta nej upprepar sig, ett flaxigt gör det inte.
   */
  negativeSignal: boolean;
}

// Uttryckliga "går inte att leverera hit"-svar. Allt ANNAT (timeout, HTTP 502,
// oväntad svarsform, tom lista) är brus och får aldrig räknas som ett nej.
const EXPLICIT_NEGATIVE =
  /DELIVERY_NOT_AVAILABLE_TO_YOUR_ADDRESS|not\s+available\s+to\s+your\s+address|can(?:no|')t\s+be\s+shipped\s+to\s+your\s+address/i;

/** true när texten är ett uttryckligt adress-nej (inte ett generellt fel). */
export function isExplicitNegative(text: string | undefined | null): boolean {
  return Boolean(text && EXPLICIT_NEGATIVE.test(text));
}

// Nyckelmönster för listor med fraktalternativ i kända svarsformer.
const OPTION_LIST_KEY = /delivery_option|freight_calculate_result|delivery_options|logistics_service/i;


/** Plockar alla arrayer vars nyckel ser ut som en fraktalternativ-lista,
 *  inklusive en nivå singel-nyckel-wrapper ({delivery_option_d_t_o: [...]}). */
function collectOptionArrays(node: unknown, keyHint: string, out: unknown[][], depth = 0): void {
  if (depth > 8 || node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    if (OPTION_LIST_KEY.test(keyHint)) out.push(node);
    // Element kan i sin tur innehålla nästlade strukturer — men listelement i
    // en träffad lista är själva alternativen; gå inte djupare i dem.
    if (!OPTION_LIST_KEY.test(keyHint)) {
      for (const item of node) collectOptionArrays(item, keyHint, out, depth + 1);
    }
    return;
  }
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    collectOptionArrays(value, OPTION_LIST_KEY.test(keyHint) ? keyHint : key, out, depth + 1);
  }
}

/** Letar explicit success=false + meddelande i kända svars-kuvert. */
function findFailureMessage(node: unknown, depth = 0): string | null {
  if (depth > 6 || node === null || typeof node !== "object" || Array.isArray(node)) return null;
  const obj = node as Record<string, unknown>;
  const success = obj.success ?? obj.is_success;
  if (success === false || success === "false") {
    const msg = obj.msg ?? obj.error_msg ?? obj.message ?? obj.error_message;
    return typeof msg === "string" && msg ? msg : "success=false utan meddelande";
  }
  for (const value of Object.values(obj)) {
    const hit = findFailureMessage(value, depth + 1);
    if (hit) return hit;
  }
  return null;
}

export function parseFreightOutcome(outcome: FreightQueryOutcome): FreightVerdict {
  // Fel från anropet (inkl. AliExpress "nej"-strängar) → unknown. Aldrig
  // en negativ dom på ett enskilt svar — se lärdomen i filhuvudet.
  if (outcome.error) {
    return {
      known: false,
      shippable: null,
      optionCount: 0,
      note: outcome.error.slice(0, 160),
      negativeSignal: isExplicitNegative(outcome.error),
    };
  }

  const lists: unknown[][] = [];
  collectOptionArrays(outcome.raw, "", lists);
  const optionCount = lists.reduce((s, l) => s + l.length, 0);
  if (optionCount > 0) {
    return { known: true, shippable: true, optionCount, negativeSignal: false };
  }

  const failure = findFailureMessage(outcome.raw);
  if (failure) {
    return {
      known: false,
      shippable: null,
      optionCount: 0,
      note: failure.slice(0, 160),
      negativeSignal: isExplicitNegative(failure),
    };
  }

  // Tom lista utan felindikation: API:t har visat sig ge tomma/nekande svar
  // även för fraktbara SKU:er — unknown, inte en dom.
  if (lists.length > 0) {
    // Tom lista är INTE ett nej — API:t har gett tomma svar för fraktbara
    // SKU:er. Räknas aldrig som negativ signal.
    return { known: false, shippable: null, optionCount: 0, note: "tom alternativlista — obevisat", negativeSignal: false };
  }

  // Inget alternativ-fält alls i svaret → vi VET inte (klassa aldrig som
  // ofraktbar på det). Trunkerad rå-form i noten för felsökning.
  return {
    known: false,
    shippable: null,
    optionCount: 0,
    note: `oväntad svarsform: ${JSON.stringify(outcome.raw).slice(0, 160)}`,
    negativeSignal: false,
  };
}

/**
 * Matchar en mapping-variants supplierVariantId mot AliExpress-produktens
 * SKU:er och returnerar den numeriska sku_id:n (som fraktAPI:t kräver).
 *
 * Två id-format förekommer i mappningarna:
 *   - Numerisk sku_id ("12000058218136832") → exakt likhet.
 *   - Attribut-sträng från extension-importen
 *     ("14:350853#39 Drawers;200007763:201336106") — namngivna värden ligger
 *     efter "#" per property; ships-from-egenskapen saknar "#". Matchas mot
 *     SKU:ns skuProps-VÄRDEN; kräver ENTYDIG träff (annars null — hellre
 *     ingen kontroll än fel varianters dom).
 */
export function matchAeVariant(
  supplierVariantId: string,
  aeVariants: ReadonlyArray<{ skuId: string; skuAttr?: string; skuProps: Record<string, string> }>,
): string | null {
  const id = (supplierVariantId || "").trim();
  if (!id) return null;

  // Exakt träff på numeriskt sku_id ELLER attribut-strängen (sku_attr) —
  // extension-importens supplierVariantId ÄR AliExpress sku_attr, så detta
  // är den robusta huvudvägen; värde-matchningen nedan är fallback.
  const exact = aeVariants.find((v) => v.skuId === id || (v.skuAttr && v.skuAttr.trim() === id));
  if (exact) return exact.skuId;

  const namedValues = id
    .split(";")
    .map((part) => {
      const hash = part.indexOf("#");
      return hash >= 0 ? part.slice(hash + 1).trim().toLowerCase() : null;
    })
    .filter((v): v is string => Boolean(v));

  if (namedValues.length === 0) {
    // Enproduktsgenväg: en enda SKU utan namngivna val är entydig.
    return aeVariants.length === 1 ? aeVariants[0].skuId : null;
  }

  const hits = aeVariants.filter((v) => {
    const values = Object.values(v.skuProps).map((s) => s.trim().toLowerCase());
    return namedValues.every((nv) => values.includes(nv));
  });
  return hits.length === 1 ? hits[0].skuId : null;
}
