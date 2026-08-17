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
  namedValuesFromVariantId,
  parseFreightOutcome,
  type FreightQueryOutcome,
} from "../aliexpress/freight";
import { warehouseAlternativeSkuIds } from "./mapping-repair";
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

/**
 * Beviskrav för ett AUTOMATISKT nej (kontroll v2, 2026-08-16). Kod röd
 * 2026-07-14 kom av att ETT nej räckte: nattens rotation gav
 * DELIVERY_NOT_AVAILABLE_TO_YOUR_ADDRESS för enstaka färgvarianter hos
 * säljare som bevisligen levererar, och 8 säljbara produkter nollades.
 *
 * Skillnaden mellan ett flaxigt nej och ett äkta: det äkta upprepar sig.
 */
export const NEGATIVE_CONFIRMATIONS = 2;
/** …och upprepningarna måste vara OBEROENDE, alltså spridda över tid. */
export const NEGATIVE_MIN_SPAN_MS = 24 * 60 * 60 * 1000;
/** Öppen nej-serie kontrolleras oftare än 7 dygn så den hinner bekräftas. */
export const NEGATIVE_RECHECK_MS = 24 * 60 * 60 * 1000;

/**
 * Hur många ANDRA lager vi provar innan ett nej får stå (stödbenen
 * 2026-08-17). Lagerlandet är en del av SKU:n hos AliExpress, så vår sparade
 * SKU kan vara död medan listningen skickas från fyra andra länder. Taket
 * finns för anropsbudgetens skull; kandidaterna kommer i preferensordning
 * (lager med saldo först, EU före icke-EU), så de bästa provas först.
 */
export const SHIP_FROM_FAILOVER_MAX = 3;

/** true om varianten behöver (om)kontrolleras. */
export function isShippabilityStale(v: VariantMapping, nowMs: number): boolean {
  if (!v.shippabilityCheckedAt) return true;
  const t = Date.parse(v.shippabilityCheckedAt);
  if (!Number.isFinite(t)) return true;
  // Pågående nej-serie → kortare intervall, annars skulle en bekräftelse ta
  // två veckor (7 dygn × 2) och varan sälja vidare under tiden.
  const interval = (v.shippabilityNegativeStreak ?? 0) > 0 ? NEGATIVE_RECHECK_MS : SHIPPABILITY_RECHECK_MS;
  return nowMs - t >= interval;
}

/**
 * Uppdaterar en variants nej-serie utifrån ETT svar och avgör om serien nu
 * räcker som dom. Ren funktion → testbar utan nät.
 *
 * `siblingPositive` = någon ANNAN SKU på samma produkt svarade fraktbar i
 * samma körning. Det var exakt kod röd-mönstret (Aosom: "Beige ok, Grå nej"
 * på samma vägghylla), så ett nej bredvid ett ja får aldrig bli en dom —
 * serien får ackumuleras, men domen kräver att bruset inte motsägs direkt.
 * Ett äkta ofraktbart fall (hela listningen går inte att skicka) har inga
 * positiva syskon och passerar därför.
 */
export function escalateNegative(
  v: VariantMapping,
  nowMs: number,
  siblingPositive: boolean,
): { streak: number; since: string; verdict: boolean | null; reason: string } {
  const streak = (v.shippabilityNegativeStreak ?? 0) + 1;
  const since = v.shippabilityNegativeSince ?? new Date(nowMs).toISOString();
  const spanMs = nowMs - Date.parse(since);
  const spanOk = Number.isFinite(spanMs) && spanMs >= NEGATIVE_MIN_SPAN_MS;

  if (siblingPositive) {
    return { streak, since, verdict: null, reason: "nej bredvid ett fraktbart syskon — räknas men dömer inte" };
  }
  if (streak < NEGATIVE_CONFIRMATIONS) {
    return { streak, since, verdict: null, reason: `nej ${streak}/${NEGATIVE_CONFIRMATIONS} — obekräftat` };
  }
  if (!spanOk) {
    return { streak, since, verdict: null, reason: "nejen ligger för tätt — kräver spridning över dygn" };
  }
  return { streak, since, verdict: false, reason: `bekräftat nej ×${streak} över ${Math.round(spanMs / 3600000)} h` };
}

/**
 * Kontrollerar fraktbarhet till Sverige för mappningens STALE varianter, upp
 * till budgeten. aeVariants kommer från produkthämtningen som synken redan
 * gjort (inga extra product.get-anrop).
 */
