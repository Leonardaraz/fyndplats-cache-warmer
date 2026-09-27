// Server-renderad, LÄTT textlänk-katalog över produkter (A–Ö, bokstavsgrupperad).
// Finns för crawlbarheten: ShopBrowser-gridden visar 24 kort (medveten perf-
// gräns — rendering av alla ~400 BILDKORT regredierade prestandan, se
// shopbrowser.tsx) och "Visa fler" är en JS-knapp som crawlers aldrig klickar
// → ~330 produkter saknade interna ankarlänkar helt. Rena textlänkar kostar
// ~inget i layout/LCP → perf-invarianten bevaras. <details> är säkert: mobile-
// first-indexeringen ger innehåll i hopfällda sektioner full vikt, och länkarna
// ligger i server-HTML:en.
import { productCountLabel } from "../lib/rating";
import { indexGrupper, indexHtml } from "../lib/product-index-html";

export function ProductIndex({
  products,
  title = "Alla produkter A–Ö",
}: {
  products: { slug: string; name: string }[];
  title?: string;
}) {
  // Dedupe på slug (defensivt) + svensk alfabetisk ordning, grupperat per
  // inledande bokstav (siffror under "0–9") — premium katalog-känsla + lättare
  // att skanna än en obruten textvägg.
  const groups = indexGrupper(products);
  const antal = groups.reduce((n, g) => n + g.items.length, 0);
  if (antal === 0) return null;

  return (
    <details className="prodindex">
      <summary>
        <span className="prodindex-title">{title}</span>
        <span className="prodindex-count">{productCountLabel(antal)}</span>
        <svg className="prodindex-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      {/* Som färdig HTML-sträng, inte som JSX — annars ligger listan en gång
          till, dubbelt så stor, i sidans React-data. Se lib/product-index-html.ts. */}
      <div className="prodindex-body" dangerouslySetInnerHTML={{ __html: indexHtml(groups) }} />
    </details>
  );
}
