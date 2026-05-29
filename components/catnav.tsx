import type { Collection } from "../lib/products";
import { CatNavRow } from "./catnav-row";

// Kategorinavigering — EN svepbar rad (scroll i sidled) i stället för en vägg
// av knappar som tryckte ner produkterna. Auto-detekterar kategorier från
// faktiska produktantal (följer Wix-katalogen), sorterade störst först.
//
// Topp-kategorierna visas alltid; svansen tas med om den har ≥3 produkter
// (kategorier med <3 göms — förorenar raden). Allt i samma swipe-rad.
//
// "Alla"-chippet visar totalProducts (unika produkter), INTE summan av
// kategoriantal — produkter kan ligga i flera kategorier samtidigt så summan
// blir dubblerad/trippeled.
const MAIN_LIMIT = 8;

export function CatNav({ collections, productCounts, totalProducts, activeSlug }: {
  collections: Collection[];
  productCounts: Map<string, number>;
  totalProducts: number;
  activeSlug?: string;
}) {
  const counted = collections
    .map((c) => ({ ...c, count: productCounts.get(c.id) || 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const main = counted.slice(0, MAIN_LIMIT);
  const subs = counted.slice(MAIN_LIMIT).filter((c) => c.count >= 3);
  const chips = [...main, ...subs];

  return (
    <div className="catnav">
      <CatNavRow>
        <a className={`catchip ${!activeSlug ? "active" : ""}`} href="/butik">
          Alla
          <span className="cc-count">{totalProducts}</span>
        </a>
        {chips.map((c) => (
          <a
            key={c.id}
            className={`catchip ${activeSlug === c.slug ? "active" : ""}`}
            href={`/kategori/${c.slug}`}
          >
            {c.name}
            <span className="cc-count">{c.count}</span>
          </a>
        ))}
      </CatNavRow>
    </div>
  );
}
