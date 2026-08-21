import { getProducts, getCollections, forListings } from "../../lib/products";
import { currentDayMs, orderRecommended } from "../../lib/sort-products";
import { universalCollectionIds } from "../../lib/related-pick";
import { jsonLdString } from "../../lib/seo";
import { ShopBrowser } from "../../components/shopbrowser";
import { attachRatings } from "../../lib/review-aggregates";
import { CategoryDropdown } from "../../components/categorydropdown";
import { ProductIndex } from "../../components/product-index";
import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta(
  "Alla produkter – hela sortimentet",
  "Bläddra hela Fyndplats-sortimentet. Filtrera på pris, rea och kategori. Fri frakt över 499 kr, trygga betalningar med Klarna.",
  "/alla-produkter",
  "512c0f177326223c"
);

export default async function AllaProdukter({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  const { kategori } = await searchParams;
  const [allProducts, collections] = await Promise.all([getProducts(), getCollections()]);
  const products = forListings(allProducts); // dölj ev. slutsålda från listan (opt-in)
  const active = collections.find((c) => c.slug === kategori);
  // Rekommenderat är sidans standardordning (Leonard 2026-08-21) — samma som
  // ShopBrowsers defaultSort "img", och samma som kategorisidorna redan hade.
  // Ersätter Nyast, som sorterade på importdatum: hela katalogen är importerad
  // juni–augusti 2026, så "nyast" särskilde knappt något.
  //
  // Ordningen förberäknas här, med EXAKT samma indata som klientens useMemo
  // räknar om den med, annars kastas rutnätet om inför ögonen vid hydrering.
  // attachRatings MÅSTE därför köra FÖRE orderRecommended: recommendedScore
  // läser p.rating, och gör den det på en olik lista blir ordningen en annan.
  const rated = await attachRatings(
    active ? products.filter((p) => p.collectionIds?.includes(active.id)) : products,
  );
  const list = orderRecommended(rated, universalCollectionIds(rated), currentDayMs());

  // Underkategorier till den valda kategorin → samma chips som på /kategori.
  // Utan vald kategori finns inget att förfina; kategori-dropdownen ovanför
  // sköter den nivån.
  const subs = active
    ? collections
        .filter((c) => c.parentId === active.id)
        .sort((a, b) => a.index - b.index)
        .map((c) => ({
          name: c.name,
          slug: c.slug,
          count: products.filter((p) => (p.collectionIds || []).includes(c.id)).length,
        }))
        .filter((sub) => sub.count > 0)
    : [];

  // JSON-LD: CollectionPage + BreadcrumbList (samma mönster som /butik) så Google
  // förstår att detta är en produktlistning. När ?kategori= är aktiv beskriver
  // sidan EN kategori (H1 + lista byts) — då måste schemat följa med, annars
  // motsäger strukturerad data den synliga sidan (fel namn/antal/url).
  const pageName = active ? active.name : "Alla produkter – hela sortimentet";
  const pageUrl = active
    ? `https://www.fyndplats.se/alla-produkter?kategori=${active.slug}`
    : "https://www.fyndplats.se/alla-produkter";
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
      { "@type": "ListItem", position: 2, name: "Butik", item: "https://www.fyndplats.se/butik" },
      { "@type": "ListItem", position: 3, name: active ? active.name : "Alla produkter", item: pageUrl },
    ],
  };
  const collectionPageLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageName,
    url: pageUrl,
    description: active
      ? `Handla ${active.name} hos Fyndplats – noga utvalda fynd till smarta priser.`
      : "Bläddra hela Fyndplats-sortimentet. Filtrera på pris, rea och kategori.",
    isPartOf: { "@type": "WebSite", name: "Fyndplats", url: "https://www.fyndplats.se/" },
    numberOfItems: list.length,
  };

  return (
    <div className="alla-prod">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(collectionPageLd) }} />
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
                : `${products.length} noga utvalda fynd inom hem, elektronik, kök och mer – varje produkt handplockad för svenska hem.`}
              <span className="butik-hero-meta"> {products.length} produkter · {collections.length} kategorier · Fri frakt över 499 kr</span>
            </p>
          </div>
        </div>
      </section>

      <section className="alla-prod-body">
        <div className="container">
          <CategoryDropdown products={products} collections={collections} activeSlug={active?.slug} />

          <ShopBrowser products={list} subs={subs} />

          {/* Crawlbart A–Ö-index över HELA sortimentet: gridden ovan visar 24
              (perf-gräns) och "Visa fler" är en JS-knapp — utan denna lista
              saknade ~330 produkter interna ankarlänkar helt. Alltid hela
              sortimentet (även vid ?kategori=): sidans canonical är
              /alla-produkter, så hubben ska bära alla länkar. */}
          <ProductIndex products={products} />
        </div>
      </section>
    </div>
  );
}
