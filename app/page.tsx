import Image from "next/image";
import { getProducts, getCollections, mixByCategory } from "../lib/products";
import { ProductCard } from "../components/productcard";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: "Fyndplats",
  url: "https://www.fyndplats.se",
  description: "Svensk webbutik för kvalitetsprodukter till låga priser.",
  email: "info@fyndplats.com",
  telephone: "+46736630990",
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "21" },
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

  // Premium kategori-mosaik: auto-väljer topp-6 kategorier från faktiska produktantal,
  // men bildvalen är HANDPLOCKADE (PREMIUM_CURATION) efter visuell granskning — inga
  // produktbilder med text-overlays, brand-loggor eller plastförpackningar.
  // Fallback-logik om en kategori saknar curated picks: hoppa över denylist,
  // sedan ta första bästa, sist allt.
  const PREMIUM_CURATION: Record<string, string[]> = {
    "Hem & Inredning": [
      "magnetisk-knivhallare-akacia-vaggmonterad-knivlist",
      "manuell-mathackare",
      "astronaut-stjarnprojektor",
      "knivslip-4-steg",
    ],
    "Elektronik": [
      "elektrisk-mjolkskummare",
      "elektrisk-vinoppnare",
      "mini-luftfuktare",
      "usb-koppvarmare",
    ],
    "Lek, Bädd & Tillbehör": [
      "napphallare-i-silikon-och-tra-saker",
      "traleksak-med-bondgardsdjur-stapel-och-balansleksak",
      "handgjord-napphallare-i-tra-virkad-kanin",
      "montessori-koksleksak-i-tra-pedagogiskt-kokset",
    ],
    "Barn & Familj": [
      "montessori-musikset-i-tra-5-delars",
      "babygym-i-tra-stabil-aktivitetsstallning",
      "montessori-musikleksaker-i-tra-pedagogiskt-instrumentset",
      "kaffemaskin-i-tra-leksaksset-for-barn",
    ],
    "Kropp & Välbefinnande": [
      "hallningskorrigerare-ryggstod",
      "elektrisk-fotfil",
      "elektrisk-munduschare",
      "spikmatta-akupressurmatta-kudde-rygg-nacke",
    ],
    "Köksredskap & Tillbehör": [
      "manuell-mathackare",
      "knivslip-4-steg",
      "keramisk-kaffekopp-stilren-handgjord-vintagekopp",
      "vinkylare-med-luftare-och-upphallare-rostfritt",
    ],
  };
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

  // "Veckans fynd": fyll i FÖRSTA HAND med redan visuellt granskade, proffsiga
  // produkter (samma kurerade slugs som hero/kategori-mosaikerna använder — inga
  // text-/mått-overlays, loggor eller plastförpackningar). Backfilla sedan med
  // mixByCategory MEN exkludera MOSAIC_DENYLIST så kända dåliga bilder inte
  // slinker in (tidigare gjorde slice(0,8) det utan filter).
  const VETTED_SLUGS = Array.from(new Set([
    ...Object.values(PREMIUM_CURATION).flat(),
    ...Object.values(HERO_CURATION).flat(),
  ]));
  const bySlug = new Map(allProducts.map((p) => [p.slug, p] as const));
  const weekly: typeof allProducts = [];
  const usedWeekly = new Set<string>(usedHero); // återanvänd inte hero-produkterna
  for (const slug of VETTED_SLUGS) {
    if (weekly.length >= 8) break;
    const p = bySlug.get(slug);
    if (p && p.img && !usedWeekly.has(slug)) { weekly.push(p); usedWeekly.add(slug); }
  }
  // Backfill: varierad mix, men hoppa över denylistade (dåliga bilder) och redan valda.
  if (weekly.length < 8) {
    for (const p of mixByCategory(allProducts, cols)) {
      if (weekly.length >= 8) break;
      if (!p.img || usedWeekly.has(p.slug) || MOSAIC_DENYLIST.has(p.slug)) continue;
      weekly.push(p); usedWeekly.add(p.slug);
    }
  }
  const products = weekly;

  const catCounts = new Map<string, number>();
  for (const p of allProducts) for (const cid of (p.collectionIds || [])) catCounts.set(cid, (catCounts.get(cid) || 0) + 1);
  const catTiles = cols
    .map((c) => ({ ...c, count: catCounts.get(c.id) || 0 }))
    .filter((c) => c.count >= 4)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((c) => {
      const inCat = allProducts.filter((p) => p.img && (p.collectionIds || []).includes(c.id));
      const slugMap = new Map(inCat.map((p) => [p.slug, p]));
      const mosaic: typeof inCat = [];
      const used = new Set<string>();
      // 1. Curated picks
      for (const slug of PREMIUM_CURATION[c.name] || []) {
        const p = slugMap.get(slug);
        if (p && !used.has(slug)) { mosaic.push(p); used.add(slug); if (mosaic.length >= 4) break; }
      }
      // 2. Fill with non-denylisted
      if (mosaic.length < 4) for (const p of inCat) {
        if (used.has(p.slug) || MOSAIC_DENYLIST.has(p.slug)) continue;
        mosaic.push(p); used.add(p.slug);
        if (mosaic.length >= 4) break;
      }
      // 3. Last resort
      if (mosaic.length < 4) for (const p of inCat) {
        if (used.has(p.slug)) continue;
        mosaic.push(p); used.add(p.slug);
        if (mosaic.length >= 4) break;
      }
      return { ...c, mosaic };
    });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="hero">
        <div className="container">
          <div className="herogrid">
            <div className="heroinner">
              <span className="badge">✦ Noga utvalda fynd · Nytt varje vecka</span>
              <h1>Fynda allt – till <em>låga priser</em></h1>
              <p>Hem, mode, teknik och fritid för hela familjen. Skickas snabbt och tryggt – hela vägen hem till din dörr.</p>
              <div className="btns">
                <a className="btn btn-primary" href="#produkter">Handla nu →</a>
                <a className="btn btn-ghost" href="#kategorier">Se alla kategorier</a>
              </div>
              <div className="herotrust">
                <span><i className="dot" /> Fri frakt över 499 kr</span>
                <span><i className="dot" /> 14 dagars ångerrätt</span>
                <span><i className="dot" /> Google 4,9★</span>
              </div>
            </div>
            <div className="heromosaic">
              <div className="mcol">
                {heroProducts.slice(0, 2).map((p, i) => (
                  <a className="herotile" key={p.slug} href={`/produkt/${p.slug}`}>
                    <Image src={p.img} alt={p.name} fill priority={i === 0} sizes="(max-width:880px) 42vw, 22vw" />
                    {p.price && <span className="htag">{p.price}</span>}
                  </a>
                ))}
              </div>
              <div className="mcol mcol-offset">
                {heroProducts.slice(2, 4).map((p) => (
                  <a className="herotile" key={p.slug} href={`/produkt/${p.slug}`}>
                    <Image src={p.img} alt={p.name} fill sizes="(max-width:880px) 42vw, 22vw" />
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
          <span className="uspitem"><svg viewBox="0 0 24 24" fill="none"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="7" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" /><circle cx="17.5" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" /></svg>Snabb leverans</span>
          <span className="uspitem"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>Trygg Klarna-betalning</span>
          <span className="uspitem"><svg viewBox="0 0 24 24" fill="none"><path d="M9 14L4 9l5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 9h11a5 5 0 0 1 5 5v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>14 dagars ångerrätt</span>
          <span className="uspitem">⭐ Google 4,9 (21 omdömen)</span>
        </div>
      </div>

      {catTiles.length > 0 && (
        <section className="sec" id="kategorier">
          <div className="container">
            <div className="sechead">
              <div className="eyebrow">Utforska</div>
              <h2>Handla efter kategori</h2>
              <p>Hitta dina fynd snabbt – sortimentets största kategorier.</p>
            </div>
            <div className="catmosaic-grid">
              {catTiles.map((c) => (
                <a className="catmtile" key={c.id} href={`/kategori/${c.slug}`} aria-label={`${c.name}, ${c.count} produkter`}>
                  <div className="catmtile-grid">
                    {c.mosaic.map((p, i) => (
                      <div className="catmtile-cell" key={p.slug + i}>
                        <Image src={p.img} alt="" fill sizes="(max-width:540px) 50vw, (max-width:880px) 25vw, 17vw" />
                      </div>
                    ))}
                  </div>
                  <div className="catmtile-meta">
                    <span className="catmtile-name">{c.name}</span>
                    <span className="catmtile-count">{c.count} produkter</span>
                    <span className="catmtile-arr" aria-hidden>→</span>
                  </div>
                </a>
              ))}
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
          <div className="center"><a className="linkbtn" href="/butik">Visa hela sortimentet →</a></div>
        </div>
      </section>

      <section className="sec why">
        <div className="container">
          <div className="sechead">
            <div className="eyebrow">Trygg svensk e-handel</div>
            <h2>Därför handlar du hos Fyndplats</h2>
          </div>
          <div className="cards">
            <div className="card"><div className="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="7" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" /><circle cx="17.5" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" /></svg></div><h3>Snabb &amp; spårbar leverans</h3><p>Fri frakt över 499 kr. Följ paketet hela vägen hem.</p></div>
            <div className="card"><div className="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></div><h3>Trygg betalning med Klarna</h3><p>Kort, Swish eller faktura – du väljer själv.</p></div>
            <div className="card"><div className="ic"><svg viewBox="0 0 24 24" fill="none"><path d="M9 14L4 9l5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 9h11a5 5 0 0 1 5 5v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></div><h3>14 dagars ångerrätt</h3><p>Ändrat dig? Enkel och trygg retur enligt lag.</p></div>
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
