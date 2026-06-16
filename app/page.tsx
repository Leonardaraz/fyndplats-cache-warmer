import Image from "next/image";
import { getProducts, getCollections, forListings, dedupeProducts } from "../lib/products";
import { ProductCard } from "../components/productcard";
import { buildGroupCards } from "../lib/category-groups";
import { getBlurDataURLs, SHIMMER_BLUR } from "../lib/lqip";
import { Newsletter } from "../components/newsletter";
import { getHiddenFromFeatured, FEATURED_MIN_SCORE } from "../lib/image-scores";
import { tightFillUrl } from "../lib/wix-image";
import { GOOGLE_RATING, GOOGLE_REVIEWS_LABEL } from "../lib/social-proof";

// ISR: startsidan renderas statiskt men regenereras i bakgrunden var timme, så
// nyimporterade produkter och kategori-ändringar dyker upp utan en ny deploy.
// (Pris/lager är inte tidskritiskt här — det visas på produktsidorna, som har
// egen 5-min-ISR + webhook-revalidering vid order_created.)
export const revalidate = 3600;

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
  // OBS: ingen aggregateRating här. Ett hårdkodat butiks-betyg på Organization/
  // OnlineStore-entiteten är "self-serving rating" som Googles riktlinjer
  // förbjuder i strukturerad data (måste komma från recensioner PÅ sajten) och
  // kan ge manuell åtgärd. Äkta betyg visas bara på produktsidorna (PDP), där
  // aggregateRating sätts enbart när det finns riktig recensionsdata. Google-
  // betyget 4,9 visas fortfarande som synlig text i sidfoten (helt OK).
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
  const [allProductsRaw, cols] = await Promise.all([getProducts(), getCollections()]);
  // Dölj ev. slutsålda från alla kund-ytor på startsidan (hero + Veckans fynd)
  // när HIDE_OOS_FROM_LISTINGS är på. Default av → oförändrat.
  const allProducts = forListings(allProductsRaw);

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

  // Äkta blur-up (8×8 webp från Wix-CDN, base64-cachad) för hjälte-mosaikens 4
  // bilder. Above-the-fold → litet antal, så server-fetchen är billig och tar
  // bort den tomma vita rutan på first paint som granskningen flaggade.
  const heroBlur = await getBlurDataURLs(heroProducts.map((p) => p.img));

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
  // Veckans fynd drivs nu av bildkvalitets-poäng (lib/image-scores): bara topp-
  // nivån (score > 75) får visas, sorterat fallande, och produkter merchant gömt
  // i /admin/image-issues filtreras bort. Den handplockade VECKANS_CURATION
  // behålls som prioriterad front NÄR slugarna klarar poängkravet — annars styr
  // poängen. Faller tillbaka på poäng-sorterad pool om för få passerar baren.
  const hiddenFromFeatured = await getHiddenFromFeatured();
  const veckansPool = allProducts.filter(
    (p) => !usedHero.has(p.slug) && !hiddenFromFeatured.has(p.id) && !MOSAIC_DENYLIST.has(p.slug),
  );
  const topTier = veckansPool.filter((p) => p.imageScore > FEATURED_MIN_SCORE);
  const curatedSet = new Set(VECKANS_CURATION);
  const curatedFront = VECKANS_CURATION
    .map((slug) => topTier.find((p) => p.slug === slug))
    .filter((p): p is (typeof allProducts)[number] => Boolean(p));
  const byScore = topTier
    .filter((p) => !curatedSet.has(p.slug))
    .sort((a, b) => b.imageScore - a.imageScore);
  const veckansPicks = [...curatedFront, ...byScore];
  // Säkerhetsfyllning om < 8 produkter klarar > 75: ta de högst poängsatta ur
  // poolen (fortfarande utan gömda/denylist) så raden aldrig blir gles.
  if (veckansPicks.length < 8) {
    const used = new Set(veckansPicks.map((p) => p.slug));
    for (const p of [...veckansPool].sort((a, b) => b.imageScore - a.imageScore)) {
      if (veckansPicks.length >= 8) break;
      if (used.has(p.slug)) continue;
      veckansPicks.push(p); used.add(p.slug);
    }
  }
  const products = dedupeProducts(veckansPicks).slice(0, 8);

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
                <a className="btn btn-primary" href="/alla-produkter">Handla nu →</a>
                <a className="btn btn-ghost" href="/butik">Se alla kategorier</a>
              </div>
              <div className="herotrust">
                <span><b style={{ color: "#C2410C" }}>✓</b> Google {GOOGLE_RATING}★ ({GOOGLE_REVIEWS_LABEL})</span>
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
                      src={tightFillUrl(p.img, 800, 800)}
                      alt={p.name}
                      fill
                      preload
                      fetchPriority={i === 0 ? "high" : undefined}
                      placeholder="blur"
                      blurDataURL={heroBlur[i]}
                      sizes="(max-width:880px) 42vw, 22vw"
                    />
                    {p.price && <span className="htag">{p.price}</span>}
                  </a>
                ))}
              </div>
              <div className="mcol mcol-offset">
                {heroProducts.slice(2, 4).map((p, i) => (
                  <a className="herotile" key={p.slug} href={`/produkt/${p.slug}`}>
                    <Image src={tightFillUrl(p.img, 800, 800)} alt={p.name} fill preload placeholder="blur" blurDataURL={heroBlur[i + 2]} sizes="(max-width:880px) 42vw, 22vw" />
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
          <span className="uspitem">⭐ Google {GOOGLE_RATING} ({GOOGLE_REVIEWS_LABEL})</span>
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
                  {/* 2×2-mosaik av 4 riktiga produktbilder ur kategorin. Under-fold →
                      ingen priority, lazy default; sized thumbs håller LCP på hjälten. */}
                  <div className="homecat-mosaic">
                    {Array.from({ length: 4 }).map((_, i) =>
                      c.thumbs[i] ? (
                        <span className="homecat-thumb" key={i}>
                          <Image
                            src={tightFillUrl(c.thumbs[i], 280, 280)}
                            alt={c.main.name}
                            fill
                            placeholder="blur"
                            blurDataURL={SHIMMER_BLUR}
                            sizes="(max-width:380px) 25vw, (max-width:880px) 12vw, 140px"
                          />
                        </span>
                      ) : (
                        <span className="homecat-thumb homecat-thumb-pad" key={i} aria-hidden="true" />
                      )
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
            <a className="card" href="/sparning"><div className="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="7" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" /><circle cx="17.5" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" /></svg></div><h3>Spårbar leverans</h3><p>Fri frakt över 499 kr. Följ paketet hela vägen hem.</p></a>
            <a className="card" href="/kopvillkor"><div className="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></div><h3>Trygg betalning med Klarna</h3><p>Kort, Swish eller faktura – du väljer själv.</p></a>
            <a className="card" href="/returer"><div className="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M9 14L4 9l5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 9h11a5 5 0 0 1 5 5v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></div><h3>30 dagars öppet köp</h3><p>Ändrat dig? Enkel och trygg retur – vi förlänger lagens 14 dagar till 30.</p></a>
            <a className="card" href="/kontaktaoss"><div className="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.7L3 21l1.8-5.8A8.5 8.5 0 1 1 21 11.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg></div><h3>Svensk kundtjänst</h3><p>Vi svarar normalt inom 24 timmar.</p></a>
          </div>
        </div>
      </section>

      <Newsletter />
    </>
  );
}
