// lib/sync/shippability.ts
//
// Orkestrering av fraktbarhetskontrollen: vilka varianter ska kontrolleras,
// hur uppdateras mappningen, och hur nollas ofraktbara varianters Wix-lager.
// API-anropet injiceras (queryFn) så logiken kan enhetstestas utan nät.
//
// Konservativ i båda riktningar:
//   - unknown-svar (transient fel, oväntad svarsform) ändrar INGENTING —
//     shippableToSe behåller sitt gamla värde och checkedAt stämplas inte,
//     så varianten kontrolleras igen nästa körning.
//   - En variant klassas fraktbar igen så fort API:t visar fraktvägar →
//     synken speglar verkligt lager vid samma körning (självläkande åt båda håll).

import type { ProductMappingRecord } from "../store/index";
import type { VariantMapping } from "../import/pipeline";
import {
  matchAeVariant,
  parseFreightOutcome,
  type FreightQueryOutcome,
} from "../aliexpress/freight";
import {
  bulkUpdateInventoryQuantities,
  queryInventoryItemsByProductId,
} from "../wix/client";

/** Omkontroll-intervall: fraktmallar ändras sällan — 7 dygn räcker. */
export const SHIPPABILITY_RECHECK_MS = 7 * 24 * 60 * 60 * 1000;

/** Paus mellan fraktanrop (AliExpress rate-limit, samma ton som sync-loopen). */
export const FREIGHT_CALL_DELAY_MS = 600;

export interface ShippabilityBudget {
  /** Kvarvarande fraktanrop denna körning (delas över alla produkter). */
  remaining: number;
}

export interface VariantShippabilityResult {
  sku: string;
  choices: Record<string, string>;
  skuId: string | null;
  shippable: boolean | null;
  optionCount: number;
  note?: string;
  method?: string;
}

export interface ShippabilityCheckResult {
  /** Antal API-anrop som gjordes. */
  apiCalls: number;
  /** Antal varianter som nu är markerade ofraktbara. */
  unshippable: number;
  /** true om mappningen ändrades (anroparen ska spara den). */
  changed: boolean;
  /** Uppdaterad variantlista (ny array — muterar inte indata). */
  variants: VariantMapping[];
  /** Per-variant-detaljer (för debug-endpointen och loggning). */
  details: VariantShippabilityResult[];
}

/** true om varianten behöver (om)kontrolleras. */
export function isShippabilityStale(v: VariantMapping, nowMs: number): boolean {
  if (!v.shippabilityCheckedAt) return true;
  const t = Date.parse(v.shippabilityCheckedAt);
  return !Number.isFinite(t) || nowMs - t >= SHIPPABILITY_RECHECK_MS;
}

/**
 * Kontrollerar fraktbarhet till Sverige för mappningens STALE varianter, upp
 * till budgeten. aeVariants kommer från produkthämtningen som synken redan
 * gjort (inga extra product.get-anrop).
 */
export async function checkMappingShippability(opts: {
  mapping: Pick<ProductMappingRecord, "supplierProductId" | "variants">;
  aeVariants: ReadonlyArray<{ skuId: string; skuProps: Record<string, string> }>;
  nowMs: number;
  budget: ShippabilityBudget;
  queryFn: (productId: string, skuId: string) => Promise<FreightQueryOutcome>;
  /** Paus mellan anrop — injicerbar för tester (default FREIGHT_CALL_DELAY_MS). */
  delayMs?: number;
}): Promise<ShippabilityCheckResult> {
  const { mapping, aeVariants, nowMs, budget, queryFn } = opts;
  const delayMs = opts.delayMs ?? FREIGHT_CALL_DELAY_MS;
  const checkedAt = new Date(nowMs).toISOString();

  const details: VariantShippabilityResult[] = [];
  let apiCalls = 0;
  let changed = false;

  const variants: VariantMapping[] = [];
  for (const v of mapping.variants) {
    if (!isShippabilityStale(v, nowMs) || budget.remaining <= 0) {
      variants.push(v);
      continue;
    }

    const skuId = matchAeVariant(v.supplierVariantId, aeVariants);
    if (!skuId) {
      // Ingen entydig SKU-matchning → kan inte kontrollera. Stämpla INTE
      // checkedAt (så en framtida bättre matchning provas igen), logga detalj.
      details.push({ sku: v.sku, choices: v.choices, skuId: null, shippable: null, optionCount: 0, note: "ingen entydig SKU-matchning" });
      variants.push(v);
      continue;
    }

    budget.remaining--;
    apiCalls++;
    if (apiCalls > 1 && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
    const outcome = await queryFn(mapping.supplierProductId, skuId);
    const verdict = parseFreightOutcome(outcome);
    details.push({
      sku: v.sku,
      choices: v.choices,
      skuId,
      shippable: verdict.shippable,
      optionCount: verdict.optionCount,
      note: verdict.note,
      method: outcome.method,
    });

    if (!verdict.known) {
      // Obevisat svar → rör ingenting; varianten förblir stale.
      variants.push(v);
      continue;
    }

    // Känt utfall → persistera dom + tidsstämpel (stämpeln ändras alltid).
    changed = true;
    variants.push({
      ...v,
      shippableToSe: verdict.shippable === true,
      shippabilityCheckedAt: checkedAt,
    });
  }

  const unshippable = variants.filter((v) => v.shippableToSe === false).length;
  return { apiCalls, unshippable, changed, variants, details };
}

/**
 * Nollar Wix-lagret för mappningens ofraktbara varianter DIREKT (används av
 * debug-endpointen med apply=1; i synk-flödet sköts det av
 * applyInventoryTarget som utesluter ofraktbara varianter vid varje spegling).
 */
export async function zeroUnshippableInventory(
  wixProductId: string,
  variants: ReadonlyArray<VariantMapping>,
): Promise<number> {
  const blocked = new Set(
    variants.filter((v) => v.shippableToSe === false && v.wixVariantId).map((v) => v.wixVariantId as string),
  );
  if (blocked.size === 0) return 0;
  const items = await queryInventoryItemsByProductId(wixProductId);
  const updates = items
    .filter((it) => blocked.has(it.variantId))
    .map((it) => ({ id: it.id, revision: it.revision, quantity: 0 }));
  await bulkUpdateInventoryQuantities(updates);
  return updates.length;
}
