import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "../../components/site";
import { getProducts, getCollections } from "../../lib/products";
import { ProductCard } from "../../components/productcard";

export const metadata: Metadata = {
  title: "Butik – hela sortimentet",
  description: "Handla i Fyndplats webbutik – kvalitetsprodukter till låga priser. Fri frakt över 499 kr, trygg betalning med Klarna.",
  alternates: { canonical: "https://www.fyndplats.se/butik" },
};

export default async function Butik({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  const { kategori } = await searchParams;
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  const active = collections.find((c) => c.slug === kategori);
  const list = active ? products.filter((p) => p.collectionIds?.includes(active.id)) : products;

  return (
    <>
      <SiteHeader />
      <section className="sec">
        <div className="container">
          <div className="sechead">
            <div className="eyebrow">Butik</div>
            <h2>{active ? active.name : "Hela sortimentet"}</h2>
            <p>{list.length} {list.length === 1 ? "produkt" : "produkter"}{active ? "" : " · fler läggs till varje vecka"}</p>
          </div>

          {collections.length > 0 && (
            <div className="catbar">
              <a className={`chip ${!active ? "active" : ""}`} href="/butik">Alla</a>
              {collections.map((c) => (
                <a key={c.id} className={`chip ${active?.id === c.id ? "active" : ""}`} href={`/kategori/${c.slug}`}>{c.name}</a>
              ))}
            </div>
          )}

          <div className="prodgrid">
            {list.map((p) => (
              <ProductCard p={p} key={p.slug} />
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
