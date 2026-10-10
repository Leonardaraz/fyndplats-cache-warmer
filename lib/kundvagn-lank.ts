// Adressen till produktsidan för en rad i varukorgen.
//
// Två källor, i den här ordningen:
//   1. Wix egen adress på raden (`url.relativePath`, i formen
//      `/product-page/<slug>`; normaliseraKundvagn bär den från v2:s
//      `attributes.url`). Slugen flyttas till butikens `/produkt/<slug>`, så
//      klicket inte går via omdirigeringen.
//   2. Slugen från förslagsanropet (`/api/kundvagn-forslag` svarar med
//      `lankar`, id → slug, för de varor i varukorgen som finns i
//      underlaget). Den gäller när Wix inte skickat någon adress.
//
// Utan någon av dem får raden ingen länk. Hellre ett namn som inte går att
// klicka på än en länk till fel sida.
//
// Alternativet följer med som `?variant=<id>`, samma parameter som
// Google-flödet använder och som produktsidan förväljer ur (productview.tsx).
// Utan den öppnade länken alltid första alternativet, också när kunden valt
// ett annat (Leonard 2026-10-10). En vara utan alternativ bär nollornas id i
// Wix, och då läggs ingen parameter till.

const WIX_PRODUKT = /^\/product-page\/([^/?#]+)\/?$/;
const SLUG = /^[^/?#\s]+$/;

export interface RadMedAdress {
  url?: { relativePath?: string | null; url?: string | null } | null;
  catalogReference?: { catalogItemId?: string; options?: unknown } | null;
}

const NOLL_ID = /^0{8}-0{4}-0{4}-0{4}-0{12}$/;
const VARIANT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Radens valda alternativ, eller null för en vara utan alternativ. */
export function variantForRad(li: RadMedAdress | null | undefined): string | null {
  const o = li?.catalogReference?.options;
  const id = o && typeof o === "object" ? (o as { variantId?: unknown }).variantId : undefined;
  return typeof id === "string" && VARIANT_ID.test(id) && !NOLL_ID.test(id) ? id : null;
}

function vagFranUrl(u: RadMedAdress["url"]): string | null {
  if (!u) return null;
  if (typeof u.relativePath === "string" && u.relativePath.trim()) return u.relativePath.trim();
  if (typeof u.url === "string" && u.url) {
    try {
      return new URL(u.url).pathname;
    } catch {
      return null;
    }
  }
  return null;
}

export function produktLankForRad(
  li: RadMedAdress | null | undefined,
  reserv?: Record<string, string> | null,
): string | null {
  const m = WIX_PRODUKT.exec(vagFranUrl(li?.url) ?? "");
  const id = li?.catalogReference?.catalogItemId;
  const reservSlug = id && reserv ? reserv[id] : undefined;
  const slug = m ? m[1] : typeof reservSlug === "string" && SLUG.test(reservSlug) ? reservSlug : null;
  if (!slug) return null;
  const variant = variantForRad(li);
  return variant ? `/produkt/${slug}?variant=${variant}` : `/produkt/${slug}`;
}

/**
 * Sant när länken leder till sidan och alternativet kunden redan står på.
 * Då ska trycket bara stänga varukorgen: en omladdning av samma sida såg ut
 * som att ingenting hände.
 */
export function arSammaSida(lank: string, nu: { pathname: string; search: string }): boolean {
  const u = new URL(lank, "https://x.invalid");
  if (u.pathname !== nu.pathname) return false;
  const valt = new URLSearchParams(nu.search).get("variant");
  return (u.searchParams.get("variant") ?? null) === valt;
}
