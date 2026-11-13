// Provens låtsas-svar på frågan om de publicerade sidornas titlar
// (POST /stores/v3/products/query, lib/polish/seo-unik.ts).
//
// Svarar som Wix gjorde 2026-11-11: sidindelat (två per svar här, 100 i drift),
// markören bär läget, och ett filter som följer med markören ger 400
// INVALID_CURSOR. Proven som går genom den här hjälparen fäller därför om
// läsningen skickar filtret på sida två, eller glömmer det på sida ett.

const PER_SIDA = 2;

export function seoSvar(alla: ReadonlyArray<Record<string, unknown>>, kropp: unknown): unknown {
  const q = ((kropp ?? {}) as { query?: { filter?: unknown; cursorPaging?: { cursor?: string } } }).query ?? {};
  const markor = q.cursorPaging?.cursor;
  if (markor !== undefined && q.filter !== undefined) {
    throw new Error('Wix 400: {"message":"Invalid cursor. Sort or filter can not be specified together with cursor","details":{"applicationError":{"code":"INVALID_CURSOR"}}}');
  }
  if (markor === undefined && q.filter === undefined) throw new Error("provet: första sidan ska bära filtret visible");
  const fran = markor === undefined ? 0 : Number(markor.slice(1));
  const sida = alla.slice(fran, fran + PER_SIDA);
  const mer = fran + PER_SIDA < alla.length;
  return { products: sida, pagingMetadata: { count: sida.length, hasNext: mer, cursors: mer ? { next: `m${fran + PER_SIDA}` } : {} } };
}
