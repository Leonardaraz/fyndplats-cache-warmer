// lib/lista-antal.ts
//
// Ett tal, två ställen: kategoriväljarens knapp ("Bygg & Renovering 227") och
// verktygsraden under den ("228 st").
//
// De räknades på var sitt håll och visade olika tal på samma skärm
// (granskningen 2026-11-18): väljaren räknade varje produkt i avdelningen eller
// någon av dess underkategorier, verktygsraden räknade sidans egen lista, som
// hoppar över dubbletter och varor som bara ska synas i sin underkategori. Och
// när ShopBrowser hämtat hela listan från /api/lista följde verktygsraden den
// färskare listan medan väljaren stod kvar på talet från den cachade sidan.
//
// Nu är det sidans lista som gäller på båda ställena: sidan skickar sitt antal
// till väljaren (`activeCount`), och när hela listan kommit säger ShopBrowser
// till med händelsen här.

export const LISTA_ANTAL_HANDELSE = "fp:lista-antal";

/** Ett antal att visa: ett heltal från noll och uppåt, annars null. */
export function giltigtAntal(v: unknown): number | null {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : null;
}

/** ShopBrowser: hela listan har kommit och är så här lång. */
export function sagListaAntal(antal: number): void {
  if (typeof window === "undefined" || giltigtAntal(antal) === null) return;
  window.dispatchEvent(new CustomEvent(LISTA_ANTAL_HANDELSE, { detail: antal }));
}
