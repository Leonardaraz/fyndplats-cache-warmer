import type { Collection } from "../lib/products";

// Två-stegs kategorinavigering — auto-detekterar topp-kategorier från faktiska
// produktantal istället för hårdkodad lista (så det följer Wix-katalogen).
//
// Toppraden: de N största kategorierna som stora fyllda chips med antal.
// Underraden: övriga kategorier med ≥3 produkter som små text-länkar.
// Kategorier med <3 produkter göms helt (förorenar utseendet).
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

  return (
    <div className="catnav">
      <div className="catnav-main" role="navigation" aria-label="Huvudkategorier">
        <a className={`catchip ${!activeSlug ? "active" : ""}`} href="/butik">
          Alla
          <span className="cc-count">{totalProducts}</span>
        </a>
        {main.map((c) => (
          <a
            key={c.id}
            className={`catchip ${activeSlug === c.slug ? "active" : ""}`}
            href={`/kategori/${c.slug}`}
          >
            {c.name}
            <span className="cc-count">{c.count}</span>
          </a>
        ))}
      </div>
      {subs.length > 0 && (
        <div className="catnav-sub" aria-label="Fler kategorier">
          <span className="catnav-sub-label">Fler kategorier</span>
          {subs.map((c) => (
            <a
              key={c.id}
              className={`catlink ${activeSlug === c.slug ? "active" : ""}`}
              href={`/kategori/${c.slug}`}
            >
              {c.name}
              <span className="cl-count">{c.count}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
