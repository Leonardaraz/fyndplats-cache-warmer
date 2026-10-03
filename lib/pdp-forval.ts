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

/** "2 999,00 kr" → 2999. 0 om strängen saknar ett pris. */
function prisTal(s: string | undefined): number {
  const t = (s || "").replace(/[^\d,.]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

type PrisVal = EnkeltVal & { priceNum: number; originalPrice?: string };
type PrisRad = Rad & { priceNum: number; originalPrice?: string };

/**
 * Priset för förvalet, alltså varianten på produktens huvudbild. Startsidans
 * mosaik visar huvudbilden, och utan detta stod produktens lägsta pris under
 * den: fåtöljen syntes petrolblå för 2 199 kr men kostar 2 499 kr i petrolblått
 * (2026-10-03). null när produkten saknar val eller valet saknar pris.
 */
export function forvaltPris(p: {
  img?: string;
  variantAxes?: ReadonlyArray<unknown>;
  variantTable?: ReadonlyArray<PrisRad>;
  options?: { choices: ReadonlyArray<PrisVal> } | null;
}): { priceNum: number; originalPriceNum?: number } | null {
  let val: { priceNum: number; originalPrice?: string } | undefined;
  const tabell = p.variantTable ?? [];
  if ((p.variantAxes?.length ?? 0) >= 2 && tabell.length >= 1) {
    const kombo = forvalKombination(tabell, p.img);
    val = tabell.find((t) => Object.entries(kombo).every(([a, l]) => t.choices[a] === l));
  } else if ((p.options?.choices.length ?? 0) >= 2) {
    val = p.options!.choices[forvalIndex(p.options!.choices, p.img)];
  }
  if (!val || !(val.priceNum > 0)) return null;
  const ord = prisTal(val.originalPrice);
  return ord > val.priceNum ? { priceNum: val.priceNum, originalPriceNum: ord } : { priceNum: val.priceNum };
}
