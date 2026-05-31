import { getProducts, getCollections, mixByCategory, forListings } from "../../lib/products";
import { ShopBrowser } from "../../components/shopbrowser";
import { CategoryDropdown } from "../../components/categorydropdown";
import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta(
  "Alla produkter – hela sortimentet",
  "Bläddra hela Fyndplats-sortimentet. Filtrera på pris, rea och kategori. Fri frakt över 499 kr, trygga betalningar med Klarna.",
  "/alla-produkter"
);

export default async function AllaProdukter({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  const { kategori } = await searchParams;
  const [allProducts, collections] = await Promise.all([getProducts(), getCollections()]);
  const products = forListings(allProducts); // dölj ev. slutsålda från listan (opt-in)
  const active = collections.find((c) => c.slug === kategori);
  const list = active ? products.filter((p) => p.collectionIds?.includes(active.id)) : mixByCategory(products, collections);

  return (
    <div className="alla-prod">
      {/* PREMIUM HERO — samma look som /butik (cream, serif, brödsmulor) */}
      <section className="butik-hero alla-prod-hero">
        <div className="container">
          <nav className="butik-crumbs" aria-label="Brödsmulor">
            <a href="/">Hem</a>
            <span aria-hidden="true">/</span>
            <a href="/butik">Butik</a>
            <span aria-hidden="true">/</span>
            <em>{active ? active.name : "Alla produkter"}</em>
          </nav>
          <div className="butik-hero-inner">
            <span className="butik-hero-eyebrow">Hela sortimentet</span>
            <h1 className="butik-hero-title">{active ? active.name : "Alla produkter"}</h1>
            <p className="butik-hero-lede">
              {active
                ? `Noga utvalda fynd inom ${active.name.toLowerCase()}.`
                : "Filtrera på pris, rea och kategori – allt på ett ställe."}
              <span className="butik-hero-meta"> {products.length} produkter · {collections.length} kategorier</span>
            </p>
          </div>
        </div>
      </section>

      <section className="alla-prod-body">
        <div className="container">
          <CategoryDropdown products={products} collections={collections} activeSlug={active?.slug} />

          <ShopBrowser products={list} />
        </div>
      </section>
    </div>
  );
}
