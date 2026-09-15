import type { Metadata } from "next";
import { getProducts, forListings } from "../../lib/products";
import { forListClient } from "../../lib/list-payload";
import { currentDayMs, orderRecommended } from "../../lib/sort-products";
import { universalCollectionIds } from "../../lib/related-pick";
import { jsonLdString, pageMeta } from "../../lib/seo";
import { ShopBrowser } from "../../components/shopbrowser";
import { ProductIndex } from "../../components/product-index";
import { attachRatings } from "../../lib/review-aggregates";
import { productCountLabel } from "../../lib/rating";
import { REA_TITLE, REA_H1, REA_INTRO, REA_META_DESC, reaLede, saleProducts } from "../../lib/rea";

// ISR 1 h — samma takt som /alla-produkter, /kategori och sitemapen. Rean byts
// inte oftare än katalogen i övrigt, och sidan får inte vara dynamisk: den
// skulle då förlora CDN-cachen precis som ?kategori= en gång gjorde på
// /alla-produkter (se noten där).
export const revalidate = 3600;

// Antalet måste hämtas för att avgöra robots-taggen, därför async metadata.
// Samma mönster som /blogg: en tom sida ska inte be Google indexera sig.
export async function generateMetadata(): Promise<Metadata> {
  const rea = saleProducts(forListings(await getProducts()));
  const meta = pageMeta(REA_TITLE, REA_META_DESC, "/rea", "rea-2026");
  if (rea.length === 0) meta.robots = { index: false, follow: true };
  return meta;
}

export default async function Rea() {
  const all = forListings(await getProducts());
  const rea = saleProducts(all);

  // attachRatings FÖRE orderRecommended — recommendedScore läser p.rating, och
  // körs den på en olik lista blir ordningen en annan vid hydrering. Samma
  // ordningskrav som /alla-produkter dokumenterar utförligt.
  const dagMs = currentDayMs();
  const rated = await attachRatings(rea);
  const list = orderRecommended(rated, universalCollectionIds(rated), dagMs);

  const pageUrl = "https://www.fyndplats.se/rea";
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
      { "@type": "ListItem", position: 2, name: "Butik", item: "https://www.fyndplats.se/butik" },
      { "@type": "ListItem", position: 3, name: "Rea", item: pageUrl },
    ],
  };
  const collectionPageLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: REA_H1,
    url: pageUrl,
    description: REA_META_DESC,
    isPartOf: { "@type": "WebSite", name: "Fyndplats", url: "https://www.fyndplats.se/" },
    numberOfItems: list.length,
  };

  return (
    <div className="alla-prod">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(collectionPageLd) }} />

      <section className="butik-hero alla-prod-hero">
        <div className="container">
          <nav className="butik-crumbs" aria-label="Brödsmulor">
            <a href="/">Hem</a>
            <span aria-hidden="true">/</span>
            <a href="/butik">Butik</a>
            <span aria-hidden="true">/</span>
            <em>Rea</em>
          </nav>
          <div className="butik-hero-inner">
            <span className="butik-hero-eyebrow">Nedsatta priser</span>
            <h1 className="butik-hero-title">{REA_H1}</h1>
            <p className="butik-hero-lede">
              {reaLede(list.length)}
              {list.length > 0 && (
                <span className="butik-hero-meta"> {productCountLabel(list.length)} · Fri frakt över 499 kr · 30 dagars öppet köp</span>
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="alla-prod-body">
        <div className="container">
          {list.length > 0 ? (
            <>
              {/* Unik brödtext — sidan är permanent medan innehållet roterar, och
                  utan egen text är den bara ett filtrerat rutnät i Googles ögon.
                  prog-intro är köpguidernas befintliga stil; ingen ny CSS behövs. */}
              <div className="prog-intro">
                {REA_INTRO.map((stycke) => (
                  <p key={stycke.slice(0, 24)}>{stycke}</p>
                ))}
              </div>

              {/* forClient skär bort fälten klienten aldrig läser (se ListProduct
                  i lib/products.ts) — samma besparing som på /alla-produkter. */}
              <ShopBrowser products={forListClient(list, dagMs)} dayMs={dagMs} />

              {/* Rutnätet visar 24 åt gången bakom en JS-knapp. Utan den här
                  listan saknar resten av reavarorna interna ankarlänkar helt —
                  och att Google FAKTISKT når reavarorna är hela poängen med
                  sidan. */}
              <ProductIndex products={list} title="Alla reavaror A–Ö" />
            </>
          ) : (
            <div className="prog-intro">
              <p>
                Just nu har vi inga nedsatta varor. Kika in igen om några dagar — eller
                bläddra i <a href="/alla-produkter">hela sortimentet</a> under tiden.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
