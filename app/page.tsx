import Image from "next/image";
import { getProducts, getCollections, mixByCategory } from "../lib/products";
import { ProductCard } from "../components/productcard";
import { buildGroupCards } from "../lib/category-groups";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: "Fyndplats",
  url: "https://www.fyndplats.se/",
  description: "Fyndplats är en svensk e-handelsbutik som levererar i hela Sverige. Noga utvalda fynd, fri frakt över 499 kr, 30 dagars öppet köp.",
  email: "info@fyndplats.com",
  telephone: "+46736630990",
  areaServed: "SE",
  currenciesAccepted: "SEK",
  paymentAccepted: "Credit Card, Klarna",
  sameAs: [
    // Google Business Profile — bidirektionell länk för entity-koppling
    "https://maps.google.com/?cid=13527624431203349873",
    "https://www.instagram.com/fyndplats/",
    "https://www.facebook.com/profile.php?id=100089607278056",
  ],
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "21" },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Fyndplats",
  alternateName: "Fyndplats.se",
  url: "https://www.fyndplats.se/",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://www.fyndplats.se/sok?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default async function Home() {
  const [allProducts, cols] = await Promise.all([getProducts(), getCollections()]);

  // Hero-mosaik: curated premium-bilder per kategori efter visuell granskning.
  // Helt skild logik från CATEGORY-mosaiken nedan — denna visar bara 4 stora
  // bilder överst på sidan ("breadth"-shot av sortimentet).
  const HERO_CATS = ["Elektronik", "Hem & Inredning", "Kök & Matlagning", "Hudvård & Ansikte", "Mode & Accessoarer", "Husdjur", "Ljud & Hörlurar", "Dator & Gaming"];
  const HERO_CURATION: Record<string, string[]> = {
    "Elektronik": ["elektrisk-mjolkskummare", "elektrisk-vinoppnare", "mini-luftfuktare", "usb-koppvarmare"],
    "Hem & Inredning": ["magnetisk-knivhallare-akacia-vaggmonterad-knivlist", "4-pack-glas-ribbad-design", "astronaut-stjarnprojektor", "manuell-mathackare"],
    "Kök & Matlagning": ["keramisk-kaffekopp-stilren-handgjord-vintagekopp", "vinkylare-med-luftare-och-upphallare-rostfritt", "manuell-mathackare"],
    "Hudvård & Ansikte": ["gua-sha-massagesten-i-akta-jade", "ansiktsroller-massageverktyg-for-ansikte-och-ogon", "ultratunna-foundationborstar-2-pack-precisionsborste"],
    "Mode & Accessoarer": [],
    "Husdjur": [],
    "Ljud & Hörlurar": [],
    "Dator & Gaming": [],
  };

  // MOSAIC_DENYLIST: produktbilder med text-overlays, brand-loggor eller plast­förpackningar
  // som inte ska visas som hero. Används av hero-mosaiken nedan (homeCats använder
  // den centrala buildGroupCards som har sin egen denylist).
  const MOSAIC_DENYLIST = new Set<string>([
    "sladdlos-handdammsugare-bil", "rgb-led-slinga", "digital-stektermometer",
    "tradlos-ergonomisk-mus-4000-dpi-99", "automatisk-tvaldispenser-touchless-sensor-skum",
    "doktorsset-i-silikon-pedagogisk-leksak", "tragavobox-for-bebis-handgjort-presentset",
    "massagepistol-led-skarm", "elektrisk-sonisk-tandborste",
    "tandgnisselskena-for-nattbruk-och-tandskydd",
    "tandblekningsremsor-effektiv-hemmablekning-med-mintsmak",
    "whiskey-stenar-i-rostfritt-stal-4", "oljesprayer-glas-2-i-1",
    "arcade-basketbollspel-for-hemmet-justerbart-stabil",
    "barnens-bilformade-lektalt-inomhus-playhouse-hopfallbart",
    // Hudvård/Hem — mått-overlays och text-overlays
    "svart-multifunktionell-makeupborste",  // "19.0cm/7.4in" mått
    "uppvarmd-ogonmask",                     // "28cm/11.02inch" mått
    "roterande-sminkforvaring-360",          // "360° rotating" text
  ]);

  // Bygg hero-mosaikens 4 produkter — curation först, sen denylist-filter,
  // sen vad som finns. Samma logik som CATEGORY-mosaiken men för enskilda
  // produkter per HERO_CATS-kategori (visar bredd i sortimentet).
  const heroProducts: typeof allProducts = [];
  const usedHero = new Set<string>();
  for (const name of HERO_CATS) {
    if (heroProducts.length >= 4) break;
    const col = cols.find((c) => c.name === name);
    if (!col) continue;
    const inCat = allProducts.filter((p) => p.img && (p.collectionIds || []).includes(col.id));
    const slugMap = new Map(inCat.map((p) => [p.slug, p]));
    // 1. Försök curated
    let picked: (typeof allProducts)[number] | undefined;
    for (const slug of HERO_CURATION[name] || []) {
      const p = slugMap.get(slug);
      if (p && !usedHero.has(slug)) { picked = p; break; }
    }
    // 2. Annars första non-denylisted
    if (!picked) picked = inCat.find((p) => !usedHero.has(p.slug) && !MOSAIC_DENYLIST.has(p.slug));
    // 3. Sista utvägen
    if (!picked) picked = inCat.find((p) => !usedHero.has(p.slug));
    if (picked) { heroProducts.push(picked); usedHero.add(picked.slug); }
  }
  // Sista fyllning över alla kategorier om vi inte fick 4
  for (const p of allProducts) {
    if (heroProducts.length >= 4) break;
    if (!usedHero.has(p.slug) && p.img && !MOSAIC_DENYLIST.has(p.slug)) {
      heroProducts.push(p); usedHero.add(p.slug);
    }
  }

  // Pinned 8-slug curation för "Veckans fynd" — handplockade clean-bilder.
  // Speglar HERO_CURATION/PREMIUM_CURATION-mönstret: utan curation gav
  // mixByCategory().slice(0, 8) ett shufflande urval där bl.a. mus, makeupborste
  // och massagepistol (alla i MOSAIC_DENYLIST p.g.a. logga/text-overlays) kunde
  // dyka upp. Fallback faller tillbaka på MOSAIC_DENYLIST-filtrerad round-robin
  // om en curated slug saknas i katalogen (defensivt mot katalog-ändringar).
  const VECKANS_CURATION = [
    "gamewave-x-handhallen-spelkonsol-med-64gb",          // Dator & Gaming
    "trendigt-snake-chain-kedjehalsband-slat",            // Smycken
    "mjuk-huva-handduk-i-coral-fleece",                   // Barn & Familj
    "12-pack-hjarteballonger-roda-och-peach",             // Hem / fest
    "digital-bagagevag",                                   // Friluftsliv & Resa
    "elektrisk-vinoppnare",                                // Elektronik / Kök
    "astronaut-stjarnprojektor",                           // Hem & Inredning
    "ansiktsroller-massageverktyg-for-ansikte-och-ogon",  // Hudvård
  ];
  const veckansPool = allProducts.filter((p) => !usedHero.has(p.slug));
  const veckansSlugMap = new Map(veckansPool.map((p) => [p.slug, p]));
  const veckansPicks: typeof allProducts = [];
  const veckansUsed = new Set<string>();
  for (const slug of VECKANS_CURATION) {
    const p = veckansSlugMap.get(slug);
    if (p && !veckansUsed.has(slug)) { veckansPicks.push(p); veckansUsed.add(slug); }
  }
  if (veckansPicks.length < 8) {
    for (const p of mixByCategory(veckansPool, cols)) {
      if (veckansPicks.length >= 8) break;
      if (veckansUsed.has(p.slug) || MOSAIC_DENYLIST.has(p.slug)) continue;
      veckansPicks.push(p); veckansUsed.add(p.slug);
    }
  }
  const products = veckansPicks.slice(0, 8);

  // Topp-4 huvudgrupper för hemsidan (sorterade efter produktantal). Använder samma
  // groupbuild som /butik så curated hero-bilder matchar — användaren ser samma
  // bild för "Hem & Inredning" på startsidan som på butik-landningen.
  const allGroups = buildGroupCards(allProducts, cols);
  const homeCats = [...allGroups].sort((a, b) => b.count - a.count).slice(0, 4);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />

      <section className="hero">
        <div className="container">
          <div className="herogrid">
            <div className="heroinner">
              <span className="badge">✦ Trygg svensk e-handel · Nya fynd varje vecka</span>
              <h1>Fyndplats — Noga utvalda fynd, <em>tryggt köp</em></h1>
              <p>Handplockade fynd inom hem, kök, sport och elektronik – noga utvalda för svenska hem. Fri frakt över 499 kr. Svensk kundtjänst som svarar inom 24 timmar.</p>
              <div className="btns">
                <a className="btn btn-primary" href="/butik">Handla nu →</a>
                <a className="btn btn-ghost" href="/butik">Se alla kategorier</a>
              </div>
              <div className="herotrust">
                <span><b style={{ color: "#C2410C" }}>✓</b> Google 4,9★ (21 omdömen)</span>
                <span><b style={{ color: "#C2410C" }}>✓</b> Svensk kundtjänst</span>
                <span><b style={{ color: "#C2410C" }}>✓</b> 30 dagars öppet köp</span>
                <span><b style={{ color: "#C2410C" }}>✓</b> Spårbar leverans</span>
              </div>
            </div>
            <div className="heromosaic">
              <div className="mcol">
                {heroProducts.slice(0, 2).map((p, i) => (
                  <a className="herotile" key={p.slug} href={`/produkt/${p.slug}`}>
                    <Image
                      src={p.img}
                      alt={p.name}
                      fill
                      priority={i === 0}
                      fetchPriority={i === 0 ? "high" : undefined}
                      loading={i === 0 ? undefined : "eager"}
                      sizes="(max-width:880px) 42vw, 22vw"
                    />
                    {p.price && <span className="htag">{p.price}</span>}
                  </a>
                ))}
              </div>
              <div className="mcol mcol-offset">
                {heroProducts.slice(2, 4).map((p) => (
                  <a className="herotile" key={p.slug} href={`/produkt/${p.slug}`}>
                    <Image src={p.img} alt={p.name} fill loading="eager" sizes="(max-width:880px) 42vw, 22vw" />
                    {p.price && <span className="htag">{p.price}</span>}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="usp">
        <div className="container usprow">
          <span className="uspitem"><svg viewBox="0 0 24 24" fill="none"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="7" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" /><circle cx="17.5" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" /></svg>Fri frakt över 499 kr</span>
          <span className="uspitem"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>Trygg Klarna-betalning</span>
          <span className="uspitem"><svg viewBox="0 0 24 24" fill="none"><path d="M9 14L4 9l5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 9h11a5 5 0 0 1 5 5v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>30 dagars öppet köp</span>
          <span className="uspitem">⭐ Google 4,9 (21 omdömen)</span>
        </div>
      </div>

      {homeCats.length > 0 && (
        <section className="homecat-sec" id="kategorier">
          <div className="container">
            <div className="homecat-head">
              <div className="eyebrow">Utforska kategorier</div>
              <h2>Hitta dina nästa fynd</h2>
              <p>Våra största avdelningar – noga utvalda för svenska hem.</p>
            </div>
            <div className="homecat-grid">
              {homeCats.map((c) => (
                <a className="homecat" key={c.main.id} href={`/kategori/${c.main.slug}`} aria-label={`${c.main.name}, ${c.count} produkter`}>
                  <div className="homecat-img">
                    {c.heroImg && (
                      <Image
                        src={c.heroImg}
                        alt=""
                        fill
                        sizes="(max-width:380px) 100vw, (max-width:880px) 50vw, 280px"
                      />
                    )}
                    <span className="homecat-cta">Utforska →</span>
                  </div>
                  <div className="homecat-body">
                    <span className="homecat-name">{c.main.name}</span>
                    <span className="homecat-count">{c.count} st</span>
                  </div>
                </a>
              ))}
            </div>
            <div className="homecat-allwrap">
              <a className="homecat-alllink" href="/butik">Se alla kategorier <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>
      )}

      <section className="sec" id="produkter" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="sechead">
            <div className="eyebrow">Populärt just nu</div>
            <h2>Veckans fynd</h2>
            <p>Handplockade favoriter – nya varje vecka.</p>
          </div>
          <div className="prodgrid">
            {products.map((p) => (
              <ProductCard p={p} key={p.slug} />
            ))}
          </div>
          <div className="center"><a className="linkbtn" href="/alla-produkter">Visa hela sortimentet →</a></div>
        </div>
      </section>

      <section className="sec why">
        <div className="container">
          <div className="sechead">
            <div className="eyebrow">Trygg svensk e-handel</div>
            <h2>Därför handlar du hos Fyndplats</h2>
          </div>
          <div className="cards">
            <div className="card"><div className="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="7" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" /><circle cx="17.5" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" /></svg></div><h3>Spårbar leverans</h3><p>Fri frakt över 499 kr. Följ paketet hela vägen hem.</p></div>
            <div className="card"><div className="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></div><h3>Trygg betalning med Klarna</h3><p>Kort, Swish eller faktura – du väljer själv.</p></div>
            <div className="card"><div className="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M9 14L4 9l5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 9h11a5 5 0 0 1 5 5v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></div><h3>30 dagars öppet köp</h3><p>Ändrat dig? Enkel och trygg retur – vi förlänger lagens 14 dagar till 30.</p></div>
            <div className="card"><div className="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.7L3 21l1.8-5.8A8.5 8.5 0 1 1 21 11.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg></div><h3>Svensk kundtjänst</h3><p>Vi svarar normalt inom 24 timmar.</p></div>
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="bandwrap">
          <div className="band">
            <h2>Bli först att fynda nyheterna</h2>
            <p>Få våra bästa fynd och erbjudanden direkt i inkorgen – varje vecka.</p>
            <a className="btn-white" href="/butik">Utforska butiken →</a>
          </div>
        </div>
      </section>
    </>
  );
}
