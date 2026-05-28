// Ren v1 → v3-transform. Inga API-anrop, inga sidoeffekter — testbart.
// Ricos-konverteringen är ett separat steg som anropas av orkestratorn
// (se descriptionsToConvert i resultatet).

export const ALL_PRODUCTS_LEGACY_ID = "00000000-000000-000000-000000000001";
export const WIX_STORES_APP_ID = "215238eb-22a5-4c36-9e7b-e7c08025e04e";

// ---------- v1 input typer ----------

export interface V1Choice {
  value: string;
  description?: string;
  visible?: boolean;
  inStock?: boolean;
}

export interface V1Option {
  optionType: string;
  name: string;
  choices: V1Choice[];
}

export interface V1Variant {
  choices: Record<string, string>;
  sku: string;
  price: number;
  discountedPrice?: number;
  weight?: number;
  visible?: boolean;
  quantity?: number;
  trackQuantity?: boolean;
}

export interface V1MediaItem {
  type: string;
  url: string;
}

export interface V1InfoSection {
  title: string;
  description: string;
}

export interface V1Product {
  name: string;
  slug: string;
  visible: boolean;
  productType: string;
  brand?: string | null;
  ribbon?: string | null;
  description: string;
  additionalInfoSections?: V1InfoSection[];
  currency?: string;
  price: number;
  discountedPrice?: number;
  stock?: { quantity?: number; trackInventory?: boolean; inventoryStatus?: string };
  mediaMainUrl?: string | null;
  mediaItems?: V1MediaItem[];
  manageVariants?: boolean;
  productOptions?: V1Option[];
  variants?: V1Variant[];
  collectionIds?: string[];
}

// ---------- v3 output typer ----------

export interface V3Choice {
  choiceType: "CHOICE_TEXT" | "ONE_COLOR";
  name: string;
  colorCode?: string;
}

export interface V3Option {
  name: string;
  optionRenderType: "TEXT_CHOICES" | "SWATCH_CHOICES";
  choicesSettings: { choices: V3Choice[] };
}

export interface V3Variant {
  sku: string;
  visible: boolean;
  choices: { optionChoiceNames: { optionName: string; choiceName: string; renderType: string } }[];
  price: {
    actualPrice: { amount: string };
    compareAtPrice?: { amount: string };
  };
  inventoryStatus: { inStock: boolean; preorderEnabled: boolean };
}

export interface V3InfoSection {
  uniqueName: string;
  title: string;
  description?: unknown; // Fylls i av Ricos-konvertering
  plainDescription: string;
}

export interface V3MediaItem {
  url: string;
  altText?: string;
  mediaType?: "IMAGE";
}

export interface V3Product {
  name: string;
  slug?: string;
  visible: boolean;
  productType: "PHYSICAL";
  physicalProperties: Record<string, never>;
  brand?: { name: string };
  ribbon?: { name: string };
  description?: unknown; // Ricos-document — fylls i av orkestratorn
  plainDescription: string;
  infoSections: V3InfoSection[];
  mainCategoryId?: string;
  media?: {
    main?: V3MediaItem;
    itemsInfo: { items: V3MediaItem[] };
  };
  options?: V3Option[];
  variantsInfo: { variants: V3Variant[] };
}

export interface TransformContext {
  /** Gammal bild-URL → ny URL på mål-sajten. Saknad nyckel = behåll original. */
  imageMap: Record<string, string>;
  /** Legacy collectionId → ny v3 category-id. */
  categoryMap: Record<string, string>;
  /** Frivilliga alt-texter per gammal bild-URL. Default = produktnamnet. */
  altTextByUrl?: Record<string, string>;
}

export interface TransformResult {
  product: V3Product;
  /** Beskrivningar som behöver Ricos-konverteras innan skarp create. */
  descriptionsToConvert: { path: string; html: string }[];
  /** Sekundära kategori-id:n att koppla i Steg 8. */
  secondaryCategoryIds: string[];
  /** Lagersaldon att sätta i Steg 7. */
  initialStock: { sku: string; quantity: number }[];
}

// ---------- transform ----------

