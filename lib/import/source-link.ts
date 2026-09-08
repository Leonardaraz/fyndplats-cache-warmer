// Hjälpare för admin-uppslaget "hitta AliExpress-källa" (app/admin/source-lookup).
//
// Operatorn klistrar in EN sträng — Wix-produkt-id (GUID), en produkt-slug eller
// en hel storefront-URL (https://www.fyndplats.se/produkt/<slug>). Vi normaliserar
// den till antingen ett produkt-id (slår direkt mot FyndplatsMappings) eller en
// slug (resolvas till id via Wix V3 först). Ren logik → enhetstestbar utan nät.

import type { MappingSupplier } from "../store";
import { mappingSupplier } from "../store/supplier";
import { AOSOM_ID_PREFIX } from "../aosom/to-product";

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
 * item-URL:en från supplierProductId.
 *
 * ☠️ FALLBACKEN GÄLLER BARA AE-RADER. Ett Aosom-artikelnummer i samma fält
 * hade byggt `https://www.aliexpress.com/item/aosom:000-000V00XX.html` — en
 * länk som ser giltig ut och alltid är död. Samma familj som resten av
 * `isAliExpressMapping`-spärrarna: fältet heter likadant för båda
 * leverantörerna och betyder olika saker.
 */
export function aliexpressUrlFor(opts: {
  sourceUrl?: string | null;
  supplierProductId?: string | null;
  supplier?: MappingSupplier;
}): string | null {
  const src = (opts.sourceUrl || "").trim();
  if (/^https?:\/\//i.test(src)) return src;
  const id = (opts.supplierProductId || "").trim();
  if (!id) return null;
  if (mappingSupplier({ supplier: opts.supplier, supplierProductId: id }) !== "aliexpress") return null;
  return `https://www.aliexpress.com/item/${encodeURIComponent(id)}.html`;
}

/** Leverantörens namn som det skrivs för en människa. */
const LEVERANTORSNAMN: Record<MappingSupplier, string> = {
  aliexpress: "AliExpress",
  aosom: "Aosom",
};

export interface Leverantorskalla {
  leverantor: MappingSupplier;
  /** "AliExpress" · "Aosom" — för etiketter och knapptexter. */
  namn: string;
  /**
   * Artikelnumret som det ska LÄSAS och klistras in hos leverantören, alltså
   * utan `aosom:`-prefixet. Prefixet är vår interna diskriminator och betyder
   * ingenting i Aosoms egen bulkorderfil.
   */
  artikelnummer: string;
  /** Produktsidan hos leverantören, eller null när den inte går att bygga. */
  url: string | null;
}

/**
 * Vad en mappningsrad pekar på hos sin leverantör: namn, artikelnummer och
 * länk. Ett enda ställe, så att admin-vyerna inte var för sig gissar vad
 * `supplierProductId` betyder.
 *
 * Bakgrunden är konkret: /admin/source-lookup och /admin/mappings skrev båda
 * "AliExpress" över varje rad, alltså även över Aosoms 5 566. Uppslaget
 * FUNGERADE för Aosom (sourceUrl vinner), men etiketten ljög och numret visades
 * med sitt interna prefix — och mappnings-kortet byggde dessutom en död
 * aliexpress.com-länk av ett Aosom-artikelnummer.
 */
export function leverantorskallaFor(m: {
  sourceUrl?: string | null;
  supplierProductId?: string | null;
  supplier?: MappingSupplier;
}): Leverantorskalla {
  const id = (m.supplierProductId || "").trim();
  const leverantor = mappingSupplier({ supplier: m.supplier, supplierProductId: id });
  return {
    leverantor,
    namn: LEVERANTORSNAMN[leverantor],
    artikelnummer: leverantor === "aosom" && id.startsWith(AOSOM_ID_PREFIX)
      ? id.slice(AOSOM_ID_PREFIX.length)
      : id,
    url: aliexpressUrlFor(m),
  };
}
