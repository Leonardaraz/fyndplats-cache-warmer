// lib/list-pages.ts
//
// Listsidornas produktlistor — EN källa för både sidan och /api/lista.
//
// /alla-produkter, /rea och /kategori/[slug] ritar de första korten i sidans
// HTML och hämtar resten från /api/lista när kunden behöver dem (se
// lib/list-overview.ts för varför). Då MÅSTE sidan och rutten räkna fram samma
// lista, annars byter korten plats när listan kommer. Därför bor urvalet och
// ordningen här, och båda läser dem härifrån.
//
// ORDNINGEN RÄKNAS PÅ SERVERN, med samma dag som webbläsaren får.
// Uppmätt på skarp sajt 2026-09-27: kategorisidorna skickade sina produkter i
// katalogordning (med de tre bästa bilderna först), men ShopBrowser sorterar på
// "Rekommenderat". När sidan laddat klart byttes därför i stort sett hela
// rutnätet ut — på /kategori/husdjur stod 0 av de 24 korten kvar, på möbler
// och fåtöljer 2. Kunden såg rutnätet blinka om, bilderna som redan laddats
// kastades, och en sökmotor som läste HTML:en såg andra produkter än kunden.
// /alla-produkter och /rea gjorde redan rätt; nu gör alla listsidor det.

import type { Collection, ListProduct, Product } from "./products";
import { dedupeProducts, forClient, forListings, getCollections, getProducts } from "./products";
import { attachRatings } from "./review-aggregates";
import { orderRecommended } from "./sort-products";
import { universalCollectionIds } from "./related-pick";
import { saleProducts } from "./rea";
import { listOversikt, type ListOversikt } from "./list-overview";
import { listaUrl, type ListNyckel } from "./list-key";
import { specOversikt, type FacettDef, type Nyckel, type SpecFacett } from "./spec-facets";
import { facetterFor } from "./spec-config";

export type { ListNyckel };

/** Hur många kort sidan bär i sin HTML: 24 synliga + ett "Visa fler"-klick
 *  utan väntan. Matchar PAGE_SIZE × 2 i components/shopbrowser.tsx. */
export const FORSTA_KORT = 48;

/**
 * Produkterna en kategorisida visar, i katalogordning.
 *
 * Huvudkategori: kategorin OCH alla dess underkategorier, så avdelningssidan
 * blir komplett. Underkategori: bara sina egna. Populära & REA är
 * merchandising-sidor utan egna Wix-tilldelade produkter och fylls från
 * produktflaggorna i stället.
 */
export function kategoriProdukter(active: Collection, collections: Collection[], products: Product[]): Product[] {
  if (active.slug === "rea") return products.filter((p) => p.onSale);
  if (active.slug === "populara") {
    // Populära = bästsäljare (ribbon === "Bestseller"). Efter Kina-utfasningen
    // (2026-06) saknas Bestseller-taggade produkter — alla låg på Kina-lagret —
    // så vi faller tillbaka på de bäst presenterade produkterna (högst bild-
    // poäng) så sidan aldrig blir tom. Re-taggas EU-produkter som Bestseller
    // i Wix tar de över igen automatiskt.
    const tagged = products.filter((p) => p.ribbon === "Bestseller");
    return tagged.length >= 8 ? tagged : [...products].sort((a, b) => b.imageScore - a.imageScore).slice(0, 24);
  }
  const childIds = collections.filter((c) => c.parentId === active.id).map((c) => c.id);
  const catIds = new Set([active.id, ...childIds]);
  return products.filter((p) => (p.collectionIds || []).some((cid) => catIds.has(cid)));
}

/**
 * Listan i "Rekommenderat"-ordning — exakt den ordning ShopBrowser räknar fram
 * i webbläsaren med samma `dagMs`.
 *
 * attachRatings MÅSTE köra före orderRecommended: recommendedScore läser
 * p.rating, och körs den på en olik lista blir ordningen en annan.
 */
export async function ordnaLista(list: Product[], dagMs: number): Promise<Product[]> {
  const rated = await attachRatings(list);
  return orderRecommended(rated, universalCollectionIds(rated), dagMs);
}

/**
 * Hela listan för en nyckel, ordnad — det /api/lista svarar med. null när
 * nyckeln inte motsvarar någon sida.
 */
