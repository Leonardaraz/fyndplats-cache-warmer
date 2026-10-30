// VEVOR steg 8: syskonen slås ihop till en produkt vid importen (Leonard
// 2026-10-29: "kan vi när vi hämtar produkter göra så att de slås ihop med
// sina syskon på en gång?").
//
// VEVOR:s sida länkar artikelns syskon (`DETAIL_ATTR_LINK`, lib/vevor/sida.ts),
// och varje syskon har en egen sida med sina egna värden (`PRODUCT_DATA.attr`,
// `egenskaper` på avläsningen). En familj blir en produkt med en variant per
// artikel och en axel per egenskap. Varje variant bär sitt eget artikelnummer,
// sitt eget saldo och sitt eget inköp, som en sammanslagen Aosom-sida
// (lib/aosom/artiklar.ts, utfallet "flera").
//
// Uppmätt på 35 sparade sidor 2026-10-29: 7 hade syskon, 2–6 artiklar per
// familj, en till tre axlar ("Typ", "Kabellängd", "Färg & Längd").
//
// Fem egenskaper som inte ska tas bort:
//
// 1. ☠️ Bara syskon med en egen avläsning följer med. Värdena kommer från
//    syskonets egen sida, aldrig från länklistan: den säger inte vilken
//    kombination syskonet är.
// 2. ☠️ Varje artikel måste ha samma axlar, och ingen kombination får finnas
//    två gånger. Annars går varianterna inte att skilja åt, och då blir
//    artikeln en egen produkt som förut (`ej_sammanslagen`).
// 3. ☠️ Ett syskon som redan sitter på en produkt följer inte med. Det hade
//    blivit samma vara på två sidor.
// 4. Ett syskon som är slut följer med med saldo 0. Annars hade det blivit en
//    egen produkt när det kommer tillbaka.
// 5. ☠️ Ett syskon vars avläsning saknar betyg (läst före steg 8) gör att hela
//    familjen väntar på nästa läsning. Annars hade det lämnats utanför
//    familjen och sedan aldrig fått komma in.
//
// Ren modul.

import { WIX_MAX_OPTIONS_PER_PRODUCT } from "@/lib/wix/limits";
import type { AliExpressProduct } from "@/lib/import/types";
import type { Avlasning } from "./lager";
import { medlemshinder, specifikation, kostnadUsd, vevorProdukt, type Prisunderlag } from "./to-product";
import type { Bildval } from "./bilder";

export type FamiljSkal = "utan_egenskaper" | "olika_axlar" | "samma_kombination" | "for_manga_axlar";

export const FAMILJ_SKAL: readonly FamiljSkal[] = ["utan_egenskaper", "olika_axlar", "samma_kombination", "for_manga_axlar"];

export type Familj =
  /** Inga syskon att slå ihop med: artikeln blir en egen produkt. */
  | { typ: "ensam" }
  /** Ett syskon saknar betyg (läst före steg 8): familjen väntar på nästa läsning. */
  | { typ: "vanta" }
  /** Syskonen går inte att skilja åt: artikeln blir en egen produkt. */
  | { typ: "ej_sammanslagen"; skal: FamiljSkal }
  | {
      typ: "familj";
      /** Ankaret först, sedan syskonen i artikelnummerordning. */
      medlemmar: Avlasning[];
      /** Axlarna i ankarets ordning. */
      axlar: string[];
      /** Axeln vars värden är olika för varje artikel, eller null. Den bär varianternas bilder. */
      bildaxel: string | null;
    };

/** Syskonens artikelnummer, utan artikeln själv, en gång var. */
export function syskonSkus(a: Pick<Avlasning, "sku" | "syskon">): string[] {
  return [...new Set((a.syskon ?? []).map((s) => s.sku).filter((s) => s && s !== a.sku))];
}

/**
 * Ett värde som det ska stå på varianten. Mellanslagen rensas, och en känd
 * felöversättning hos VEVOR rättas: "20 M" (meter) blev "20 miljoner" på en
 * längdaxel (uppmätt 2026-10-29). Ett variantvärde går inte att döpa om i Wix
 * efteråt, så det rättas här.
 */
export function rensaVarde(axel: string, varde: string): string {
  const v = varde.replace(/\s+/g, " ").trim();
  const m = /^(\d+(?:[.,]\d+)?)\s*miljoner$/i.exec(v);
  if (m && /längd/i.test(axel)) return `${m[1]} m`;
  return v;
}

/** Artikelns egenskaper som axel → värde, rensade. Tomma tas bort. */
export function egenskaperFor(a: Pick<Avlasning, "egenskaper">): Record<string, string> {
  const ut: Record<string, string> = {};
  for (const [k, v] of a.egenskaper ?? []) {
    const axel = k.replace(/\s+/g, " ").trim();
    const varde = rensaVarde(axel, v ?? "");
    if (axel && varde && !(axel in ut)) ut[axel] = varde;
  }
  return ut;
}

