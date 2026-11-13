import Image from "next/image";
import Link from "next/link";
import { jsonLdString, pageMeta } from "../../lib/seo";
import { getHelaKatalogen, getCollections, forListings, dedupeProducts } from "../../lib/products";
import { ProductCard } from "../../components/productcard";
import { attachRatings } from "../../lib/review-aggregates";
import { buildGroupCards, MOSAIC_DENYLIST, categoryHero } from "../../lib/category-groups";
import { getHiddenFromFeatured } from "../../lib/image-scores";
import { tightFillUrl } from "../../lib/wix-image";
import { productCountLabel, categoryCountLabel, tusental } from "../../lib/rating";
import { unsplashIForm } from "../../lib/bildformat";
import { populartNu } from "../../lib/sok-tom";
import { PrefetchLink } from "../../components/prefetch-link";
import { SHIMMER_BLUR } from "../../lib/lqip";
import { FREE_SHIPPING_OVER_KR, STANDARD_SHIPPING_KR } from "../../lib/shipping";
import "./butik.css";

export const metadata = pageMeta(
  "Butik – utforska hela vårt sortiment",
  "Köp prisvärda fynd online hos Fyndplats – möbler, hem, kök, trädgård, leksaker, husdjur & mer. Fri frakt över 499 kr, Klarna & 30 dagars öppet köp.",
  "/butik",
  "c3bea817cdcb3351"
);

// ISR, 1 timme — samma takt som /kategori, /produkt och sitemapen.
//
// Sidan läste tidigare searchParams (?kategori=X) enbart för att vidarebefordra
// gamla länkar till /kategori/[slug]. Det gjorde hela routen dynamisk: ingen
// CDN-cache, ingen ETag, full origin-rendering av 250 kB vid VARJE hämtning —
// också Googlebots. En okänd ?kategori= ignoreras nu, och sidan renderas som
// vanligt. (Den query-gatade omdirigeringen i next.config.ts byggde en oändlig
// loop via /kategori/ovrigt → /alla-produkter; se git-historiken.)
export const revalidate = 3600;

// ── Förslag 2026-11-12 ──────────────────────────────────────────────────
// Leonard: "designen där är inte heller snygg premium eller så, kolla vad du
// kan göra för att det ska bli mycket bättre och optimera hastigheten".
//
// Mätt på produktionen samma dag (390 × 844 och 1280 × 900):
//   - sidan var 19 387 px hög på mobilen och 10 456 px på datorn;
//   - 171 bilder, varav en tumnagel på 48 px för var och en av de 127
//     underkategorierna, och srcset-texten för dem vägde 294 kB av sidans
//     695 kB HTML;
//   - avdelningarna stod två gånger (listan i hjälten och korten under);
//   - Veckans fynd valdes på bildpoäng, så raden visade ett skåp för
//     brandfarliga vätskor och en flaggstång.
// Nu: en bild per avdelning, underkategorierna som ett register i text,
// varorna som kunderna faktiskt köper, och löftena en gång längst ner.

/** Genvägarna under rubriken. Sidor som redan finns i butiken. */
const GENVAGAR = [
  { href: "/rea", text: "Rea" },
  { href: "/under-500-kr", text: "Under 500 kr" },
  { href: "/under-1000-kr", text: "Under 1 000 kr" },
  { href: "/fyndauktion", text: "Fyndauktionen" },
  { href: "/kopguider", text: "Köpguider" },
] as const;

