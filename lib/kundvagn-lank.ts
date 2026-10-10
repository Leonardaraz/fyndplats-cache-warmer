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

const WIX_PRODUKT = /^\/product-page\/([^/?#]+)\/?$/;
const SLUG = /^[^/?#\s]+$/;

export interface RadMedAdress {
  url?: { relativePath?: string | null; url?: string | null } | null;
  catalogReference?: { catalogItemId?: string } | null;
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
  if (m) return `/produkt/${m[1]}`;
  const id = li?.catalogReference?.catalogItemId;
  const slug = id && reserv ? reserv[id] : undefined;
  return typeof slug === "string" && SLUG.test(slug) ? `/produkt/${slug}` : null;
}
