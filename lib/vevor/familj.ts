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
// 6. ☠️ Ett syskon som inte lästs alls men står i läsarens kö (`arPaVag`) gör
//    också att familjen väntar (Leonard 2026-10-30: "Gör det som blir
//    proffsigast"). Annars hade artikeln importerats ensam, och syskonet blivit
//    en egen produkt när det lästs. Ett syskon som inte står i kön, är borta,
//    eller vars sida inte går att läsa väntar familjen inte på: då hade den
//    väntat för alltid.
//
// ☠️ VARJE FÄRG FÅR SINA EGNA BILDER (Leonard 2026-10-30: "Ja gör det
// noggrant"). Familjen fick först ankarets sex bilder och bara huvudbilden från
// varje syskon. Traktorskopskyddet i tre färger visade då en bild för grön och
// orange och sju för röd, och den röda huvudbilden låg två gånger i galleriet.
// Nu ligger varje artikels egna bilder i galleriet, ankaret först, och kopplas
// till artikelns värde på bildaxeln (`valBilder`, lib/import/types.ts). Varje
// bild laddas upp en gång. Syskonens bilder ligger i egna mappar hos VEVOR,
// så ingen adress delas mellan två artiklar (uppmätt på traktorskopskyddet, 3 × 12
// egna bilder, 0 gemensamma). Skulle en adress ändå delas kopplas den till den
// första artikeln som har den. Wix tar högst 50 bilder per produkt, så en familj
// med fler än åtta artiklar får färre än sex bilder per artikel, minst en.
//
// Ren modul.

import { WIX_MAX_BILDER_PER_PRODUKT, WIX_MAX_OPTIONS_PER_PRODUCT, WIX_MAX_VALNAMN } from "@/lib/wix/limits";
import type { AliExpressProduct } from "@/lib/import/types";
import type { Avlasning, Sidrad } from "./lager";
import { medlemshinder, specifikation, kostnadUsd, vevorProdukt, type Prisunderlag } from "./to-product";
import { BILDER_PER_PRODUKT, type Bildval } from "./bilder";

export type FamiljSkal = "utan_egenskaper" | "olika_axlar" | "samma_kombination" | "for_manga_axlar" | "for_langt_namn";

export const FAMILJ_SKAL: readonly FamiljSkal[] = [
  "utan_egenskaper",
  "olika_axlar",
  "samma_kombination",
  "for_manga_axlar",
  "for_langt_namn",
];

export type Familj =
  /** Inga syskon att slå ihop med: artikeln blir en egen produkt. */
  | { typ: "ensam" }
  /** Ett syskon saknar betyg, eller är oläst men står i läsarens kö: familjen väntar. */
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

/**
 * Ska familjen vänta på syskonets sida? Bara när sidan står i läsarens kö och
 * inte har prövats, eller senast föll på ett övergående fel. En sida som
 * lästs (då finns en avläsning, eller ett annat artikelnummer), är borta,
 * saknas, har flyttat, är spärrad eller inte går att tolka väntar familjen inte
 * på.
 */
export function arPaVag(r: Sidrad | undefined): boolean {
  if (!r || r.borta) return false;
  return r.senastUtfall === null || r.senastUtfall === "tillfalligt" || r.senastUtfall === "skrivfel";
}

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
 * redan sitter på en produkt (id med prefix). `pavag` är artikelnumren för
 * syskon utan avläsning vars sida står i läsarens kö (`arPaVag`).
 */