export default async function Butik() {
  const [allProducts, collections] = await Promise.all([getHelaKatalogen(), getCollections()]);
  const products = forListings(allProducts); // dölj ev. slutsålda från listan (opt-in)
  const groups = buildGroupCards(products, collections);
  // Talen i hjälten räknas ur samma lista som sidan visar, så att antalet
  // kategorier är exakt så många länkar som registret har.
  const antalKategorier = groups.reduce((s, g) => s + g.subs.length, 0);

  // Det som kunderna köper: flest sålda enheter de senaste 90 dagarna
  // (lib/sok-tom.ts, samma urval som söksidan utan träff). Gömda bilder och
  // varor med text eller förpackning i bilden står utanför, som förut.
  const hiddenFromFeatured = await getHiddenFromFeatured();
  const pool = products.filter((p) => !hiddenFromFeatured.has(p.id) && !MOSAIC_DENYLIST.has(p.slug));
  const populara = await attachRatings(dedupeProducts(populartNu(pool, 12)).slice(0, 8));
  // Etiketten lovar "mest köpt" bara när varje vara i raden har sålts.
  const allaSalda = populara.length > 0 && populara.every((p) => (p.popularity ?? 0) > 0);

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
    description: "Bläddra Fyndplats butiksavdelningar – möbler, hem & inredning, kök, trädgård, husdjur och mer.",
    hasPart: groups.map((g) => ({
      "@type": "CollectionPage",
      name: g.main.name,
      url: `https://www.fyndplats.se/kategori/${g.main.slug}`,
    })),
  };

  return (
    <div className="butik2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(collectionPageLd) }} />

      <section className="b2-hjalte">
        <div className="container">
          <nav className="butik-crumbs" aria-label="Brödsmulor">
            <Link href="/">Hem</Link>
            <span aria-hidden="true">/</span>
            <em>Butik</em>
          </nav>
          <div className="b2-hjalte-rad">
            <div className="b2-hjalte-text">
              <div className="eyebrow">Hela sortimentet</div>
              <h1>Hitta dina nästa fynd.</h1>
              <p className="b2-ingress">
                Möbler, heminredning, kök, trädgård, leksaker och husdjur – noga utvalda fynd, samlade på ett ställe.
              </p>
            </div>
            <a className="btn btn-primary b2-cta" href="/alla-produkter">
              Se alla {productCountLabel(products.length)} <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="b2-hjalte-fot">
            <ul className="b2-fakta" aria-label="Sortimentet i siffror">
              <li><span className="b2-tal">{tusental(products.length)}</span><span className="b2-etikett">produkter</span></li>
              <li><span className="b2-tal">{groups.length}</span><span className="b2-etikett">avdelningar</span></li>
              <li><span className="b2-tal">{tusental(antalKategorier)}</span><span className="b2-etikett">kategorier</span></li>
            </ul>
            <nav className="b2-genvagar" aria-label="Genvägar">
              {GENVAGAR.map((g) => (
                <a key={g.href} href={g.href}>{g.text}</a>
              ))}
            </nav>
          </div>
        </div>
      </section>

      <section className="sec b2-avdsek" id="avdelningar">
        <div className="container">
          <div className="h2rad">
            <div>
              <div className="eyebrow">{groups.length} avdelningar</div>
              <h2>Välj avdelning</h2>
            </div>
          </div>
          <div className="b2-avdrad">
            {groups.map((g, i) => {
              // Samma bild som avdelningens egen sida och startsidan, i rutans
              // form (lib/bildformat.ts). Produktbilden bara om stämningsbild saknas.
              const bild = unsplashIForm(categoryHero(g.main.name), "4:3") || g.heroImg || g.thumbs[0];
              return (
                <PrefetchLink className="b2-avd" key={g.main.id} href={`/kategori/${g.main.slug}`}>
                  <span className="b2-avd-bild" aria-hidden="true">
                    {bild && (
                      <Image
                        src={tightFillUrl(bild, 560, 420)}
                        alt=""
                        fill
                        placeholder="blur"
                        blurDataURL={SHIMMER_BLUR}
                        // 30 % av bredden på mobilen, inte rutans 44 %: en telefon med tre
                        // pixlar per punkt väljer då 384 px i stället för 640 (samma
                        // avvägning som startsidans kategorirutor). Tre kolumner upp
                        // till 1 100 px, där rutan är 30 % av bredden (337 px vid 1 100).
                        sizes="(max-width:1100px) 30vw, 270px"
                        quality={60}
                        // De fyra första hämtas direkt, utan hög prioritet. Mätt
                        // 2026-11-12: på 768, 1 100 och 1 200 px står första raden i
                        // vyn och är större än rubrikens text (39 900, 85 339 och
                        // 54 069 px² mot 23 558, 42 987 och 51 398), så sidans största
                        // element är en bild där. Reacts server förladdar en bild som
                        // inte är lazy, så webbläsaren hittar dem tidigt; på telefonen
                        // är rubriken och ingressen störst och bilderna små.
                        loading={i < 4 ? "eager" : undefined}
                      />
                    )}
                  </span>
                  <span className="b2-avd-text">
                    <span className="b2-avd-namn">{g.main.name}</span>
                    <span className="b2-avd-antal">{productCountLabel(g.count)}</span>
                  </span>
                  <span className="b2-avd-tag">{g.tag}</span>
                </PrefetchLink>
              );
            })}
            {/* Den tolfte rutan: hela sortimentet. Elva avdelningar lämnade ett hål i
                rutnätet på datorn (4 + 4 + 3). */}
            <PrefetchLink className="b2-avd b2-avd-alla" href="/alla-produkter">
              <span className="b2-avd-bild b2-alla-yta" aria-hidden="true">
                <span className="b2-alla-tal">{tusental(products.length)}</span>
                <span className="b2-alla-text">produkter i alla avdelningar</span>
              </span>
              <span className="b2-avd-text">
                <span className="b2-avd-namn">Hela sortimentet</span>
                <span className="b2-avd-antal">Se alla <span aria-hidden="true">→</span></span>
              </span>
              <span className="b2-avd-tag">Filtrera på pris, rea och kategori.</span>
            </PrefetchLink>
          </div>
        </div>
      </section>

      {populara.length >= 4 && (
        <section className="sec b2-populart">
          <div className="container">
            <div className="h2rad">
              <div>
                <div className="eyebrow">{allaSalda ? "Mest köpt de senaste 90 dagarna" : "Urval ur sortimentet"}</div>
                <h2>Populärt just nu</h2>
              </div>
              <PrefetchLink className="h2lank" href="/alla-produkter">Alla produkter <span aria-hidden="true">→</span></PrefetchLink>
            </div>
            <div className="prodgrid listgrid">
              {populara.map((p) => <ProductCard p={p} key={p.slug} tvaKolumner />)}
            </div>
          </div>
        </section>
      )}

      <section className="sec b2-registersek" id="kategorier">
        <div className="container">
          <div className="h2rad">
            <div>
              <div className="eyebrow">{categoryCountLabel(antalKategorier)}</div>
              <h2>Alla kategorier</h2>
            </div>
          </div>
          {/* Registret i text: varje underkategori en gång, utan bild. Förut bar varje
              länk en egen tumnagel (127 bilder och 294 kB srcset). */}
          <div className="b2-register">
            {groups.map((g) => (
              <div className="b2-grupp" key={g.main.id}>
                <h3 className="b2-grupp-rubrik">
                  <a href={`/kategori/${g.main.slug}`}>{g.main.name}</a>
                  <span className="b2-grupp-antal">{tusental(g.count)}</span>
                </h3>
                {g.subs.length > 0 && (
                  <ul className="b2-grupp-lista">
                    {g.subs.map((s) => (
                      <li key={s.id}>
                        <a href={`/kategori/${s.slug}`}>
                          <span>{s.name}</span>
                          <span className="b2-sub-antal">{tusental(s.count)}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="b2-tryggt" aria-label="Därför Fyndplats">
        <div className="container">
          <ul>
            <li>
              <a href="/kopvillkor#leverans">
                <span className="b2-tryggt-rubrik">Fri frakt över {FREE_SHIPPING_OVER_KR} kr</span>
                <span className="b2-tryggt-text">Annars {STANDARD_SHIPPING_KR} kr, till hela Sverige.</span>
              </a>
            </li>
            <li>
              <a href="/returer">
                <span className="b2-tryggt-rubrik">30 dagars öppet köp</span>
                <span className="b2-tryggt-text">14 dagars ångerrätt, sedan öppet köp till dag 30.</span>
              </a>
            </li>
            <li>
              <a href="/eu-lager-garanti">
                <span className="b2-tryggt-rubrik">Ingen tull</span>
                <span className="b2-tryggt-text">Allt skickas från lager inom EU.</span>
              </a>
            </li>
            <li>
              <a href="/kopvillkor#betalning">
                <span className="b2-tryggt-rubrik">Kort, Klarna, Apple Pay</span>
                <span className="b2-tryggt-text">Och Google Pay. Krypterat hela vägen.</span>
              </a>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
