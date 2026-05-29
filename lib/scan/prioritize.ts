// Prioritering: vad ska användaren göra FÖRST, och hur allvarligt är läget?
// "Snabba vinster" = hög effekt (allvarlighet × antal) delat med åtgärdsinsats.
// Ren logik — testbar.

import { REMEDIATION } from "../accessibility/remediation";
import { SEVERITY_WEIGHT, type CategoryResult, type Finding } from "./types";

const EFFORT_WEIGHT: Record<string, number> = { låg: 1, medel: 2, hög: 3 };

export interface QuickWin {
  finding: Finding;
  categoryLabel: string;
}

/** Effekt av ett fynd: allvarlighet × antal förekomster. */
export function impactOf(f: Finding): number {
  return SEVERITY_WEIGHT[f.severity] * f.count;
}

/**
 * Topp-N att åtgärda först, rankade på effekt/insats (störst nytta för minst jobb).
 */
export function quickWins(categories: CategoryResult[], max = 3): QuickWin[] {
  const scored: Array<{ win: QuickWin; score: number }> = [];
  for (const c of categories) {
    for (const f of c.findings) {
      const effort = EFFORT_WEIGHT[REMEDIATION[f.id]?.effort ?? "medel"];
      scored.push({ win: { finding: f, categoryLabel: c.label }, score: impactOf(f) / effort });
    }
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, max).map((s) => s.win);
}

export type RiskLevel = "Låg" | "Medel" | "Hög";

/** Grov EAA-risknivå utifrån tillgänglighetspoängen (vägledande, ej juridisk bedömning). */
export function eaaRisk(accessibilityScore: number): RiskLevel {
  if (accessibilityScore >= 80) return "Låg";
  if (accessibilityScore >= 50) return "Medel";
  return "Hög";
}
