// AI-kvalitetsläge för import-pipelinen — EN sanningskälla för "hur mycket AI".
//
// Tre lägen, valbara per import (extension-dropdown → flags.qualityMode) eller
// globalt via env AI_QUALITY_MODE (default "standard"):
//
//   raw      → 0 öre. INGA Claude-anrop alls. Rå AliExpress-data + deterministisk
//              variant-översättning. Produkten skapas som draft och väntar på
//              manuell polering. (= det gamla AI_ENRICHMENT_ENABLED=false-läget.)
//   standard → ~10,5 öre. Batchat Haiku-anrop (SEO + kategori + flikar i ett) +
//              Sonnet bildanalys. Draft. (= dagens normalflöde.)
//   premium  → ~75–100 öre. Opus multi-pass self-critique på beskrivning + FAQ,
//              Sonnet vision lifestyle-ranking av bilderna, 3-variant SEO-meta med
//              judge, och en slutlig kvalitets-judge (1–10) med strikt grind.
//              Publiceras direkt (visible:true) om judgen ≥ tröskeln, annars
//              flaggas för manuell polering men är ändå rikare än standard.
//
// Det här lagret mappar det HÖGNIVÅ-läget på de befintliga maskinerierna
// (aiEnrichmentEnabled / useBatchedPipeline / premium-pipeline) så att inget
// dubbleras. Bakåtkompatibelt: legacy-flaggorna flags.enableAI och env
// AI_ENRICHMENT_ENABLED tolkas fortfarande (false → raw).

import type { FeatureFlags } from "./types";

export type QualityMode = "raw" | "standard" | "premium";

export const QUALITY_MODES: readonly QualityMode[] = ["raw", "standard", "premium"] as const;

export function isQualityMode(v: unknown): v is QualityMode {
  return v === "raw" || v === "standard" || v === "premium";
}

/**
 * Härleder det effektiva kvalitetsläget för en import. Prioritet (mest specifik
 * vinner):
 *   1. flags.qualityMode  — explicit val i extension-popupen för JUST den importen.
 *   2. flags.enableAI=false — legacy explicit RÅ-tvång → "raw".
 *   3. env AI_QUALITY_MODE — global default-policy (raw/standard/premium).
 *   4. env AI_ENRICHMENT_ENABLED=false — legacy global RÅ-tvång → "raw".
 *   5. annars "standard".
 */
export function resolveQualityMode(flags?: FeatureFlags): QualityMode {
  if (flags?.qualityMode && isQualityMode(flags.qualityMode)) return flags.qualityMode;

  const env = (process.env.AI_QUALITY_MODE ?? "").toLowerCase();
  const envMode = isQualityMode(env) ? env : null;

  // Legacy: en explicit enableAI vinner ALLTID över env-flaggorna (default men
  // inte hård — samma kontrakt som gamla aiEnrichmentEnabled).
  //   enableAI=false → RÅ.
  //   enableAI=true  → minst standard; respektera ett icke-rått env-läge (premium).
  if (flags?.enableAI === false) return "raw";
  if (flags?.enableAI === true) return envMode && envMode !== "raw" ? envMode : "standard";

  if (envMode) return envMode;

  // Legacy global switch: AI_ENRICHMENT_ENABLED=false → RÅ.
  if ((process.env.AI_ENRICHMENT_ENABLED ?? "true").toLowerCase() === "false") return "raw";

  return "standard";
}

/** True om läget kör NÅGON AI-berikning (standard eller premium). raw → false. */
export function aiEnabledForMode(mode: QualityMode): boolean {
  return mode !== "raw";
}

/** True om läget kör det dyra premium-flödet (Opus multi-pass + vision-ranking). */
export function isPremiumMode(mode: QualityMode): boolean {
  return mode === "premium";
}

/**
 * Ungefärlig API-kostnad per produkt i öre — för UI/loggar och cost-stickprov.
 * Verklig kostnad bokförs per anrop i lib/llm/stats.ts (recordCall); de här
 * värdena är de dokumenterade riktmärkena Leonard fattar lägesvalet på.
 */
export function estimatedCostOre(mode: QualityMode): number {
  switch (mode) {
    case "raw":
      return 0;
    case "standard":
      return 10.5;
    case "premium":
      return 85; // mittpunkt av 75–100-spannet
  }
}

/** Default-synlighet: premium publiceras direkt (om judgen godkänner), övriga draft. */
export function publishesDirectly(mode: QualityMode): boolean {
  return mode === "premium";
}
