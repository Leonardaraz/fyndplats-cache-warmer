import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProducts, getCollections } from "../../../lib/products";
import { ProductCard } from "../../../components/productcard";
import { CatNav } from "../../../components/catnav";
import { pageMeta } from "../../../lib/seo";
import { MOSAIC_DENYLIST } from "../../../lib/category-groups";

export async function generateStaticParams() {
  const cols = await getCollections();
  return cols.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [cols, products] = await Promise.all([getCollections(), getProducts()]);
  const c = cols.find((x) => x.slug === slug);
  if (!c) return { title: "Kategori" };
  const base = pageMeta(
    c.name,
    `Handla ${c.name} hos Fyndplats – noga utvalda fynd till smarta priser. Fri frakt över 499 kr.`,
    `/kategori/${c.slug}`
  );
  // Per-kategori Open Graph-bild: första produktens bild i kategorin
  const firstImg = products.find((p) => (p.collectionIds || []).includes(c.id))?.img;
  if (firstImg) {
    return { ...base, openGraph: { ...(base.openGraph as object), images: [firstImg] } };
  }
  return base;
}

export default async function Kategori({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  const active = collections.find((c) => c.slug === slug);
  if (!active) notFound();
  const list = products.filter((p) => p.collectionIds?.includes(active.id));

  // Hero-bild: första non-denylisted produktbild i kategorin (clean, ingen text-overlay)
  const heroImg =
    list.find((p) => p.img && !MOSAIC_DENYLIST.has(p.slug))?.img ||
    list.find((p) => p.img)?.img ||
    "";

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

      <section className="kat-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Brödsmulor">
            <a href="/">Hem</a> <span>/</span> <a href="/butik">Butik</a> <span>/</span> <em>{active.name}</em>
          </nav>
          <div className="kat-hero-grid">
            <div className="kat-hero-text">
              <div className="eyebrow">Kategori</div>
              <h1>{active.name}</h1>
              <p>{list.length} {list.length === 1 ? "produkt" : "produkter"} – noga utvalda fynd inom {active.name.toLowerCase()}.</p>
            </div>
            {heroImg && (
              <div className="kat-hero-img">
                <Image
                  src={heroImg}
                  alt=""
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(max-width:760px) 100vw, 480px"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 36 }}>
        <div className="container">
          <CatNav products={products} collections={collections} activeSlug={active.slug} />

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
