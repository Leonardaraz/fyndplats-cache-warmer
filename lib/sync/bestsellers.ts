// Feature 4 — prioriterad sync (bestseller-delen).
//
// En gång per dygn (i början av sync-cronen) tittar vi på senaste 30 dagars
// orderdata och sätter priority="high" på de top-50 mest sålda produkterna så
// de alltid synkas först (skippar den rullande kön). Produkter som ramlat ur
// topp-50 och bara var high PÅ GRUND AV bestseller-status nedgraderas tillbaka
// till "normal" — vi rör inte high som satts manuellt eller av ett färskt köp.
//
// Pris-/ordervärden kommer från lib/wix/orders.ts (read-only). Skrivningar
// (mapping.priority) hoppas över i dry-run.

import type { ProductMappingRecord } from "../store/index";
import type { Store } from "../store/index";

/** Markör i priorityReason för automatiskt satt bestseller-prioritet. */
export const BESTSELLER_REASON = "bestseller-30d";
/** Markör i priorityReason för köp-triggad engångs-prioritet. */
export const RECENT_PURCHASE_REASON = "recent-purchase";

export function isPrioritySyncEnabled(): boolean {
  return (process.env.PRIORITY_SYNC ?? "on").toLowerCase() !== "off";
}

/**
 * Köar produkter för en high-priority-check nästa cron-cykel (Feature 4 —
 * "recent purchases"). Anropas av order-webhooken. Best-effort: hoppar över
 * saknade mappningar och produkter som redan är high. Returnerar antal köade.
 */
export async function enqueuePriorityCheck(
  store: Store,
  wixProductIds: string[],
): Promise<number> {
  if (!isPrioritySyncEnabled()) return 0;
  const now = new Date().toISOString();
  const unique = [...new Set(wixProductIds.filter(Boolean))];
  let n = 0;
  for (const id of unique) {
    try {
      const m = await store.getMappingByWixProductId(id);
      if (!m || m.priority === "high") continue;
      await store.saveMapping({
        ...m,
        priority: "high",
        priorityReason: RECENT_PURCHASE_REASON,
        priorityUpdatedAt: now,
      });
      n++;
    } catch {
      // best-effort — en order ska aldrig faila pga prioriterings-skrivning.
    }
  }
  return n;
}

/**
 * Väljer de top-N produkt-id:n efter sålda enheter. Ren funktion — testbar.
 * Endast produkter med > 0 sålda enheter kvalar.
 */
export function selectBestsellerProductIds(
  salesByProduct: Record<string, number>,
  topN = 50,
): Set<string> {
  const ranked = Object.entries(salesByProduct)
    .filter(([, units]) => units > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([productId]) => productId);
  return new Set(ranked);
}

export interface BestsellerPriorityPlan {
  /** Produkter som ska sättas till high (nya bestsellers). */
  promote: string[];
  /** Produkter som ska nedgraderas till normal (var bestseller, är inte längre). */
  demote: string[];
}

/**
 * Ren beslutsfunktion: givet nuvarande mappings + bestseller-setet, vilka ska
 * promotas/demotas? Rör inte high som satts manuellt eller av färskt köp.
 */
export function planBestsellerPriority(
  mappings: ProductMappingRecord[],
  bestsellers: Set<string>,
): BestsellerPriorityPlan {
  const promote: string[] = [];
  const demote: string[] = [];
  for (const m of mappings) {
    const isBestseller = bestsellers.has(m.wixProductId);
    if (isBestseller) {
      if (m.priority !== "high") promote.push(m.wixProductId);
    } else if (m.priority === "high" && m.priorityReason === BESTSELLER_REASON) {
      // Var bestseller-high, har ramlat ur listan → tillbaka till normal.
      demote.push(m.wixProductId);
    }
  }
  return { promote, demote };
}

export interface ApplyBestsellerResult {
  promoted: number;
  demoted: number;
  dryRun: boolean;
}

/**
 * Tillämpar bestseller-prioritet. I dry-run räknas bara vad som SKULLE ändras
 * (inga mapping-skrivningar). Best-effort: ett fel på en enskild mapping
 * avbryter inte resten.
 */
export async function applyBestsellerPriority(opts: {
  store: Store;
  mappings: ProductMappingRecord[];
  salesByProduct: Record<string, number>;
  dryRun: boolean;
  topN?: number;
}): Promise<ApplyBestsellerResult> {
  if (!isPrioritySyncEnabled()) {
    return { promoted: 0, demoted: 0, dryRun: opts.dryRun };
  }
  const bestsellers = selectBestsellerProductIds(opts.salesByProduct, opts.topN ?? 50);
  const plan = planBestsellerPriority(opts.mappings, bestsellers);
  const byId = new Map(opts.mappings.map((m) => [m.wixProductId, m]));
  const now = new Date().toISOString();

  let promoted = 0;
  let demoted = 0;

  for (const id of plan.promote) {
    const m = byId.get(id);
    if (!m) continue;
    // Mutera in-memory så att efterföljande sortering ser den nya prioriteten
    // — även i dry-run (då vi inte skriver till store).
    m.priority = "high";
    m.priorityReason = BESTSELLER_REASON;
    m.priorityUpdatedAt = now;
    if (opts.dryRun) {
      promoted++;
      continue;
    }
    try {
      await opts.store.saveMapping(m);
      promoted++;
    } catch {
      // best-effort
    }
  }
  for (const id of plan.demote) {
    const m = byId.get(id);
    if (!m) continue;
    m.priority = "normal";
    m.priorityReason = undefined;
    m.priorityUpdatedAt = now;
    if (opts.dryRun) {
      demoted++;
      continue;
    }
    try {
      await opts.store.saveMapping(m);
      demoted++;
    } catch {
      // best-effort
    }
  }

  return { promoted, demoted, dryRun: opts.dryRun };
}

/** Rangordningsvärde för sortering: high=0, normal=1, low=2 (lägre = först). */
export function priorityRank(priority: ProductMappingRecord["priority"]): number {
  switch (priority) {
    case "high": return 0;
    case "low": return 2;
    default: return 1; // normal / saknas
  }
}
