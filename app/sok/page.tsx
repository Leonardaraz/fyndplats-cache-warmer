import type { Metadata } from "next";
import { getProducts, MAIN_ORDER } from "../../lib/products";
import { forListClient } from "../../lib/list-payload";
import { ShopBrowser } from "../../components/shopbrowser";
import { ProductCard } from "../../components/productcard";
import { populartNu } from "../../lib/sok-tom";
import { sidhuvudsdata } from "../../lib/sidhuvud-data";
import { populara } from "../../lib/sidhuvud-val";
import { attachRatings } from "../../lib/review-aggregates";
import { normalize, rankByName } from "../../lib/search";
import { productCountLabel } from "../../lib/rating";

export const metadata: Metadata = {
  title: "Sök",
  robots: { index: false, follow: true },
  // Egen canonical — annars ärvs root-layoutens (= startsidan), vilket ger den
  // noindexade söksidan en motsägelsefull "jag är startsidan"-signal.
  alternates: { canonical: "https://www.fyndplats.se/sok" },
};

export default async function Sok({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim();
  const all = await getProducts();
  // Tokeniserad, stam-medveten matchning (lib/search) — samma som autocomplete:
  // NAMN-träffar först, rankade på relevans-score ("knivset" → knivhållare,
  // "halsband" → kedjehalsband). Beskrivning/specs-matchning används BARA som
  // fallback när namnet inte ger NÅGON träff (t.ex. material-/varumärkessök som
  // "akacia"). Så snart riktiga namn-träffar finns visar vi bara dem — annars
  // drar en lös omnämning i en produkttext in fel resultat (re-audit: "halsband"
  // tog tidigare med en halloween-kattdräkt vars text nämnde ordet).
  //
  // LAGER I SÖK: till skillnad från bläddring (kategori/butik) filtreras slutsålda
  // INTE bort här. En sökning är avsiktsstyrd — skriver någon in produktnamnet de
  // just sett ska varan hittas, med "Slutsåld"-badge + bevakningsformulär på
  // produktsidan. Att svara "inga resultat" på en vara som finns vore sämre. Men
  // de köpbara går alltid först (stabil partition, relevansordningen behålls inom
  // varje grupp) så det man faktiskt kan handla möter ögat överst.
  let results: typeof all = [];
  if (term) {
    const ranked = rankByName(all, (p) => p.name, term);
    if (ranked.length > 0) {
      results = ranked;
    } else {
      const phrase = normalize(term);
      results = all.filter(
        (p) => normalize(p.blurb || "").includes(phrase) || normalize(p.specs || "").includes(phrase)
      );
    }
    results = await attachRatings([...results.filter((p) => p.inStock), ...results.filter((p) => !p.inStock)]);
  }

  // UTAN TRÄFF: samma vägar vidare som 404-sidan, och fyra varor som säljer
  // just nu (lib/sok-tom.ts). Förut var sidan en mening och en länk.
  const tom = Boolean(term) && results.length === 0;
  let populart: typeof all = [];
  let kategorier: { name: string; slug: string }[] = [];
  if (tom) {
    populart = await attachRatings(populartNu(all, 4));
    try {
      const { tree } = await sidhuvudsdata();
      kategorier = populara(tree, MAIN_ORDER).map((c) => ({ name: c.name, slug: c.slug }));
    } catch {
      kategorier = []; // hellre ingen kategorirad än en trasig söksida
    }
  }

  return (
    <>
      <section className="sec">
        <div className="container">
          <div className="sechead">
            <div className="eyebrow">Sök</div>
            <h1>{q ? `Sökresultat för “${q}”` : "Sök i butiken"}</h1>
            <p>{q ? `${productCountLabel(results.length)} hittades` : "Skriv i sökrutan ovan för att hitta produkter."}</p>
          </div>
          {/* forClient, inte results rakt av. Product är strukturellt
              tilldelningsbar till ListProduct, så det HAR kompilerat — men då
              serialiserades hela Product-objektet in i klient-nyttolasten:
              gallery, imageAlts, blurb, specs, variants, descriptionHtml. Mätt
              på skarp sajt 2026-09-04 vägde /sok?q=bord 791 kB HTML, varav 465 kB
              flight-payload. Listsidorna mappade redan ner; söksidan var den enda
              som inte gjorde det. */}
          {/* defaultSort "rel": behåll relevansordningen ovan. Förr sorterades
              träffarna om efter Rekommenderat (samma mix som kategorisidorna),
              så "soffa" gav "Sidobord för soffan" på plats två och en
              hängmatta i ett klösträd före riktiga mattor. */}
          {results.length > 0 && <ShopBrowser products={forListClient(results)} defaultSort="rel" />}
          {tom && (
            <div className="sok-tom">
              <p className="sok-tom-text">
                Vi hittade inget på “{q}”. Prova ett kortare ord, en annan stavning eller varans typ, till exempel “fåtölj” i stället för ett märke.
              </p>
              <div className="nf-actions">
                <a className="btn btn-primary" href="/butik">Se alla kategorier</a>
                <a className="btn btn-ghost" href="/kontaktaoss">Fråga oss om varan</a>
              </div>
              {kategorier.length > 0 && (
                <div className="nf-cats">
                  <div className="nf-cats-label">Populära kategorier</div>
                  <div className="nf-cats-row">
                    {kategorier.map((c) => (
                      <a key={c.slug} href={`/kategori/${c.slug}`}>{c.name}</a>
                    ))}
                  </div>
                </div>
              )}
              {populart.length > 0 && (
                <div className="sok-tom-populart">
                  <h2>Populärt just nu</h2>
                  <div className="prodgrid listgrid">
                    {forListClient(populart).map((p) => <ProductCard p={p} key={p.slug} tvaKolumner />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
