// lib/seo/pris-oversikt.ts
// Ren byggare för Pattern 2b: översikten /under-{200,500,1000}-kr.
//
// Genvägarna på /butik pekade på /under-500-kr och /under-1000-kr innan sidorna
// fanns, och båda gav 404 (Leonard 2026-11-13). Översikten visar ett urval varor
// under gränsen i hela sortimentet och länkar till varje kategori som har en
// egen prissida, grupperade per avdelning som registret på /butik.
// lib/seo/programmatic.ts kopplar in katalogen och hjälparna (hubCore); här finns
// bara reglerna, så att de går att pröva utan katalogen
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

export type HubKategori = { id: string; slug: string; name: string; parentId: string | null };

export type PrisKategori = { href: string; namn: string; antal: number };
export type PrisLank = { href: string; label: string };

/** En avdelning i registret. Rubriken länkar bara när avdelningen själv har en
 *  prissida för gränsen; annars är den en ren rubrik över sina kategorier. */
export type PrisGrupp = { namn: string; href: string | null; antal: number; kategorier: PrisKategori[] };

export type HubCore<P extends HubProdukt> = {
  path: string;
  price: number;
  /** Varor i lager för högst priset i hela sortimentet, efter dubblettrensning. */
  antal: number;
  /** Alla kategorier med egen prissida för gränsen, flest varor först. */
  kategorier: PrisKategori[];
  /** Samma kategorier grupperade per avdelning, största avdelningen först. */
  grupper: PrisGrupp[];
  products: P[];
  intro: string[];
  /** Översikterna för de andra gränserna, bara de som finns. */
  andraGranser: PrisLank[];
  bodyWords: number;
};

export type PrisOversiktIn<P extends HubProdukt> = {
  price: number;
  /** Prisgränserna som har sidor (PRICE_TIERS). */
  granser: readonly number[];
  /** Gränserna vars översikt finns (klarar kraven). Bara dit länkar sidan, så
   *  att en gräns med för få varor aldrig blir en länk till en 404. */
  andraSidor: readonly number[];
  products: P[];
  kategorier: HubKategori[];
  /** De giltiga prissidorna, samma lista som sitemapen (getValidPriceTierParams). */
  prissidor: { price: number; categorySlug: string }[];
  /** Varor i kategorin och dess underkategorier, bara i lager. */
  iKategorin: (slug: string) => P[];
  dedupe: (lista: P[]) => P[];
  /** Varvar kategorierna, så att urvalet inte blir en enda kategori i rad. */
  blanda: (lista: P[]) => P[];
  /** Får varan visas i urvalet? Samma spärrar som "Populärt just nu" på /butik
   *  (gömda bilder och varor med text eller förpackning i bilden). Antalet och
   *  kategorierna räknar alla varor; bara urvalet följer spärren. */
  iUrvalet: (p: P) => boolean;
  raknaOrd: (text: string) => number;
  /** "1 produkt", "1 234 produkter" (productCountLabel i lib/rating.ts). */
  produkterText: (antal: number) => string;
  /** "500 kr", "1 000 kr" med hårda mellanslag. */
  prisText: (kronor: number) => string;
  minProdukter: number;
  minOrd: number;
  maxLista: number;
};

export function underPriset<P extends HubProdukt>(lista: P[], price: number): P[] {
  return lista.filter((p) => p.priceNum > 0 && p.priceNum <= price);
}

/** Avdelningen (kategorin utan förälder) som kategorin hör till. */
export function avdelningFor(kat: HubKategori, alla: HubKategori[]): HubKategori {
  const perId = new Map(alla.map((k) => [k.id, k]));
  let nu = kat;
  // Högst tio led: ett trasigt träd (en förälder som pekar i ring) får inte låsa sidan.
  for (let i = 0; i < 10 && nu.parentId; i++) {
    const upp = perId.get(nu.parentId);
    if (!upp) break;
    nu = upp;
  }
  return nu;
}

const storstForst = (a: { antal: number; namn: string }, b: { antal: number; namn: string }) =>
  b.antal - a.antal || a.namn.localeCompare(b.namn, "sv");

export function byggPrisOversikt<P extends HubProdukt>(inn: PrisOversiktIn<P>): HubCore<P> | null {
  const { price } = inn;
  if (!inn.granser.includes(price)) return null;

  const under = inn.dedupe(underPriset(inn.products.filter((p) => p.inStock), price));
  if (under.length < inn.minProdukter) return null;

  // Samma ordning som prissidorna: bästa bilden först, sedan lägst pris.
  const sorterade = [...under].sort((a, b) => b.imageScore - a.imageScore || a.priceNum - b.priceNum);
  const urval = inn.blanda(sorterade.filter(inn.iUrvalet)).slice(0, inn.maxLista);

  const antalI = (slug: string) => inn.dedupe(underPriset(inn.iKategorin(slug), price)).length;
  const kategorier: PrisKategori[] = [];
  const perAvdelning = new Map<string, PrisGrupp>();
  for (const sida of inn.prissidor) {
    if (sida.price !== price) continue;
    const kat = inn.kategorier.find((k) => k.slug === sida.categorySlug);
    if (!kat) continue;
    const rad: PrisKategori = { href: `/under-${price}-kr/${kat.slug}`, namn: kat.name, antal: antalI(kat.slug) };
    kategorier.push(rad);
    const avd = avdelningFor(kat, inn.kategorier);
    let grupp = perAvdelning.get(avd.id);
    if (!grupp) {
      grupp = { namn: avd.name, href: null, antal: avd.id === kat.id ? rad.antal : antalI(avd.slug), kategorier: [] };
      perAvdelning.set(avd.id, grupp);
    }
    if (avd.id === kat.id) grupp.href = rad.href;
    else grupp.kategorier.push(rad);
  }
  kategorier.sort(storstForst);
  const grupper = [...perAvdelning.values()].sort(storstForst);
  for (const g of grupper) g.kategorier.sort(storstForst);

  const pris = inn.prisText(price);
  const intro = [
    `${inn.produkterText(under.length)} i lager för högst ${pris}. Börja med urvalet, eller gå direkt till en kategori längre ner.`,
  ];
  const andraGranser: PrisLank[] = inn.granser
    .filter((g) => g !== price && inn.andraSidor.includes(g))
    .map((g) => ({ href: `/under-${g}-kr`, label: `Under ${inn.prisText(g)}` }));

  // Samma ordkrav som de andra mönstren (MIN_BODY_WORDS): texten, kategorinamnen
  // och varornas namn och pris.
  const bodyWords = inn.raknaOrd([...intro, ...kategorier.map((k) => k.namn)].join(" ")) + inn.raknaOrd(urval.map((p) => `${p.name} ${p.price}`).join(" "));
  if (bodyWords < inn.minOrd) return null;

  return { path: `/under-${price}-kr`, price, antal: under.length, kategorier, grupper, products: urval, intro, andraGranser, bodyWords };
}
