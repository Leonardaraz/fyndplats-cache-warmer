// Produkter som bara ska synas i sin underkategori, aldrig på avdelningens sida.
//
// En avdelningssida (en huvudkategori utan förälder) visar sina egna produkter
// OCH alla underkategoriers. Leonard 2026-10-14 om den elektriska
// cigarettmaskinen: den ska inte synas när man öppnar Hem & Inredning, bara när
// man går in i underkategorin Hushållsapparater. Wix har inget sådant val, så
// listan bor här, nycklad på produktens Wix-id, som inte ändras med sluggen.
//
// Regeln gäller kategorisidan och dess lista (lib/list-pages.ts) och
// prissidorna /under-…-kr/<kategori> (lib/seo/programmatic.ts). Menyns och
// sitemapens räknare tar fortfarande med produkten. Det är en produkt av
// hundratals och syns inte i siffrorna.
//
// LÖVMODUL utan importer, testad i lib/bara-i-underkategorin.test.ts.

export const BARA_I_UNDERKATEGORIN: ReadonlySet<string> = new Set([
  // Elektrisk cigarettmaskin, ligger i Hushållsapparater.
  "f31eb0a5-5267-40fd-b193-a5adbebfb5d0",
]);

type Kategori = { id: string; parentId: string | null };

/**
 * Produkterna på kategorins sida: kategorins egna och, för en avdelning, även
 * de direkta underkategoriernas. En avdelning hoppar över produkterna i
 * BARA_I_UNDERKATEGORIN, också när de ligger direkt i den.
 */
export function produkterIKategorin<P extends { id: string; collectionIds?: string[] }>(
  produkter: readonly P[],
  kategori: Kategori,
  kategorier: readonly Kategori[],
): P[] {
  const barn = kategorier.filter((c) => c.parentId === kategori.id).map((c) => c.id);
  const idn = new Set([kategori.id, ...barn]);
  const avdelning = !kategori.parentId;
  return produkter.filter(
    (p) =>
      !(avdelning && BARA_I_UNDERKATEGORIN.has(p.id)) &&
      (p.collectionIds || []).some((cid) => idn.has(cid)),
  );
}
