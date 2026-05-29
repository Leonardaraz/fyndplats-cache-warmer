import type { Metadata } from "next";
import { getProducts } from "../../lib/products";
import { ShopBrowser } from "../../components/shopbrowser";

export const metadata: Metadata = {
  title: "Sök",
  robots: { index: false, follow: true },
};

export default async function Sok({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim().toLowerCase();
  const all = await getProducts();
  const results = term ? all.filter((p) => p.name.toLowerCase().includes(term)) : [];

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
              Inga produkter matchade “{q}”. Prova ett annat sökord eller <a href="/butik" style={{ color: "var(--orange)", fontWeight: 600 }}>se hela sortimentet</a>.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