export function byggFamilj(
  ankare: Avlasning,
  lasta: ReadonlyMap<string, Avlasning>,
  nu: number,
  upptagen: (sku: string) => boolean,
  pavag: ReadonlySet<string> = new Set(),
): Familj {
  const syskon: Avlasning[] = [];
  for (const sku of syskonSkus(ankare).sort()) {
    if (upptagen(sku)) continue;
    const m = lasta.get(sku);
    if (!m || m.sku !== sku) {
      if (pavag.has(sku)) return { typ: "vanta" };
      continue;
    }
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
  // Wix avvisar hela produkten när en axel eller ett värde är längre än 50 tecken.
  if (varden.some((v) => Object.entries(v).some(([k, x]) => k.length > WIX_MAX_VALNAMN || x.length > WIX_MAX_VALNAMN)))
    return { typ: "ej_sammanslagen", skal: "for_langt_namn" };
  const kombination = (v: Record<string, string>) => axlar.map((k) => (v[k] ?? "").toLowerCase()).join("\u0001");
  if (new Set(varden.map(kombination)).size !== varden.length) return { typ: "ej_sammanslagen", skal: "samma_kombination" };

  const bildaxel =
    axlar.find((k) => new Set(varden.map((v) => (v[k] ?? "").toLowerCase())).size === varden.length) ?? null;
  return { typ: "familj", medlemmar, axlar, bildaxel };
}

/** Familjens galleri, uppdelat på de foton ett värde har ensamt och de som flera delar. */
export interface Familjegalleri {
  /** Galleriet: varje foto en gång, i medlemmarnas ordning. */
  imageUrls: string[];
  /** Foton som bara ett värde har, per värde. De kopplas till värdet. */
  perVarde: Record<string, string[]>;
  /** Foton som flera värden har. De kopplas inte och syns för alla värden. */
  gemensamma: string[];
}

/**
 * Familjens galleri och bilderna per värde: varje artikels egna bilder, i
 * medlemmarnas ordning, så att ankarets första bild blir huvudbilden. Högst
 * `WIX_MAX_BILDER_PER_PRODUKT` bilder, fördelade lika mellan artiklarna (minst
 * en var så länge taket räcker).
 *
 * ☠️ Varje FOTO tas en gång, inte varje adress. `nyckel` ger fotots innehåll
 * (md5, lib/vevor/bildinnehall.ts): VEVOR lägger samma foto under olika
 * adresser för varje storlek. Ett foto som bara ett värde har kopplas till det
 * värdet. Ett foto som flera värden har kopplas inte: butiken ger varje bild
 * EN ägare (headless-site lib/variant-bilder.ts), och en bild utan ägare visas
 * för alla val. Utan nyckel jämförs adresserna.
 */
export function familjensBilder(
  medlemmar: Avlasning[],
  bildval: (a: Avlasning) => Bildval,
  varde: (i: number) => string,
  nyckel: (url: string) => string = (u) => u,
): Familjegalleri {
  const perArtikel = Math.min(BILDER_PER_PRODUKT, Math.max(1, Math.floor(WIX_MAX_BILDER_PER_PRODUKT / medlemmar.length)));
  const forsta = new Map<string, string>();
  const agare = new Map<string, Set<string>>();
  const perMedlem: { v: string; nycklar: string[] }[] = [];
  const imageUrls: string[] = [];
  for (const [i, m] of medlemmar.entries()) {
    const v = varde(i);
    const nycklar: string[] = [];
    for (const url of bildval(m).urls) {
      if (nycklar.length >= perArtikel) break;
      const k = nyckel(url);
      if (nycklar.includes(k)) continue;
      if (!forsta.has(k)) {
        if (imageUrls.length >= WIX_MAX_BILDER_PER_PRODUKT) continue;
        forsta.set(k, url);
        imageUrls.push(url);
      }
      nycklar.push(k);
      (agare.get(k) ?? agare.set(k, new Set()).get(k)!).add(v);
    }
    perMedlem.push({ v, nycklar });
  }
  const perVarde: Record<string, string[]> = {};
  for (const { v, nycklar } of perMedlem) {
    const egna = nycklar.filter((k) => agare.get(k)!.size === 1).map((k) => forsta.get(k)!);
    if (egna.length > 0) perVarde[v] = [...(perVarde[v] ?? []), ...egna];
  }
  const gemensamma = imageUrls.filter((u) => agare.get(nyckel(u))!.size > 1);
  return { imageUrls, perVarde, gemensamma };
}

/**
 * Familjen som pipelinens produkt: ankarets text och specifikation, och en
 * variant per artikel med dess egna värden, saldo och inköp.
 *
 * Värdena och axlarnas namn är VEVOR:s egen svenska och skickas som manuella
 * namn (`variantNameOverrides`, `axisNameOverrides`), så att pipelinen varken
 * översätter dem eller flaggar dem. Med en `bildaxel` får varje artikel sina
 * egna bilder kopplade till sitt värde, och foton som flera artiklar har blir
 * gemensamma (`familjensBilder`). Utan en får produkten ankarets bilder,
 * okopplade.
 */
export function vevorFamiljeProdukt(
  f: Extract<Familj, { typ: "familj" }>,
  pris: Prisunderlag,
  bilder: Bildval,
  bildval: (a: Avlasning) => Bildval,
  nyckel?: (url: string) => string,
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
  const axel = f.bildaxel;
  const galleri = axel ? familjensBilder(f.medlemmar, bildval, (i) => varianter[i].options[axel], nyckel) : null;
  return {
    ...bas,
    variants: varianter,
    inStock: varianter.some((v) => v.stock > 0),
    specifications: spec,
    variantNameOverrides: namn,
    axisNameOverrides: Object.fromEntries(f.axlar.map((k) => [k, k])),
    ...(axel && galleri && galleri.imageUrls.length > 0
      ? {
          imageUrls: galleri.imageUrls,
          valBilder: { [axel]: galleri.perVarde },
          ...(galleri.gemensamma.length > 0 ? { gemensammaBilder: galleri.gemensamma } : {}),
        }
      : {}),
  };
}
