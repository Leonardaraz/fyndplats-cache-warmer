// Poleringens publiceringsplan: vilka produkter i en runda som inte får
// publiceras, och vilka som ska bära ett märke. Byggs av rutten
// (app/api/admin/polish-write) innan textsteget och verifieringen körs.
//
// Bara textsteget publicerar (`visible: true`), och bara det och
// verifieringen behöver planen. De andra stegen rör inte synligheten, och för
// dem läses ingenting här.
//
// ☠️ EN FALLEN LÄSNING STOPPAR STEGET. Går mappningarna eller GPSR-raderna inte
// att läsa kastar bygget, och rutten svarar 500 utan att skriva något. Att
// publicera utan att ha prövat hindret är felet spärren finns för.

import type { ProductMappingRecord } from "@/lib/store";
import { vevorSkuOf } from "@/lib/store/supplier";
import { hinderText, publiceringshinderFor, type Publiceringshinder } from "@/lib/publicering";
import type { GpsrLager } from "@/lib/vevor/gpsr-lager";
import { VEVOR_MARKE } from "@/lib/vevor/gpsr";
import { INGEN_PUBLICERINGSPLAN, type Publiceringsplan, type Skrivplan, type Steg } from "./skrivplan";

export interface PubliceringsDeps {
  /** Mappningarna för produkterna, nycklade på Wix-produkt-id. En produkt utan rad saknas i svaret. */
  mappningar: (wixProductIds: string[]) => Promise<Map<string, ProductMappingRecord>>;
  gpsr: Pick<GpsrLager, "las">;
  /** Märkets id i Wix, skapat om det saknas (lib/polish/marke.ts). */
  markeId: (namn: string) => Promise<string>;
}

export async function byggPubliceringsplan(
  plan: Skrivplan,
  steg: Steg,
  torr: boolean,
  deps: PubliceringsDeps,
): Promise<Publiceringsplan> {
  if (steg !== "text" && steg !== "verifiera") return INGEN_PUBLICERINGSPLAN;

  const pids = plan.produkter.map((p) => p.pid);
  const mappningar = await deps.mappningar(pids);
  const rader = pids.map((pid) => mappningar.get(pid)).filter((m): m is ProductMappingRecord => Boolean(m));
  const hinder = new Map<string, Publiceringshinder>(await publiceringshinderFor(rader, "polering", deps.gpsr));

  // VEVOR-varorna bär märket VEVOR i Wix, också medan de är dolda: då är varan
  // klar den dag uppgifterna finns.
  const vevor = rader.filter((m) => vevorSkuOf(m) !== null).map((m) => m.wixProductId);
  const marke = new Map<string, string>();
  if (steg === "text" && !torr && vevor.length > 0) {
    try {
      const id = await deps.markeId(VEVOR_MARKE);
      for (const pid of vevor) marke.set(pid, id);
    } catch (e) {
      // Utan märket publiceras ingen VEVOR-vara: flödena hade fått "Fyndplats".
      const fel = (e instanceof Error ? e.message : String(e)).slice(0, 160);
      for (const pid of vevor) if (!hinder.has(pid)) hinder.set(pid, { kod: "marke", fel });
    }
  }

  return {
    hinder: new Map([...hinder].map(([pid, h]) => [pid, hinderText(h)])),
    marke,
    markesnamn: new Map(vevor.map((pid) => [pid, VEVOR_MARKE])),
  };
}
