import type { Metadata } from "next";
import { jsonLdString } from "../../../lib/seo";
import { faqPageJsonLd } from "../../../lib/faq-jsonld";
import { notFound, permanentRedirect } from "next/navigation";
import { getProductRedirect } from "../../../lib/redirects";
import { ProductView } from "../../../components/productview";
import { ProductCard } from "../../../components/productcard";
import { attachRatings } from "../../../lib/review-aggregates";
import { getProduct, getProducts, getCollections, type Product } from "../../../lib/products";
import { curatedRelatedSlugs, pickRelated } from "../../../lib/related-products";
import { produktGrannar } from "../../../lib/product-neighbours";
import { ProductBrowse } from "../../../components/product-browse";
import { getBlurDataURL } from "../../../lib/lqip";
import { getProductReviews } from "../../../lib/reviews";
import { reviewSchemaMode, shouldEmitReviewSchema } from "../../../lib/review-schema";
import { ProductReviews } from "../../../components/ProductReviews";
import { PdpReviewsSection } from "../../../components/pdp-reviews-section";
import { ProgCrossLinks } from "../../../components/programmatic";
import { blogLinksForPage } from "../../../lib/seo/programmatic";
import { NAV_EXCLUDED } from "../../../lib/category-groups";
import { DELIVERY_MIN_DAYS, DELIVERY_MAX_DAYS } from "../../../lib/shipping";

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
  // Fallback-blurben är rått avhuggen vid 220 tecken (lib/products.ts) — för
  // meta-description trunkerar vi på ORDgräns ≤155 så SERP-snippeten inte kapar
  // mitt i ett ord. Kuraterad seoDescription används alltid orörd.
  const trimDesc = (s: string) => (s.length <= 155 ? s : s.slice(0, 155).replace(/\s+\S*$/, ""));
  const desc = p.seoDescription || (p.blurb ? trimDesc(p.blurb) : `${p.name} – köp hos Fyndplats. Fri frakt över 499 kr.`);
  return {
    title: p.seoTitle ? { absolute: p.seoTitle } : p.name,
    description: desc,
    alternates: { canonical: `https://www.fyndplats.se/produkt/${p.slug}` },
    // type/locale/siteName måste sättas här: Next ERSÄTTER layoutens openGraph
    // per fält-grupp (ärver inte), så utan dem tappar PDP og:type/locale/site_name.
    openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", title: p.seoTitle || p.name, description: desc, url: `https://www.fyndplats.se/produkt/${p.slug}`, images: p.img ? [p.img] : [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) {
    // Permanent borttagen produkt? Slå upp redirect-tabellen (Wix CMS) och
    // svara 308 till närmaste levande produkt/kategori i stället för 404 —
    // bevarar länkvärde och räddar besökare från gamla länkar/annonser.
    const target = await getProductRedirect(slug);
    if (target) permanentRedirect(target);
    notFound();
  }

  const cols = await getCollections();
  // Brödsmulans/JSON-LD:ns kategori: produktens HUVUDavdelning (parentId null) om
  // den finns, annars en underkategori — men ALDRIG promo-/rotkollektioner
  // (All Products, REA, Populära). Används för synlig brödsmula, breadcrumb-JSON-LD
  // OCH GA4-kategori, så alla tre är konsekventa. Faller tillbaka på "Butik" (visuellt)
  // / utelämnas (JSON-LD) om produkten saknar en riktig kategori.
  const ownCats = (p.collectionIds || [])
    .map((id) => cols.find((c) => c.id === id))
    .filter((c): c is (typeof cols)[number] => c !== undefined && !NAV_EXCLUDED.has(c.name));
  const primaryCol = ownCats.find((c) => c.parentId === null) || ownCats[0];

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
    // Inkludera huvudbilden FÖRST + galleriet (galleriet utesluter numera hjälte-
    // fil-id:t, så Google får primärbilden här i stället för att den faller bort).
    image: Array.from(new Set([p.img, ...p.gallery].filter(Boolean))),
    // Samma preferens som meta-descriptionen ovan: kuraterad Wix-SEO när den
    // finns, annars blurb — så strukturerad data och snippet matchar.
    description: p.seoDescription || p.blurb,
    brand: { "@type": "Brand", name: "Fyndplats" },
    offers: {
      "@type": "Offer",
      priceCurrency: p.currency,
      price: p.priceNum,
      // Merchant-listing-rekommenderade fält (Search Console varnar annars).
      // priceValidUntil rullar 30 dagar framåt vid varje ISR-regenerering.
      priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url: `https://www.fyndplats.se/produkt/${p.slug}`,
      // Fraktvillkoren speglar kassan exakt: fri frakt ≥ 499 kr, annars 19 kr,
      // leverans 3–7 arbetsdagar (samma sanningskälla som resten av sajten).
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: p.priceNum >= 499 ? 0 : 19,
          currency: p.currency,
        },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "SE" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: DELIVERY_MIN_DAYS,
            maxValue: DELIVERY_MAX_DAYS,
            unitCode: "DAY",
          },
        },
      },
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

  // AggregateRating + Review markup BARA när vi har riktiga recensioner OCH
  // switchen är på. Google straffar fejkade/hårdkodade betyg (review snippet
  // spam) — tidigare låg här ett statiskt 4.9/20.
  //
  // Switchen tillkom 2026-08-16: recensionerna är AliExpress-köpares omdömen om
  // samma produkt, inte våra egna kunders. Texten visas för kunden, men vi
  // lämnar inget maskinläsbart betygspåstående till Google förrän datan är
  // förstahands (Trustpilot Product Reviews / egna kundrecensioner).
  // Se lib/review-schema.ts.
  const reviewAverage = reviewData.average;
  if (
    reviewAverage != null
    // FÖRSTAHANDS-siffrorna, inte de synliga. De importerade omdömena får
    // visas för kunden men aldrig utge sig för att vara vårt betyg i Googles
    // ögon — det var hela poängen med att bygga egna omdömen.
    && shouldEmitReviewSchema(
      reviewSchemaMode(process.env.PRODUCT_REVIEW_SCHEMA),
      reviewData.firstPartyCount,
      reviewData.firstPartyAverage,
    )
  ) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: (reviewData.firstPartyAverage ?? 0).toFixed(1),
      reviewCount: String(reviewData.firstPartyCount),
      bestRating: "5",
      worstRating: "1",
    };
    // Upp till 10 enskilda Review-objekt för rich snippets — BARA egna kunders.
    // Ett importerat omdöme i listan hade gjort hela markeringen osann även om
    // snittet ovan var rätt räknat.
    jsonLd.review = reviewData.reviews.filter((r) => r.firstParty).slice(0, 10).map((r) => ({
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
    // Matcha den SYNLIGA brödsmulan (Hem → Butik → produkt) — schemat hoppade
    // tidigare över Butik-steget för okategoriserade produkter.
    breadcrumbItems.push({ "@type": "ListItem", position: 2, name: "Butik", item: "https://www.fyndplats.se/butik" });
    breadcrumbItems.push({ "@type": "ListItem", position: 3, name: p.name, item: `https://www.fyndplats.se/produkt/${p.slug}` });
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

  // "Liknande produkter" – kuraterade LLM-val (data/related-products.json,
  // scripts/score-related.mjs: Opus 4.8 butiks-merchandiser — komplement +
  // prispassning) med meningsfullt kategori-överlapp som fallback/påfyllning.
  // All logik (universell-kategori-exkludering, i-lager, dedup, aldrig tomt) i den
  // testade rena pickRelated(). Se lib/related-products.test.ts.
  const all = await getProducts();
  const related: Product[] = await attachRatings(pickRelated(p, all, curatedRelatedSlugs(p.slug), 4));

  // Föregående/nästa i avdelningen, så man slipper backa till kategorisidan för
  // varje produkt. Samma id-mängd som kategorisidan bygger sin lista av:
  // avdelningen + dess underkategorier. Saknar produkten huvudavdelning blir
  // mängden tom, grannarna null och raden renderas inte alls.
  const bladdringIds = primaryCol
    ? new Set([primaryCol.id, ...cols.filter((c) => c.parentId === primaryCol.id).map((c) => c.id)])
    : new Set<string>();
  const grannar = produktGrannar(all, bladdringIds, p.slug);

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
  // Blogg-länkar för produkten. ÖMSESIDIGA först: en guide som länkar till den
  // här produktsidan visas här, oavsett om produktnamnet råkar finnas i guidens
  // rubrik eller meta-beskrivning (vinterförvarings-guiden ägnar ett avsnitt åt
  // dieselvärmaren men nämner den ingenstans i rubriken — produktsidan länkade
  // därför tillbaka till fel guide). Kategori + första ordet i namnet är kvar
  // som påfyllning; äkta-träff-filtrerat, tom lista → inget block.
  const blogLinks = await blogLinksForPage(
    `/produkt/${p.slug}`,
    [primaryCol?.name || "", p.name.split(/\s+/)[0] || ""].filter(Boolean),
  );

  // FAQPage-schema ur beskrivningens "Vanliga frågor"-sektion (modulen kommer
  // från motorn där generatorn bor — se docs/faq-jsonld-handover.md i det
  // repot; verifierad mot alla 510 produkter). null när sektionen saknas →
  // ingen script-tagg alls (tom FAQPage flaggas av Google som strukturfel).
  const faqLd = faqPageJsonLd(p.descriptionHtml || "");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqLd) }} />}

      <div className="container">
        <nav className="crumbs">
          <a href="/">Hem</a> <span>/</span>{" "}
          {primaryCol ? (
            <><a href={`/kategori/${primaryCol.slug}`}>{primaryCol.name}</a> <span>/</span> </>
          ) : (
            <><a href="/butik">Butik</a> <span>/</span> </>
          )}
          <em>{p.name}</em>
        </nav>

        <ProductBrowse grannar={grannar} kategoriNamn={primaryCol?.name} />

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
          imageOwners={p.imageOwners}
          imageAlts={p.imageAlts}
          category={primaryCol?.name}
          // Med Trustpilot påslaget renderas våra egna omdömen inte alls
          // (se villkoret nedan) — då får betyget inte stå kvar i huvudet
          // och länka till en sektion som inte finns.
          reviewCount={trustpilotBU ? 0 : reviewData.count}
          reviewAverage={trustpilotBU ? null : reviewData.average}
        />
      </div>

      {trustpilotBU ? (
        // Självdöljande: rubrik + tom TrustBox blev annars en död vit yta på
        // produkter utan Trustpilot-recensioner (visuell rond 2026-07-02).
        <PdpReviewsSection businessUnitId={trustpilotBU} sku={p.id} />
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
        <ProgCrossLinks title="Utforska fler avdelningar" links={deptLinks} blogLinks={blogLinks} />
      )}
    </>
  );
}
