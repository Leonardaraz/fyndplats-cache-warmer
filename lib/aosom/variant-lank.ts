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
// rad faktiskt behöver det (varianten är en annan än huvudartikeln).
//
// ☠️ FLÖDET ÄR TUNGT. Att ladda ner det vid varje uppslag gjorde sökningen seg
// igen (Leonard 2026-09-30). Anroparen cachar därför bara tabellen artikel →
// adress (`feedLankar`), komprimerad så den ryms i Vercels datacache (2 MB per
// post): det gemensamma prefixet skalas bort och läggs på igen i `lankFran`.
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

const PREFIX = "https://www.aosom.de/item/";

/** Artikel → adress ur flödet, komprimerad. Rader utan giltig adress hoppas över. */
export function feedLankar(rader: Array<Pick<AosomRow, "sku" | "url">>): Record<string, string> {
  const ut: Record<string, string> = {};
  for (const r of rader) {
    const url = (r.url ?? "").trim();
    if (!r.sku || !/^https?:\/\//i.test(url)) continue;
    const kort = url.startsWith(PREFIX) ? url.slice(PREFIX.length) : url;
    ut[nyckel(r.sku)] = kort;
  }
  return ut;
}

/** Tillbaka till en hel adress. */
export function lankFran(kort: string): string {
  return /^https?:\/\//i.test(kort) ? kort : `${PREFIX}${kort}`;
}

export async function lankaVarianter<T extends LankbarRad>(
  rader: T[],
  hamtaLankar: () => Promise<Record<string, string>>,
): Promise<T[]> {
  const behover = (r: T) =>
    !!r.huvudartikel && !!r.artikelnummer && nyckel(r.artikelnummer) !== nyckel(r.huvudartikel);
  if (!rader.some(behover)) return rader;

  let karta: Record<string, string> | null = null;
  let fel: string | null = null;
  try {
    karta = await hamtaLankar();
  } catch (e) {
    fel = e instanceof Error ? e.message : String(e);
  }

  return rader.map((r) => {
    if (!behover(r)) return r;
    const kort = karta?.[nyckel(r.artikelnummer)];
    if (kort) return { ...r, kallUrl: lankFran(kort) };
    const skal = fel ? "Aosoms flöde gick inte att hämta" : "artikeln finns inte i Aosoms flöde just nu";
    const varning =
      `Länken öppnar produktens huvudsida (${skal}). Välj varianten med artikelnummer ${r.artikelnummer} där.`;
    return { ...r, varning: r.varning ? `${r.varning} ${varning}` : varning };
  });
}
