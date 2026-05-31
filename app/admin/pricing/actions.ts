"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { mergePricingRules, savePricingRules } from "@/lib/store/pricing-config";
import type { PricingRules } from "@/lib/import/types";

/**
 * Sparar prissättningsreglerna. Tar emot ett (otrustat) objekt från klienten och
 * kör det genom mergePricingRules för validering/normalisering ovanpå defaults
 * innan det persisteras i FyndplatsPricingConfig.
 */
export async function savePricingRulesAction(
  input: Partial<PricingRules>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const rules = mergePricingRules(input);
    await savePricingRules(rules);
    await audit(
      "pricing-config-saved",
      "default",
      `default=${rules.defaultMultiplier}x fixed=${rules.fixedSurchargeSek}kr tiers=${rules.tiersEnabled ? "på" : "av"} rounding=${rules.rounding}`,
    );
    revalidatePath("/admin/pricing");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
