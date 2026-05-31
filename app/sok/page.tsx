import type { Metadata } from "next";
import { getProducts } from "../../lib/products";
import { ShopBrowser } from "../../components/shopbrowser";
import { nameScore, normalize } from "../../lib/search";

export const metadata: Metadata = {
  title: "Sök",
  robots: { index: false, follow: true },
};

export default async function Sok({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim();
  const all = await getProducts();
  // Tokeniserad, stam-medveten matchning (lib/search) — samma som autocomplete:
  // 1) NAMN-träffar först, rankade på relevans-score ("knivset" → knivhållare,
  //    "halsband" → kedjehalsband). 2) Sedan produkter där HELA söksträngen finns
  //    i beskrivning/specs men inte i namnet (så varumärkes-/materialsök funkar)
  //    — men bara som exakt fras, så "halsband" inte drar in en kattdräkt vars
  //    beskrivning råkar nämna ordet löst. Namn-träffar slår alltid text-träffar.
  let results: typeof all = [];
  if (term) {
    const scored = all
      .map((p) => ({ p, score: nameScore(p.name, term) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
    const nameHitIds = new Set(scored.map((r) => r.p.id));
    const phrase = normalize(term);
    const textHits = all.filter(
      (p) => !nameHitIds.has(p.id) &&
        (normalize(p.blurb || "").includes(phrase) || normalize(p.specs || "").includes(phrase))
    );
    results = [...scored.map((r) => r.p), ...textHits];
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
