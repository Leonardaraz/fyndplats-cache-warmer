// lib/sparning-lage.ts
//
// Läget som märket och raden under spårningsnumret på /sparning beskriver.
// Ren modul utan importer, så att node --test kan ladda den.
//
// Sidan sa "Spårningen är pausad" för alla fyra avvikande statusar från
// 17TRACK. Det stämmer bara för Expired. I genomgången av alla 135 paket
// (2026-10-28) var två paket på väg tillbaka till avsändaren och ett hade en
// avvikelse mitt i leveransen, och alla tre fick samma text om en pausad
// spårning. 17TRACK ger ett paket i retur status Exception, så returen syns
// bara i den senaste händelsen.

export type SparningsLage = "levererad" | "retur" | "pausad" | "misslyckad" | "avvikelse" | "pa-vag";

/** Den senaste händelsen som sidan visar den: rubrik och svensk text. */
export interface SenasteHandelse {
  status?: string;
  desc?: string;
}

const RETUR = /tillbaka till avsändaren|har returnerats/i;

export function sparningsLage(status: string, levererad: boolean, senaste?: SenasteHandelse): SparningsLage {
  if (levererad || status === "Delivered") return "levererad";
  if (senaste && (/^Returner/.test(senaste.status ?? "") || RETUR.test(senaste.desc ?? ""))) return "retur";
  if (status === "Expired") return "pausad";
  if (status === "DeliveryFailure" || status === "Undelivered") return "misslyckad";
  if (status === "Exception") return "avvikelse";
  return "pa-vag";
}

/** Märket uppe till höger. */
export function lageMarke(lage: SparningsLage): { text: string; klass: "done" | "warn" | "transit" } {
  switch (lage) {
    case "levererad":
      return { text: "Levererad", klass: "done" };
    case "retur":
      return { text: "På väg tillbaka", klass: "warn" };
    case "pausad":
    case "misslyckad":
    case "avvikelse":
      return { text: "Behöver kollas", klass: "warn" };
    case "pa-vag":
      return { text: "På väg till dig", klass: "transit" };
  }
}

/**
 * Raden under märket när paketet inte rör sig som planerat. Texten före
 * e-postadressen; sidan lägger till adressen och resten av meningen.
 */
export const LAGE_TEXT: Record<"retur" | "pausad" | "misslyckad" | "avvikelse", { fore: string; efter: string }> = {
  retur: { fore: "Paketet är på väg tillbaka till avsändaren. Hör av dig till", efter: "så hjälper vi dig." },
  pausad: { fore: "Spårningen är pausad. Vi följer paketet – hör av dig till", efter: "om du undrar." },
  misslyckad: { fore: "Leveransen kunde inte genomföras. Se historiken nedan, och hör av dig till", efter: "om du undrar." },
  avvikelse: { fore: "Det har uppstått en avvikelse i leveransen. Vi följer paketet – hör av dig till", efter: "om du undrar." },
};
