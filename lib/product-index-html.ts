// lib/product-index-html.ts
//
// A–Ö-listans innehåll som EN färdig HTML-sträng.
//
// VARFÖR SOM STRÄNG (2026-09-27). En serverkomponent hamnar två gånger i
// sidan: som HTML, och som React-data (RSC) som webbläsaren läser vid
// navigering. För en lista med tusentals länkar blev den andra kopian dubbelt
// så stor som den första — varje <li> blev ett objekt med nyckel, element-typ
// och props, och slugen stod tre gånger. Uppmätt på skarp sajt:
//   /kategori/hem-inredning  A–Ö 242 kB HTML + 454 kB RSC
//   /kategori/mobler         A–Ö 125 kB HTML + 233 kB RSC
// Som en sträng i dangerouslySetInnerHTML står innehållet i RSC-datan bara som
// sig självt, ungefär lika stort som HTML:en. Länkarna, ankartexterna och
// markupen är exakt desamma som förut, så för en sökmotor är ingenting ändrat.
//
// Ren modul utan importer: node --test kör den direkt.

export type IndexProdukt = { slug: string; name: string };

export type IndexGrupp = { letter: string; items: IndexProdukt[] };

/** Dubbletter bort (på slug), svensk bokstavsordning, grupperat per första tecken. */
export function indexGrupper(products: readonly IndexProdukt[]): IndexGrupp[] {
  const seen = new Set<string>();
  const sorted = products
    .filter((p) => p.slug && !seen.has(p.slug) && (seen.add(p.slug), true))
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
  const groups: IndexGrupp[] = [];
  for (const p of sorted) {
    const ch = (p.name.trim().charAt(0) || "#").toUpperCase();
    // Siffror samlas under "0–9".
    const letter = /[0-9]/.test(ch) ? "0–9" : ch;
    const last = groups[groups.length - 1];
    if (last && last.letter === letter) last.items.push(p);
    else groups.push({ letter, items: [p] });
  }
  return groups;
}

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export function escHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESC[c]);
}

/**
 * Innehållet i .prodindex-body: samma markup som komponenten renderade förut,
 * grupp för grupp. Namnen kommer från Wix och ska aldrig kunna bli markup —
 * allt escapas.
 */
export function indexHtml(groups: readonly IndexGrupp[]): string {
  let ut = "";
  for (const g of groups) {
    ut += `<div class="prodindex-group"><div class="prodindex-letter" aria-hidden="true">${escHtml(g.letter)}</div><ul>`;
    for (const p of g.items) ut += `<li><a href="/produkt/${escHtml(p.slug)}">${escHtml(p.name)}</a></li>`;
    ut += "</ul></div>";
  }
  return ut;
}
