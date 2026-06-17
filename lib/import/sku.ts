// Läsbara, snygga SKU:er för Wix/Google — "FP-<produkt>-<variant>" istället för
// "AE-<hash>" (som dessutom skvallrade om AliExpress).
//
// SKU:n är ren ETIKETT: den parsas aldrig tillbaka, synken matchar på wixVariantId
// och fulfillment går via mappningen (sku→supplierVariantId lagras vid import). Så
// formatet är fritt — det enda kravet är Wix SKU MAX_LENGTH (40) och att den är unik
// inom produkten (för snygga, icke-krockande artikelnummer i flöden/feed).
//
// Byggs ur produktens slug + variantens optionsvärden, ASCII-säkert (å/ä→a, ö→o).
// Ett ledande märkes-token (succebuy, vevor, …) strippas så SKU:n aldrig avslöjar märket.

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

// Kända leverantörs-/AliExpress-märken som råimporten alltid lägger FÖRST i
// titeln (HOMCOM, SucceBuy, VEVOR, …). SKU:n ska aldrig avslöja märket — samma
// policy som för namn/titel/meta — så vi strippar ett ledande märkes-token innan
// produkt-delen byggs. (Annars läckte t.ex. "FP-succebuy-…" till feed/kvitto/JSON-LD.)
const KNOWN_BRAND_TOKENS = new Set([
  "succebuy", "vevor", "homcom", "pawhut", "outsunny", "giantex", "costway",
  "tobbi", "aosom", "zeny", "happybuy", "goplus", "vivohome", "kkmoon",
  "yaheetech", "vingli", "skyshalo", "bentism", "walnew", "moukey",
]);

/** Tar bort ledande märkes-token ur en redan slugifierad sträng ("succebuy-x-y" → "x-y"). */
export function stripBrandPrefix(slug: string): string {
  const parts = (slug || "").split("-").filter(Boolean);
  // Behåll minst ett token kvar (en produkt som BARA heter märket blir inte tom).
  while (parts.length > 1 && KNOWN_BRAND_TOKENS.has(parts[0])) parts.shift();
  return parts.join("-");
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
    truncateSlug(stripBrandPrefix(skuSlugify(slug)), PRODUCT_PART_MAX) ||
    truncateSlug(stripBrandPrefix(skuSlugify(supplierProductId)), PRODUCT_PART_MAX) ||
    "produkt";

  const out = new Map<string, string>();
  const used = new Set<string>();
  for (const v of variants) {
    const variantPart = truncateSlug(skuSlugify(Object.values(v.options ?? {}).join(" ")), VARIANT_PART_MAX);
    const base = (variantPart ? `FP-${productPart}-${variantPart}` : `FP-${productPart}`)
      .slice(0, SKU_MAX)
      .replace(/-+$/g, "");
    // Garantera unikhet mot ALLA redan utdelade SKU:er (inte bara mot samma bas):
    // annars kan en variants naturliga namn krocka med en annans dedup-form
    // ("Svart 2" vs "Svart" → "…-svart-2") → dubbel Wix-SKU → samma wixVariantId på
    // två varianter → fel lager/pris/fulfillment vid synk. Suffix-längden räknas
    // dynamiskt så strängen ALLTID håller sig ≤ SKU_MAX (även vid 2-/3-siffrig n).
    let sku = base;
    for (let n = 2; used.has(sku); n++) {
      const suffix = `-${n}`;
      sku = `${base.slice(0, SKU_MAX - suffix.length).replace(/-+$/g, "")}${suffix}`;
    }
    used.add(sku);
    out.set(v.supplierVariantId, sku);
  }
  return out;
}
