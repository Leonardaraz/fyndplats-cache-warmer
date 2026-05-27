import Image from "next/image";
import { getProducts, getCollections } from "../lib/products";
import { SiteHeader, SiteFooter } from "../components/site";
import { ProductCard } from "../components/productcard";

const categories = [
  { label: "Elektronik", slug: "elektronik", img: "https://static.wixstatic.com/media/nsplsh_677a396e6a64307a596251~mv2_d_4543_2927_s_4_2.jpg/v1/fill/w_487,h_315,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Image%20by%20Davide%20Boscolo.jpg" },
  { label: "Skönhet & Hälsa", slug: "skonhet-och-halsa", img: "https://static.wixstatic.com/media/11062b_e28b14eefbfe42da87f53f3c36946e1d~mv2.jpg/v1/fill/w_471,h_315,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/yoga.jpg" },
  { label: "Mode & Accessoarer", slug: "mode-och-accessoarer", img: "https://static.wixstatic.com/media/11062b_367cd9d02f1f411e9e87707d9cb5a4fa~mv2_d_2717_1811_s_2.jpg/v1/fill/w_487,h_325,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Modern%20Watch.jpg" },
  { label: "Hem & Inredning", slug: "hem-och-inredning", img: "https://static.wixstatic.com/media/7e702b9782b74bd0a817aa0ef9c17a67.jpg/v1/fill/w_476,h_315,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Vardagsrum.jpg" },
  { label: "Husdjur", slug: "husdjur", img: "https://static.wixstatic.com/media/11062b_55e976feb9ef42ae87ff8eef2269e582~mv2.jpg/v1/fill/w_471,h_315,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Hund%20och%20katt%20i%20kontakt.jpg" },
  { label: "Barn & Familj", slug: "barn-och-familj", img: "https://static.wixstatic.com/media/11062b_568ec9bc56854149aa93379800659d18~mv2.jpeg/v1/fill/w_487,h_325,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/F%C3%A4rgglada%20leksaker.jpeg" },
];

const HERO = "https://static.wixstatic.com/media/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg/v1/fill/w_1600,h_353,al_c,q_85,enc_avif,quality_auto/b379ce_0e6a6260c9f243b3afd79cbaf147b67b~mv2.jpg";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: "Fyndplats",
  url: "https://www.fyndplats.se",
  description: "Svensk webbutik för kvalitetsprodukter till låga priser.",
  email: "info@fyndplats.com",
  telephone: "+46736630990",
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "20" },
};

export default async function Home() {
  const [allProducts, cols] = await Promise.all([getProducts(), getCollections()]);
  const products = allProducts.slice(0, 8);
  const catHref = (label: string) => {
    const c = cols.find((x) => x.name.toLowerCase() === label.toLowerCase());
    return c ? `/kategori/${c.slug}` : "/butik";
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SiteHeader />

      <section className="hero">
        <Image src={HERO} alt="" fill priority sizes="100vw" style={{ objectFit: "cover", zIndex: 0 }} />
        <div className="container">
          <div className="heroinner">
            <span className="badge">✦ Nyheter varje vecka</span>
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
        </div>
      </section>

      <div className="usp">
        <div className="container usprow">
          <span className="uspitem"><svg viewBox="0 0 24 24" fill="none"><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><circle cx="7" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" /><circle cx="17.5" cy="17" r="1.7" stroke="currentColor" strokeWidth="1.7" /></svg>Snabb leverans</span>
          <span className="uspitem"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2l8 4v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>Trygg Klarna-betalning</span>
          <span className="uspitem"><svg viewBox="0 0 24 24" fill="none"><path d="M9 14L4 9l5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 9h11a5 5 0 0 1 5 5v1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>14 dagars ångerrätt</span>
          <span className="uspitem">⭐ Google 4,9 (20 omdömen)</span>
        </div>
      </div>

      <section className="sec" id="kategorier">
        <div className="container">
          <div className="sechead">
            <div className="eyebrow">Utforska</div>
            <h2>Handla efter kategori</h2>
            <p>Hitta dina fynd snabbt – sex populära kategorier.</p>
          </div>
          <div className="catgrid">
            {categories.map((c) => (
              <a className="cat" key={c.slug} href={catHref(c.label)}>
                <Image className="catimg" src={c.img} alt={c.label} fill sizes="(max-width:540px) 100vw, (max-width:880px) 50vw, 33vw" />
                <div className="lbl">{c.label}<span className="arr">→</span></div>
              </a>
            ))}
          </div>
        </div>
      </section>

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

      <SiteFooter />
    </>
  );
}