/**
 * Familjen artikeln hör till.
 *
 * `lasta` är syskonens avläsningar. `upptagen` svarar sant för en artikel som
 * redan sitter på en produkt (id med prefix).
 */
export function byggFamilj(
  ankare: Avlasning,
  lasta: ReadonlyMap<string, Avlasning>,
  nu: number,
  upptagen: (sku: string) => boolean,
): Familj {
  const syskon: Avlasning[] = [];
  for (const sku of syskonSkus(ankare).sort()) {
    const m = lasta.get(sku);
    if (!m || m.sku !== sku || upptagen(sku)) continue;
    if (m.spu !== ankare.spu) continue;
    const h = medlemshinder(m, nu);
    if (h === "betyg_okant") return { typ: "vanta" };
    if (h === null) syskon.push(m);
  }
  if (syskon.length === 0) return { typ: "ensam" };

  const medlemmar = [ankare, ...syskon];
  const varden = medlemmar.map(egenskaperFor);
  if (varden.some((v) => Object.keys(v).length === 0)) return { typ: "ej_sammanslagen", skal: "utan_egenskaper" };
  const axlar = Object.keys(varden[0]);
  const nyckel = (v: Record<string, string>) => Object.keys(v).sort().join("\u0001");
  if (varden.some((v) => nyckel(v) !== nyckel(varden[0]))) return { typ: "ej_sammanslagen", skal: "olika_axlar" };
  if (axlar.length > WIX_MAX_OPTIONS_PER_PRODUCT) return { typ: "ej_sammanslagen", skal: "for_manga_axlar" };
  const kombination = (v: Record<string, string>) => axlar.map((k) => (v[k] ?? "").toLowerCase()).join("\u0001");
  if (new Set(varden.map(kombination)).size !== varden.length) return { typ: "ej_sammanslagen", skal: "samma_kombination" };

  const bildaxel =
    axlar.find((k) => new Set(varden.map((v) => (v[k] ?? "").toLowerCase())).size === varden.length) ?? null;
  return { typ: "familj", medlemmar, axlar, bildaxel };
}

/**
 * Familjen som pipelinens produkt: ankarets text, bilder och specifikation,
 * och en variant per artikel med dess egna värden, saldo och inköp.
 *
 * Värdena och axlarnas namn är VEVOR:s egen svenska och skickas som manuella
 * namn (`variantNameOverrides`, `axisNameOverrides`), så att pipelinen varken
 * översätter dem eller flaggar dem. Bilderna kopplas till valen på
 * `bildaxel`: varje artikels första bild till dess värde.
 */
export function vevorFamiljeProdukt(
  f: Extract<Familj, { typ: "familj" }>,
  pris: Prisunderlag,
  bilder: Bildval,
  huvudbild: (a: Avlasning) => string | null,
): AliExpressProduct {
  const [ankare] = f.medlemmar;
  const bas = vevorProdukt(ankare, pris, bilder);
  const axlar = new Set(f.axlar.map((k) => k.toLowerCase()));
  const spec = Object.fromEntries(
    Object.entries(specifikation({ spec: ankare.spec, egenskaper: [] })).filter(([k]) => !axlar.has(k.trim().toLowerCase())),
  );
  const varianter = f.medlemmar.map((m) => {
    const v = egenskaperFor(m);
    return {
      supplierVariantId: m.sku,
      options: Object.fromEntries(f.axlar.map((k) => [k, v[k]])),
      costUsd: kostnadUsd(m, pris),
      // Bufferten är 0 (Leonard 2026-10-28): VEVOR:s saldo rakt av.
      stock: m.saldo > 0 ? m.saldo : 0,
      included: true,
    };
  });
  const namn: Record<string, string> = {};
  for (const v of varianter) for (const varde of Object.values(v.options)) namn[varde] = varde;
  const swatch: Record<string, string> = {};
  if (f.bildaxel) {
    for (const [i, m] of f.medlemmar.entries()) {
      const url = huvudbild(m);
      if (url) swatch[varianter[i].options[f.bildaxel]] = url;
    }
  }
  return {
    ...bas,
    variants: varianter,
    inStock: varianter.some((v) => v.stock > 0),
    specifications: spec,
    variantNameOverrides: namn,
    axisNameOverrides: Object.fromEntries(f.axlar.map((k) => [k, k])),
    ...(f.bildaxel && Object.keys(swatch).length > 0 ? { swatchImages: { [f.bildaxel]: swatch } } : {}),
  };
}
