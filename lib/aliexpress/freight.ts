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
// Tolkningen är MEDVETET försiktig: bara när svaret bevisligen innehåller en
// fraktalternativ-lista (även tom) eller ett tydligt "ingen fraktväg"-fel
// fäller vi ett avgörande. Allt annat → unknown (null) — vi nollar ALDRIG en
// variant på ett obevisat svar (samma princip som synkens transient-skydd).

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
}

// Nyckelmönster för listor med fraktalternativ i kända svarsformer.
const OPTION_LIST_KEY = /delivery_option|freight_calculate_result|delivery_options|logistics_service/i;

// Felmeddelanden som betyder "ingen fraktväg" (inte transient strul).
const NO_ROUTE_ERROR =
  /(no|not|unable|unavailable|can.?t|cannot)[^.]{0,60}(ship|deliver|logistics|freight|route)|delivery.{0,20}(unavailable|not support)|not support.{0,20}(ship|deliver|country)/i;

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
  if (outcome.error) {
    if (NO_ROUTE_ERROR.test(outcome.error)) {
      return { known: true, shippable: false, optionCount: 0, note: outcome.error.slice(0, 160) };
    }
    return { known: false, shippable: null, optionCount: 0, note: outcome.error.slice(0, 160) };
  }

  const lists: unknown[][] = [];
  collectOptionArrays(outcome.raw, "", lists);
  if (lists.length > 0) {
    const optionCount = lists.reduce((s, l) => s + l.length, 0);
    return { known: true, shippable: optionCount > 0, optionCount };
  }

  const failure = findFailureMessage(outcome.raw);
  if (failure) {
    if (NO_ROUTE_ERROR.test(failure)) {
      return { known: true, shippable: false, optionCount: 0, note: failure.slice(0, 160) };
    }
    return { known: false, shippable: null, optionCount: 0, note: failure.slice(0, 160) };
  }

  // Inget alternativ-fält alls i svaret → vi VET inte (klassa aldrig som
  // ofraktbar på det). Trunkerad rå-form i noten för felsökning.
  return {
    known: false,
    shippable: null,
    optionCount: 0,
    note: `oväntad svarsform: ${JSON.stringify(outcome.raw).slice(0, 160)}`,
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
