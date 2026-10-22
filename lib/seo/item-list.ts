// lib/seo/item-list.ts
//
// ItemList-schemat för listsidorna: köpguiderna, /under-…-kr/<kategori> och
// /for-dig-som/<intresse> (lib/seo/programmatic.ts). LÖVMODUL, testad i
// lib/seo/item-list.test.ts.
//
// Varje rad är en ListItem med bara plats, länk och namn, samma form som
// kategorisidan (app/kategori/[slug]). Förut var varje rad ett Product-objekt
// med namn, bild och pris. Search Console räknade då varje rad som en egen
// vara som saknade beskrivning, frakt, returvillkor och märke (185 objekt
// 2026-10-22), och Google rekommenderar varudata på produktsidor, inte på sidor
// som listar produkter. Produktsidan har hela varudatan.

export type ListadProdukt = { name: string; slug: string };

export function listsidansItemList(site: string, name: string, url: string, produkter: ListadProdukt[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url,
    numberOfItems: produkter.length,
    itemListElement: produkter.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${site}/produkt/${p.slug}`,
      name: p.name,
    })),
  };
}
