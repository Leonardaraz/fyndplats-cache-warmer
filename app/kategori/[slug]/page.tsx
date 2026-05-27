import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader, SiteFooter } from "../../../components/site";
import { getProducts, getCollections } from "../../../lib/products";
import { ProductCard } from "../../../components/productcard";

export async function generateStaticParams() {
  const cols = await getCollections();
  return cols.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cols = await getCollections();
  const c = cols.find((x) => x.slug === slug);
  if (!c) return { title: "Kategori" };
  return {
    title: c.name,
    description: `Handla ${c.name} hos Fyndplats – kvalitetsprodukter till låga priser. Fri frakt över 499 kr.`,
    alternates: { canonical: `https://www.fyndplats.se/kategori/${c.slug}` },
  };
}

export default async function Kategori({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  const active = collections.find((c) => c.slug === slug);
  if (!active) notFound();
  const list = products.filter((p) => p.collectionIds?.includes(active.id));

  return (
    <>
      <SiteHeader />
      <section className="sec">
        <div className="container">
          <div className="sechead">
            <div className="eyebrow">Kategori</div>
            <h2>{active.name}</h2>
            <p>{list.length} {list.length === 1 ? "produkt" : "produkter"}</p>
          </div>

          <div className="catbar">
            <a className="chip" href="/butik">Alla</a>
            {collections.map((c) => (
              <a key={c.id} className={`chip ${active.id === c.id ? "active" : ""}`} href={`/kategori/${c.slug}`}>{c.name}</a>
            ))}
          </div>

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
