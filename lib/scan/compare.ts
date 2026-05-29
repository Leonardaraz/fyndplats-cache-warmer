// Jämförelse mellan flera sajter (din butik vs konkurrenter). Ren funktion.

import type { Category } from "./types";

export interface CompareEntry {
  url: string;
  overall: number;
  categories: { category: Category; label: string; score: number }[];
}

export interface CompareRow {
  url: string;
  overall: number;
  rank: number; // 1 = bäst
}

export interface CategoryCompare {
  category: Category;
  label: string;
  leader: string; // url med högst poäng
  scores: { url: string; score: number }[];
}

export interface CompareResult {
  ranking: CompareRow[];
  byCategory: CategoryCompare[];
}

export function compareSites(entries: CompareEntry[]): CompareResult {
  const ranking: CompareRow[] = [...entries]
    .sort((a, b) => b.overall - a.overall)
    .map((e, i) => ({ url: e.url, overall: e.overall, rank: i + 1 }));

  // Samla alla kategorier i den ordning de först dyker upp.
  const order: Category[] = [];
  const labels = new Map<Category, string>();
  for (const e of entries) {
    for (const c of e.categories) {
      if (!labels.has(c.category)) {
        labels.set(c.category, c.label);
        order.push(c.category);
      }
    }
  }

  const byCategory: CategoryCompare[] = order.map((cat) => {
    const scores = entries.map((e) => ({
      url: e.url,
      score: e.categories.find((c) => c.category === cat)?.score ?? 0,
    }));
    const leader = [...scores].sort((a, b) => b.score - a.score)[0]?.url ?? "";
    return { category: cat, label: labels.get(cat)!, leader, scores };
  });

  return { ranking, byCategory };
}
