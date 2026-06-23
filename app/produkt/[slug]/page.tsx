import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "../../../components/productview";
import { ProductCard } from "../../../components/productcard";
import { getProduct, getProducts, getCollections } from "../../../lib/products";
import { getBlurDataURL } from "../../../lib/lqip";
import { getProductReviews } from "../../../lib/reviews";
import { ProductReviews } from "../../../components/ProductReviews";
import { TrustBox, TRUSTBOX_TEMPLATES } from "../../../components/trustpilot";
import { ProgCrossLinks } from "../../../components/programmatic";

// ISR: PDPs cachas på Vercel edge i 1h. Bakgrundsregenerering på stale (SWR) —
// besökaren får ALLTID en cachad sida direkt, regenereringen sker i bakgrunden.
// Lager/pris pushas omgående via revalidatePath i app/api/wix-webhook/route.ts
// vid order_created — så 1h är bara ett tak för ÖVRIGA (manuella) ändringar, inte
// en fördröjning vid köp. Höjt 300→3600 (2026-06): den gamla 5-min-ISR:en lät
// cache-warmern tvinga fram ~en ISR-write per produkt var 10:e minut (dyrt) utan
// reell färskhetsvinst, eftersom köp ändå revalidateras direkt av webhooken.
export const revalidate = 3600;
// dynamicParams=true: produkter utanför generateStaticParams (long-tail + nya
// efter deploy) renderas on-demand vid första träffen och cachas sen.
export const dynamicParams = true;

// Kostnadsoptimering: pre-bygg bara topp-N produktsidor vid build (Bestseller →
// högst bild-poäng). Resten renderas on-demand vid första träffen och cachas —
// kapar Build CPU rejält utan 404-risk (dynamicParams=true). SEO opåverkat:
// sitemap.xml listar fortfarande ALLA produkter.
const SSG_PREBUILD = 40;
export async function generateStaticParams() {
  const all = await getProducts();
  const ranked = [...all].sort((a, b) => {
    const ba = a.ribbon === "Bestseller" ? 1 : 0;
    const bb = b.ribbon === "Bestseller" ? 1 : 0;
    if (ba !== bb) return bb - ba;
    return (b.imageScore ?? 60) - (a.imageScore ?? 60);
  });
  return ranked.slice(0, SSG_PREBUILD).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Produkten hittades inte" };
  // Föredra merchantens kuraterade Wix-SEO (korta, Google-anpassade) när de finns;
  // annars dagens name/blurb. seoTitle innehåller redan "| Fyndplats", så vi sätter
  // den som `absolute` för att inte få templaten (%s | Fyndplats) att dubblera den.
  const desc = p.seoDescription || p.blurb || `${p.name} – köp hos Fyndplats. Fri frakt över 499 kr.`;
  return {
    title: p.seoTitle ? { absolute: p.seoTitle } : p.name,
    description: desc,
    alternates: { canonical: `https://www.fyndplats.se/produkt/${p.slug}` },
    openGraph: { title: p.seoTitle || p.name, description: desc, url: `https://www.fyndplats.se/produkt/${p.slug}`, images: p.img ? [p.img] : [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const cols = await getCollections();
  const primaryCol = cols.find((c) => (p.collectionIds || []).includes(c.id));

  // Riktiga importerade kundrecensioner (social proof + schema.org). Tom om inga.
  const reviewData = await getProductReviews(p.id);

  // Trustpilot Product Reviews-widget matchar recensioner mot produktens SKU
  // (= Wix-produkt-ID). När business unit-ID:t är ifyllt visar vi Trustpilot;
  // annars faller vi tillbaka på de egna importerade recensionerna nedan.
  const trustpilotBU = (process.env.TRUSTPILOT_BUSINESS_UNIT_ID || "").trim();

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.id,
    image: p.gallery.length ? p.gallery : [p.img],
    // Samma preferens som meta-descriptionen ovan: kuraterad Wix-SEO när den
    // finns, annars blurb — så strukturerad data och snippet matchar.
    description: p.seoDescription || p.blurb,
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
  };

  // AggregateRating + Review markup BARA när vi har riktiga recensioner. Google
  // straffar fejkade/hårdkodade betyg (review snippet spam) — tidigare låg här
  // ett statiskt 4.9/20 som nu ersätts av verklig data eller utelämnas helt.
  if (reviewData.count > 0 && reviewData.average != null) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviewData.average.toFixed(1),
      reviewCount: String(reviewData.count),
      bestRating: "5",
      worstRating: "1",
    };
    // Upp till 10 enskilda Review-objekt för rich snippets.
    jsonLd.review = reviewData.reviews.slice(0, 10).map((r) => ({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: String(r.rating), bestRating: "5", worstRating: "1" },
      author: { "@type": "Person", name: r.displayName },
      ...(r.date ? { datePublished: r.date.slice(0, 10) } : {}),
      reviewBody: r.text,
    }));
  }

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
  // Äkta low-res blur (16×16 webp från Wix-CDN) för galleriets HUVUDbild. Den
  // är LCP-elementet och optimerades tidigare med en generisk shimmer som såg
  // tom ut medan Vercel-bildoptimeraren kallstartade (1–3 s, Leonards rapport).
  // En riktig blur av produktbilden visar en igenkännbar förhandsbild direkt.
  const mainBlur = await getBlurDataURL(images[0] || "");

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

  // Korskategori-upptäckt: länka vidare till övriga HUVUDavdelningar (exkl. produktens
  // egen). Bara giltiga /kategori/{slug} → noll 404. Samma on-brand chips som kategorisidan.
  const ownTopCats = new Set(
    (p.collectionIds || [])
      .map((cid) => {
        const c = cols.find((x) => x.id === cid);
        return c ? (c.parentId ?? c.id) : null;
      })
      .filter((x): x is string => Boolean(x)),
  );
  const deptLinks = cols
    // REA har egen menylänk → exkludera ur strippen (Populära behålls).
    .filter((c) => c.parentId === null && !ownTopCats.has(c.id) && c.slug !== "rea")
    .sort((a, b) => a.index - b.index)
    .map((c) => ({ href: `/kategori/${c.slug}`, label: c.name }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="container">
        <nav className="crumbs"><a href="/">Hem</a> <span>/</span> <a href="/butik">Butik</a> <span>/</span> <em>{p.name}</em></nav>

        <ProductView
          key={p.id}
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
          mainBlur={mainBlur}
          variants={p.variants}
          options={p.options}
          variantAxes={p.variantAxes}
          variantTable={p.variantTable}
          category={primaryCol?.name}
        />
      </div>

      {trustpilotBU ? (
        <section className="sec revsec" id="recensioner">
          <div className="container">
            <div className="sechead">
              <div className="eyebrow">Vad kunderna säger</div>
              <h2>Kundrecensioner</h2>
            </div>
            <TrustBox
              businessUnitId={trustpilotBU}
              templateId={TRUSTBOX_TEMPLATES.productReviews}
              height="500px"
              sku={p.id}
              className="pdp-trustbox"
            />
          </div>
        </section>
      ) : (
        <ProductReviews
          reviews={reviewData.reviews}
          count={reviewData.count}
          average={reviewData.average}
        />
      )}

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

      {deptLinks.length > 0 && (
        <ProgCrossLinks title="Utforska fler avdelningar" links={deptLinks} />
      )}
    </>
  );
}
