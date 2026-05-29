// Skanningshistorik + förändring över tid (re-skanning & övervakning).
//
// Pluggbar lagring; default är in-memory (försvinner vid serverless-omstart —
// bra för dev/test). För varaktig historik backas detta lämpligen av en
// databas/Wix Data senare; interfacet hålls litet så bytet blir enkelt.

import type { Category, CategoryResult } from "./types";
import type { RiskLevel } from "./prioritize";

export interface CategoryScore {
  category: Category;
  label: string;
  score: number;
}

export interface ScanSnapshot {
  url: string;
  scannedAt: string; // ISO
  overall: number;
  eaaRisk: RiskLevel;
  categories: CategoryScore[];
}

/** Bygger en snapshot från ett skanningsresultat. */
export function toSnapshot(
  url: string,
  overall: number,
  eaaRisk: RiskLevel,
  categories: CategoryResult[],
): ScanSnapshot {
  return {
    url,
    scannedAt: new Date().toISOString(),
    overall,
    eaaRisk,
    categories: categories.map((c) => ({ category: c.category, label: c.label, score: c.score })),
  };
}

export interface CategoryDelta {
  category: Category;
  label: string;
  delta: number; // curr - prev
}

export interface SnapshotDiff {
  overallDelta: number;
  categories: CategoryDelta[];
}

/** Skillnad mellan två snapshots (curr − prev). */
export function diffSnapshots(prev: ScanSnapshot, curr: ScanSnapshot): SnapshotDiff {
  const prevByCat = new Map(prev.categories.map((c) => [c.category, c.score]));
  return {
    overallDelta: curr.overall - prev.overall,
    categories: curr.categories.map((c) => ({
      category: c.category,
      label: c.label,
      delta: c.score - (prevByCat.get(c.category) ?? c.score),
    })),
  };
}

export interface Regression {
  regressed: boolean;
  overallDelta: number;
  /** Kategorier som tappat minst `threshold` poäng. */
  drops: CategoryDelta[];
}

/** Upptäcker försämring: totalpoäng eller någon kategori tappar ≥ threshold. */
export function detectRegression(prev: ScanSnapshot, curr: ScanSnapshot, threshold = 5): Regression {
  const diff = diffSnapshots(prev, curr);
  const drops = diff.categories.filter((c) => c.delta <= -threshold);
  return {
    regressed: diff.overallDelta <= -threshold || drops.length > 0,
    overallDelta: diff.overallDelta,
    drops,
  };
}

// --- Lagring ---

export interface SnapshotStore {
  record(s: ScanSnapshot): Promise<void>;
  /** Historik för en URL, nyast först. */
  history(url: string, limit?: number): Promise<ScanSnapshot[]>;
  latest(url: string): Promise<ScanSnapshot | null>;
  trackedUrls(): Promise<string[]>;
}

export class MemorySnapshotStore implements SnapshotStore {
  private byUrl = new Map<string, ScanSnapshot[]>();

  async record(s: ScanSnapshot): Promise<void> {
    const list = this.byUrl.get(s.url) ?? [];
    list.push(s);
    this.byUrl.set(s.url, list);
  }

  async history(url: string, limit = 50): Promise<ScanSnapshot[]> {
    const list = [...(this.byUrl.get(url) ?? [])].reverse(); // nyast först
    return list.slice(0, limit);
  }

  async latest(url: string): Promise<ScanSnapshot | null> {
    const list = this.byUrl.get(url);
    return list && list.length > 0 ? list[list.length - 1] : null;
  }

  async trackedUrls(): Promise<string[]> {
    return [...this.byUrl.keys()];
  }
}

let singleton: SnapshotStore | null = null;
export function getSnapshotStore(): SnapshotStore {
  if (!singleton) singleton = new MemorySnapshotStore();
  return singleton;
}
