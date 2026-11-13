// lib/seo/pris-oversikt.ts
// Ren byggare för Pattern 2b: översikten /under-{200,500,1000}-kr.
//
// Genvägarna på /butik pekade på /under-500-kr och /under-1000-kr innan sidorna
// fanns, och båda gav 404 (Leonard 2026-11-13). Översikten visar ett urval varor
// under gränsen i hela sortimentet och länkar till varje kategori som har en
// egen prissida. lib/seo/programmatic.ts kopplar in katalogen och hjälparna
// (hubCore); här finns bara reglerna, så att de går att pröva utan katalogen
// (lib/seo/pris-oversikt.test.ts).

export type HubProdukt = {
  id: string;
  slug: string;
  name: string;
  price: string;
  priceNum: number;
  inStock: boolean;
  imageScore: number;
};

export type PrisKategori = { href: string; namn: string; antal: number };
export type PrisLank = { href: string; label: string };

export type HubCore<P extends HubProdukt> = {
  path: string;
  price: number;
  /** Varor i lager för högst priset i hela sortimentet, efter dubblettrensning. */
  antal: number;
  kategorier: PrisKategori[];
  products: P[];
  intro: string[];
  andraGranser: PrisLank[];
  bodyWords: number;
};

export type PrisOversiktIn<P extends HubProdukt> = {
  price: number;
  /** Prisgränserna som har sidor (PRICE_TIERS). */
  granser: readonly number[];
  products: P[];
  kategorier: { slug: string; name: string }[];
  /** De giltiga prissidorna, samma lista som sitemapen (getValidPriceTierParams). */
  prissidor: { price: number; categorySlug: string }[];
  /** Varor i kategorin och dess underkategorier, bara i lager. */
  iKategorin: (slug: string) => P[];
  dedupe: (lista: P[]) => P[];
  /** Varvar kategorierna, så att urvalet inte blir en enda kategori i rad. */
  blanda: (lista: P[]) => P[];
  raknaOrd: (text: string) => number;
  /** "1 produkt", "1 234 produkter" (productCountLabel i lib/rating.ts). */
  produkterText: (antal: number) => string;
  minProdukter: number;
  minOrd: number;
  maxLista: number;
};

export function underPriset<P extends HubProdukt>(lista: P[], price: number): P[] {
  return lista.filter((p) => p.priceNum > 0 && p.priceNum <= price);
}

export function byggPrisOversikt<P extends HubProdukt>(inn: PrisOversiktIn<P>): HubCore<P> | null {
  const { price } = inn;
  if (!inn.granser.includes(price)) return null;

  const under = inn.dedupe(underPriset(inn.products.filter((p) => p.inStock), price));
  if (under.length < inn.minProdukter) return null;

  // Samma ordning som prissidorna: bästa bilden först, sedan lägst pris.
  const sorterade = [...under].sort((a, b) => b.imageScore - a.imageScore || a.priceNum - b.priceNum);
  const urval = inn.blanda(sorterade).slice(0, inn.maxLista);

  const kategorier: PrisKategori[] = [];
  for (const sida of inn.prissidor) {
    if (sida.price !== price) continue;
    const kat = inn.kategorier.find((k) => k.slug === sida.categorySlug);
    if (!kat) continue;
    const antal = inn.dedupe(underPriset(inn.iKategorin(kat.slug), price)).length;
    kategorier.push({ href: `/under-${price}-kr/${kat.slug}`, namn: kat.name, antal });
  }
  kategorier.sort((a, b) => b.antal - a.antal || a.namn.localeCompare(b.namn, "sv"));

  const intro = [
    `${inn.produkterText(under.length)} i lager för högst ${price} kr. Här är ett urval, och längre ner finns varje kategori med egna fynd under ${price} kr.`,
  ];
  const andraGranser: PrisLank[] = inn.granser.filter((g) => g !== price).map((g) => ({ href: `/under-${g}-kr`, label: `Fynd under ${g} kr` }));

  // Samma ordkrav som de andra mönstren (MIN_BODY_WORDS): texten, kategorinamnen
  // och varornas namn och pris.
  const bodyWords = inn.raknaOrd([...intro, ...kategorier.map((k) => k.namn)].join(" ")) + inn.raknaOrd(urval.map((p) => `${p.name} ${p.price}`).join(" "));
  if (bodyWords < inn.minOrd) return null;

  return { path: `/under-${price}-kr`, price, antal: under.length, kategorier, products: urval, intro, andraGranser, bodyWords };
}
