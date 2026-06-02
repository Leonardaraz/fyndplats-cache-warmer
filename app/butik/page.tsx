import Image from "next/image";
import { redirect } from "next/navigation";
import { getProducts, getCollections, forListings, dedupeProducts } from "../../lib/products";
import { ProductCard } from "../../components/productcard";
import { buildGroupCards, MOSAIC_DENYLIST, categoryHero } from "../../lib/category-groups";
import { pageMeta } from "../../lib/seo";
import { getHiddenFromFeatured, FEATURED_MIN_SCORE } from "../../lib/image-scores";
import { tightFillUrl } from "../../lib/wix-image";

export const metadata = pageMeta(
  "Butik – utforska hela vårt sortiment",
  "Bläddra Fyndplats butiksavdelningar – hem & inredning, elektronik, hudvård, mode och mer. Noga utvalda fynd, fri frakt över 499 kr.",
  "/butik",
  "c3bea817cdcb3351"
);

export default async function Butik({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  // Bakåtkompabilitet: gamla länkar ?kategori=X (sökindex, externa länkar)
  // bör fortsätta fungera → skicka dem vidare till den nya kategorisidan.
  const { kategori } = await searchParams;
  if (kategori) {
    const cols = await getCollections();
    const match = cols.find((c) => c.slug === kategori);
    if (match) redirect(`/kategori/${match.slug}`);
  }

  const [allProducts, collections] = await Promise.all([getProducts(), getCollections()]);
  const products = forListings(allProducts); // dölj ev. slutsålda från listan (opt-in)
  const groups = buildGroupCards(products, collections);

  // Veckans fynd: 8 curated picks (samma logik som hemsidan men oberoende
  // utfall — användaren ska se nya intressanta produkter, inte exakt samma rad).
  const VECKANS_CURATION = [
    "elektrisk-vinoppnare",
    "astronaut-stjarnprojektor",
    "magnetisk-knivhallare-akacia-vaggmonterad-knivlist",
    "gua-sha-massagesten-i-akta-jade",
    "trendigt-snake-chain-kedjehalsband-slat",
    "mjuk-huva-handduk-i-coral-fleece",
    "gamewave-x-handhallen-spelkonsol-med-64gb",
    "digital-bagagevag",
  ];
  // Poäng-driven Veckans fynd (se lib/image-scores): topp-nivå (> 75), gömda
  // bortfiltrerade, curation först när den klarar baren, annars poäng-sorterat.
  const hiddenFromFeatured = await getHiddenFromFeatured();
  const veckansPool = products.filter(
    (p) => !hiddenFromFeatured.has(p.id) && !MOSAIC_DENYLIST.has(p.slug),
  );
  const topTier = veckansPool.filter((p) => p.imageScore > FEATURED_MIN_SCORE);
  const curatedSet = new Set(VECKANS_CURATION);
  const curatedFront = VECKANS_CURATION
    .map((slug) => topTier.find((p) => p.slug === slug))
    .filter((p): p is (typeof products)[number] => Boolean(p));
  const byScore = topTier
    .filter((p) => !curatedSet.has(p.slug))
    .sort((a, b) => b.imageScore - a.imageScore);
  const veckansPicks = [...curatedFront, ...byScore];
  if (veckansPicks.length < 8) {
    const used = new Set(veckansPicks.map((p) => p.slug));
    for (const p of [...veckansPool].sort((a, b) => b.imageScore - a.imageScore)) {
      if (veckansPicks.length >= 8) break;
      if (used.has(p.slug)) continue;
      veckansPicks.push(p); used.add(p.slug);
    }
  }
  const veckans = dedupeProducts(veckansPicks).slice(0, 8);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
      { "@type": "ListItem", position: 2, name: "Butik", item: "https://www.fyndplats.se/butik" },
    ],
  };
  const collectionPageLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Butik – hela sortimentet",
    url: "https://www.fyndplats.se/butik",
    description: "Bläddra Fyndplats butiksavdelningar – hem & inredning, elektronik, hudvård, mode och mer.",
    hasPart: groups.map((g) => ({
      "@type": "CollectionPage",
      name: g.main.name,
      url: `https://www.fyndplats.se/kategori/${g.main.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageLd) }} />

      {/* PREMIUM HERO — minimal, typografi-driven, ingen tung bild → snabb LCP */}
      <section className="butik-hero">
        <div className="container">
          <nav className="butik-crumbs" aria-label="Brödsmulor">
            <a href="/">Hem</a>
            <span aria-hidden="true">/</span>
            <em>Butik</em>
          </nav>
          <div className="butik-hero-inner">
            <span className="butik-hero-eyebrow">Hela vårt sortiment</span>
            <h1 className="butik-hero-title">Hitta dina nästa fynd.</h1>
            <p className="butik-hero-lede">
              Noga utvalda favoriter inom hem, kök, elektronik, hudvård och mer – allt på ett ställe.
              <span className="butik-hero-meta"> {products.length} produkter · {collections.length} kategorier</span>
            </p>
            <div className="butik-hero-ctas">
              <a className="butik-hero-cta-all" href="/alla-produkter">
                Se alla {products.length} produkter <span aria-hidden="true">→</span>
              </a>
              <a className="butik-hero-cta-cats" href="#kategorier">
                Bläddra kategorier
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* HUVUDKATEGORIER — stora premium-kort med hero-bild + undergrupper */}
      <section className="butik-cats-sec" id="kategorier">
        <div className="container">
          <h2 className="sronly">Huvudkategorier</h2>
          <div className="butik-cats-grid">
            {groups.map((g, idx) => {
              // Samma curated lifestyle-hero som huvudkategori-sidans egen hero
              // (lib categoryHero). Faller tillbaka på produkt-heron bara om en
              // huvudkategori saknar curated bild (ska inte hända för de 8).
              const heroSrc = categoryHero(g.main.name) || g.heroImg;
              return (
              <article className="butik-cat" key={g.main.id}>
                <a className="butik-cat-imgwrap" href={`/kategori/${g.main.slug}`} aria-label={`Utforska ${g.main.name}`}>
                  {heroSrc && (
                    <Image
                      className="butik-cat-img"
                      src={tightFillUrl(heroSrc, 1120, 1120)}
                      alt=""
                      fill
                      sizes="(max-width:760px) 100vw, (max-width:1100px) 50vw, 560px"
                      priority={idx < 2}
                      fetchPriority={idx === 0 ? "high" : undefined}
                    />
                  )}
                  <span className="butik-cat-imghover">
                    <span>Utforska →</span>
                  </span>
                </a>
                <div className="butik-cat-body">
                  <div className="butik-cat-head">
                    <a className="butik-cat-titlelink" href={`/kategori/${g.main.slug}`}>
                      <h3 className="butik-cat-title">{g.main.name}</h3>
                    </a>
                    <span className="butik-cat-count">{g.count} produkter</span>
                  </div>
                  <p className="butik-cat-tag">{g.tag}</p>
                  {g.subs.length > 0 && (
                    <div className="butik-cat-subs" aria-label={`Underkategorier i ${g.main.name}`}>
                      {g.subs.map((s) => (
                        <a className="butik-subchip" key={s.id} href={`/kategori/${s.slug}`}>
                          {s.img && (
                            <span className="butik-subchip-thumb">
                              <Image src={tightFillUrl(s.img, 96, 96)} alt="" fill sizes="48px" />
                            </span>
                          )}
                          <span className="butik-subchip-text">
                            <span className="butik-subchip-name">{s.name}</span>
                            <span className="butik-subchip-count">{s.count} produkter</span>
                          </span>
                          <span className="butik-subchip-arr" aria-hidden="true">→</span>
                        </a>
                      ))}
                    </div>
                  )}
                  <a className="butik-cat-cta" href={`/kategori/${g.main.slug}`}>
                    Se alla {g.main.name.toLowerCase()} <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* VECKANS FYND — smal curated rad, inte en full produktlista */}
      <section className="sec butik-veckans">
        <div className="container">
          <div className="sechead">
            <div className="eyebrow">Populärt just nu</div>
            <h2>Veckans fynd</h2>
            <p>Handplockade favoriter – bara ett urval, hela sortimentet hittar du i kategorierna ovan.</p>
          </div>
          <div className="prodgrid">
            {veckans.map((p) => <ProductCard p={p} key={p.slug} />)}
          </div>
          <div className="center"><a className="linkbtn" href="/alla-produkter">Visa alla produkter →</a></div>
        </div>
      </section>

      {/* EDITORIAL — "Vad är Fyndplats?" — bygger varumärkesförtroende */}
      <section className="butik-story">
        <div className="container">
          <div className="butik-story-grid">
            <div className="butik-story-text">
              <div className="eyebrow" style={{ justifyContent: "flex-start" }}>Vår story</div>
              <h2>Vad är Fyndplats?</h2>
              <p>
                Vi är en svensk webbutik som letar upp och kvalitetssäkrar fynd från hela världen, så du
                inte behöver göra det själv. Inget överflöd – bara saker som verkligen är värda din tid.
              </p>
              <p>
                Vi driver Fyndplats från Sverige med svensk kundtjänst som svarar inom 24 timmar.
                Trygga köp med Klarna, 30 dagars öppet köp och spårbar leverans – varje gång.
              </p>
            </div>
            <ul className="butik-story-pillars">
              <li>
                <span className="butik-pillar-num">01</span>
                <div>
                  <h4>Noga utvalda</h4>
                  <p>Vi testar och granskar varje produkt innan den hamnar i butiken.</p>
                </div>
              </li>
              <li>
                <span className="butik-pillar-num">02</span>
                <div>
                  <h4>Svensk kundtjänst</h4>
                  <p>Riktig kontakt med svensktalande personal – vi svarar inom 24 timmar.</p>
                </div>
              </li>
              <li>
                <span className="butik-pillar-num">03</span>
                <div>
                  <h4>Trygga köp</h4>
                  <p>Klarna, 30 dagars öppet köp och spårbar leverans till hela Sverige.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
