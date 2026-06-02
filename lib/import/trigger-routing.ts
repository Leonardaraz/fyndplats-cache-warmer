// Smart routing mellan Anthropic Batch API (50 % rabatt, latens upp till 24 h,
// i praktiken 5–15 min) och realtids-API (direkt anrop, omedelbart svar).
//
// Beslutet är två-dimensionellt:
//   1. MASTER-flagga USE_BATCH_API (lib/claude/batch.ts#isBatchApiEnabled). Av →
//      allt går realtid, oavsett källa (legacy-beteende).
//   2. LATENS-TOLERANS per trigger-källa. Även med master på SKA UX-blockerande
//      källor (extension-knappen, admin-singel) köra realtid — annars får Leonard
//      stirra på en spinner i minuter.
//
// Resultat (path):
//   bulk | cron | admin-batch     → 'batch'  (latens ok, ta 50 %-rabatten)
//   extension | admin-singleton   → 'realtime' (blockerar UX → direkt-API)
//
// path:en loggas per import och cost-stats taggas med den (lib/llm/stats.ts) så
// Leonard kan jämföra batch- vs realtidskostnad över tid i /admin/llm-usage.

import { isBatchApiEnabled } from "../claude/batch";

/**
 * Var en import startade. Avgör om latens är acceptabelt (→ Batch API) eller om
 * svaret blockerar UX och måste komma direkt (→ realtids-API).
 */
export type TriggerSource =
  | "bulk" // CSV-bulkimport (bakgrundsjobb, cron-driven)
  | "cron" // schemalagd worker-tick / sync-re-run
  | "admin-batch" // admin trycker "kör om N produkter" — bakgrund, latens ok
  | "extension" // klick på import-knappen i tillägget — MÅSTE vara direkt
  | "admin-singleton"; // admin importerar EN produkt manuellt — direkt

export type ImportPath = "batch" | "realtime";

/** Källor där latens är acceptabelt (svaret konsumeras av ett bakgrundsjobb). */
const LATENCY_TOLERANT: ReadonlySet<TriggerSource> = new Set<TriggerSource>([
  "bulk",
  "cron",
  "admin-batch",
]);

/** True om källan tål batch-latens (sekunder→minuter). */
export function isLatencyTolerant(source: TriggerSource): boolean {
  return LATENCY_TOLERANT.has(source);
}

/**
 * Slutgiltig transport-path för en given trigger-källa. Batch API används ENDAST
 * när master-flaggan är på OCH källan tål latens — annars realtid.
 */
export function resolveImportPath(source: TriggerSource): ImportPath {
  return isBatchApiEnabled() && isLatencyTolerant(source) ? "batch" : "realtime";
}

/** Kort en-radslogg för path-beslutet (skrivs per import-körning). */
export function describeRouting(source: TriggerSource): string {
  const path = resolveImportPath(source);
  const reason =
    path === "batch"
      ? "latens-tolerant + USE_BATCH_API=true"
      : isLatencyTolerant(source)
        ? "USE_BATCH_API=false → direkt-API"
        : "UX-blockerande källa → direkt-API";
  return `trigger=${source} path=${path} (${reason})`;
}
