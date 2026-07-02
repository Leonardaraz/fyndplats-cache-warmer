import Image from "next/image";
import { jsonLdString } from "../lib/seo";
import { getProducts, getCollections, forListings, dedupeProducts, sortByNewest, mixByCategory } from "../lib/products";
import { ProductCard } from "../components/productcard";
import { buildGroupCards } from "../lib/category-groups";
import { getBlurDataURLs, SHIMMER_BLUR } from "../lib/lqip";
import { Newsletter } from "../components/newsletter";
import { getHiddenFromFeatured, PROBLEM_MAX_SCORE } from "../lib/image-scores";
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

  // ── Startsidan visar NYTT: hero + Veckans fynd drivs av de 100 senast ──────
  // skapade produkterna (Leonards önskemål 2026-06-23) i stället för en fast
  // handplockad slug-lista. Vi sorterar på createdAt (Wix numericId, auto-ökande)
  // och jobbar i den senaste 100-poolen. Kvaliteten skyddas fortfarande av:
  //   • MOSAIC_DENYLIST  — kända bilder med text-overlay/logga/förpackning,
  //   • merchant-gömda    — hidden=true i /admin/image-issues,
  //   • en MJUK bild-poäng-grind — vi släpper igenom oscorad (default 60) men
  //     stoppar känt dåliga (< PROBLEM_MAX_SCORE = 50), så en känd ful bild
  //     aldrig hamnar överst men nya (ännu oscorade) produkter syns direkt.
  const hiddenFromFeatured = await getHiddenFromFeatured();

  // MOSAIC_DENYLIST: produktbilder med text-overlays, brand-loggor eller plast­förpackningar
  // som inte ska visas på startsidan (homeCats använder buildGroupCards som har sin egen denylist).
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

  // Kvalitetsgrind för start-ytorna: har bild, inte denylistad, inte gömd, och
  // inte KÄNT dålig (oscorad = default 60 → släpps igenom).
  const isCleanImage = (p: (typeof allProducts)[number]) =>
    Boolean(p.img) &&
    !MOSAIC_DENYLIST.has(p.slug) &&
    !hiddenFromFeatured.has(p.id) &&
    p.imageScore >= PROBLEM_MAX_SCORE;

  const latest100 = sortByNewest(allProducts).slice(0, 100);
  const freshClean = latest100.filter(isCleanImage);

  // Hero-mosaik (4 stora bilder): nyaste produkterna spridda över avdelningar för
  // en "breadth"-shot av nytillskotten. mixByCategory round-robinerar per
  // huvudkategori och behåller nyast-först inom varje bucket → de 4 första blir
  // nyaste produkten i var och en av de första avdelningarna.
  const usedHero = new Set<string>();
  const heroProducts: typeof allProducts = [];
  for (const p of mixByCategory(freshClean, cols)) {
    if (heroProducts.length >= 4) break;
    if (usedHero.has(p.slug)) continue;
    heroProducts.push(p); usedHero.add(p.slug);
  }
  // Defensiv fyllning om de 100 senaste inte räcker till 4 (mycket litet/nytt
  // sortiment): ta nyaste rena produkten ur hela katalogen.
  if (heroProducts.length < 4) {
    for (const p of sortByNewest(allProducts).filter(isCleanImage)) {
      if (heroProducts.length >= 4) break;
      if (usedHero.has(p.slug)) continue;
      heroProducts.push(p); usedHero.add(p.slug);
    }
  }

  // Äkta blur-up (8×8 webp från Wix-CDN, base64-cachad) för hjälte-mosaikens 4
  // bilder. Above-the-fold → litet antal, så server-fetchen är billig och tar
  // bort den tomma vita rutan på first paint som granskningen flaggade.
  const heroBlur = await getBlurDataURLs(heroProducts.map((p) => p.img));

  // Veckans fynd (8): nyaste produkterna ur de 100 senaste, MED en del REA
  // (onSale) inblandat — Leonards önskemål. Vi leder med upp till 3 nyaste
  // REA-fynd och fyller resten med nyaste rena produkter spridda över avdelningar
  // (mixByCategory). Finns ingen REA bland de 100 senaste blir raden bara nyast.
  const featPool = latest100.filter((p) => isCleanImage(p) && !usedHero.has(p.slug));
  const reaPicks = featPool.filter((p) => p.onSale).slice(0, 3);
  const reaSet = new Set(reaPicks.map((p) => p.slug));
  const restMixed = mixByCategory(featPool.filter((p) => !reaSet.has(p.slug)), cols);
  const veckansPicks = [...reaPicks, ...restMixed];
  // Säkerhetsfyllning om de 100 senaste rena inte ger 8: ta nyaste rena produkter
  // ur hela katalogen så raden aldrig blir gles.
  if (veckansPicks.length < 8) {
    const used = new Set(veckansPicks.map((p) => p.slug));
    for (const p of sortByNewest(allProducts).filter(isCleanImage)) {
      if (veckansPicks.length >= 8) break;
      if (usedHero.has(p.slug) || used.has(p.slug)) continue;
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(websiteJsonLd) }} />

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
                <span><b style={{ color: "#C2410C" }}>🇪🇺</b> <a href="/blogg/nya-tullreglerna-2026-eu-lager" style={{ color: "inherit", textDecorationColor: "rgba(43,38,33,.32)", textUnderlineOffset: "2px" }}>Allt från EU-lager – ingen importtull</a></span>
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
                      {...(i === 0 ? { priority: true } : {})}
                      placeholder="blur"
                      blurDataURL={heroBlur[i]}
                      sizes="(max-width:880px) 42vw, 22vw"
                    />
                    {p.onSale && p.inStock && <span className="sale-badge">Rea</span>}
                    {p.price && (
                      <span className="htag">
                        {p.price}
                        {p.onSale && p.originalPrice && <span className="htag-old">{p.originalPrice}</span>}
                      </span>
                    )}
                  </a>
                ))}
              </div>
              <div className="mcol mcol-offset">
                {heroProducts.slice(2, 4).map((p, i) => (
                  <a className="herotile" key={p.slug} href={`/produkt/${p.slug}`}>
                    <Image src={tightFillUrl(p.img, 800, 800)} alt={p.name} fill placeholder="blur" blurDataURL={heroBlur[i + 2]} sizes="(max-width:880px) 42vw, 22vw" />
                    {p.onSale && p.inStock && <span className="sale-badge">Rea</span>}
                    {p.price && (
                      <span className="htag">
                        {p.price}
                        {p.onSale && p.originalPrice && <span className="htag-old">{p.originalPrice}</span>}
                      </span>
                    )}
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
