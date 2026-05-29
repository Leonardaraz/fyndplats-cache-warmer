import type { Collection, Product } from "../lib/products";
import { relatedCollections } from "../lib/products";
import { CatNavClient, type Chip } from "./catnav-client";

// Kategorinavigering — EN svepbar rad (scroll i sidled) i stället för en vägg
// av knappar. Auto-detekterar kategorier från faktiska produktantal (följer
// Wix-katalogen), sorterade störst först. Topp-kategorierna visas alltid;
// svansen tas med om den har ≥3 produkter (kategorier med <3 göms).
//
// Tvånivå: tryck på en kategori → de kategorier dess produkter oftast OCKSÅ
// tillhör fälls ut som en andra rad (co-occurrence — vi har ingen riktig
// hierarki). Allt rendreras i klient-skalet (CatNavClient) för svep + utfällning.
//
// "Alla"-chippet visar totalt antal unika produkter, INTE summan av
// kategoriantal (en produkt kan ligga i flera kategorier).
const MAIN_LIMIT = 8;
const SUB_LIMIT = 6;

export function CatNav({ products, collections, activeSlug }: {
  products: Product[];
  collections: Collection[];
  activeSlug?: string;
}) {
  const counts = new Map<string, number>();
  for (const p of products) for (const cid of (p.collectionIds || [])) counts.set(cid, (counts.get(cid) || 0) + 1);

  const counted = collections
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug, count: counts.get(c.id) || 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const main = counted.slice(0, MAIN_LIMIT);
  const subs = counted.slice(MAIN_LIMIT).filter((c) => c.count >= 3);
  const chips: Chip[] = [...main, ...subs];

  // Per-kategori relaterade kategorier (co-occurrence), upplösta till chips.
  const related = relatedCollections(products);
  const byId = new Map(counted.map((c) => [c.id, c] as const));
  const subMap: Record<string, Chip[]> = {};
  for (const c of chips) {
    const rel = (related.get(c.id) || [])
      .map((id) => byId.get(id))
      .filter((x): x is Chip => Boolean(x) && x!.slug !== c.slug)
      .slice(0, SUB_LIMIT);
    if (rel.length) subMap[c.id] = rel;
  }

  return (
    <CatNavClient chips={chips} subMap={subMap} totalProducts={products.length} activeSlug={activeSlug} />
  );
}