export async function checkMappingShippability(opts: {
  mapping: Pick<ProductMappingRecord, "supplierProductId" | "variants">;
  aeVariants: ReadonlyArray<{
    skuId: string;
    skuAttr?: string;
    skuProps: Record<string, string>;
    /** Saldo och lagerland när DS-svaret bar dem — styr vilket lager vi provar först. */
    stock?: number;
    shipFrom?: string;
  }>;
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

  // Svar samlas i pass 1 och tolkas i pass 2 — domen behöver veta om något
  // syskon på samma produkt svarade fraktbar i samma körning.
  const pending: {
    index: number;
    detailIndex: number;
    v: VariantMapping;
    verdict: ReturnType<typeof parseFreightOutcome>;
    /** Satt när ett ANNAT lagers SKU svarade ja — varianten pekas om dit. */
    switchTo?: { skuId: string; skuAttr?: string };
  }[] = [];
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

    // LAGER-FAILOVER. Ett nej på VÅR SKU är inte ett nej på produkten:
    // lagerlandet är en del av SKU:n, och säljaren kan ha lagt ner just det
    // lager vi sparade vid import medan varan skickas från flera andra
    // (stödbenen 2026-08-17 — mappningen sa DE, listningen visade ES/FR/CZ/PL).
    // Innan nejet får räknas provar vi därför samma vara i andra lager.
    let effektivDom = verdict;
    let switchTo: { skuId: string; skuAttr?: string } | undefined;
    if (verdict.shippable !== true) {
      const alternativ = warehouseAlternativeSkuIds(
        { skuId, choiceValues: namedValuesFromVariantId(v.supplierVariantId) },
        aeVariants,
      ).slice(0, SHIP_FROM_FAILOVER_MAX);

      for (const altSkuId of alternativ) {
        if (budget.remaining <= 0) break;
        budget.remaining--;
        apiCalls++;
        if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));

        const altOutcome = await queryFn(mapping.supplierProductId, altSkuId);
        const altVerdict = parseFreightOutcome(altOutcome);
        details.push({
          sku: v.sku,
          choices: v.choices,
          skuId: altSkuId,
          shippable: altVerdict.shippable,
          optionCount: altVerdict.optionCount,
          note: `annat lager: ${altVerdict.note ?? ""}`.trim(),
          method: altOutcome.method,
        });
        if (altVerdict.shippable === true) {
          effektivDom = altVerdict;
          const alt = aeVariants.find((a) => a.skuId === altSkuId);
          switchTo = { skuId: altSkuId, skuAttr: alt?.skuAttr };
          break;
        }
      }
    }

    pending.push({ index: variants.length, detailIndex: details.length - 1, v, verdict: effektivDom, switchTo });
    variants.push(v); // platshållare — ersätts i pass 2 när syskonen är kända
  }

  // PASS 2: nu vet vi om NÅGON SKU på produkten svarade fraktbar den här
  // körningen. Utan den kontexten kunde ett flaxigt nej bredvid ett ja bli en
  // dom — precis kod röd-mönstret 2026-07-14.
  const siblingPositive = pending.some((p) => p.verdict.shippable === true);
  for (const { index, detailIndex, v, verdict, switchTo } of pending) {
    if (verdict.shippable === true) {
      // Positivt svar dömer direkt OCH nollar en pågående nej-serie
      // (självläkande: fraktmallen kan ha rättats hos säljaren).
      changed = true;
      variants[index] = {
        ...v,
        shippableToSe: true,
        shippabilityCheckedAt: checkedAt,
        shippabilityNegativeStreak: undefined,
        shippabilityNegativeSince: undefined,
        // Kom jaet från ett annat lager pekas varianten om dit — annars hade
        // nästa körning frågat samma döda SKU igen, och en order hade lagts på
        // ett lager säljaren inte längre skickar ifrån. Det gamla id:t sparas
        // så bytet går att följa (och rulla tillbaka) i efterhand.
        ...(switchTo
          ? {
              supplierVariantId: switchTo.skuAttr?.trim() || switchTo.skuId,
              previousSupplierVariantId: v.supplierVariantId,
              shipFromSwitchedAt: checkedAt,
            }
          : {}),
      };
      continue;
    }

    if (verdict.negativeSignal) {
      const esc = escalateNegative(v, nowMs, siblingPositive);
      changed = true;
      // Koppla på INDEX, inte sku — sku är inte garanterat unik per variant.
      const d = details[detailIndex];
      if (d) d.note = `${d.note ? d.note + " · " : ""}${esc.reason}`;
      variants[index] = {
        ...v,
        // Domen sätts BARA när serien räcker; annars lämnas det gamla värdet
        // orört (unknown ändrar aldrig något).
        ...(esc.verdict === false ? { shippableToSe: false } : {}),
        shippabilityCheckedAt: checkedAt,
        shippabilityNegativeStreak: esc.streak,
        shippabilityNegativeSince: esc.since,
      };
      continue;
    }

    // Brus (timeout, tom lista, oväntad form) → rör ingenting alls; varianten
    // förblir stale och provas igen nästa körning.
    variants[index] = v;
  }

  // Räkna bara de domar som FAKTISKT nollar lager (manuella + bevisade serier).
  // Gamla v1-flaggor är inerta; att räkna med dem fick synkloggen att påstå att
  // "lagret tvingas till 0" för varianter den inte rörde (granskning 2026-08-16).
  const unshippable = variants.filter(
    (v) =>
      v.shippableToSe === false
      && (v.shippabilityManual === true || (v.shippabilityNegativeStreak ?? 0) >= NEGATIVE_CONFIRMATIONS),
  ).length;
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
