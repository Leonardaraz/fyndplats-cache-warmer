import { getProducts, getCollections, mixByCategory } from "../../lib/products";
import { ShopBrowser } from "../../components/shopbrowser";
import { CatNav } from "../../components/catnav";
import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta(
  "Butik – hela sortimentet",
  "Handla i Fyndplats webbutik – kvalitetsprodukter till låga priser. Fri frakt över 499 kr, trygg betalning med Klarna.",
  "/butik"
);

export default async function Butik({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  const { kategori } = await searchParams;
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  const active = collections.find((c) => c.slug === kategori);
  const list = active ? products.filter((p) => p.collectionIds?.includes(active.id)) : mixByCategory(products, collections);

  // Räkna produkter per kategori (för CatNav-badges)
  const counts = new Map<string, number>();
  for (const p of products) for (const cid of (p.collectionIds || [])) counts.set(cid, (counts.get(cid) || 0) + 1);

  return (
    <>
      <section className="sec">
        <div className="container">
          <div className="sechead">
            <div className="eyebrow">Butik</div>
            <h1>{active ? active.name : "Hela sortimentet"}</h1>
            <p>{active ? `Allt inom ${active.name}` : "Filtrera på pris och sortera – fler fynd varje vecka."}</p>
          </div>

          <CatNav collections={collections} productCounts={counts} totalProducts={products.length} activeSlug={active?.slug} />

          <ShopBrowser products={list} />
        </div>
      </section>
    </>
  );
}
