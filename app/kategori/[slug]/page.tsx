import Image from "next/image";
import { jsonLdString } from "../../../lib/seo";
import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getProducts, getCollections, getAllCategorySlugs, forListings, dedupeProducts, forClient } from "../../../lib/products";
import { CategoryDropdown } from "../../../components/categorydropdown";
import { ShopBrowser } from "../../../components/shopbrowser";
import { attachRatings } from "../../../lib/review-aggregates";
import { ProductIndex } from "../../../components/product-index";
import { pageMeta } from "../../../lib/seo";
import { MOSAIC_DENYLIST, categoryHero } from "../../../lib/category-groups";
import { categoryContent } from "../../../lib/category-content";
import { categorySeo } from "../../../lib/category-seo";
import { getBlurDataURL } from "../../../lib/lqip";
import { categoryProgrammaticLinks, blogLinksForPage } from "../../../lib/seo/programmatic";
import { ProgCrossLinks } from "../../../components/programmatic";

// ISR: kategorisidorna förgenereras (generateStaticParams) men regenereras i
// bakgrunden var timme, så nya/ändrade produkter i en kategori syns utan en ny
// deploy. dynamicParams=true: en helt ny kategori (efter senaste deploy)
// renderas on-demand vid första träffen och cachas sen.
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const cols = await getCollections();
  return cols.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [cols, products] = await Promise.all([getCollections(), getProducts()]);
  const c = cols.find((x) => x.slug === slug);
  if (!c) return { title: "Kategori" };
  // Sökordsanpassad titel/beskrivning när kategorin har en (lib/category-seo):
  // kategorinamnet är Wix interna hyllskylt ("Friluftsliv & Resa") som ingen
  // googlar, medan titeln ska vara kundens sökord ("Campingutrustning …").
  // Namnet lever kvar oförändrat i meny, brödsmulor och <h1>. Saknas posten
  // faller sidan tillbaka på den gamla mallen → nya kategorier funkar direkt.
  const seo = categorySeo(c.slug);
  const base = pageMeta(
    seo?.title ?? c.name,
    seo?.description ??
      `Köp ${c.name} online hos Fyndplats – prisvärda, noga utvalda fynd till smarta priser. Fri frakt över 499 kr & 30 dagars öppet köp.`,
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
  // KÄND men just nu tom kategori (t.ex. tömd efter Kina-utfasningen) →
  // redirect till /butik (307, temporärt — SELF-REVIVE: får kategorin ≥1 synlig
  // produkt finns den i getCollections igen → sidan renderar normalt, utan
  // manuell åtgärd). OKÄND/skräp-slug → riktig 404: tidigare kunde
  // /kategori/<vadsomhelst> aldrig 404:a → oändligt "giltigt" URL-utrymme som
  // Google återcrawlar för evigt. Fail-open: kan fulla kategorilistan inte
  // hämtas (null) antar vi "känd" — hellre redirect än felaktig 404.
  if (!active) {
    const known = await getAllCategorySlugs();
    if (known && !known.has(slug)) notFound();
    redirect("/butik");
  }
  // Huvudkategori: visa produkter i kategorin OCH alla dess underkategorier, så
  // avdelningssidan blir komplett. Subkategori: bara sina egna produkter.
  const childIds = collections.filter((c) => c.parentId === active.id).map((c) => c.id);
  const catIds = new Set([active.id, ...childIds]);
  // Populära & REA är merchandising-sidor utan egna Wix-tilldelade produkter → auto-fyll
  // dem från produktflaggor: REA = rea-produkter (onSale), Populära = bästsäljare (ribbon).
  // Övriga kategorier: collectionIds-membership (kategori + underkategorier).
  const catList =
    slug === "rea"
      ? products.filter((p) => p.onSale)
      : slug === "populara"
        ? (() => {
            // Populära = bästsäljare (ribbon === "Bestseller"). Efter Kina-utfasningen
            // (2026-06) saknas Bestseller-taggade produkter — alla låg på Kina-lagret —
            // så vi faller tillbaka på de bäst presenterade produkterna (högst bild-
            // poäng) så sidan aldrig blir tom. Re-taggas EU-produkter som Bestseller
            // i Wix tar de över igen automatiskt.
            const tagged = products.filter((p) => p.ribbon === "Bestseller");
            return tagged.length >= 8
              ? tagged
              : [...products].sort((a, b) => b.imageScore - a.imageScore).slice(0, 24);
          })()
        : products.filter((p) => (p.collectionIds || []).some((cid) => catIds.has(cid)));
  // Första raden: de 3 högst bild-poängsatta produkterna (lib/image-scores) först
  // — bästa bilderna möter besökaren. Resten behåller katalogordningen.
  const topThree = [...catList].sort((a, b) => b.imageScore - a.imageScore).slice(0, 3);
  const topIds = new Set(topThree.map((p) => p.id));
  // dedupeProducts: defensivt skydd så två kort aldrig visar samma produkt/bild
  // bredvid varandra (Leonards "samma bild två gånger i rad" i Mobiltillbehör).
  const list = await attachRatings(dedupeProducts([...topThree, ...catList.filter((p) => !topIds.has(p.id))]));
  // Förälder (om detta är en subkategori) → för brödsmulor.
  const parent = active.parentId ? collections.find((c) => c.id === active.parentId) : undefined;
  // Programmatiska SEO-länkar för kategorin (pris-tiers + bäst-i-test) — bara
  // giltiga sidor, så aldrig en länk till 404.
  const progLinks = await categoryProgrammaticLinks(active.slug);
  // Blogg-länkar för kategorin (länkflöde pengasidor → blogg, saknades helt).
  // Ömsesidiga först: en guide som länkar hit ("Mer till vagnen hittar du inom
  // Friluftsliv & Resa") visas på kategorisidan även när kategorinamnet saknas
  // i guidens rubrik. Kategorinamn + förälder är kvar som påfyllning.
  // Äkta-träff-filtrerat: tom lista → inget blogg-block renderas.
  const blogLinks = await blogLinksForPage(`/kategori/${active.slug}`, [
    active.name,
    ...(parent ? [parent.name] : []),
  ]);
  // Korskategori-upptäckt: länka till övriga huvudavdelningar (exkl. den aktuella
  // avdelningen). Bara giltiga /kategori/{slug}-sidor från getCollections → aldrig
  // 404. Ger en guidad väg vidare mellan avdelningar (höjer upptäckt + AOV).
  // Underkategorier till den kategori sidan visar → chips i filterpanelen.
  // Antalet räknas ur samma produktlista sidan renderar, så siffran är ett
  // löfte som håller vid klicket.
  const subs = collections
    .filter((c) => c.parentId === active.id)
    .sort((a, b) => a.index - b.index)
    .map((c) => ({
      name: c.name,
      slug: c.slug,
      count: products.filter((p) => (p.collectionIds || []).includes(c.id)).length,
    }))
    .filter((sub) => sub.count > 0);

  const currentMainId = active.parentId ?? active.id;
  const deptLinks = collections
    // REA har en egen accent-länk i toppmenyn → exkludera ur strippen (undvik dubbel-
    // exponering). Populära behålls (rik bästsäljar-sida).
    .filter((c) => c.parentId === null && c.id !== currentMainId && c.slug !== "rea")
    .sort((a, b) => a.index - b.index)
    .map((c) => ({ href: `/kategori/${c.slug}`, label: c.name }));

  // Redaktionellt innehåll (intro + FAQ) för kategorier som har curated innehåll
  // i lib/category-content. KARTAN är gaten — tidigare krävdes dessutom att det
  // var en huvudkategori (parentId === null), vilket lämnade de 27 under-
  // kategorierna helt utan brödtext (0 ord → såg för Google ut som varianter av
  // /alla-produkter). REA/Populära och okända slugs saknas i kartan → inget block.
  const editorial = categoryContent(active.slug);

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
  // FAQPage-JSON-LD när huvudkategorin har en FAQ (samma mönster som blogginläggen).
  // Frågorna/svaren renderas synligt nedan → uppfyller Googles krav på att FAQ-
  // markup speglar synligt sidinnehåll.
  const faqLd = editorial?.faq?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: editorial.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(collectionPageLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqLd) }} />}

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
              <p>
                {active.slug === "rea"
                  ? `${list.length} fynd till nedsatt pris just nu.`
                  : active.slug === "populara"
                    ? `${list.length} av våra mest populära fynd just nu.`
                    : `${list.length} ${list.length === 1 ? "produkt" : "produkter"} – noga utvalda fynd inom ${active.name.toLowerCase()}.`}
              </p>
            </div>
            {heroImg && (
              <div className={`kat-hero-img${heroIsProduct ? " is-product" : ""}`}>
                <Image
                  src={heroImg}
                  alt={active.name}
                  fill
                  // `priority` utfasad i Next 16 → `preload`; kategorihjälten är
                  // sidans LCP-element. fetchPriority sätts separat (next/image
                  // härleder den inte ur preload).
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
          {/* forClient skär bort de fält klienten aldrig läser — se ListProduct
              i lib/products.ts. Mätt: 1 005 kB av 2 704 på den här sidan. */}
          <ShopBrowser products={forClient(list)} subs={subs} />

          {/* Crawlbart A–Ö-index för kategorin: gridden visar 24 (perf-gräns) och
              på statiskt renderade kategorisidor saknas "Visa fler"-knappen helt
              i server-HTML (Suspense-fallback) → utan denna lista fick svans-
              produkterna inga kategori-ankarlänkar alls. Ren text = noll perf. */}
          <ProductIndex products={list} title={`Alla inom ${active.name} A–Ö`} />
        </div>
      </section>

      {/* Redaktionellt block (intro + FAQ) under produktnätet — ger huvudkategori-
          sidorna riktig brödtext + long-tail-SEO. Renderas bara för huvudkategorier
          med curated innehåll (lib/category-content); subkategorier/REA/Populära får
          inget. FAQ:n speglas i FAQPage-JSON-LD ovan. */}
      {editorial && (
        <section className="sec kat-editorial">
          <div className="container">
            <div className="kat-intro">
              <h2>Om {active.name}</h2>
              {editorial.intro.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            {editorial.faq.length > 0 && (
              <div className="kat-faq">
                <h2>Vanliga frågor om {active.name}</h2>
                <dl>
                  {editorial.faq.map((f, i) => (
                    <div className="kat-faq-item" key={i}>
                      <dt>{f.q}</dt>
                      <dd>{f.a}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </section>
      )}

      {progLinks.length > 0 && (
        <ProgCrossLinks title={`Fler sätt att handla ${active.name}`} links={progLinks} blogLinks={blogLinks} />
      )}

      {deptLinks.length > 0 && (
        <ProgCrossLinks title="Utforska fler avdelningar" links={deptLinks} />
      )}
    </>
  );
}
