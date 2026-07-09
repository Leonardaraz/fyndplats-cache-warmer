// lib/related-pick.ts
//
// Ren urvalslogik för "Liknande produkter" — inga sidoeffekter, ingen JSON/IO-import,
// så den är enhetstestbar direkt (lib/related-products.test.ts). lib/related-products.ts
// re-exporterar dessa jämte kartläsaren (curatedRelatedSlugs).

import type { Product } from "./products";

// ── Meningsfullt kategori-överlapp ──────────────────────────────────────────
// Wix-katalogen har en "All Products"-kategori som sitter på VARENDA produkt
// (audit 2026-07: den täckte alla 420 produkter). En sådan universell kategori
// bär ingen relevanssignal — utan att exkludera den "delar" varje produkt kategori
// med varenda annan, så fallback-överlappet kunde dra in en helt orelaterad produkt
// (mätt: produkter i små kategorier fick ett irrelevant 4:e förslag). Vi hittar
// universella kategorier DYNAMISKT (täcker ≥90 % av katalogen) och räknar dem inte
// som "samma kategori". Robust: finns ingen sådan kategori exkluderas inget.
export function universalCollectionIds(all: Product[]): Set<string> {
  const uni = new Set<string>();
  if (all.length < 20) return uni;
  const count = new Map<string, number>();
  for (const p of all) for (const c of p.collectionIds || []) count.set(c, (count.get(c) || 0) + 1);
  const threshold = all.length * 0.9;
  for (const [c, n] of count) if (n >= threshold) uni.add(c);
  return uni;
}

/** Antal MENINGSFULLA (icke-universella) kategorier som två produkter delar. */
export function sharedCategoryCount(a: Product, b: Product, universal: Set<string>): number {
  const bs = new Set((b.collectionIds || []).filter((c) => !universal.has(c)));
  let n = 0;
  for (const c of a.collectionIds || []) if (!universal.has(c) && bs.has(c)) n++;
  return n;
}

/**
 * Slutgiltig "Liknande produkter"-lista för PDP:n. Två lager:
 *   1. Kuraterade LLM-val (bäst först) — bara i lager + fortfarande existerande.
 *   2. Fallback/påfyllning: meningsfullt kategori-överlapp (flest delade först,
 *      i lager före slutsåld). Täcker HELT när kuraterad lista saknas.
 * Aldrig produkten själv, aldrig dubbletter, max `limit`. Ren funktion → testbar.
 */
export function pickRelated(p: Product, all: Product[], curatedSlugs: string[], limit = 4): Product[] {
  const bySlug = new Map(all.map((x) => [x.slug, x]));
  const universal = universalCollectionIds(all);
  const out: Product[] = [];
  const seen = new Set<string>([p.slug]); // aldrig produkten själv
  const add = (x?: Product) => { if (x && !seen.has(x.slug)) { out.push(x); seen.add(x.slug); } };

  // 1) Kuraterade val (bäst först) — bara i lager + fortfarande i katalogen.
  for (const s of curatedSlugs) {
    if (out.length >= limit) break;
    const x = bySlug.get(s);
    if (x && x.inStock) add(x);
  }
  // 2) Meningsfullt kategori-överlapp som fallback/påfyllning.
  if (out.length < limit) {
    const overlap = all
      .map((x) => ({ x, shared: sharedCategoryCount(p, x, universal) }))
      .filter((s) => s.shared > 0 && !seen.has(s.x.slug))
      .sort((a, b) => b.shared - a.shared || (b.x.inStock ? 1 : 0) - (a.x.inStock ? 1 : 0));
    for (const s of overlap) { if (out.length >= limit) break; add(s.x); }
  }
  return out;
}
