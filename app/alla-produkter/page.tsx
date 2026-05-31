import { getProducts, getCollections, mixByCategory } from "../../lib/products";
import { ShopBrowser } from "../../components/shopbrowser";
import { CatNav } from "../../components/catnav";
import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta(
  "Alla produkter – hela sortimentet",
  "Bläddra hela Fyndplats-sortimentet. Filtrera på pris, rea och kategori. Fri frakt över 499 kr, trygga betalningar med Klarna.",
  "/alla-produkter"
);

export default async function AllaProdukter({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  const { kategori } = await searchParams;
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  const active = collections.find((c) => c.slug === kategori);
  const list = active ? products.filter((p) => p.collectionIds?.includes(active.id)) : mixByCategory(products, collections);

  return (
    <section className="sec">
      <div className="container">
        <nav className="crumbs">
          <a href="/">Hem</a> <span>/</span> <a href="/butik">Butik</a> <span>/</span> <em>Alla produkter</em>
        </nav>
        <div className="sechead">
          <div className="eyebrow">Hela sortimentet</div>
          <h1>{active ? active.name : "Alla produkter"}</h1>
          <p>{active ? `Allt inom ${active.name}` : "Filtrera på pris och sortera – fler fynd varje vecka."}</p>
        </div>

        <CatNav products={products} collections={collections} activeSlug={active?.slug} />

        <ShopBrowser products={list} />
      </div>
    </section>
  );
}
