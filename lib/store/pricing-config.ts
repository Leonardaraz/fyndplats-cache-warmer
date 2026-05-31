// FyndplatsPricingConfig — en enda Wix Data-rad som håller Leonards
// prissättningsregler (redigeras i /admin/pricing). Läses i import-pipelinen
// vid varje import via getPricingRules(). Faller tillbaka till env-defaults
// (lib/config.ts pricingRulesFromEnv) när ingen rad finns ännu.
//
// Schema (dataItem.data) speglar PricingRules + _id="default".

import { pricingRulesFromEnv } from "../config";
import type { PricingRules, PricingTier } from "../import/types";

const WIX_BASE = "https://www.wixapis.com";

function headers(): Record<string, string> {
  const token = process.env.WIX_API_TOKEN;
  if (!token) throw new Error("WIX_API_TOKEN saknas i miljön.");
  const h: Record<string, string> = { "Content-Type": "application/json", Authorization: token };
  const siteId = process.env.WIX_SITE_ID;
  if (siteId) h["wix-site-id"] = siteId;
  return h;
}

const COLLECTION_ID = process.env.WIX_DATA_COL_PRICING_CONFIG ?? "FyndplatsPricingConfig";
const CONFIG_ID = "default";

/** Tolerant validering + merge av en (möjligen partiell) sparad rad ovanpå defaults. */
export function mergePricingRules(stored: Partial<PricingRules> | null): PricingRules {
  const base = pricingRulesFromEnv();
  if (!stored) return base;

  const num = (v: unknown, fallback: number): number =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;

  const categoryMultipliers: Record<string, number> = { ...base.categoryMultipliers };
  if (stored.categoryMultipliers && typeof stored.categoryMultipliers === "object") {
    for (const [k, v] of Object.entries(stored.categoryMultipliers)) {
      if (typeof v === "number" && Number.isFinite(v) && v > 0) categoryMultipliers[k] = v;
    }
  }

  const tiers: PricingTier[] = Array.isArray(stored.tiers) && stored.tiers.length > 0
    ? stored.tiers
        .filter((t): t is PricingTier => Boolean(t) && typeof t.minCostSek === "number")
        .map((t) => ({
          minCostSek: num(t.minCostSek, 0),
          maxCostSek: t.maxCostSek == null ? null : num(t.maxCostSek, 0),
          multiplier: num(t.multiplier, base.defaultMultiplier),
        }))
    : base.tiers;

  return {
    usdToSek: num(stored.usdToSek, base.usdToSek),
    vatRatePercent: num(stored.vatRatePercent, base.vatRatePercent),
    defaultMultiplier: num(stored.defaultMultiplier, base.defaultMultiplier),
    fixedSurchargeSek: num(stored.fixedSurchargeSek, base.fixedSurchargeSek),
    categoryMultipliers,
    tiersEnabled: typeof stored.tiersEnabled === "boolean" ? stored.tiersEnabled : base.tiersEnabled,
    tiers,
    rounding: stored.rounding ?? base.rounding,
  };
}

/**
 * Läser sparade prissättningsregler (merge:ade ovanpå env-defaults). Saknad
 * kollektion eller rad → defaults. Best-effort: vid läsfel loggar vi och
 * returnerar defaults så importen aldrig faller på en pris-config-läsning.
 */
export async function getPricingRules(): Promise<PricingRules> {
  try {
    const url = `${WIX_BASE}/data/v2/items/${encodeURIComponent(CONFIG_ID)}?dataCollectionId=${encodeURIComponent(COLLECTION_ID)}`;
    const res = await fetch(url, { method: "GET", headers: headers() });
    if (res.status === 404) return mergePricingRules(null);
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 400 && /not found|does not exist|unknown collection/i.test(text)) {
        return mergePricingRules(null);
      }
      throw new Error(`getPricingRules (${res.status}): ${text.slice(0, 300)}`);
    }
    const body = (await res.json()) as { dataItem?: { data?: Partial<PricingRules> } };
    return mergePricingRules(body.dataItem?.data ?? null);
  } catch (err) {
    console.warn(
      "[pricing-config] getPricingRules failade, använder env-defaults:",
      err instanceof Error ? err.message : String(err),
    );
    return mergePricingRules(null);
  }
}

/** Sparar (overwrite) prissättningsregler i den enda raden. */
export async function savePricingRules(rules: PricingRules): Promise<void> {
  const res = await fetch(`${WIX_BASE}/data/v2/items/save`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      dataCollectionId: COLLECTION_ID,
      dataItem: {
        id: CONFIG_ID,
        dataCollectionId: COLLECTION_ID,
        data: { _id: CONFIG_ID, ...rules, updatedAt: new Date().toISOString() },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`savePricingRules (${res.status}): ${text.slice(0, 300)}`);
  }
}
