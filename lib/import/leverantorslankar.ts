// Leverantörslänkar för en lista produkter — ren logik, ingen IO.
//
// VARFÖR DEN FINNS (Leonard 2026-10-07). Han skickade två listor, 45 produkter
// vars recensionsfoton ska hämtas och 460 produkter med fyra bilder eller
// färre, och bad om varje produkts länk hos Aosom "så jag kan direkt se
// produkten". Länken finns bara på mappningsraden (`sourceUrl`), och den bär
// artikelnumret. /admin/source-lookup tar en produkt i taget, och kuvertet i
// polish-mapping.yml likaså, med inköpspriset bredvid.
//
// Den här tar en hel lista och svarar med samma länk som "Öppna hos Aosom" i
// uppslaget (`leverantorskallaFor`, en enda definition). En AliExpress-rad får
// sin AliExpress-länk. En sammanslagen Aosom-sida får dessutom en länk per
// färg, ur flödet, eftersom Aosom har en egen adress per artikel.
//
// ☠️ SVARET BÄR ARTIKELNUMMER. Rutten kräver CRON_SECRET, och den enda
// anroparen är leverantorslankar.yml, som krypterar svaret mot anroparens
// engångsnyckel innan något når den publika loggen. Inget inköpspris, ingen
// kostnad och ingen frakt följer med — bara det som behövs för att öppna sidan.

import type { MappingSupplier, ProductMappingRecord } from "../store";
import { aosomArtikelbild } from "../aosom/artiklar";
import { lankFran } from "../aosom/variant-lank";
import { leverantorskallaFor, parseLookupInput } from "./source-link";

/** Högsta antal produkter per anrop. Rutten har 120 sekunder. */
export const MAX_PRODUKTER = 1000;

export type Mal = { kind: "id"; id: string; fran: string } | { kind: "slug"; slug: string; fran: string };

/**
 * Delar en fri lista i mål: Wix-produkt-id, slug eller butiksadress, åtskilda
 * av komma, mellanslag eller radbrytning. Samma tolkning som uppslaget
 * (`parseLookupInput`). Ordernummer och variant-SKU:er tas inte här: de pekar
 * på en orderrad eller kan sitta på flera produkter, och listan ska vara
 * produkter. De returneras som ogiltiga i stället för att tystas.
 */
export function tolkaProduktlista(indata: string | readonly string[]): { mal: Mal[]; ogiltiga: string[] } {
  const delar = (typeof indata === "string" ? [indata] : [...indata])
    .flatMap((s) => String(s ?? "").split(/[\s,]+/))
    .map((s) => s.trim())
    .filter(Boolean);
  const mal: Mal[] = [];
  const ogiltiga: string[] = [];
  const sedda = new Set<string>();
  for (const fran of delar) {
    const t = parseLookupInput(fran);
    if (t?.kind === "id") {
      if (sedda.has(`id:${t.id}`)) continue;
      sedda.add(`id:${t.id}`);
      mal.push({ kind: "id", id: t.id, fran });
    } else if (t?.kind === "slug") {
      const slug = t.slug.toLowerCase();
      if (sedda.has(`slug:${slug}`)) continue;
      sedda.add(`slug:${slug}`);
      mal.push({ kind: "slug", slug, fran });
    } else {
      ogiltiga.push(fran);
    }
  }
  return { mal, ogiltiga };
}

export interface VariantLank {
  artikelnummer: string;
  /** Artikelns egen sida hos Aosom, ur flödet. Null när flödet inte har den. */
  url: string | null;
  /** Variantens val, t.ex. { Färg: "Grå" }. */
  val: Record<string, string>;
}

export interface Leverantorslank {
  wixProductId: string;
  /** Det som skickades in: id, slug eller adress. */
  fran: string;
  leverantor: MappingSupplier;
  /** Utan aosom:-prefixet, som det klistras in hos leverantören. */
  artikelnummer: string;
  /** Produktsidan hos leverantören, samma som uppslagets knapp. */
  url: string | null;
  /** Bara på en sammanslagen Aosom-sida: en rad per variant. */
  varianter?: VariantLank[];
}

const nyckel = (s: string) => s.trim().toUpperCase();

/** Har raden minst två olika Aosom-artiklar på sina varianter? */
function arSammanslagen(m: ProductMappingRecord): boolean {
  return leverantorskallaFor(m).leverantor === "aosom" && aosomArtikelbild(m).typ !== "en";
}

/**
 * Behöver svaret Aosoms flöde? Bara för en sammanslagen sida, eller för en
 * Aosom-rad utan egen adress. Flödet är tungt, och de flesta listor behöver
 * det inte.
 */
export function behoverFlodet(mappningar: Iterable<ProductMappingRecord>): boolean {
  for (const m of mappningar) {
    const kalla = leverantorskallaFor(m);
    if (kalla.leverantor !== "aosom") continue;
    if (!kalla.url || arSammanslagen(m)) return true;
  }
  return false;
}

/**
 * En länk per produkt, i listans ordning. `flode` är artikel → adress ur
 * Aosoms flöde (`feedLankar`), eller null när det inte hämtades.
 */
export function byggLeverantorslankar(
  mal: ReadonlyArray<{ wixProductId: string; fran: string }>,
  mappningar: ReadonlyMap<string, ProductMappingRecord>,
  flode: Readonly<Record<string, string>> | null,
): { lankar: Leverantorslank[]; utanMappning: string[] } {
  const lankar: Leverantorslank[] = [];
  const utanMappning: string[] = [];
  const sedda = new Set<string>();
  const urFlodet = (artikel: string): string | null => {
    const kort = artikel ? flode?.[nyckel(artikel)] : undefined;
    return kort ? lankFran(kort) : null;
  };

  for (const { wixProductId, fran } of mal) {
    if (sedda.has(wixProductId)) continue;
    sedda.add(wixProductId);
    const m = mappningar.get(wixProductId);
    if (!m) {
      utanMappning.push(fran);
      continue;
    }
    const kalla = leverantorskallaFor(m);
    const rad: Leverantorslank = {
      wixProductId,
      fran,
      leverantor: kalla.leverantor,
      artikelnummer: kalla.artikelnummer,
      url: kalla.url ?? (kalla.leverantor === "aosom" ? urFlodet(kalla.artikelnummer) : null),
    };
    if (arSammanslagen(m)) {
      rad.varianter = (m.variants ?? []).map((v) => {
        const artikel = (v.supplierVariantId ?? "").trim();
        const egen = urFlodet(artikel);
        return {
          artikelnummer: artikel,
          // Huvudartikelns variant har samma sida som raden när flödet saknar den.
          url: egen ?? (artikel && nyckel(artikel) === nyckel(kalla.artikelnummer) ? rad.url : null),
          val: { ...(v.choices ?? {}) },
        };
      });
    }
    lankar.push(rad);
  }
  return { lankar, utanMappning };
}
