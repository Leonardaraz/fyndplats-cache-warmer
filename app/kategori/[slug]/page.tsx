import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProducts, getCollections, forListings, dedupeProducts } from "../../../lib/products";
import { ProductCard } from "../../../components/productcard";
import { CategoryDropdown } from "../../../components/categorydropdown";
import { pageMeta } from "../../../lib/seo";
import { MOSAIC_DENYLIST, categoryHero } from "../../../lib/category-groups";
import { getBlurDataURL } from "../../../lib/lqip";

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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

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
                  alt=""
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
