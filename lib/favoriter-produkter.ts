// lib/favoriter-produkter.ts
//
// Favoriternas uppslag: namn, bild, pris och lager för de produktadresser som
// står i kundens lista (GET /api/favoriter). ETT anrop till Wix för hela
// listan, aldrig hela katalogen (getProdukterForSluggar i lib/products.ts).

import { getProdukterForSluggar, type Product } from "./products";
import { formatPrice, listPris } from "./price-range";
import { tightFillUrl } from "./wix-image";
import { FAVORITBILD_KANT, favoritsvar, somFavoritProdukt, type FavoritFormat, type Favoritsvar } from "./favoriter";

const FORMAT: FavoritFormat<Product> = {
  listPris,
  pris: formatPrice,
  bild: (url) => tightFillUrl(url, FAVORITBILD_KANT, FAVORITBILD_KANT),
};

/** En vara med val (färg, storlek) har fler än en variant, eller en enda som bär ett val. */
function harVal(p: Product): boolean {
  return p.variants.length > 1 || (p.variants.length === 1 && p.variants[0].label !== "Standard");
}

/** Kastar när Wix felar. En adress utan synlig produkt står under `saknas`. */
export async function hamtaFavoritprodukter(sluggar: readonly string[]): Promise<Favoritsvar> {
  const produkter = await getProdukterForSluggar(sluggar);
  return favoritsvar(sluggar, produkter.map((p) => somFavoritProdukt(p, harVal(p), FORMAT)));
}
