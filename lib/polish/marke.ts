// Märket i Wix (Stores V3 Brands) som poleringen sätter på en vara.
//
// VARFÖR (Leonard 2026-10-28, steg 7). VEVOR får synas på varan och i
// flödena, men inte i titeln. Butikens strukturerade data och flöden läser
// märket ur Wix produktfält `brand` (headless-site, lib/varumarke.ts), och en
// vara utan märke får "Fyndplats", vilket är fel för en riktig märkesvara.
//
// ☠️ EN UPPDATERING TAR BARA MÄRKETS ID. Wix dokumentation för Update Product:
// "Supplying brand.name without brand.id is rejected with a BRAND_MISSING_ID
// validation error." Id:t slås därför upp bland butikens märken, och märket
// skapas om det saknas (2026-10-29 fanns sex märken och inget VEVOR).

import type { WixAnrop } from "./skrivplan";

type Obj = Record<string, unknown>;

const normera = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

/** Id:t för märket med det namnet, eller null när det inte finns. Läser alla sidor. */
export async function hittaMarke(namn: string, wix: WixAnrop): Promise<string | null> {
  const mal = normera(namn);
  let cursor: string | undefined;
  for (let sida = 0; sida < 50; sida++) {
    const cursorPaging: Obj = { limit: 100 };
    if (cursor) cursorPaging.cursor = cursor;
    const svar = (await wix("POST", "/stores/v3/brands/query", { query: { cursorPaging } })) as Obj;
    for (const b of ((svar.brands ?? []) as Obj[])) {
      if (typeof b.id === "string" && typeof b.name === "string" && normera(b.name) === mal) return b.id;
    }
    const paging = (svar.pagingMetadata ?? {}) as Obj;
    cursor = ((paging.cursors ?? {}) as Obj).next as string | undefined;
    if (!cursor || paging.hasNext === false) return null;
  }
  throw new Error("märkeslistan tog inte slut efter 50 sidor");
}

/**
 * Id:t för märket, skapat om det saknas. Hann någon annan skapa det samtidigt
 * svarar Wix med ett fel (namnet är unikt), och då läses listan en gång till.
 */
export async function markeId(namn: string, wix: WixAnrop): Promise<string> {
  const finns = await hittaMarke(namn, wix);
  if (finns) return finns;
  try {
    const svar = (await wix("POST", "/stores/v3/brands", { brand: { name: namn } })) as Obj;
    const id = ((svar.brand ?? {}) as Obj).id;
    if (typeof id === "string" && id) return id;
  } catch (e) {
    const igen = await hittaMarke(namn, wix);
    if (igen) return igen;
    throw e;
  }
  const igen = await hittaMarke(namn, wix);
  if (igen) return igen;
  throw new Error(`märket ${namn} skapades men syns inte i listan`);
}
