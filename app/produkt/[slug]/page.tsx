import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteHeader, SiteFooter } from "../../../components/site";
import { BuyBox } from "../../../components/cart";
import { getProduct, getProductSlugs } from "../../../lib/products";

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
      url: `https://www.fyndplats.se/produkt/${p.slug}`,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
      { "@type": "ListItem", position: 2, name: "Butik", item: "https://www.fyndplats.se/butik" },
      { "@type": "ListItem", position: 3, name: p.name, item: `https://www.fyndplats.se/produkt/${p.slug}` },
    ],
  };

  const specLines = p.specs ? p.specs.split(/(?=[A-ZÅÄÖ][a-zåäö]+:)/).map((s) => s.trim()).filter(Boolean) : [];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <SiteHeader />

      <div className="container">
        <nav className="crumbs"><a href="/">Hem</a> <span>/</span> <a href="/butik">Butik</a> <span>/</span> <em>{p.name}</em></nav>

        <div className="pdp">
          <div className="gallery">
            <div className="gmain"><Image src={p.img} alt={p.name} width={800} height={800} priority sizes="(max-width:760px) 100vw, 45vw" style={{ width: "100%", height: "auto" }} /></div>
            {p.gallery.length > 1 && (
              <div className="gthumbs">
                {p.gallery.slice(0, 5).map((g, i) => (
                  <div className="gthumb" key={i}><Image src={g} alt="" fill sizes="72px" style={{ objectFit: "cover" }} /></div>
                ))}
              </div>
            )}
          </div>

          <div className="pinfo">
            <div className="eyebrow" style={{ marginBottom: 10 }}>Fyndplats</div>
            <h1>{p.name}</h1>
            <div className="pdp-price">{p.price}</div>
            <div className={`stock ${p.inStock ? "in" : "out"}`}>{p.inStock ? "✓ I lager – skickas inom 1–2 dagar" : "Tillfälligt slut"}</div>
            <p className="pdp-blurb">{p.blurb}</p>
            <BuyBox id={p.id} variants={p.variants} />
            <div className="pdp-trust">
              <span>🚚 Fri frakt över 499 kr</span>
              <span>↩ 14 dagars ångerrätt</span>
              <span>🔒 Trygg betalning med Klarna</span>
            </div>
            {specLines.length > 0 && (
              <div className="specbox">
                <h3>Specifikationer</h3>
                <ul>{specLines.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
