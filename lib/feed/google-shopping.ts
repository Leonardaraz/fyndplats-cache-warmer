// Tilläggsfeeden till Google Merchant Center — ren logik, ingen IO.
//
// BAKGRUNDEN (2026-09-15). Butiken har redan en huvudfeed: butiksrepots
// `/feed/google.xml` (variantnivå, `g:id` = Wix-variantens id, `g:item_group_id`
// = produktens, brand Fyndplats, identifier_exists no, kategori via
// kollektionens slug). Den byggdes 2026-07 och behöver inte en tvilling.
// Det den INTE kan är att bära det som bara finns i det här repots
// mappningar: prisgruppen (A/B-testet), prisbandet och konkurrensläget mot
// dealproffsen. Det är annonsstyrningen — kampanjen väljer produkter på
// `custom_label_0`.
//
// Därför en TILLÄGGSFEED (Merchant Centers "supplemental feed"): bara `id`
// och etiketterna. Merchant Center slår ihop den med huvudfeeden på `id`, och
// en rad vars id inte finns i huvudfeeden ignoreras — en opublicerad produkt
// gör alltså ingen skada här.
//
// ☠️ ID:T ÄR VARIANTENS, INTE PRODUKTENS. Huvudfeeden nycklar på `g:id` =
// Wix-variantens id; en rad nycklad på produkt-id:t matchar ingenting och
// etiketten sätts tyst aldrig. Mappningen bär `variants[0].wixVariantId`, och
// Aosom-rader har exakt en variant (uppmätt). Utan variant-id utelämnas raden
// och räknas i `utanVariantId`.
//
// ☠️ INGET ARTIKELNUMMER, INGET INKÖPSPRIS, INGEN KOSTNAD. Raden är id plus
// tre etiketter. Etiketterna är ord ("A", "2000_4000", "under_dealproffsen"),
// aldrig belopp — dealproffsens pris i kronor står inte i feeden, bara om vi
// ligger under eller över det.
//
// ☠️ PRISET SOM AVGÖR BAND OCH LÄGE ÄR BUTIKENS (`listV3ProductPrices`),
// aldrig mappningens `grossSek` — samma regel som `jamforelsePris`.

import type { ProductMappingRecord } from "../store";
import { isAliExpressMapping } from "../store/supplier";
import type { WixProduktPris } from "../wix/v3-products";
import type { Prisgrupp } from "../pricing/konkurrentregel";

export interface TillaggsRad {
  id: string;
  /** Prisgrupp A/B — tom = inte med i testet, och det är så kampanjen väljer. */
  custom_label_0: string;
  /** Prisband, t.ex. "2000_4000". */
  custom_label_1: string;
  /** Konkurrensläge: under_dealproffsen · over_dealproffsen · ingen_jamforelse. */
  custom_label_2: string;
}

export const KOLUMNER: (keyof TillaggsRad)[] = ["id", "custom_label_0", "custom_label_1", "custom_label_2"];

export interface TillaggsUtfall {
  rader: TillaggsRad[];
  ejAosom: number;
  utanVariantId: number;
  /** Butikspriset är tvetydigt eller saknas — raden får ingen etikett alls, ingen gissning. */
  utanPris: number;
  perGrupp: Record<Prisgrupp | "ingen", number>;
  perKonkurrenslage: Record<string, number>;
}

export function prisband(pris: number): string {
  if (pris < 500) return "under_500";
  if (pris < 1000) return "500_1000";
  if (pris < 2000) return "1000_2000";
  if (pris < 4000) return "2000_4000";
  if (pris < 8000) return "4000_8000";
  return "8000_plus";
}

/**
 * Konkurrensläget styr annonsurvalet: en rad som ligger ÖVER dealproffsen ska
 * inte få klick vi förlorar, och en rad utan jämförelse vet vi inget om.
 */
export function konkurrenslage(pris: number, konkurrent: ProductMappingRecord["konkurrent"]): string {
  if (!konkurrent || !(konkurrent.pris > 0)) return "ingen_jamforelse";
  return pris <= konkurrent.pris ? "under_dealproffsen" : "over_dealproffsen";
}

/** TSV-säkert fält: tabb och radbrytning blir blanksteg. */
export function tsvFalt(s: string): string {
  return s.replace(/[\t\r\n]+/g, " ");
}

export function tillTsv(rader: readonly TillaggsRad[]): string {
  const ut = [KOLUMNER.join("\t")];
  for (const r of rader) ut.push(KOLUMNER.map((k) => tsvFalt(String(r[k] ?? ""))).join("\t"));
  return ut.join("\n") + "\n";
}

export function byggTillaggsfeed(
  mappningar: readonly ProductMappingRecord[],
  vartPris: ReadonlyMap<string, WixProduktPris>,
): TillaggsUtfall {
  const ut: TillaggsUtfall = {
    rader: [],
    ejAosom: 0,
    utanVariantId: 0,
    utanPris: 0,
    perGrupp: { A: 0, B: 0, ingen: 0 },
    perKonkurrenslage: {},
  };
  for (const m of mappningar) {
    if (isAliExpressMapping(m)) {
      ut.ejAosom++;
      continue;
    }
    const variantId = m.variants?.[0]?.wixVariantId;
    if (!variantId) {
      ut.utanVariantId++;
      continue;
    }
    const w = vartPris.get(m.wixProductId);
    if (!w || w.priceSek === null || !(w.priceSek > 0)) {
      ut.utanPris++;
      continue;
    }
    const pris = w.priceSek;
    const lage = konkurrenslage(pris, m.konkurrent);
    const grupp = m.prisgrupp ?? "ingen";
    ut.perGrupp[grupp]++;
    ut.perKonkurrenslage[lage] = (ut.perKonkurrenslage[lage] ?? 0) + 1;
    ut.rader.push({
      id: variantId,
      custom_label_0: m.prisgrupp ?? "",
      custom_label_1: prisband(pris),
      custom_label_2: lage,
    });
  }
  return ut;
}
