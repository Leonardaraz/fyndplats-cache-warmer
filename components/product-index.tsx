// Server-renderad, LÄTT textlänk-katalog över produkter (A–Ö, bokstavsgrupperad).
// Finns för crawlbarheten: ShopBrowser-gridden visar 24 kort (medveten perf-
// gräns — rendering av alla ~400 BILDKORT regredierade prestandan, se
// shopbrowser.tsx) och "Visa fler" är en JS-knapp som crawlers aldrig klickar
// → ~330 produkter saknade interna ankarlänkar helt. Rena textlänkar kostar
// ~inget i layout/LCP → perf-invarianten bevaras. <details> är säkert: mobile-
// first-indexeringen ger innehåll i hopfällda sektioner full vikt, och länkarna
// ligger i server-HTML:en.
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

  // Gruppera per inledande bokstav (siffror samlas under "0–9") — premium
  // katalog-känsla + lättare att skanna än en obruten textvägg.
  const groups: { letter: string; items: typeof sorted }[] = [];
  for (const p of sorted) {
    const ch = (p.name.trim().charAt(0) || "#").toUpperCase();
    const letter = /[0-9]/.test(ch) ? "0–9" : ch;
    const last = groups[groups.length - 1];
    if (last && last.letter === letter) last.items.push(p);
    else groups.push({ letter, items: [p] });
  }

  return (
    <details className="prodindex">
      <summary>
        <span className="prodindex-title">{title}</span>
        <span className="prodindex-count">{sorted.length} produkter</span>
        <svg className="prodindex-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="prodindex-body">
        {groups.map((g) => (
          <div className="prodindex-group" key={g.letter}>
            <div className="prodindex-letter" aria-hidden="true">{g.letter}</div>
            <ul>
              {g.items.map((p) => (
                <li key={p.slug}>
                  <a href={`/produkt/${p.slug}`}>{p.name}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
