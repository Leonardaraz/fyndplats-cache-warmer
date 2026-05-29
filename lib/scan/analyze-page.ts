// Kör alla kategori-analyser på en redan hämtad sida. Delad av grade- och
// compare-endpointen så de alltid bedömer likadant.

import { evaluateHtml, type ScanResult } from "../accessibility/scanner";
import { analyzeSeo } from "../seo/analyzer";
import { analyzeAeo } from "../aeo/analyzer";
import { analyzePerformance } from "../perf/analyzer";
import { buildCategory, type CategoryResult, type Finding } from "./types";

/** Mappar tillgänglighetsresultatet till det gemensamma kategori-formatet. */
export function accessibilityToCategory(r: ScanResult): CategoryResult {
  const findings: Finding[] = r.issues.map((i) => ({
    id: i.id,
    title: i.title,
    severity: i.severity,
    ref: `WCAG ${i.wcag}`,
    count: i.count,
    examples: i.examples,
  }));
  return buildCategory("accessibility", "Tillgänglighet (EAA)", findings, r.checksRun);
}

/** Alla fyra kategorierna för en sida. */
export function analyzePage(url: string, html: string): CategoryResult[] {
  return [
    accessibilityToCategory(evaluateHtml(url, html)),
    analyzeSeo(html, url),
    analyzeAeo(html),
    analyzePerformance(html),
  ];
}

/** Viktat totalbetyg över kategorier. */
export function overallScore(categories: CategoryResult[]): number {
  if (categories.length === 0) return 0;
  return Math.round(categories.reduce((s, c) => s + c.score, 0) / categories.length);
}
