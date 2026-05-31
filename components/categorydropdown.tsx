import type { Product, Collection } from "../lib/products";
import { buildCategoryTree } from "../lib/category-groups";
import { CategoryDropdownClient } from "./categorydropdown-client";

// Premium kategori-navigering — ersätter den platta chip-raden med en
// kollapsibel "Kategorier ▾"-dropdown som visar den riktiga 2-nivå-hierarkin
// (huvudkategori som bold rubrik, subkategorier indragna under).
// Single source of truth: buildCategoryTree bygger trädet direkt ur Wix V3-
// hierarkin (parentId/index) — samma träd som headerns mega-meny och mobil-
// drawer, så strukturen är konsekvent över hela siten.
export function CategoryDropdown({ products, collections, activeSlug }: {
  products: Product[];
  collections: Collection[];
  activeSlug?: string;
}) {
  const tree = buildCategoryTree(products, collections);
  return (
    <CategoryDropdownClient tree={tree} totalProducts={products.length} activeSlug={activeSlug} />
  );
}
