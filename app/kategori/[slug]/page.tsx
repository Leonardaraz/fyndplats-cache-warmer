import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProducts, getCollections } from "../../../lib/products";
import { ProductCard } from "../../../components/productcard";
import { pageMeta } from "../../../lib/seo";

export async function generateStaticParams() {
  const cols = await getCollections();
  return cols.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cols = await getCollections();
  const c = cols.find((x) => x.slug === slug);
  if (!c) return { title: "Kategori" };
  return pageMeta(
    c.name,
    `Handla ${c.name} hos Fyndplats – kvalitetsprodukter till låga priser. Fri frakt över 499 kr.`,
    `/kategori/${c.slug}`
  );
}

export default async function Kategori({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  const active = collections.find((c) => c.slug === slug);
  if (!active) notFound();
  const list = products.filter((p) => p.collectionIds?.includes(active.id));

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
      { "@type": "ListItem", position: 2, name: "Butik", item: "https://www.fyndplats.se/butik" },
      { "@type": "ListItem", position: 3, name: active.name, item: `https://www.fyndplats.se/kategori/${active.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <section className="sec">
        <div className="container">
          <nav className="crumbs"><a href="/">Hem</a> <span>/</span> <a href="/butik">Butik</a> <span>/</span> <em>{active.name}</em></nav>
          <div className="sechead">
            <div className="eyebrow">Kategori</div>
            <h1>{active.name}</h1>
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
    </>
  );
}
