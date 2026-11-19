// lib/sok-kall.ts
//
// Vad webbläsaren söker i när servern inte har katalogen i minnet
// (components/sok-kall.tsx, 2026-11-19).
//
// ☠️ VARULISTAN HAR BARA DET SOM GÅR ATT KÖPA. /api/lista?k=alla är listsidornas
// lista, och den går genom forListings (lib/list-pages.ts). Söksidan visar med
// flit också slutsålda varor, sist: den som skriver namnet på en vara den just
// sett ska hitta den, med märket "Slutsåld" och bevakningen på produktsidan.
// Första bygget sökte bara i varulistan, och provet i webbläsaren visade
// skillnaden mot servern: "svart tv-bänk" 18 mot 21, "länstol" 250 mot 294,
// "utemöbler" 69 mot 89. Den enda tv-bänken med "svart" i namnet var slutsåld,
// så den kalla vägen strök dessutom ordet och gav ett annat besked.
//
// De slutsålda finns i sökindexet (/api/search-index), som sökrutan redan
// hämtar: namn, adress, foto, pris och märket `o`. Här läggs de till som
// enkla kort, så att de två vägarna söker i samma varor.
//
// LÖVMODUL: bara typer in, så att `node --test` kan ladda den.
import type { ListProduct } from "./products";

/** En rad i sökindexet, samma form som SokTraff i lib/sok-index.ts. */
export type IndexRad = { n: string; s: string; i: string; p: string; o?: 1 };

/**
 * Ett slutsålt kort ur en indexrad. Priset står som text i indexet ("1 599 kr"
 * eller "Från 659 kr", lib/price-range.ts listPris), och kortet ritar samma
 * text tillbaka. `id` är tomt: det används bara till att förhämta
 * medlemspriset, och en slutsåld vara har inget att förhämta.
 */
export function kortUrIndex(h: IndexRad): ListProduct {
  const fran = /^Från\s+/.test(h.p);
  const text = h.p.replace(/^Från\s+/, "");
  const tal = Number(text.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
  return {
    id: "", slug: h.s, name: h.n, price: text, priceNum: tal, inStock: false,
    ...(h.i ? { img: h.i } : {}),
    ...(fran ? { hasRange: true, priceFrom: text, priceFromNum: tal } : {}),
  };
}

/**
 * Varorna den kalla vägen söker i: hela varulistan, och efter den de slutsålda
 * ur indexet som inte redan står i listan. Utan index (hämtningen föll) blir
 * det bara varulistan, alltså det som går att köpa.
 */
export function kandidater(lista: readonly ListProduct[], index: readonly IndexRad[] | null): ListProduct[] {
  if (!index) return [...lista];
  const iListan = new Set(lista.map((p) => p.slug));
  return [...lista, ...index.filter((h) => h.o === 1 && h.s && h.n && !iListan.has(h.s)).map(kortUrIndex)];
}
