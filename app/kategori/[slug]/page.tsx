import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProducts, getCollections, forListings, dedupeProducts } from "../../../lib/products";
import { CategoryDropdown } from "../../../components/categorydropdown";
import { ShopBrowser } from "../../../components/shopbrowser";
import { pageMeta } from "../../../lib/seo";
import { MOSAIC_DENYLIST, categoryHero } from "../../../lib/category-groups";
import { getBlurDataURL } from "../../../lib/lqip";
import { categoryProgrammaticLinks } from "../../../lib/seo/programmatic";
import { ProgCrossLinks } from "../../../components/programmatic";

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
  const [allProducts, collections] = await Promise.all([getProducts(), getCollections()]);
  const products = forListings(allProducts); // dölj ev. slutsålda från listan (opt-in)
  const active = collections.find((c) => c.slug === slug);
  if (!active) notFound();
  // Huvudkategori: visa produkter i kategorin OCH alla dess underkategorier, så
  // avdelningssidan blir komplett. Subkategori: bara sina egna produkter.
  const childIds = collections.filter((c) => c.parentId === active.id).map((c) => c.id);
  const catIds = new Set([active.id, ...childIds]);
  const catList = products.filter((p) => (p.collectionIds || []).some((cid) => catIds.has(cid)));
  // Första raden: de 3 högst bild-poängsatta produkterna (lib/image-scores) först
  // — bästa bilderna möter besökaren. Resten behåller katalogordningen.
  const topThree = [...catList].sort((a, b) => b.imageScore - a.imageScore).slice(0, 3);
  const topIds = new Set(topThree.map((p) => p.id));
  // dedupeProducts: defensivt skydd så två kort aldrig visar samma produkt/bild
  // bredvid varandra (Leonards "samma bild två gånger i rad" i Mobiltillbehör).
  const list = dedupeProducts([...topThree, ...catList.filter((p) => !topIds.has(p.id))]);
  // Förälder (om detta är en subkategori) → för brödsmulor.
  const parent = active.parentId ? collections.find((c) => c.id === active.parentId) : undefined;
  // Programmatiska SEO-länkar för kategorin (pris-tiers + bäst-i-test) — bara
  // giltiga sidor, så aldrig en länk till 404.
  const progLinks = await categoryProgrammaticLinks(active.slug);

  // Hero-bild: curated Unsplash-lifestyle per huvudkategori (categoryHero), annars
  // den högst bild-poängsatta non-denylisted produktbilden i kategorin.
  const curatedHero = categoryHero(active.name);
  const heroImg =
    curatedHero ||
    [...catList]
      .filter((p) => p.img && !MOSAIC_DENYLIST.has(p.slug))
      .sort((a, b) => b.imageScore - a.imageScore)[0]?.img ||
    catList.find((p) => p.img)?.img ||
    "";
  // Föll vi tillbaka på en produktbild (subkategori)? Då renderas heron i en
  // 4:3-ram med object-fit:cover (is-product) så den kvadratiska produktbilden
  // centreras balanserat — varken inzoomad eller hopkrympt med bakgrund runtom.
  // Curated Unsplash-heron (huvudkategori) behåller sin breda cover-ram.
  const heroIsProduct = !curatedHero && !!heroImg;
  const heroBlur = heroImg ? await getBlurDataURL(heroImg) : "";

  const crumbItems = [
    { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
    { "@type": "ListItem", position: 2, name: "Butik", item: "https://www.fyndplats.se/butik" },
    ...(parent ? [{ "@type": "ListItem", position: 3, name: parent.name, item: `https://www.fyndplats.se/kategori/${parent.slug}` }] : []),
    { "@type": "ListItem", position: parent ? 4 : 3, name: active.name, item: `https://www.fyndplats.se/kategori/${active.slug}` },
  ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbItems,
  };
  // CollectionPage + ItemList för kategorin (samma mönster som /butik och
  // /alla-produkter) så Google förstår sidan som en produktlistning, inte bara
  // en brödsmulekedja. ItemList:en kapas till 50 för att hålla payloaden rimlig.
  const collectionPageLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: active.name,
    url: `https://www.fyndplats.se/kategori/${active.slug}`,
    description: `Handla ${active.name} hos Fyndplats – noga utvalda fynd till smarta priser.`,
    isPartOf: { "@type": "WebSite", name: "Fyndplats", url: "https://www.fyndplats.se/" },
    numberOfItems: list.length,
    mainEntity: {
      "@type": "ItemList",
      // numberOfItems måste matcha antalet faktiskt uppräknade itemListElement
      // (vi kapar till 50), annars är ItemList:en internt inkonsistent och Google
      // kan ignorera den. CollectionPage-nivåns numberOfItems ovan = hela katalogen.
      numberOfItems: Math.min(list.length, 50),
      itemListElement: list.slice(0, 50).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://www.fyndplats.se/produkt/${p.slug}`,
        name: p.name,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageLd) }} />

      <section className="kat-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Brödsmulor">
            <a href="/">Hem</a> <span>/</span> <a href="/butik">Butik</a> <span>/</span>
            {parent && (<><a href={`/kategori/${parent.slug}`}>{parent.name}</a> <span>/</span> </>)}
            <em>{active.name}</em>
          </nav>
          <div className="kat-hero-grid">
            <div className="kat-hero-text">
              <div className="eyebrow">Kategori</div>
              <h1>{active.name}</h1>
              <p>{list.length} {list.length === 1 ? "produkt" : "produkter"} – noga utvalda fynd inom {active.name.toLowerCase()}.</p>
            </div>
            {heroImg && (
              <div className={`kat-hero-img${heroIsProduct ? " is-product" : ""}`}>
                <Image
                  src={heroImg}
                  alt={active.name}
                  fill
                  preload
                  fetchPriority="high"
                  placeholder="blur"
                  blurDataURL={heroBlur}
                  sizes="(max-width:760px) 100vw, 480px"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 36 }}>
        <div className="container">
          <CategoryDropdown products={products} collections={collections} activeSlug={active.slug} />

          {/* ShopBrowser ger sortering (Rekommenderat/pris/namn), prisfilter,
              lager-/rea-toggles, paginering och delbart filter-tillstånd i URL:en
              — samma verktyg som /alla-produkter. (Audit 2026-06-02 #7) */}
          <ShopBrowser products={list} />
        </div>
      </section>

      {progLinks.length > 0 && (
        <ProgCrossLinks title={`Fler sätt att handla ${active.name}`} links={progLinks} />
      )}
    </>
  );
}
