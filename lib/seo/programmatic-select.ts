// lib/seo/programmatic-select.ts
//
// URVALSREGELN för de programmatiska sidorna, bruten ur programmatic.ts för att
// vara testbar: den här filen importerar ingenting. programmatic.ts drar in Wix-
// SDK:n via ../products och går därför inte att ladda i node-testköraren, vilket
// är precis varför regeln aldrig haft ett test — och varför en byrå kunde bli en
// laddare utan att någon grind sa ifrån.
//
// REGELN, i två grindar:
//   1. KATEGORIN avgränsar. Produkten måste ligga i sidans kategori (inkl. dess
//      underkategorier). Kategorin är auktoritativ.
//   2. NYCKELORDEN smalnar av INOM kategorin. De får aldrig vidga urvalet.
// Plus en valfri plocklista (productSlugs) som tas med även utanför kategorin.
//
// Strukturella typer, inte Product/Collection: modulen ska inte veta något om
// Wix. Anroparen skickar in vad den har.

export type SelCollection = { id: string; name: string; parentId?: string | null };
export type SelProduct = {
  id: string;
  slug: string;
  name: string;
  inStock: boolean;
  imageScore: number;
  collectionIds?: string[];
};

const lc = (s: string) => (s || "").toLowerCase();

/**
 * Produkter i en eller flera kategorier, inklusive deras underkategorier.
 *
 * `null` = ingen av kategorierna finns som collection. Anroparen ska då INTE
 * falla tillbaka på hela katalogen — det var exakt det felet: utan avgränsning
 * matchade "laddstation" mot varenda byrå och lasertag-set i sortimentet.
 * Tom `names` betyder "ingen avgränsning begärd" och ger hela listan.
 */
export function categoryPool<P extends SelProduct>(
  products: P[],
  collections: SelCollection[],
  names: string[],
): P[] | null {
  if (!names.length) return products;
  const ids = new Set<string>();
  for (const name of names) {
    const c = collections.find((x) => x.name === name);
    if (!c) continue;
    ids.add(c.id);
    for (const child of collections.filter((x) => x.parentId === c.id)) ids.add(child.id);
  }
  if (!ids.size) return null;
  return products.filter((p) => (p.collectionIds || []).some((cid) => ids.has(cid)));
}

/** Delsträngsmatchning på produktnamnet, gemener. `exclude` vinner över `keywords`. */
export function matchByName<P extends SelProduct>(products: P[], keywords: string[], exclude: string[]): P[] {
  const kw = keywords.map(lc);
  const ex = exclude.map(lc);
  return products.filter((p) => {
    const n = lc(p.name);
    if (ex.some((e) => e && n.includes(e))) return false;
    return kw.some((k) => k && n.includes(k));
  });
}

/** Slår upp slugs i katalogen och behåller ordningen i listan. Slut på lagret = utelämnas. */
export function bySlugInStock<P extends SelProduct>(products: P[], slugs: string[]): P[] {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  return slugs.map((s) => bySlug.get(s)).filter((p): p is P => !!p && p.inStock);
}

/**
 * Handplockade först, nyckelordsträffar (bäst bild först) efter — dubbletter bort.
 * `dedupe` skickas in av anroparen så den här modulen slipper känna till bild-
 * nycklar; testet skickar in identitet.
 */
export function unionCuratedFirst<P extends SelProduct>(
  curated: P[],
  matches: P[],
  limit: number,
  dedupe: (list: P[]) => P[],
): P[] {
  const seen = new Set<string>();
  const union: P[] = [];
  for (const p of [...curated, ...[...matches].sort((a, b) => b.imageScore - a.imageScore)]) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    union.push(p);
  }
  return dedupe(union).slice(0, limit);
}

/**
 * Hela urvalet för ett mönster: kategorigrind → nyckelordsgrind → plocklista.
 * `null` betyder "sidan får inte finnas" (kategorin saknas i katalogen).
 */
export function selectProducts<P extends SelProduct>(
  products: P[],
  collections: SelCollection[],
  cfg: { categories: string[]; keywords: string[]; exclude: string[]; productSlugs?: string[] },
  limit: number,
  dedupe: (list: P[]) => P[],
): P[] | null {
  const curated = bySlugInStock(products, cfg.productSlugs || []);
  const pool = categoryPool(products, collections, cfg.categories);
  if (!pool) return curated.length ? curated.slice(0, limit) : null;
  const matched = matchByName(pool, cfg.keywords, cfg.exclude).filter((p) => p.inStock);
  return unionCuratedFirst(curated, matched, limit, dedupe);
}
