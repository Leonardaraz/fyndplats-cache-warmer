import { getProducts, getCollections, sortByNewest, forListings } from "../../lib/products";
import { ShopBrowser } from "../../components/shopbrowser";
import { CategoryDropdown } from "../../components/categorydropdown";
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
  // Nyast först (Leonard 2026-06-14): senast importerade produkter överst, både i
  // hela sortimentet och inom en vald kategori. Ersätter den tidigare kategori-
  // mixen på den här sidan.
  const list = sortByNewest(active ? products.filter((p) => p.collectionIds?.includes(active.id)) : products);

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageLd) }} />
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

          <ShopBrowser products={list} defaultSort="new" />
        </div>
      </section>
    </div>
  );
}
