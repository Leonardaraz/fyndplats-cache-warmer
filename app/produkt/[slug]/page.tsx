import type { Metadata } from "next";
import { jsonLdString } from "../../../lib/seo";
import { faqPageJsonLd } from "../../../lib/faq-jsonld";
import { notFound, permanentRedirect } from "next/navigation";
import { getProductRedirect } from "../../../lib/redirects";
import { ProductView } from "../../../components/productview";
import { forvalIndex, forvalKombination } from "../../../lib/pdp-forval";
import { colorKeysOf } from "../../../lib/variant-color-image";
import { ProductCard } from "../../../components/productcard";
import { attachRatings } from "../../../lib/review-aggregates";
import { getProduct, getProducts, getCollections, dedupeProducts, forListings, fetchVarumarken, type Product } from "../../../lib/products";
import { BUTIKENS_MARKE, varumarke } from "../../../lib/varumarke";
import { valjBrodsmula } from "../../../lib/breadcrumb-category";
import { categoryIndexable, countPerCategory } from "../../../lib/category-threshold";
import { curatedRelatedSlugs, pickRelated } from "../../../lib/related-products";
import { produktGrannar } from "../../../lib/product-neighbours";
import { ProductBrowse } from "../../../components/product-browse";
import { getBlurDataURL } from "../../../lib/lqip";
import { getProductReviews } from "../../../lib/reviews";
import { getGpsr } from "../../../lib/gpsr";
import { gpsrFlikHtml, sakerhetUrBeskrivning } from "../../../lib/gpsr-flik";
import { reviewSchemaMode, shouldEmitReviewSchema } from "../../../lib/review-schema";
import { ProductReviews } from "../../../components/ProductReviews";
import { PdpReviewsSection } from "../../../components/pdp-reviews-section";
import { ProgCrossLinks } from "../../../components/programmatic";
import { blogLinksForPage } from "../../../lib/seo/programmatic";
import { NAV_EXCLUDED } from "../../../lib/category-groups";
import { DELIVERY_MIN_DAYS, DELIVERY_MAX_DAYS, FREE_SHIPPING_FROM_KR, STANDARD_SHIPPING_KR } from "../../../lib/shipping";
import { prisGiltigTill } from "../../../lib/pris-giltig";

// ISR: produktsidan cachas i SEX TIMMAR, och det är ett säkerhetsnät — inte
// färskheten. En ändring på produkten (pris, lager, synlighet, text, bilder,
// recensioner) tömmer sidan direkt: /api/cron/uppdatera-andrade läser Wix
// updatedDate och motorns recensionsändringar var femte minut, motorn säger
// till vid fyndauktionens prissteg (/api/admin/uppdatera-produkter), och
// ordrar tömmer sidan i app/api/wix-webhook/route.ts. Allt i lib/produkt-cache.ts.
//
// ☠️ TALET MÅSTE STÅ SOM LITERAL (Next läser det statiskt) och vara samma som
// PRODUKTSIDA_SEKUNDER — lib/produkt-cache.test.ts håller ihop dem. Och ingen
// hämtning på sidans väg får ha kortare revalidate, för då gäller den för hela
// sidan: V3-hämtningens 300 s gjorde att sidan i praktiken byggdes om var femte
// minut (mätt 2026-09-30, ~24 000 ombyggnader per dygn). Reservdata förkortar
// livslängden till fem minuter via lib/kort-livslangd.ts, med flit.
export const revalidate = 21600;
// dynamicParams=true: produkter utanför generateStaticParams (long-tail + nya
// efter deploy) renderas on-demand vid första träffen och cachas sen.
export const dynamicParams = true;