export async function listaFor(nyckel: ListNyckel, dagMs: number): Promise<Product[] | null> {
  const produkter = forListings(await getProducts());
  if (nyckel === "alla") return ordnaLista(produkter, dagMs);
  if (nyckel === "rea") return ordnaLista(saleProducts(produkter), dagMs);
  const slug = nyckel.slice("kategori/".length);
  const collections = await getCollections();
  const active = collections.find((c) => c.slug === slug);
  if (!active) return null;
  return ordnaLista(dedupeProducts(kategoriProdukter(active, collections, produkter)), dagMs);
}

/**
 * Kategorins måttfilter (lib/spec-config.ts), med förfäderna för arvet.
 * Tom för listor över hela sortimentet.
 */
export function specDefsFor(active: Collection, collections: Collection[]): FacettDef[] {
  const foraldrar: string[] = [];
  let c: Collection | undefined = active;
  for (let i = 0; i < 5 && c?.parentId; i++) {
    c = collections.find((x) => x.id === c!.parentId);
    if (c) foraldrar.push(c.slug);
  }
  return facetterFor(active.slug, foraldrar);
}

/** Nycklarna som ska följa med produkterna i listan för en nyckel. Samma för
 *  sidan och /api/lista, så filtren räknar på samma värden. */
export async function specNycklarFor(nyckel: ListNyckel): Promise<Set<Nyckel>> {
  if (!nyckel.startsWith("kategori/")) return new Set();
  const slug = nyckel.slice("kategori/".length);
  const collections = await getCollections();
  const active = collections.find((c) => c.slug === slug);
  return new Set(active ? specDefsFor(active, collections).map((d) => d.nyckel) : []);
}

/** Det ShopBrowser behöver för att hämta resten själv. */
export type ListaInfo = {
  url: string;
  oversikt: ListOversikt;
};

/**
 * Sidans del av listan: de första korten och sammanfattningen. `ordnad` ska
 * vara listan i visningsordning (ordnaLista).
 */
export function listaForSidan(
  ordnad: Product[],
  nyckel: ListNyckel,
  specDefs: readonly FacettDef[] = [],
): { products: ListProduct[]; lista?: ListaInfo; facetter?: SpecFacett[] } {
  // Måttfiltren räknas på HELA listan, här på servern, så panelen öppnas
  // färdig (skalor och staplar) innan resten av listan hämtats.
  const facetter = specDefs.length ? specOversikt(ordnad, specDefs) : [];
  const nycklar = new Set(facetter.map((f) => f.nyckel));
  const medFacetter = facetter.length ? { facetter } : {};
  // Ryms hela listan i sidans kort (rean, de flesta underkategorier) finns
  // inget att hämta: sidan får hela listan och ShopBrowser räknar allt själv —
  // då behöver korten sina mått.
  if (ordnad.length <= FORSTA_KORT) return { products: forClient(ordnad, undefined, nycklar), ...medFacetter };
  // Längre listor: måtten följer med listan från /api/lista, inte med sidans
  // första kort — filtren väntar ändå på hela listan.
  return {
    products: forClient(ordnad.slice(0, FORSTA_KORT)),
    lista: { url: listaUrl(nyckel), oversikt: listOversikt(ordnad) },
    ...medFacetter,
  };
}

/**
 * Produkter som INTE finns på någon kategorisida.
 *
 * A–Ö-listan på /alla-produkter togs bort 2026-09-27: den var 1,2 MB av sidans
 * 2,8 MB, och en PageRank-modell över sajtens egna länkar (4 015 sidor) gav
 * produkterna samma interna värde utan den (median 0,320 → 0,319) — sidan har
 * bara 66 interna länkar in, medan kategorisidorna, som har egna A–Ö-listor,
 * hör till sajtens starkaste. Uppmätt samma dag låg alla 3 478 produkter i
 * någon kategoris lista.
 *
 * En produkt som bara ligger i "Övrigt" (som omdirigeras hit, se
 * next.config.ts) eller i en kategori utan sida hade då tappat sin enda
 * ankarlänk. Den här funktionen fångar just dem, så /alla-produkter kan lista
 * dem och ingen produkt blir utan länk.
 */
export function utanKategorisida(products: Product[], collections: Collection[]): Product[] {
  const medSida = new Set(
    collections.filter((c) => !UTAN_EGEN_LISTA.has(c.slug)).map((c) => c.id),
  );
  return products.filter((p) => !(p.collectionIds || []).some((id) => medSida.has(id)));
}

/** Kategorier vars sida inte listar sina egna produkter. "ovrigt" omdirigeras
 *  till /alla-produkter; rea och populara fylls från produktflaggor. */
const UTAN_EGEN_LISTA = new Set(["ovrigt", "rea", "populara"]);
