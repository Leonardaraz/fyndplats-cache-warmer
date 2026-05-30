import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "../../../components/productview";
import { ProductCard } from "../../../components/productcard";
import { getProduct, getProductSlugs, getProducts, getCollections } from "../../../lib/products";

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Produkten hittades inte" };
  return {
    title: p.name,
    description: p.blurb || `${p.name} – köp hos Fyndplats. Fri frakt över 499 kr.`,
    alternates: { canonical: `https://www.fyndplats.se/produkt/${p.slug}` },
    openGraph: { title: p.name, description: p.blurb, images: p.img ? [p.img] : [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const cols = await getCollections();
  const primaryCol = cols.find((c) => (p.collectionIds || []).includes(c.id));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.id,
    image: p.gallery.length ? p.gallery : [p.img],
    description: p.blurb,
    brand: { "@type": "Brand", name: "Fyndplats" },
    offers: {
      "@type": "Offer",
      priceCurrency: p.currency,
      price: p.priceNum,
      availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url: `https://www.fyndplats.se/produkt/${p.slug}`,
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "SE",
        returnPolicyCountry: "SE",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 30,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnShippingFees",
      },
    },
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "20" },
  };

  const breadcrumbItems: { "@type": "ListItem"; position: number; name: string; item: string }[] = [
    { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
  ];
  if (primaryCol) {
    breadcrumbItems.push({ "@type": "ListItem", position: 2, name: primaryCol.name, item: `https://www.fyndplats.se/kategori/${primaryCol.slug}` });
    breadcrumbItems.push({ "@type": "ListItem", position: 3, name: p.name, item: `https://www.fyndplats.se/produkt/${p.slug}` });
  } else {
    breadcrumbItems.push({ "@type": "ListItem", position: 2, name: p.name, item: `https://www.fyndplats.se/produkt/${p.slug}` });
  }
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  const specLines = p.specs ? p.specs.split(/(?=[A-ZÅÄÖ][a-zåäö]+:)/).map((s) => s.trim()).filter(Boolean) : [];
  const images = Array.from(new Set([p.img, ...p.gallery].filter(Boolean)));

  // "Liknande produkter" – ranked by how many collections they share with this product
  // (most relevant first). No random global filler — only genuinely related products.
  const all = await getProducts();
  const related = all
    .filter((x) => x.slug !== p.slug)
    .map((x) => ({ x, shared: (x.collectionIds || []).filter((c) => (p.collectionIds || []).includes(c)).length }))
    .filter((s) => s.shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, 4)
    .map((s) => s.x);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="container">
        <nav className="crumbs"><a href="/">Hem</a> <span>/</span> <a href="/butik">Butik</a> <span>/</span> <em>{p.name}</em></nav>

        <ProductView
          productId={p.id}
          name={p.name}
          price={p.price}
          priceNum={p.priceNum}
          inStock={p.inStock}
          stockQuantity={p.stockQuantity}
          blurb={p.blurb}
          descriptionHtml={p.descriptionHtml}
          originalPrice={p.originalPrice}
          onSale={p.onSale}
          specLines={specLines}
          images={images}
          variants={p.variants}
          options={p.options}
          category={primaryCol?.name}
        />
      </div>

      {related.length >= 2 && (
        <section className="sec relsec">
          <div className="container">
            <div className="sechead"><div className="eyebrow">Upptäck mer</div><h2>Liknande produkter</h2></div>
            <div className="prodgrid">
              {related.map((rp) => <ProductCard p={rp} key={rp.slug} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