// INGA PRODUKTSIDOR FÖRBYGGS VID BUILD (2026-10-01; var 40).
//
// De förbyggda sidorna hamnar som egna funktioner hos Vercel, och de startar
// kalla gång på gång. Varje kallstart hämtar hela Wix-katalogen (getProducts,
// ~60 anrop i rad, runt en minut) innan sidan kan byggas. Mätt 2026-09-30: loggen
// "[wix] live products loaded" kom på 40 olika sökvägar under tre timmar, nästan
// bara de förbyggda, och julgranen/bäddsoffan tog 57 s–1 min att bygga (P75).
// Utan förbygge renderas de i den vanliga /produkt/[slug]-funktionen, som redan
// är varm, som alla andra ~3 700 produkter. dynamicParams=true ovan gör att ingen
// sida blir 404, och /api/cron/varm-katalogen värmer katalogen efter en deploy.
// SEO opåverkat: sitemap.xml listar fortfarande alla produkter.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Produkten hittades inte" };
  // Föredra merchantens kuraterade Wix-SEO (korta, Google-anpassade) när de finns;
  // annars dagens name/blurb. seoTitle innehåller redan "| Fyndplats", så vi sätter
  // den som `absolute` för att inte få templaten (%s | Fyndplats) att dubblera den.
  // Fallback-blurben är rått avhuggen vid 220 tecken (lib/products.ts) — för
  // meta-description trunkerar vi på ORDgräns ≤155 så SERP-snippeten inte kapar
  // mitt i ett ord. Kuraterad seoDescription används alltid orörd.
  const trimDesc = (s: string) => (s.length <= 155 ? s : s.slice(0, 155).replace(/\s+\S*$/, ""));
  const desc = p.seoDescription || (p.blurb ? trimDesc(p.blurb) : `${p.name} – köp hos Fyndplats. Fri frakt över 499 kr.`);
  return {
    title: p.seoTitle ? { absolute: p.seoTitle } : p.name,
    description: desc,
    alternates: { canonical: `https://www.fyndplats.se/produkt/${p.slug}` },
    // type/locale/siteName måste sättas här: Next ERSÄTTER layoutens openGraph
    // per fält-grupp (ärver inte), så utan dem tappar PDP og:type/locale/site_name.
    openGraph: { type: "website", locale: "sv_SE", siteName: "Fyndplats", title: p.seoTitle || p.name, description: desc, url: `https://www.fyndplats.se/produkt/${p.slug}`, images: p.img ? [p.img] : [] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) {
    // Permanent borttagen produkt? Slå upp redirect-tabellen (Wix CMS) och
    // svara 308 till närmaste levande produkt/kategori i stället för 404 —
    // bevarar länkvärde och räddar besökare från gamla länkar/annonser.
    const target = await getProductRedirect(slug);
    if (target) permanentRedirect(target);
    notFound();
  }

  const cols = await getCollections();
  // Brödsmulans/JSON-LD:ns kategorier: avdelning och den smalaste indexerbara
  // underkategorin (lib/breadcrumb-category.ts) — men ALDRIG promo-/rotkollektioner
  // (All Products, REA, Populära). Avdelningen används för synlig brödsmula,
  // breadcrumb-JSON-LD OCH GA4-kategori, så alla tre är konsekventa. Faller
  // tillbaka på "Butik" (visuellt) / utelämnas (JSON-LD) om produkten saknar en
  // riktig kategori.
  const ownCats = (p.collectionIds || [])
    .map((id) => cols.find((c) => c.id === id))
    .filter((c): c is (typeof cols)[number] => c !== undefined && !NAV_EXCLUDED.has(c.name));
  // navCols, inte cols: promo-kollektionerna (REA, Populära, All Products) är
  // föräldralösa och hade annars kunnat bli "avdelningen" för en produkt som
  // ligger i dem — samma NAV_EXCLUDED-filter som ownCats redan går igenom.
  const navCols = cols.filter((c) => !NAV_EXCLUDED.has(c.name));
  // Hela katalogen behövs ändå längre ner (relaterade, bläddring). Den är
  // modulcachad, så att hämta den redan här kostar inget extra anrop.
  const all = await getProducts();
  const brodsmula = valjBrodsmula(ownCats, navCols, countPerCategory(forListings(all)), categoryIndexable);
  const primaryCol = brodsmula.avdelning;
  const subCol = brodsmula.underkategori;

  // Riktiga importerade kundrecensioner (social proof + schema.org). Tom om inga.
  // Produktsäkerheten (GPSR, lib/gpsr-flik.ts) hämtas parallellt — null för
  // produkter utan uppgifter, och då visas ingen flik.
  // Märket ur Wix (ett svep för hela katalogen, cachat i sex timmar);
  // lib/varumarke.ts avgör vad det blir.
  const [reviewData, gpsr, marken] = await Promise.all([getProductReviews(p.id), getGpsr(p.id), fetchVarumarken()]);
  // Poleringens eget säkerhetsavsnitt i beskrivningen vinner över motorns data.
  const egnaSakerhetsrader = sakerhetUrBeskrivning(p.descriptionHtml);
  const gpsrHtml = gpsr
    ? gpsrFlikHtml({ ...gpsr, sakerhet: egnaSakerhetsrader ?? gpsr.sakerhet }, p.name)
    : null;

  // Trustpilot Product Reviews-widget matchar recensioner mot produktens SKU
  // (= Wix-produkt-ID). När business unit-ID:t är ifyllt visar vi Trustpilot;
  // annars faller vi tillbaka på de egna importerade recensionerna nedan.
  const trustpilotBU = (process.env.TRUSTPILOT_BUSINESS_UNIT_ID || "").trim();

  // Förvalet: valet sidan öppnar på (lib/pdp-forval), samma som ProductView
  // och döljningsskriptet längre ned räknar fram. Erbjudandet i strukturerad
  // data har förvalets pris och lager, inte produktens lägsta: hundvagnen
  // visade 1 899 kr medan datan sade 1 739 kr (extern audit 2026-10-07).
  const forval = (() => {
    const huvudbild = [p.img, ...p.gallery].find(Boolean);
    const tabell = p.variantTable ?? [];
    if ((p.variantAxes?.length ?? 0) >= 2 && tabell.length >= 1) {
      const kombo = forvalKombination(tabell, huvudbild);
      const rad = tabell.find((t) => Object.entries(kombo).every(([a, l]) => t.choices[a] === l));
      return { id: rad?.variantId, etiketter: Object.values(kombo), priceNum: rad?.priceNum, inStock: rad?.inStock };
    }
    if ((p.options?.choices.length ?? 0) >= 2) {
      const val = p.options!.choices[forvalIndex(p.options!.choices, huvudbild)];
      return { id: val?.variantId, etiketter: val ? [val.label] : [], priceNum: val?.priceNum, inStock: val?.inStock };
    }
    if (p.variants.length > 1) {
      return { id: p.variants[0]?.id, etiketter: [p.variants[0]?.label || ""], priceNum: undefined, inStock: undefined };
    }
    return { id: undefined, etiketter: [] as string[], priceNum: undefined, inStock: undefined };
  })();
  const erbjudandePris = forval.priceNum && forval.priceNum > 0 ? forval.priceNum : p.priceNum;
  const erbjudandeILager = forval.inStock ?? p.inStock;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.id,
    // Inkludera huvudbilden FÖRST + galleriet (galleriet utesluter numera hjälte-
    // fil-id:t, så Google får primärbilden här i stället för att den faller bort).
    image: Array.from(new Set([p.img, ...p.gallery].filter(Boolean))),
    // Samma preferens som meta-descriptionen ovan: kuraterad Wix-SEO när den
    // finns, annars blurb — så strukturerad data och snippet matchar.
    description: p.seoDescription || p.blurb,
    // Riktiga märkesvaror sitt eget märke, Aosoms white label Fyndplats.
    brand: { "@type": "Brand", name: varumarke(marken.get(p.id)) },
    offers: {
      "@type": "Offer",
      // Säljaren är alltid butiken, också när märket är någon annans.
      seller: { "@type": "Organization", name: BUTIKENS_MARKE, url: "https://www.fyndplats.se" },
      priceCurrency: p.currency,
      price: erbjudandePris,
      // Merchant-listing-rekommenderade fält (Search Console varnar annars).
      // Sista dagen i nästa månad: samma värde hela månaden, så sidan blir inte
      // "ny" för Vercel varje dygn (lib/pris-giltig.ts).
      priceValidUntil: prisGiltigTill(new Date()),
      availability: erbjudandeILager ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url: `https://www.fyndplats.se/produkt/${p.slug}`,
      // Fraktvillkoren speglar kassan exakt: fri frakt från 500 kr, annars 19 kr,
      // leverans 3–6 arbetsdagar (samma sanningskälla som resten av sajten).
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: erbjudandePris >= FREE_SHIPPING_FROM_KR ? 0 : STANDARD_SHIPPING_KR,
          currency: p.currency,
        },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "SE" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: DELIVERY_MIN_DAYS,
            maxValue: DELIVERY_MAX_DAYS,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "SE",
        returnPolicyCountry: "SE",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 30,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnShippingFees",
      },
    },
  };

  // AggregateRating + Review markup BARA när vi har riktiga recensioner OCH
  // switchen är på. Google straffar fejkade/hårdkodade betyg (review snippet
  // spam) — tidigare låg här ett statiskt 4.9/20.
  //
  // Switchen tillkom 2026-08-16: recensionerna är AliExpress-köpares omdömen om
  // samma produkt, inte våra egna kunders. Texten visas för kunden, men vi
  // lämnar inget maskinläsbart betygspåstående till Google förrän datan är
  // förstahands (Trustpilot Product Reviews / egna kundrecensioner).
  // Se lib/review-schema.ts.
  const reviewAverage = reviewData.average;
  if (
    reviewAverage != null
    // FÖRSTAHANDS-siffrorna, inte de synliga. De importerade omdömena får
    // visas för kunden men aldrig utge sig för att vara vårt betyg i Googles
    // ögon — det var hela poängen med att bygga egna omdömen.
    && shouldEmitReviewSchema(
      reviewSchemaMode(process.env.PRODUCT_REVIEW_SCHEMA),
      reviewData.firstPartyCount,
      reviewData.firstPartyAverage,
    )
  ) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: (reviewData.firstPartyAverage ?? 0).toFixed(1),
      reviewCount: String(reviewData.firstPartyCount),
      bestRating: "5",
      worstRating: "1",
    };
    // Upp till 10 enskilda Review-objekt för rich snippets — BARA egna kunders.
    // Ett importerat omdöme i listan hade gjort hela markeringen osann även om
    // snittet ovan var rätt räknat.
    jsonLd.review = reviewData.reviews.filter((r) => r.firstParty).slice(0, 10).map((r) => ({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: String(r.rating), bestRating: "5", worstRating: "1" },
      author: { "@type": "Person", name: r.displayName },
      ...(r.date ? { datePublished: r.date.slice(0, 10) } : {}),
      reviewBody: r.text,
    }));
  }

  const breadcrumbItems: { "@type": "ListItem"; position: number; name: string; item: string }[] = [
    { "@type": "ListItem", position: 1, name: "Hem", item: "https://www.fyndplats.se/" },
  ];
  if (primaryCol) {
    breadcrumbItems.push({ "@type": "ListItem", position: 2, name: primaryCol.name, item: `https://www.fyndplats.se/kategori/${primaryCol.slug}` });
    if (subCol) {
      breadcrumbItems.push({ "@type": "ListItem", position: 3, name: subCol.name, item: `https://www.fyndplats.se/kategori/${subCol.slug}` });
    }
    breadcrumbItems.push({ "@type": "ListItem", position: breadcrumbItems.length + 1, name: p.name, item: `https://www.fyndplats.se/produkt/${p.slug}` });
  } else {
    // Matcha den SYNLIGA brödsmulan (Hem → Butik → produkt) — schemat hoppade
    // tidigare över Butik-steget för okategoriserade produkter.
    breadcrumbItems.push({ "@type": "ListItem", position: 2, name: "Butik", item: "https://www.fyndplats.se/butik" });
    breadcrumbItems.push({ "@type": "ListItem", position: 3, name: p.name, item: `https://www.fyndplats.se/produkt/${p.slug}` });
  }
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  const specLines = p.specs ? p.specs.split(/(?=[A-ZÅÄÖ][a-zåäö]+:)/).map((s) => s.trim()).filter(Boolean) : [];
  const images = Array.from(new Set([p.img, ...p.gallery].filter(Boolean)));
  // Äkta low-res blur (16×16 webp från Wix-CDN) för galleriets HUVUDbild. Den
  // är LCP-elementet och optimerades tidigare med en generisk shimmer som såg
  // tom ut medan Vercel-bildoptimeraren kallstartade (1–3 s, Leonards rapport).
  // En riktig blur av produktbilden visar en igenkännbar förhandsbild direkt.
  const mainBlur = await getBlurDataURL(images[0] || "");

  // "Liknande produkter" – kuraterade LLM-val (data/related-products.json,
  // scripts/score-related.mjs: Opus 4.8 butiks-merchandiser — komplement +
  // prispassning) med meningsfullt kategori-överlapp som fallback/påfyllning.
  // All logik (universell-kategori-exkludering, i-lager, dedup, aldrig tomt) i den
  // testade rena pickRelated(). Se lib/related-products.test.ts.
  const related: Product[] = await attachRatings(pickRelated(p, all, curatedRelatedSlugs(p.slug), 4));

  // Föregående/nästa, så man slipper backa till kategorisidan för varje produkt.
  //
  // BLÄDDRINGEN GÅR I HELA HUVUDAVDELNINGEN, uppdelad i ett avsnitt per
  // underkategori. Räknaren räknar i det egna avsnittet ("19 av 19 i Solskydd &
  // Paviljonger") medan pilarna fortsätter förbi avsnittsgränsen — annars tar
  // bläddringen slut mitt i en avdelning, vilket ser ut som en bugg. Att hela
  // avdelningen är EN kedja är dessutom vad som gör steget tillbaka pålitligt;
  // se den mätta 26-procentsbuggen i lib/product-neighbours.ts.
  //
  // Saknar produkten kategori helt blir grannarna null och raden renderas inte.
  // dedupeProducts skickas in för att ordningen ska bli EXAKT kategorisidans —
  // den släpper produkter som delar bild med en tidigare, och utan den kunde
  // "nästa" peka på något som aldrig syntes i listan.
  //
  // Både cols och ownCats: ownCats säger vilken avdelning produkten hör till,
  // cols bygger avdelningens alla avsnitt.
  //
  // navCols, inte cols: se ovan.
  const grannar = produktGrannar(navCols, ownCats, all, p.slug, dedupeProducts);

  // Korskategori-upptäckt: länka vidare till övriga HUVUDavdelningar (exkl. produktens
  // egen). Bara giltiga /kategori/{slug} → noll 404. Samma on-brand chips som kategorisidan.
  const ownTopCats = new Set(
    (p.collectionIds || [])
      .map((cid) => {
        const c = cols.find((x) => x.id === cid);
        return c ? (c.parentId ?? c.id) : null;
      })
      .filter((x): x is string => Boolean(x)),
  );
  const deptLinks = cols
    // REA har egen menylänk → exkludera ur strippen (Populära behålls).
    .filter((c) => c.parentId === null && !ownTopCats.has(c.id) && c.slug !== "rea")
    .sort((a, b) => a.index - b.index)
    .map((c) => ({ href: `/kategori/${c.slug}`, label: c.name }));
  // Blogg-länkar för produkten. ÖMSESIDIGA först: en guide som länkar till den
  // här produktsidan visas här, oavsett om produktnamnet råkar finnas i guidens
  // rubrik eller meta-beskrivning (vinterförvarings-guiden ägnar ett avsnitt åt
  // dieselvärmaren men nämner den ingenstans i rubriken — produktsidan länkade
  // därför tillbaka till fel guide). Kategori + första ordet i namnet är kvar
  // som påfyllning; äkta-träff-filtrerat, tom lista → inget block.
  const blogLinks = await blogLinksForPage(
    `/produkt/${p.slug}`,
    [primaryCol?.name || "", p.name.split(/\s+/)[0] || ""].filter(Boolean),
  );

  // FAQPage-schema ur beskrivningens "Vanliga frågor"-sektion (modulen kommer
  // från motorn där generatorn bor — se docs/faq-jsonld-handover.md i det
  // repot; verifierad mot alla 510 produkter). null när sektionen saknas →
  // ingen script-tagg alls (tom FAQPage flaggas av Google som strukturfel).
  const faqLd = faqPageJsonLd(p.descriptionHtml || "");

  // Annonslänkar (?variant=, ?farg=) pekar ofta på ett annat val än förvalet.
  // Sidan är ISR-cachad och ritas med förvalet; väljaren byter först när JS
  // hydrerat, och på en vanlig mobil syntes förvalets bild och pris i nästan
  // en sekund (2026-10-01). Skriptet nedan körs innan produkten ritas och döljer
  // bild, pris och väljare (platsen behålls) när adressen avser ett annat val.
  // ProductView tar bort döljningen när valet gjorts; senast efter 4 s gör
  // skriptet det själv.
  const valVantar = (() => {
    const { id, etiketter } = forval;
    if (!id) return null;
    const farger = Array.from(new Set(etiketter.flatMap((e) => Array.from(colorKeysOf(e)))));
    const css =
      ".pdp .gmain img,.pdp .gtiles,.pdp-price,.klarna-osm-wrap,.pdp-variants,.sticky-buy-mobile{visibility:hidden}";
    return (
      "(function(){try{var q=new URLSearchParams(location.search),v=q.get('variant'),f=q.get('farg');" +
      `if(v?v!==${JSON.stringify(id)}:f?${JSON.stringify(farger)}.indexOf(f)<0:false){` +
      `var s=document.createElement('style');s.id='pdp-val-vantar';s.textContent=${JSON.stringify(css)};` +
      "document.head.appendChild(s);setTimeout(function(){s.remove()},4000)}}catch(e){}})()"
    );
  })();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(faqLd) }} />}

      <div className="container">
        <nav className="crumbs">
          <a href="/">Hem</a> <span>/</span>{" "}
          {primaryCol ? (
            <>
              <a href={`/kategori/${primaryCol.slug}`}>{primaryCol.name}</a> <span>/</span>{" "}
              {subCol && (
                <><a href={`/kategori/${subCol.slug}`}>{subCol.name}</a> <span>/</span> </>
              )}
            </>
          ) : (
            <><a href="/butik">Butik</a> <span>/</span> </>
          )}
          <em>{p.name}</em>
        </nav>

        <ProductBrowse grannar={grannar} />

        {valVantar && <script dangerouslySetInnerHTML={{ __html: valVantar }} />}

        <ProductView
          key={p.id}
          productId={p.id}
          name={p.name}
          price={p.price}
          priceNum={p.priceNum}
          inStock={p.inStock}
          stockQuantity={p.stockQuantity}
          blurb={p.blurb}
          descriptionHtml={p.descriptionHtml}
          originalPrice={p.originalPrice}
          onSale={p.onSale}
          specLines={specLines}
          images={images}
          mainBlur={mainBlur}
          variants={p.variants}
          options={p.options}
          variantAxes={p.variantAxes}
          variantTable={p.variantTable}
          imageOwners={p.imageOwners}
          imageAlts={p.imageAlts}
          category={primaryCol?.name}
          // Med Trustpilot påslaget renderas våra egna omdömen inte alls
          // (se villkoret nedan) — då får betyget inte stå kvar i huvudet
          // och länka till en sektion som inte finns.
          reviewCount={trustpilotBU ? 0 : reviewData.count}
          reviewAverage={trustpilotBU ? null : reviewData.average}
          gpsrHtml={gpsrHtml}
        />
      </div>

      {trustpilotBU ? (
        // Självdöljande: rubrik + tom TrustBox blev annars en död vit yta på
        // produkter utan Trustpilot-recensioner (visuell rond 2026-07-02).
        <PdpReviewsSection businessUnitId={trustpilotBU} sku={p.id} />
      ) : (
        <ProductReviews
          reviews={reviewData.reviews}
          count={reviewData.count}
          average={reviewData.average}
        />
      )}

      {related.length >= 2 && (
        <section className="sec relsec">
          <div className="container">
            <div className="sechead"><div className="eyebrow">Upptäck mer</div><h2>Liknande produkter</h2></div>
            <div className="prodgrid">
              {related.map((rp) => <ProductCard p={rp} key={rp.slug} />)}
            </div>
          </div>
        </section>
      )}

      {deptLinks.length > 0 && (
        <ProgCrossLinks title="Utforska fler avdelningar" links={deptLinks} blogLinks={blogLinks} />
      )}
    </>
  );
}