export function transformProduct(v1: V1Product, ctx: TransformContext): TransformResult {
  const productHasVariants =
    (v1.variants?.length ?? 0) > 0 &&
    (v1.productOptions?.length ?? 0) > 0;

  const options: V3Option[] | undefined = productHasVariants
    ? (v1.productOptions ?? []).map(buildOption)
    : undefined;

  const optionRenderTypes = new Map(
    (options ?? []).map((o) => [o.name, o.optionRenderType] as const),
  );

  const v3Variants: V3Variant[] = productHasVariants
    ? (v1.variants ?? []).map((v) => buildVariant(v, optionRenderTypes))
    : [defaultVariant(v1)];

  // Kategorier: filtrera bort "All Products" och mappa via categoryMap.
  const mappedCatIds = (v1.collectionIds ?? [])
    .filter((id) => id !== ALL_PRODUCTS_LEGACY_ID)
    .map((id) => ctx.categoryMap[id])
    .filter((id): id is string => Boolean(id));
  const mainCategoryId = mappedCatIds[0];
  const secondaryCategoryIds = mappedCatIds.slice(1);

  // Bilder: mappa via imageMap, behåll original om mappning saknas.
  const mediaItems: V3MediaItem[] = (v1.mediaItems ?? [])
    .filter((m) => m.type === "image")
    .map((m) => ({
      url: ctx.imageMap[m.url] ?? m.url,
      altText: ctx.altTextByUrl?.[m.url] ?? v1.name,
      mediaType: "IMAGE" as const,
    }));
  const media =
    mediaItems.length > 0
      ? { main: mediaItems[0], itemsInfo: { items: mediaItems } }
      : undefined;

  // Info-sektioner: uniqueName = <produkt-slug>-<section-slug> för att vara unika.
  const infoSections: V3InfoSection[] = (v1.additionalInfoSections ?? []).map((s) => ({
    uniqueName: slugify(`${v1.slug}-${s.title}`),
    title: s.title,
    plainDescription: s.description,
  }));

  const product: V3Product = {
    name: v1.name,
    slug: v1.slug,
    visible: v1.visible,
    productType: "PHYSICAL",
    physicalProperties: {},
    ...(v1.brand ? { brand: { name: v1.brand } } : {}),
    ...(v1.ribbon ? { ribbon: { name: v1.ribbon } } : {}),
    plainDescription: v1.description,
    infoSections,
    ...(mainCategoryId ? { mainCategoryId } : {}),
    ...(media ? { media } : {}),
    ...(options ? { options } : {}),
    variantsInfo: { variants: v3Variants },
  };

  const descriptionsToConvert = [
    { path: "description", html: v1.description },
    ...(v1.additionalInfoSections ?? []).map((s, i) => ({
      path: `infoSections.${i}.description`,
      html: s.description,
    })),
  ];

  const initialStock: { sku: string; quantity: number }[] = productHasVariants
    ? (v1.variants ?? [])
        .filter((v) => (v.quantity ?? 0) > 0)
        .map((v) => ({ sku: v.sku, quantity: v.quantity ?? 0 }))
    : v1.stock?.quantity && v1.stock.quantity > 0
      ? [{ sku: `${v1.slug}-default`, quantity: v1.stock.quantity }]
      : [];

  return { product, descriptionsToConvert, secondaryCategoryIds, initialStock };
}

function buildOption(o: V1Option): V3Option {
  return {
    name: o.name,
    optionRenderType: "TEXT_CHOICES",
    choicesSettings: {
      choices: o.choices.map((c) => ({ choiceType: "CHOICE_TEXT" as const, name: c.value })),
    },
  };
}

function buildVariant(v: V1Variant, renderTypes: Map<string, V3Option["optionRenderType"]>): V3Variant {
  const choices = Object.entries(v.choices).map(([optionName, choiceName]) => ({
    optionChoiceNames: {
      optionName,
      choiceName,
      renderType: renderTypes.get(optionName) ?? "TEXT_CHOICES",
    },
  }));
  const actual = v.discountedPrice ?? v.price;
  const showCompare = v.discountedPrice !== undefined && v.discountedPrice < v.price;
  return {
    sku: v.sku,
    visible: v.visible ?? true,
    choices,
    price: {
      actualPrice: { amount: String(actual) },
      ...(showCompare ? { compareAtPrice: { amount: String(v.price) } } : {}),
    },
    inventoryStatus: { inStock: (v.quantity ?? 0) > 0, preorderEnabled: false },
  };
}

function defaultVariant(v1: V1Product): V3Variant {
  const actual = v1.discountedPrice ?? v1.price;
  const showCompare = v1.discountedPrice !== undefined && v1.discountedPrice < v1.price;
  return {
    sku: `${v1.slug}-default`,
    visible: true,
    choices: [],
    price: {
      actualPrice: { amount: String(actual) },
      ...(showCompare ? { compareAtPrice: { amount: String(v1.price) } } : {}),
    },
    inventoryStatus: { inStock: (v1.stock?.quantity ?? 0) > 0, preorderEnabled: false },
  };
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
