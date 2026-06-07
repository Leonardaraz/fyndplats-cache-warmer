// Läsbara, snygga SKU:er för Wix/Google — "FP-<produkt>-<variant>" istället för
// "AE-<hash>" (som dessutom skvallrade om AliExpress).
//
// SKU:n är ren ETIKETT: den parsas aldrig tillbaka, synken matchar på wixVariantId
// och fulfillment går via mappningen (sku→supplierVariantId lagras vid import). Så
// formatet är fritt — det enda kravet är Wix SKU MAX_LENGTH (40) och att den är unik
// inom produkten (för snygga, icke-krockande artikelnummer i flöden/feed).
//
// Byggs ur produktens slug + variantens optionsvärden, ASCII-säkert (å/ä→a, ö→o).

const SKU_MAX = 40; // Wix SKU MAX_LENGTH
const PRODUCT_PART_MAX = 24;
const VARIANT_PART_MAX = 12;

/** ASCII-slug: "Blå Läder" → "bla-lader", "17 L" → "17-l". */
export function skuSlugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // ta bort diakriter (å/ä→a, ö→o, é→e …)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Kapar en slug på hel-ord-gräns (bindestreck) till ≤max tecken (snyggare än mitt-i-ord). */
function truncateSlug(slug: string, max: number): string {
  if (slug.length <= max) return slug;
  let out = "";
  for (const part of slug.split("-")) {
    if (!part) continue;
    if (!out) {
      out = part.length <= max ? part : part.slice(0, max);
      if (part.length > max) break;
    } else if (`${out}-${part}`.length <= max) {
      out += `-${part}`;
    } else break;
  }
  return out || slug.slice(0, max);
}

/**
 * Bygger { supplierVariantId → läsbar SKU } för ALLA varianter i en produkt.
 * Format: "FP-<produkt-slug>-<variant>" (variant-delen utelämnas om produkten
 * saknar optionsvärden). Unik inom produkten — eventuella kollisioner får -2/-3…
 * Fallback om produkt-delen blir tom: supplierProductId-slug, annars "produkt".
 */
export function buildVariantSkus(
  variants: ReadonlyArray<{ supplierVariantId: string; options?: Record<string, string> }>,
  slug: string,
  supplierProductId: string,
): Map<string, string> {
  const productPart =
    truncateSlug(skuSlugify(slug), PRODUCT_PART_MAX) ||
    truncateSlug(skuSlugify(supplierProductId), PRODUCT_PART_MAX) ||
    "produkt";

  const out = new Map<string, string>();
  const seen = new Map<string, number>();
  for (const v of variants) {
    const variantPart = truncateSlug(skuSlugify(Object.values(v.options ?? {}).join(" ")), VARIANT_PART_MAX);
    const base = (variantPart ? `FP-${productPart}-${variantPart}` : `FP-${productPart}`)
      .slice(0, SKU_MAX)
      .replace(/-+$/g, "");
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const sku = n === 1 ? base : `${base.slice(0, SKU_MAX - 3).replace(/-+$/g, "")}-${n}`;
    out.set(v.supplierVariantId, sku);
  }
  return out;
}
