import type { Metadata } from "next";
import { getProducts } from "../../lib/products";
import { forListClient } from "../../lib/list-payload";
import { ShopBrowser } from "../../components/shopbrowser";
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
          {q && results.length === 0 && (
            <p className="empty" style={{ textAlign: "center", color: "var(--soft)" }}>
              Inga resultat för “{q}”. Prova att söka på kategori eller varumärke — eller <a href="/butik" style={{ color: "var(--orange)", fontWeight: 600 }}>se hela sortimentet</a>.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
