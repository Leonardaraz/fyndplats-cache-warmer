// Får en produkt publiceras? EN regel, läst av varje väg i motorn som gör en
// produkt synlig:
//
//   polering   poleringens textsteg (lib/polish/skrivplan.ts, workflowen
//              "Polering — skriv en runda till Wix") och stämpeln
//              draftStatus "published" (/api/admin/mapping)
//   ko         köns knapp och köns API (/admin/queue, /api/admin/queue)
//
// Hindren gäller VEVOR (steg 7, Leonard 2026-10-28):
//   gpsr             tillverkaren och EU-ansvarig är inte kompletta
//                    (lib/vevor/gpsr.ts). Lagen kräver dem på produktsidan.
//   via_poleringen   köns knapp publicerar inte en VEVOR-vara. Den publiceras
//                    genom poleringen, som tar bort märket ur titeln och sätter
//                    märket VEVOR i Wix (till flödena).
//   vapenskap        ett vapenskåp eller vapenfodral (Leonards beslut
//                    2026-10-31, lib/vevor/kategorier.ts). Publiceras inte.
//
// ☠️ HINDRET GÅR INTE ATT TVINGA FÖRBI. Köns "publicera ändå" gäller prisspärren,
// inte det här: uppgifterna krävs av lagen.
//
// ☠️ EN PRODUKT SOM PUBLICERAS FÖR HAND I WIX går inte att stoppa härifrån.
// Morgonmejlet larmar om en synlig VEVOR-vara utan komplett GPSR
// (lib/orders/guard.ts).
//
// Övriga leverantörer har inget hinder här, och en rad med ett okänt
// leverantörsvärde ("okand") publiceras som förut.

import type { ProductMappingRecord } from "@/lib/store";
import { mappingSupplier, vevorSkuOf } from "@/lib/store/supplier";
import { assertNever } from "@/lib/assert-never";
import { gpsrStatus, gpsrStatusText, type GpsrStatus, type VevorGpsr } from "@/lib/vevor/gpsr";
import type { GpsrLager } from "@/lib/vevor/gpsr-lager";
import { lasEffektiva } from "@/lib/vevor/gpsr-standard";

export type Publiceringsvag = "polering" | "ko";

export type Publiceringshinder =
  | { kod: "gpsr"; status: Exclude<GpsrStatus, "komplett"> }
  | { kod: "via_poleringen" }
  /** Ett vapenskåp (`vevorGranskning.vapenskap`). Går före GPSR. */
  | { kod: "vapenskap" }
  /** Märket VEVOR kunde inte sättas i Wix. Sätts av poleringens rutt, inte här. */
  | { kod: "marke"; fel: string };

type Rad = Pick<ProductMappingRecord, "supplier" | "supplierProductId" | "vevorGranskning">;

/** Hindret för en produkt, eller null när den får publiceras. `gpsr` är artikelns GPSR-rad. */
export function publiceringshinder(m: Rad, gpsr: VevorGpsr | null, vag: Publiceringsvag): Publiceringshinder | null {
  const leverantor = mappingSupplier(m);
  switch (leverantor) {
    case "aliexpress":
    case "aosom":
    case "okand":
      return null;
    case "vevor": {
      if (m.vevorGranskning?.vapenskap === true) return { kod: "vapenskap" };
      if (vag === "ko") return { kod: "via_poleringen" };
      const status = gpsrStatus(gpsr, m.vevorGranskning?.gpsr);
      return status === "komplett" ? null : { kod: "gpsr", status };
    }
    default:
      return assertNever(leverantor, "leverantör");
  }
}

/** Hindret i klartext, för svar, loggar och audit. Bär aldrig ett artikelnummer. */
export function hinderText(h: Publiceringshinder): string {
  switch (h.kod) {
    case "gpsr":
      return `GPSR ej komplett (${gpsrStatusText(h.status)}): tillverkare och EU-ansvarig krävs, se /api/admin/vevor-gpsr`;
    case "via_poleringen":
      return "en VEVOR-vara publiceras genom poleringen, inte med köns knapp";
    case "vapenskap":
      return "vapenskåp publiceras inte (Leonards beslut 2026-10-31): skåpet är inte visat godkänt enligt SS 3492";
    case "marke":
      return `märket VEVOR gick inte att sätta i Wix: ${h.fel}`;
  }
}

/**
 * Hindret för varje mappning, nycklat på Wix-produkt-id, med GPSR-raderna
 * lästa i en omgång. Bara produkter med ett hinder står i svaret.
 */
export async function publiceringshinderFor(
  mappningar: readonly ProductMappingRecord[],
  vag: Publiceringsvag,
  lager: Pick<GpsrLager, "las">,
): Promise<Map<string, Publiceringshinder>> {
  const skus = mappningar.map((m) => vevorSkuOf(m)).filter((s): s is string => Boolean(s));
  // Artikelns egen rad, annars standardraden (lib/vevor/gpsr-standard.ts).
  const rader = skus.length > 0 ? await lasEffektiva(lager, skus) : new Map();
  const ut = new Map<string, Publiceringshinder>();
  for (const m of mappningar) {
    const sku = vevorSkuOf(m);
    const h = publiceringshinder(m, sku ? rader.get(sku) ?? null : null, vag);
    if (h) ut.set(m.wixProductId, h);
  }
  return ut;
}
