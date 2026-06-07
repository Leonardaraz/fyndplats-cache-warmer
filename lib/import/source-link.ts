// Hjälpare för admin-uppslaget "hitta AliExpress-källa" (app/admin/source-lookup).
//
// Operatorn klistrar in EN sträng — Wix-produkt-id (GUID), en produkt-slug eller
// en hel storefront-URL (https://www.fyndplats.se/produkt/<slug>). Vi normaliserar
// den till antingen ett produkt-id (slår direkt mot FyndplatsMappings) eller en
// slug (resolvas till id via Wix V3 först). Ren logik → enhetstestbar utan nät.

/** Vad inmatningen pekar på: ett Wix-produkt-id eller en slug. */
export type LookupTarget = { kind: "id"; id: string } | { kind: "slug"; slug: string };

// Wix-produkt-id är ett GUID (8-4-4-4-12 hex). Slugs innehåller aldrig denna form.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Tolkar en fri inmatning till ett uppslags-mål.
 * - "…/produkt/<slug>" (valfri domän, query/hash ignoreras) → slug
 * - rent GUID → id
 * - allt annat → behandlas som slug (trimmad på kringliggande snedstreck)
 * Tom/whitespace → null.
 */
export function parseLookupInput(raw: string): LookupTarget | null {
  const s = (raw || "").trim();
  if (!s) return null;
  // Storefront-URL (eller vilken URL som helst med /produkt/<slug>): plocka slug:en.
  const urlSlug = s.match(/\/produkt\/([^/?#]+)/i)?.[1];
  if (urlSlug) {
    const slug = safeDecode(urlSlug);
    return slug ? { kind: "slug", slug } : null;
  }
  // Rent GUID = Wix-produkt-id.
  if (UUID_RE.test(s)) return { kind: "id", id: s.toLowerCase() };
  // Annars: slug. Ta bort ev. kringliggande snedstreck (t.ex. "/min-slug/").
  const slug = s.replace(/^\/+|\/+$/g, "");
  return slug ? { kind: "slug", slug } : null;
}

/** decodeURIComponent som aldrig kastar (trasig %-encoding → råvärdet). */
function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Bygger AliExpress-produkt-URL:en för en mappning. Föredrar den exakta
 * `sourceUrl` extensionen fångade; faller annars tillbaka på den kanoniska
 * item-URL:en från supplierProductId. Saknas båda → null.
 */
export function aliexpressUrlFor(opts: {
  sourceUrl?: string | null;
  supplierProductId?: string | null;
}): string | null {
  const src = (opts.sourceUrl || "").trim();
  if (/^https?:\/\//i.test(src)) return src;
  const id = (opts.supplierProductId || "").trim();
  if (id) return `https://www.aliexpress.com/item/${encodeURIComponent(id)}.html`;
  return null;
}
