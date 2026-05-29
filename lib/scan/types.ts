// Gemensamma typer + poängsättning för alla grader-kategorier
// (tillgänglighet, SEO, AI-synlighet). Håller analysmodulerna konsekventa.

export type Severity = "critical" | "serious" | "moderate" | "minor";

export interface Finding {
  /** Stabilt id, t.ex. "meta-description". */
  id: string;
  /** Kort rubrik på svenska. */
  title: string;
  severity: Severity;
  /** Valfri referens, t.ex. "WCAG 1.1.1" eller "schema.org". */
  ref?: string;
  /** Antal förekomster (1 för av/på-kontroller). */
  count: number;
  /** Upp till några exempel (HTML-utdrag) för kontext. */
  examples: string[];
  /** Sidor där felet förekommer (sätts vid flersidig granskning). */
  pages?: string[];
}

export type Category = "accessibility" | "seo" | "aeo" | "performance";

export interface CategoryResult {
  category: Category;
  /** Visningsnamn, t.ex. "Tillgänglighet (EAA)". */
  label: string;
  /** 0–100, högre = bättre. */
  score: number;
  /** Bokstavsbetyg A–F. */
  grade: string;
  findings: Finding[];
  /** Antal kontroller som kördes (transparens). */
  checksRun: number;
}

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 15,
  serious: 8,
  moderate: 4,
  minor: 2,
};

const SEVERITY_ORDER: Severity[] = ["critical", "serious", "moderate", "minor"];

export function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  if (score >= 50) return "E";
  return "F";
}

/** Poäng 0–100 från en lista fynd (viktat per allvarlighet, med tak per regel). */
export function scoreFindings(findings: Finding[]): number {
  let penalty = 0;
  for (const f of findings) {
    const cap = SEVERITY_WEIGHT[f.severity] * 3;
    penalty += Math.min(f.count * SEVERITY_WEIGHT[f.severity], cap);
  }
  return Math.max(0, Math.min(100, Math.round(100 - penalty)));
}

/** Sorterar allvarligast först, sedan flest förekomster. */
export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) ||
      b.count - a.count,
  );
}

/** Bygger ett kategoriresultat från fynd. */
export function buildCategory(
  category: Category,
  label: string,
  findings: Finding[],
  checksRun: number,
): CategoryResult {
  const sorted = sortFindings(findings);
  const score = scoreFindings(sorted);
  return { category, label, score, grade: scoreToGrade(score), findings: sorted, checksRun };
}
