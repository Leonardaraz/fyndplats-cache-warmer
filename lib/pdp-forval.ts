// Produktsidans förval: vilket val sidan öppnar på. Ren logik, delad mellan
// servern (app/produkt/[slug]/page.tsx, som behöver veta förvalet innan sidan
// hydrerats) och väljaren (components/productview.tsx).
//
// Förvalet är det val vars bild är produktens huvudbild, om det valet går att
// köpa. Kortet i listorna visar huvudbilden, så sidan ska öppna på samma färg.
// Tidigare öppnade den på första valet i lager: linnet stod svart på kortet men
// öppnade i brunt (2026-10-01). Finns inget sådant val blir det första valet i
// lager, och är allt slut det första.
// Modulen saknar importer, så den testas direkt med node --test.

type Rad = { choices: Record<string, string>; inStock: boolean; image: string };

/** Wix fil-id ur en wixstatic-adress; annars adressen själv. */
export function bildNyckel(url: string | undefined): string {
  const m = (url || "").match(/\/media\/([^/]+)/);
  return m ? m[1] : url || "";
}

type EnkeltVal = { image?: string; inStock?: boolean };

/** Index för förvalet bland valen på en axel. */
export function forvalIndex(val: ReadonlyArray<EnkeltVal> | undefined, huvudbild?: string): number {
  const lista = val ?? [];
  const nyckel = bildNyckel(huvudbild);
  if (nyckel) {
    const i = lista.findIndex((c) => c.inStock !== false && !!c.image && bildNyckel(c.image) === nyckel);
    if (i >= 0) return i;
  }
  const j = lista.findIndex((c) => c.inStock !== false);
  return j >= 0 ? j : 0;
}

/** Förvald kombination när produkten har flera axlar (Färg × Storlek …). */
export function forvalKombination(
  tabell: ReadonlyArray<Rad>,
  huvudbild?: string,
): Record<string, string> {
  const nyckel = bildNyckel(huvudbild);
  if (nyckel) {
    const rad = tabell.find((t) => t.inStock && !!t.image && bildNyckel(t.image) === nyckel);
    if (rad) return { ...rad.choices };
  }
  const forsta = tabell.find((t) => t.inStock) ?? tabell[0];
  return forsta ? { ...forsta.choices } : {};
}
