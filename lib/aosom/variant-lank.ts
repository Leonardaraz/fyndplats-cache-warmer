// lib/aosom/variant-lank.ts
//
// Länken "Öppna hos Aosom" till den variant kunden köpte, inte sidans förvalda.
//
// VARFÖR (Leonard 2026-09-30, order 10052). En sammanslagen sida bär en
// Aosom-artikel per variant, och uppslaget räknade redan ut rätt artikelnummer
// per orderrad (aosomArtikelForTask). Men länken var mappningens `sourceUrl`,
// alltså huvudartikelns sida. Aosom har en egen adress per artikel
// (…~<kod>.html) och öppnar den artikelns variant, så länken visade sidans
// förvalda storlek och fick bytas för hand innan beställningen.
//
// Varje rad i Aosoms flöde bär artikelns egen adress. Flödet hämtas bara när en
// rad faktiskt behöver det (varianten är en annan än huvudartikeln), och högst
// en gång per uppslag.
//
// ☠️ HELLRE VARNING ÄN FEL SIDA. Finns artikeln inte i flödet, eller går flödet
// inte att hämta, står huvudsidans länk kvar med en varning som säger vilken
// artikel som ska väljas där.

import type { AosomRow } from "./feed";

export interface LankbarRad {
  artikelnummer: string;
  kallUrl: string | null;
  varning?: string;
  /** Mappningens egen artikel. Satt bara på Aosom-rader från en orderrad. */
  huvudartikel?: string;
}

const nyckel = (s: string) => s.trim().toUpperCase();

export async function lankaVarianter<T extends LankbarRad>(
  rader: T[],
  hamtaFeed: () => Promise<Array<Pick<AosomRow, "sku" | "url">>>,
): Promise<T[]> {
  const behover = (r: T) =>
    !!r.huvudartikel && !!r.artikelnummer && nyckel(r.artikelnummer) !== nyckel(r.huvudartikel);
  if (!rader.some(behover)) return rader;

  let karta: Map<string, string> | null = null;
  let fel: string | null = null;
  try {
    karta = new Map();
    for (const f of await hamtaFeed()) {
      const url = (f.url ?? "").trim();
      if (f.sku && /^https?:\/\//i.test(url)) karta.set(nyckel(f.sku), url);
    }
  } catch (e) {
    fel = e instanceof Error ? e.message : String(e);
    karta = null;
  }

  return rader.map((r) => {
    if (!behover(r)) return r;
    const url = karta?.get(nyckel(r.artikelnummer));
    if (url) return { ...r, kallUrl: url };
    const skal = fel ? "Aosoms flöde gick inte att hämta" : "artikeln finns inte i Aosoms flöde just nu";
    const varning =
      `Länken öppnar produktens huvudsida (${skal}). Välj varianten med artikelnummer ${r.artikelnummer} där.`;
    return { ...r, varning: r.varning ? `${r.varning} ${varning}` : varning };
  });
}
