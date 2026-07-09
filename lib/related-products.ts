// lib/related-products.ts
//
// LLM-kurerad "Liknande produkter"-karta. Produceras OFFLINE av
// scripts/score-related.mjs (Claude Opus 4.8, butiks-merchandiser-logik) och lever
// som en committad snapshot i data/related-products.json — DET här läser
// storefronten (app/produkt/[slug]/page.tsx) vid render (noll latency, samma
// mönster som data/image-scores.json).
//
// Kartan är slug → ordnad lista av slugs (bäst först). Saknas en produkt i kartan
// (t.ex. innan skriptet körts, eller en nyimporterad produkt) faller PDP:n tillbaka
// på kategori-överlapp — så blocket blir ALDRIG tomt och inget kan gå sönder.

import relatedFile from "../data/related-products.json";

type RelatedFile = {
  generatedAt: string;
  model: string;
  effort?: string;
  count: number;
  related: Record<string, string[]>;
};

const FILE = relatedFile as RelatedFile;
const MAP: Record<string, string[]> = FILE.related || {};

/** Kuraterade "liknande"-slugs för en produkt (bäst först). Tom = ingen kuraterad
 *  lista → anroparen faller tillbaka på kategori-överlapp. */
export function curatedRelatedSlugs(slug: string): string[] {
  return MAP[slug] || [];
}

export function relatedMeta() {
  return { generatedAt: FILE.generatedAt, model: FILE.model, count: FILE.count };
}
