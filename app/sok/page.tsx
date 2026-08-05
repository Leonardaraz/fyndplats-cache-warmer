import type { Metadata } from "next";
import { getProducts } from "../../lib/products";
import { ShopBrowser } from "../../components/shopbrowser";
import { nameScore, normalize } from "../../lib/search";

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
    const scored = all
      .map((p) => ({ p, score: nameScore(p.name, term) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
    if (scored.length > 0) {
      results = scored.map((r) => r.p);
    } else {
      const phrase = normalize(term);
      results = all.filter(
        (p) => normalize(p.blurb || "").includes(phrase) || normalize(p.specs || "").includes(phrase)
      );
    }
    results = [...results.filter((p) => p.inStock), ...results.filter((p) => !p.inStock)];
  }

  return (
    <>
      <section className="sec">
        <div className="container">
          <div className="sechead">
            <div className="eyebrow">Sök</div>
            <h1>{q ? `Sökresultat för “${q}”` : "Sök i butiken"}</h1>
            <p>{q ? `${results.length} ${results.length === 1 ? "produkt" : "produkter"} hittades` : "Skriv i sökrutan ovan för att hitta produkter."}</p>
          </div>
          {results.length > 0 && <ShopBrowser products={results} />}
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
