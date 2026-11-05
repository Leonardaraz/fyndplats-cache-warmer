// Kategorikollens läsning av katalogen: alla synliga produkter med sina
// direkta kategorier, 100 per sida.
//
// ☠️ FILTRET SKICKAS BARA PÅ FÖRSTA SIDAN (natten 2026-11-05). Markören bär
// redan frågans filter, och Wix svarar 400 INVALID_CURSOR när ett filter följer
// med markören. Kollens första körning dog så på sida två. Katalogsvepet
// (lib/wix/variantbild-koll.ts) gör samma sak. `fields` får däremot följa med
// varje sida, och måste det: utan DIRECT_CATEGORIES_INFO saknas kategorierna.

import type { WixAnrop } from "@/lib/polish/skrivplan";

type Obj = Record<string, unknown>;

/** Katalogen ska ta slut långt före det här (100 per sida). Ett tak kastar, aldrig kapar. */
export const MAX_SIDOR = 300;
const PER_SIDA = 100;

export interface KollProdukt {
  id: string;
  namn: string;
  kat: string[];
  iLager: boolean;
}

function data(svar: unknown): Obj {
  const s = (svar ?? {}) as Obj;
  return ((s.data as Obj | undefined) ?? s) as Obj;
}

/** Frågan för en sida: filtret på första sidan, bara markören på resten. */
export function sidfraga(markor: string | undefined): Obj {
  const query: Obj = markor
    ? { cursorPaging: { limit: PER_SIDA, cursor: markor } }
    : { filter: { visible: true }, cursorPaging: { limit: PER_SIDA } };
  return { fields: ["DIRECT_CATEGORIES_INFO"], query };
}

/** Alla synliga produkter. Kastar hellre än returnerar en halv katalog. */
export async function lasSynligaProdukter(wix: WixAnrop, maxSidor = MAX_SIDOR): Promise<KollProdukt[]> {
  const produkter: KollProdukt[] = [];
  let markor: string | undefined;
  for (let sida = 0; ; sida++) {
    if (sida >= maxSidor) throw new Error(`katalogen tog inte slut efter ${maxSidor} sidor`);
    const d = data(await wix("POST", "/stores/v3/products/query", sidfraga(markor)));
    const rader = Array.isArray(d.products) ? (d.products as Obj[]) : [];
    for (const p of rader) {
      if (typeof p.id !== "string" || typeof p.name !== "string" || p.visible === false) continue;
      const kat = (((p.directCategoriesInfo as Obj | undefined)?.categories ?? []) as Obj[])
        .map((c) => c.id)
        .filter((id): id is string => typeof id === "string");
      const status = (p.inventory as Obj | undefined)?.availabilityStatus;
      produkter.push({ id: p.id, namn: p.name, kat, iLager: status !== "OUT_OF_STOCK" });
    }
    const nasta = (((d.pagingMetadata ?? {}) as Obj).cursors as Obj | undefined)?.next;
    if (typeof nasta !== "string" || !nasta || rader.length === 0) break;
    markor = nasta;
  }
  return produkter;
}
