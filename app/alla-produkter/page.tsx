import { getProducts, getCollections, forListings } from "../../lib/products";
import { forListClient } from "../../lib/list-payload";
import { currentDayMs, orderRecommended } from "../../lib/sort-products";
import { universalCollectionIds } from "../../lib/related-pick";
import { jsonLdString } from "../../lib/seo";
import { ShopBrowser } from "../../components/shopbrowser";
import { attachRatings } from "../../lib/review-aggregates";
import { CategoryDropdown } from "../../components/categorydropdown";
import { ProductIndex } from "../../components/product-index";
import { pageMeta } from "../../lib/seo";

export const metadata = pageMeta(
  "Alla produkter – hela sortimentet",
  "Bläddra hela Fyndplats-sortimentet. Filtrera på pris, rea och kategori. Fri frakt över 499 kr, trygga betalningar med Klarna.",
  "/alla-produkter",
  "512c0f177326223c"
);

// ISR, 1 timme — samma takt som /kategori, /produkt och sitemapen.
//
// Sidan läste tidigare searchParams (?kategori=X) och filtrerade listan på
// servern. Det gjorde hela routen dynamisk: ingen CDN-cache, ingen ETag, full
// origin-rendering av 1 428 kB vid VARJE hämtning — också Googlebots, som
// därmed aldrig kunde få ett 304 på sajtens tyngsta sida.
//
// Parametern var redan överflödig. Kategori-dropdownen länkar till
// /kategori/[slug] (components/categorydropdown-client.tsx), inget i appen
// bygger ?kategori=-länkar, och Search Console visar 0 klick och 0 visningar på
// parametern över 92 dagar. /kategori/[slug] gör samma jobb, statiskt.
// En okänd ?kategori= ignoreras och sidan renderas som vanligt. Att i stället
// omdirigera den till /kategori/X byggde en OÄNDLIG LOOP (bevisad på preview):
// Next skickar med query-värden till destinationen, och /kategori/ovrigt
// omdirigerar redan hit — se den längre noten i app/butik/page.tsx.
// Sidan visar därför alltid HELA sortimentet — som namnet säger.
export const revalidate = 3600;

export default async function AllaProdukter() {
  const [allProducts, collections] = await Promise.all([getProducts(), getCollections()]);
  const products = forListings(allProducts); // dölj ev. slutsålda från listan (opt-in)
  // Rekommenderat är sidans standardordning (Leonard 2026-08-21) — samma som
  // ShopBrowsers defaultSort "img", och samma som kategorisidorna redan hade.
  // Ersätter Nyast, som sorterade på importdatum: hela katalogen är importerad
  // juni–augusti 2026, så "nyast" särskilde knappt något.
  //
  // Ordningen förberäknas här, med EXAKT samma indata som klientens useMemo
  // räknar om den med, annars kastas rutnätet om inför ögonen vid hydrering.
  // attachRatings MÅSTE därför köra FÖRE orderRecommended: recommendedScore
  // läser p.rating, och gör den det på en olik lista blir ordningen en annan.
  //
  // dagMs skickas vidare till ShopBrowser. Sidan är ISR-cachad (revalidate
  // ovan), så HTML:en kan bära gårdagens dag i upp till en timme efter midnatt.
  // Räknade klienten ut sin egen dag skulle rutnätet sorteras om vid hydrering:
  // uppmätt över 870 produkter med katalogens signalprofil byter 25,9 % plats,
  // största hopp 60 platser, och de 24 som syns utan att scrolla ändras.
  const dagMs = currentDayMs();
  const rated = await attachRatings(products);
  const list = orderRecommended(rated, universalCollectionIds(rated), dagMs);

  // JSON-LD: CollectionPage + BreadcrumbList (samma mönster som /butik) så Google
  // förstår att detta är en produktlistning.
  const pageName = "Alla produkter – hela sortimentet";
  const pageUrl = "https://www.fyndplats.se/alla-produkter";
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
      { "@type": "ListItem", position: 2, name: "Butik", item: "https://www.fyndplats.se/butik" },
      { "@type": "ListItem", position: 3, name: "Alla produkter", item: pageUrl },
    ],
  };
  const collectionPageLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageName,
    url: pageUrl,
    description: "Bläddra hela Fyndplats-sortimentet. Filtrera på pris, rea och kategori.",
    isPartOf: { "@type": "WebSite", name: "Fyndplats", url: "https://www.fyndplats.se/" },
    numberOfItems: list.length,
  };

  return (
    <div className="alla-prod">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(collectionPageLd) }} />
      {/* PREMIUM HERO — samma look som /butik (cream, serif, brödsmulor) */}
      <section className="butik-hero alla-prod-hero">
        <div className="container">
          <nav className="butik-crumbs" aria-label="Brödsmulor">
            <a href="/">Hem</a>
            <span aria-hidden="true">/</span>
            <a href="/butik">Butik</a>
            <span aria-hidden="true">/</span>
            <em>Alla produkter</em>
          </nav>
          <div className="butik-hero-inner">
            <span className="butik-hero-eyebrow">Hela sortimentet</span>
            <h1 className="butik-hero-title">Alla produkter</h1>
            <p className="butik-hero-lede">
              {`${products.length} noga utvalda fynd inom hem, elektronik, kök och mer – varje produkt handplockad för svenska hem.`}
              <span className="butik-hero-meta"> {products.length} produkter · {collections.length} kategorier · Fri frakt över 499 kr</span>
            </p>
          </div>
        </div>
      </section>

      <section className="alla-prod-body">
        <div className="container">
          <CategoryDropdown products={products} collections={collections} />

          {/* forClient skär bort de fält klienten aldrig läser — se ListProduct
              i lib/products.ts. Mätt: 1 005 kB av 2 704 på den här sidan. */}
          <ShopBrowser products={forListClient(list, dagMs)} dayMs={dagMs} />

          {/* Crawlbart A–Ö-index över HELA sortimentet: gridden ovan visar 24
              (perf-gräns) och "Visa fler" är en JS-knapp — utan denna lista
              saknade ~330 produkter interna ankarlänkar helt. Alltid hela
              sortimentet: sidans canonical är /alla-produkter, så hubben ska
              bära alla länkar. */}
          <ProductIndex products={products} />
        </div>
      </section>
    </div>
  );
}
