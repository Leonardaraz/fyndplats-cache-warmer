// Server-renderad, LÄTT textlänk-lista över produkter (A–Ö). Finns för crawl-
// barheten: ShopBrowser-gridden visar 24 kort (medveten perf-gräns — rendering
// av alla ~400 BILDKORT regredierade prestandan, se shopbrowser.tsx) och "Visa
// fler" är en JS-knapp som crawlers aldrig klickar → ~330 produkter saknade
// interna ankarlänkar helt (upptäcktes bara via sitemap = låg crawl-prioritet).
// Rena textlänkar kostar ~inget i layout/LCP → perf-invarianten bevaras.
// <details> är säkert: mobile-first-indexering ger innehåll i hopfällda
// sektioner full vikt, och länkarna ligger i server-HTML:en.
export function ProductIndex({
  products,
  title = "Alla produkter A–Ö",
}: {
  products: { slug: string; name: string }[];
  title?: string;
}) {
  // Dedupe på slug (defensivt) + svensk alfabetisk ordning.
  const seen = new Set<string>();
  const sorted = products
    .filter((p) => p.slug && !seen.has(p.slug) && (seen.add(p.slug), true))
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
  if (sorted.length === 0) return null;

  return (
    <details className="prodindex">
      <summary>
        {title} ({sorted.length})
      </summary>
      <ul>
        {sorted.map((p) => (
          <li key={p.slug}>
            <a href={`/produkt/${p.slug}`}>{p.name}</a>
          </li>
        ))}
      </ul>
    </details>
  );
}
